import { create } from "zustand";

interface RoomTypeColoer {
  primary: string
  secondary: string,
  glow: string,
}
interface RoomTypeState {
  roomTypes: Record<string, RoomTypeColoer>;
  roomTypesLowwer: Record<string, RoomTypeColoer>;
  setRoomTypes: (roomTypes: Record<string, RoomTypeColoer>) => void;
  setRoomTypesLowwer: (roomTypes: Record<string, RoomTypeColoer>) => void;
}

export const useRoomTypeStore = create<RoomTypeState>((set) => ({
  roomTypes: {},
  roomTypesLowwer: {},
  setRoomTypes: (roomTypes: Record<string, RoomTypeColoer>) => set({ roomTypes }),
  setRoomTypesLowwer: (roomTypes: Record<string, RoomTypeColoer>) => set({ roomTypesLowwer: roomTypes }),
}));