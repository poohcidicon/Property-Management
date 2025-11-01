import { Server as SocketIOServer } from "socket.io";
import { NextRequest, NextResponse } from "next/server";
import { createServer } from "http";
import { Circle } from "@/components/canvas-map";

// Global singleton instance - persists across hot reloads
interface GlobalSocketInstance {
  io: SocketIOServer;
  httpServer: any;
  port: number;
}

declare global {
  var __socketIOInstance: GlobalSocketInstance | undefined;
  var __socketInitializing: boolean | undefined;
}

// Use global variables to persist across hot reloads
let globalSocketIO: SocketIOServer | null = (global as any).__socketIOInstance?.io || null;
let currentHttpServer: any = (global as any).__socketIOInstance?.httpServer || null;
let currentPort: number | null = (global as any).__socketIOInstance?.port || null;
let isInitializing = (global as any).__socketInitializing || false;

// In-memory temporary booking state
let temporaryBookings: Map<string, { bookedBy: string; bookedAt: number; socketId: string; room: string }> = new Map();
// Track which socket owns which bookings
let socketBookings: Map<string, Set<string>> = new Map();
// Track which room each socket is in
let socketRooms: Map<string, string> = new Map();
// Track bookings per room
let roomBookings: Map<string, Map<string, { bookedBy: string; bookedAt: number; socketId: string }>> = new Map();
// Debounce map to prevent duplicate events
let eventDebounce: Map<string, number> = new Map();
// Event deduplication timeout (ms)
const DEBOUNCE_TIMEOUT = 100;
// Booking timeout in milliseconds (10 minutes)
const BOOKING_TIMEOUT = 10 * 60 * 1000;

// Periodic cleanup of old debounce entries (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  const cutoff = now - (DEBOUNCE_TIMEOUT * 10); // Keep entries for 10x timeout
  
  for (const [key, timestamp] of eventDebounce.entries()) {
    if (timestamp < cutoff) {
      eventDebounce.delete(key);
    }
  }
  
  if (eventDebounce.size > 1000) {
    console.log(`🧹 Cleaned up debounce map, ${eventDebounce.size} entries remaining`);
  }
}, 5 * 60 * 1000); // Every 5 minutes

// Function to check and release expired bookings
const checkExpiredBookings = () => {
  if (!globalSocketIO) return;
  
  const now = Date.now();
  const expiredBookings: string[] = [];
  
  // Check each booking for expiration
  temporaryBookings.forEach((booking, circleId) => {
    const bookingAge = now - booking.bookedAt;
    
    // If booking is older than 10 minutes, mark it as expired
    if (bookingAge > BOOKING_TIMEOUT) {
      expiredBookings.push(circleId);
      // console.log(`⏰ Booking expired: ${circleId} by ${booking.bookedBy} (age: ${Math.floor(bookingAge/1000)}s)`);
    }
  });
  
  // Process expired bookings
  if (expiredBookings.length > 0) {
    const releasedCircles = expiredBookings.map(circleId => {
      const booking = temporaryBookings.get(circleId);
      
      // Remove from socket tracking
      if (booking && booking.socketId && socketBookings.has(booking.socketId)) {
        socketBookings.get(booking.socketId)!.delete(circleId);
      }
      
      // Remove from temporary bookings
      temporaryBookings.delete(circleId);
      
      // Create released circle object
      return {
        id: circleId,
        status: 'available',
        bookedBy: undefined,
        bookedAt: undefined
      };
    });
    
    // Broadcast released circles to all clients
    globalSocketIO.emit("bookingsReleased", releasedCircles);
    // console.log(`⏰ Released ${releasedCircles.length} expired bookings: ${expiredBookings.join(", ")}`);
  }
};

// Check for expired bookings every minute
setInterval(checkExpiredBookings, 60 * 1000);

// Function to safely check and handle port conflicts
const checkPortAvailability = async (port: number): Promise<boolean> => {
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    console.log(`🔍 Checking port ${port} availability...`);
    
    // Check if port is in use
    const findCommand = `netstat -ano | findstr :${port}`;
    
    try {
      const { stdout } = await execAsync(findCommand);
      
      if (!stdout || stdout.trim() === '') {
        console.log(`✅ Port ${port} is available`);
        return true;
      }
      
      const lines = stdout.split('\n').filter((line: string) => line.trim());
      const processedPids = new Set<string>()
      let hasNodeProcess = false;
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        
        if (pid && pid !== '0' && !isNaN(parseInt(pid)) && !processedPids.has(pid)) {
          processedPids.add(pid);
          
          try {
            // Get process name to avoid killing important processes
            const processCmd = `tasklist /FI "PID eq ${pid}" /FO CSV /NH`;
            const { stdout: processOutput } = await execAsync(processCmd);
            
            if (processOutput && processOutput.trim()) {
              const processName = processOutput.split(',')[0].replace(/"/g, '');
              
              // Only attempt to close if it's a Node.js process or similar
              if (processName.toLowerCase().includes('node') || 
                  processName.toLowerCase().includes('next')) {
                console.log(`🎯 Found Node.js process ${processName} (PID: ${pid}) using port ${port}`);
                hasNodeProcess = true;
                
                // Try gentle termination first
                try {
                  await execAsync(`taskkill /PID ${pid}`);
                  console.log(`✅ Gently closed process ${pid}`);
                  
                  // Wait for process to fully close
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  
                  // Verify process is actually closed
                  try {
                    await execAsync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`);
                    console.log(`⚠️ Process ${pid} still running, attempting force close`);
                    await execAsync(`taskkill /PID ${pid} /F`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                  } catch {
                    console.log(`✅ Process ${pid} successfully terminated`);
                  }
                } catch (gentleErr) {
                  console.log(`⚠️ Could not close process ${pid}: ${gentleErr}`);
                }
              } else {
                console.log(`⚠️ Port ${port} is used by ${processName} (PID: ${pid}) - skipping to avoid system disruption`);
              }
            }
          } catch (processErr) {
            console.log(`⚠️ Could not identify process ${pid}`);
          }
        }
      }
      
      // If we found and attempted to close Node processes, wait and check again
      if (hasNodeProcess) {
        console.log(`⏳ Waiting for port ${port} to be released...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Final check if port is still in use
        try {
          const { stdout: finalCheck } = await execAsync(findCommand);
          const isAvailable = !finalCheck || finalCheck.trim() === '';
          
          if (isAvailable) {
            console.log(`✅ Port ${port} is now available`);
          } else {
            console.log(`❌ Port ${port} is still in use after cleanup`);
          }
          
          return isAvailable;
        } catch {
          console.log(`✅ Port ${port} appears to be available (command failed)`);
          return true; // Assume available if command fails
        }
      }
      
      return false; // Port still in use by non-Node processes
    } catch (cmdError) {
      // If netstat command fails, assume port is available
      console.log(`✅ Port ${port} appears to be available (netstat failed)`);
      return true;
    }
  } catch (error) {
    console.log(`⚠️ Error checking port ${port}: ${error}`);
    return false; // Assume not available on error
  }
};

// Graceful shutdown function
const gracefulShutdown = async () => {
  console.log('🛑 Initiating graceful shutdown...');
  
  if (globalSocketIO) {
    console.log('📡 Closing Socket.IO server...');
    globalSocketIO.close();
    globalSocketIO = null;
  }
  
  if (currentHttpServer) {
    console.log('🌐 Closing HTTP server...');
    currentHttpServer.close();
    currentHttpServer = null;
  }
  
  // Clear global instance
  (global as any).__socketIOInstance = undefined;
  (global as any).__socketInitializing = false;
  
  currentPort = null;
  isInitializing = false;
  
  // Clear temporary data
  temporaryBookings.clear();
  socketBookings.clear();
  socketRooms.clear();
  roomBookings.clear();
  eventDebounce.clear();
  
  console.log('✅ Graceful shutdown completed');
};

// Enhanced cleanup on process termination
const setupProcessHandlers = () => {
  const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'] as const;
  
  signals.forEach(signal => {
    process.on(signal, async () => {
      console.log(`🚨 Received ${signal}, performing graceful shutdown...`);
      await gracefulShutdown();
      process.exit(0);
    });
  });
  
  process.on('uncaughtException', async (error) => {
    console.error('🐛 Uncaught Exception:', error);
    await gracefulShutdown();
    process.exit(1);
  });
  
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('🐛 Unhandled Rejection at:', promise, 'reason:', reason);
    await gracefulShutdown();
    process.exit(1);
  });
};

setupProcessHandlers();

// Handle hot reload in development
if (process.env.NODE_ENV === 'development') {
  // Force cleanup any existing instances on module reload
  gracefulShutdown();
  
  // Check if we're in a hot reload environment (Webpack HMR)
  if (typeof (module as any).hot !== 'undefined') {
    (module as any).hot.accept();
    (module as any).hot.dispose(async () => {
      console.log('🔥 Hot reload detected, cleaning up...');
      await gracefulShutdown();
    });
  }
  
  // Additional cleanup for development
  process.on('beforeExit', async () => {
    console.log('💯 Development cleanup on exit...');
    await gracefulShutdown();
  });
}
(global as any).__socketServer = true;

// Function to get or create the Socket.IO server
const getSocketIO = async (): Promise<{ io: SocketIOServer; port: number }> => {
  // Check if we have a global instance first
  const globalInstance = (global as any).__socketIOInstance as GlobalSocketInstance | undefined;
  if (globalInstance) {
    console.log(`♻️ Reusing existing global Socket.IO server on port ${globalInstance.port}`);
    globalSocketIO = globalInstance.io;
    currentHttpServer = globalInstance.httpServer;
    currentPort = globalInstance.port;
    return { io: globalInstance.io, port: globalInstance.port };
  }

  // If we already have a running instance, return it
  if (globalSocketIO && currentPort) {
    console.log(`♻️ Reusing existing Socket.IO server on port ${currentPort}`);
    return { io: globalSocketIO, port: currentPort };
  }

  // Prevent multiple simultaneous initializations
  if (isInitializing || (global as any).__socketInitializing) {
    console.log("⏳ Socket.IO server is already initializing, waiting...");
    (global as any).__socketInitializing = true;
    // Wait for the current initialization to complete
    while (isInitializing || (global as any).__socketInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
      // Check if global instance was created while waiting
      const waitingGlobalInstance = (global as any).__socketIOInstance as GlobalSocketInstance | undefined;
      if (waitingGlobalInstance) {
        globalSocketIO = waitingGlobalInstance.io;
        currentHttpServer = waitingGlobalInstance.httpServer;
        currentPort = waitingGlobalInstance.port;
        return { io: waitingGlobalInstance.io, port: waitingGlobalInstance.port };
      }
    }
    if (globalSocketIO && currentPort) {
      return { io: globalSocketIO, port: currentPort };
    }
  }

  isInitializing = true;
  (global as any).__socketInitializing = true;
  
  return new Promise(async (resolve, reject) => {
    console.log("🚀 Initializing Socket.IO server...");
    
    // Try to start server on available port with better strategy
    const maxAttempts = 30; // Reasonable number of attempts
    const startPort = parseInt(process.env.SOCKET_PORT || '8080');
    const maxPortRange = 100; // Don't try beyond port + 100
    
    console.log(`🔍 Looking for available port starting from ${startPort}...`);
    
    // First, try to find a completely random available port if default range fails
    const tryRandomPort = () => {
      return new Promise<number>((resolve, reject) => {
        const server = require('http').createServer();
        server.listen(0, () => {
          const port = server.address()?.port;
          server.close(() => {
            if (port) {
              console.log(`🎲 Found random available port: ${port}`);
              resolve(port);
            } else {
              reject(new Error('Could not get random port'));
            }
          });
        });
        server.on('error', reject);
      });
    };
    
    const tryStartServer = async (port: number, attempts: number = 0) => {
      // Check if port is available and handle conflicts gently
      console.log(`🧼 Preparing port ${port}...`);
      const isAvailable = await checkPortAvailability(port);
      
      if (!isAvailable) {
        console.log(`⚠️ Port ${port} is still in use after cleanup attempt`);
        // Skip to next port immediately if current port is not available
        const newAttempts = attempts + 1;
        const nextPort = port + 1;
        
        if (newAttempts < maxAttempts && (nextPort - startPort) < maxPortRange) {
          console.log(`⏩ Skipping to port ${nextPort}...`);
          return tryStartServer(nextPort, newAttempts);
        } else {
          throw new Error(`Unable to find available port after cleanup attempts`);
        }
      }
      
      console.log(`✅ Port ${port} is ready for use`);
      // Small delay to ensure port is fully released
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const httpServer = createServer();
      
      const io = new SocketIOServer(httpServer, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"],
        },
        transports: ["polling"],
      });
      
      httpServer.listen(port, () => {
        // Success - store references
        currentHttpServer = httpServer;
        globalSocketIO = io;
        currentPort = port;
        isInitializing = false;
        
        console.log(`✅ Socket.IO server started on port ${port}`);
        
        // Set up event handlers
        io.on("connection", (socket) => {
          console.log(`🟢 New client connected: ${socket.id} at ${new Date().toISOString()}`);
          
          // Handle room joining
          socket.on("joinRoom", (data: { room: string }) => {
            const { room } = data;
            // console.log(`🚪 Socket ${socket.id} joining room: ${room}`);
            
            // Leave previous room if exists
            const previousRoom = socketRooms.get(socket.id);
            if (previousRoom && previousRoom !== room) {
              socket.leave(previousRoom);
              console.log(`🚪 Socket ${socket.id} left previous room: ${previousRoom}`);
            }
            
            // Join new room
            socket.join(room);
            socketRooms.set(socket.id, room);
            
            // Send current booking state for this room
            const roomBookingState = roomBookings.get(room);
            if (roomBookingState) {
              const currentBookings = Array.from(roomBookingState.entries()).map(([circleId, booking]) => ({
                circleId,
                bookedBy: booking.bookedBy,
                bookedAt: booking.bookedAt
              }));
              
              socket.emit("temporaryBookingsState", currentBookings);
              // console.log(`📦 Sent ${currentBookings.length} bookings to ${socket.id} for room ${room}`);
            } else {
              socket.emit("temporaryBookingsState", []);
              // console.log(`📦 No bookings to send to ${socket.id} for room ${room}`);
            }
          });
          
          // Handle room leaving
          socket.on("leaveRoom", (data: { room: string }) => {
            const { room } = data;
            // console.log(`🚪 Socket ${socket.id} leaving room: ${room}`);
            socket.leave(room);
            
            // Clear socket's room tracking
            if (socketRooms.get(socket.id) === room) {
              socketRooms.delete(socket.id);
            }
          });
          
          // Send current temporary booking state to new client immediately (for backward compatibility)
          const currentBookings = Array.from(temporaryBookings.entries()).map(([circleId, booking]) => ({
            circleId,
            bookedBy: booking.bookedBy,
            bookedAt: booking.bookedAt
            // Don't send socketId to clients for security
          }));
          
          // Send booking state immediately
          socket.emit("temporaryBookingsState", currentBookings);
          
          if (currentBookings.length > 0) {
            console.log(`📦 Sending current booking state to new client ${socket.id}:`,
              currentBookings.map(b => `${b.circleId}(${b.bookedBy})`).join(', '));
            console.log(`✅ Sent ${currentBookings.length} active bookings to ${socket.id}`);
            
            // Send again after a short delay to ensure client receives it
            setTimeout(() => {
              // console.log(`🔄 Re-sending booking state to ${socket.id} (delayed)`);
              socket.emit("temporaryBookingsState", currentBookings);
            }, 1000);
          } else {
            // console.log(`📦 No active bookings to send to new client ${socket.id}`);
          }

          socket.on("selectBooking", (data: { circle: Circle; sourceSocketId?: string } | Circle) => {
            let circle: Circle;
            let sourceSocketId: string | undefined;
            
            if ('sourceSocketId' in data && data.sourceSocketId) {
              circle = data.circle;
              sourceSocketId = data.sourceSocketId;
            } else {
              // Fallback for old format or missing sourceSocketId
              circle = data as Circle;
              sourceSocketId = socket.id; // Assume current socket is the source
            }
            
            // Create unique event key for deduplication
            const eventKey = `${circle.id}-${circle.status}-${circle.bookedBy || 'none'}-${circle.bookedAt || 0}`;
            const now = Date.now();
            const lastEventTime = eventDebounce.get(eventKey);
            
            // Check if this is a duplicate event within debounce timeout
            if (lastEventTime && (now - lastEventTime) < DEBOUNCE_TIMEOUT) {
              // console.log(`⏭️ Skipped duplicate event for ${circle.id} (debounced)`);
              return;
            }
            
            // Update debounce timestamp
            eventDebounce.set(eventKey, now);
            
            console.log(`📋 Processing booking event from ${socket.id}:`, { id: circle.id, status: circle.status, bookedBy: circle.bookedBy });
            
            // Update server-side temporary booking state
            if (circle.status === "pending" && circle.bookedBy && circle.bookedAt) {
              const room = socketRooms.get(socket.id) || 'default';
              temporaryBookings.set(circle.id, {
                bookedBy: circle.bookedBy,
                bookedAt: circle.bookedAt,
                socketId: sourceSocketId || socket.id,
                room: room
              });
              
              // Track booking for this socket
              if (!socketBookings.has(socket.id)) {
                socketBookings.set(socket.id, new Set());
              }
              socketBookings.get(socket.id)!.add(circle.id);
              
              // Track booking for this room
              if (!roomBookings.has(room)) {
                roomBookings.set(room, new Map());
              }
              roomBookings.get(room)!.set(circle.id, {
                bookedBy: circle.bookedBy,
                bookedAt: circle.bookedAt,
                socketId: sourceSocketId || socket.id
              });
              
              console.log(`💾 Stored temporary booking: ${circle.id} by ${circle.bookedBy} (socket: ${socket.id}, room: ${room})`);
            } else if (circle.status === "available") {
              const room = socketRooms.get(socket.id) || 'default';
              // Remove from temporary bookings
              temporaryBookings.delete(circle.id);
              
              // Remove from socket tracking
              if (socketBookings.has(socket.id)) {
                socketBookings.get(socket.id)!.delete(circle.id);
              }
              
              // Remove from room tracking
              if (roomBookings.has(room)) {
                roomBookings.get(room)!.delete(circle.id);
              }
              
              console.log(`🗑️ Removed temporary booking: ${circle.id} from room: ${room}`);
            }
            
            // Only broadcast if this client is the original source
            if (sourceSocketId === socket.id) {
              const room = socketRooms.get(socket.id);
              if (room) {
                // Broadcast only to clients in the same room
                socket.to(room).emit("circleUpdated", circle);
              } else {
                // Fallback to broadcast to all (for backward compatibility)
                socket.broadcast.emit("circleUpdated", circle);
              }
            } else {
              console.log(`⏭️ Skipped broadcast - not original source (${sourceSocketId} vs ${socket.id})`);
            }
          });

          socket.on("testSendMessage", (message: string) => {
            console.log(`💬 Test message received from ${socket.id}:`, message);
          });
          
          // Handle selectBooking event (for external updates like Property List removal)
          socket.on("selectBooking", (data: { circle: Circle; sourceSocketId: string }) => {
            console.log(`🎯 Received selectBooking from ${socket.id}:`, data);
            
            // Validate incoming data
            if (!data || !data.circle) {
              console.error(`❌ Invalid selectBooking data from ${socket.id}:`, data);
              return;
            }
            
            const { circle, sourceSocketId } = data;
            
            // Additional validation for circle object
            if (!circle.id || !circle.status) {
              console.error(`❌ Invalid circle data from ${socket.id}:`, circle);
              return;
            }
            
            // Update temporary bookings based on status
            if (circle.status === "pending" && circle.bookedBy) {
              const room = socketRooms.get(socket.id) || 'default';
              temporaryBookings.set(circle.id, {
                bookedBy: circle.bookedBy,
                bookedAt: circle.bookedAt || Date.now(),
                socketId: socket.id,
                room: room
              });
              
              // Track socket bookings
              if (!socketBookings.has(socket.id)) {
                socketBookings.set(socket.id, new Set());
              }
              socketBookings.get(socket.id)!.add(circle.id);
              
              // Track booking for this room
              if (!roomBookings.has(room)) {
                roomBookings.set(room, new Map());
              }
              roomBookings.get(room)!.set(circle.id, {
                bookedBy: circle.bookedBy,
                bookedAt: circle.bookedAt || Date.now(),
                socketId: socket.id
              });
              
              console.log(`💾 Stored booking via selectBooking: ${circle.id} by ${circle.bookedBy} (room: ${room})`);
            } else if (circle.status === "available") {
              const room = socketRooms.get(socket.id) || 'default';
              // Remove from temporary bookings
              temporaryBookings.delete(circle.id);
              
              // Remove from socket tracking
              if (socketBookings.has(socket.id)) {
                socketBookings.get(socket.id)!.delete(circle.id);
              }
              
              // Remove from room tracking
              if (roomBookings.has(room)) {
                roomBookings.get(room)!.delete(circle.id);
              }
              
              // console.log(`🗑️ Removed booking via selectBooking: ${circle.id} from room: ${room}`);
            }
            
            // Broadcast to clients in the same room
            const room = socketRooms.get(socket.id);
            if (room) {
              socket.to(room).emit("circleUpdated", circle);
              // console.log(`📡 Broadcasted circle update to room ${room}:`, circle);
            } else {
              // Fallback to broadcast to all (for backward compatibility)
              socket.broadcast.emit("circleUpdated", circle);
              console.log(`📡 Broadcasted circle update to all clients (no room):`, circle);
            }
          });
          
          // Handle request for current booking state
          socket.on("requestCurrentState", () => {
            // console.log(`📡 Client ${socket.id} requested current booking state`);
            const room = socketRooms.get(socket.id);
            const currentBookings = Array.from(temporaryBookings.entries()).map(([circleId, booking]) => ({
              circleId,
              bookedBy: booking.bookedBy,
              bookedAt: booking.bookedAt,
              room: booking.room
            }));

            const filterByRoom = room ? currentBookings.filter(booking => booking.room === room) : currentBookings;
            
            socket.emit("temporaryBookingsState", filterByRoom);
            // console.log(`📦 Sent current state to ${socket.id}: ${currentBookings.length} bookings`);
          });

          socket.on("disconnect", (reason) => {
            console.log(`🔴 Client disconnected: ${socket.id}, reason: ${reason}`);
            
            // Get the room this socket was in
            const room = socketRooms.get(socket.id);
            
            // Clean up bookings for this socket
            const userBookings = socketBookings.get(socket.id);
            if (userBookings && userBookings.size > 0) {
              console.log(`🧹 Cleaning up ${userBookings.size} bookings for disconnected socket ${socket.id} in room ${room || 'default'}`);
              
              const releasedCircles: any[] = [];
              
              userBookings.forEach(circleId => {
                const booking = temporaryBookings.get(circleId);
                if (booking) {
                  // Create released circle object
                  const releasedCircle = {
                    id: circleId,
                    status: 'available',
                    bookedBy: undefined,
                    bookedAt: undefined
                  };
                  
                  releasedCircles.push(releasedCircle);
                  
                  // Remove from temporary bookings
                  temporaryBookings.delete(circleId);
                  
                  // Remove from room tracking
                  if (room && roomBookings.has(room)) {
                    roomBookings.get(room)!.delete(circleId);
                  }
                  
                  console.log(`🔓 Released booking: ${circleId} (was booked by ${booking.bookedBy}) from room ${room || 'default'}`);
                }
              });
              
              // Remove socket tracking
              socketBookings.delete(socket.id);
              
              // Broadcast released circles to clients in the same room
              if (releasedCircles.length > 0) {
                if (room) {
                  socket.to(room).emit("bookingsReleased", releasedCircles);
                  console.log(`📡 Broadcasted ${releasedCircles.length} released bookings to room ${room}`);
                } else {
                  // Fallback to broadcast to all (for backward compatibility)
                  socket.broadcast.emit("bookingsReleased", releasedCircles);
                  console.log(`📡 Broadcasted ${releasedCircles.length} released bookings to all clients (no room)`);
                }
              }
            }
            
            // Clean up room tracking
            if (room) {
              socketRooms.delete(socket.id);
              console.log(`🚪 Removed socket ${socket.id} from room tracking`);
            }
          });
        });
        
        // Store in global for persistence across hot reloads
        (global as any).__socketIOInstance = {
          io,
          httpServer,
          port
        } as GlobalSocketInstance;
        (global as any).__socketInitializing = false;
        
        resolve({ io, port });
      });
      
      httpServer.on("error", async (err: any) => {
        if (err.code === "EADDRINUSE") {
          const newAttempts = attempts + 1;
          const nextPort = port + 1;
          
          // Check if we're within reasonable port range
          if (newAttempts < maxAttempts && (nextPort - startPort) < maxPortRange) {
            console.log(`❌ Port ${port} is still in use, trying port ${nextPort}...`);
            httpServer.close();
            
            // Wait a bit longer between attempts to allow port cleanup
            setTimeout(async () => await tryStartServer(nextPort, newAttempts), 1000);
          } else {
            // Try random port as last resort
            console.log(`🎲 Sequential ports exhausted, trying random port...`);
            try {
              const randomPort = await tryRandomPort();
              console.log(`🔄 Retrying with random port ${randomPort}...`);
              httpServer.close();
              setTimeout(async () => await tryStartServer(randomPort, 0), 500); // Reset attempts for random port
            } catch (randomErr) {
              isInitializing = false;
              (global as any).__socketInitializing = false;
              httpServer.close();
              reject(new Error(`Unable to find any available port. Sequential attempts: ${maxAttempts}, Random port failed: ${randomErr}`));
            }
          }
        } else {
          isInitializing = false;
          (global as any).__socketInitializing = false;
          httpServer.close();
          reject(err);
        }
      });
    };
    
    await tryStartServer(startPort, 0);
  });
}

// Function to handle API requests
export default async function socketServer(req: NextRequest) {
  console.log("🔧 Socket server API endpoint called");
  
  try {
    // Initialize Socket.IO if not already done
    const result = await getSocketIO();
    
    return new NextResponse(
      JSON.stringify({ 
        status: "Socket.IO server running",
        port: result.port,
        connectedClients: result.io.engine.clientsCount
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("❌ Failed to initialize Socket.IO server:", error);
    return new NextResponse(
      JSON.stringify({ 
        status: "Failed to initialize Socket.IO server",
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
