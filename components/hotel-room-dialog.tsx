"use client"

import { X, Calendar, CheckCircle } from "lucide-react"
import { Circle, ROOM_TYPE_COLORS } from "./canvas-map"
import HotelCheckinCard from "./hotel-checkin-card"
import HotelBookedCard from "./hotel-booked-card"
import { CheckedInBooking, PendingBooking } from "@/data/booking-mock-data"
import { Guest } from "@/lib/api/hotel/get-guest"
import { useEffect, useState } from "react"

interface HotelRoomDialogProps {
  showHotelRoomDialog: boolean
  setShowHotelRoomDialog: (show: boolean) => void
  selectedProperty: Circle | null
  selectedRoomType: "standard" | "family" | null
  onConfirmHotelRoom: () => void
  onChangeStatus?: (status: boolean) => void
  guestList: Guest[]
  statusType?: "available" | "booked" | "checkin"
}

export default function HotelRoomDialog({
  showHotelRoomDialog,
  setShowHotelRoomDialog,
  selectedProperty,
  selectedRoomType,
  onConfirmHotelRoom,
  onChangeStatus,
  guestList,
  statusType = "available"
}: HotelRoomDialogProps) {

  const [guest, setGuest] = useState<Guest | null>(null);

  const handleSetGuest = () => {
    if (guestList.length > 0) {
      const guest = guestList.find(g => g.id === selectedProperty?.booking?.booking_id)
      setGuest(guest || null)
    }
  }

  useEffect(() => {
    handleSetGuest()
  }, [selectedProperty])

  if (!showHotelRoomDialog) return null
  if (statusType === "checkin") {
    return (
      <div
        className={`absolute top-4 right-4 transition-all duration-300 ${showHotelRoomDialog ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="relative">
          <button
            className="absolute top-2 right-2 z-10 p-1 rounded-full bg-white hover:bg-gray-100 transition-colors shadow-md"
            onClick={() => setShowHotelRoomDialog(false)}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
          <HotelCheckinCard booking={selectedProperty?.booking} checkin_customers={selectedProperty?.checkin_customers || []} roomNumber={selectedProperty?.name} roomType={selectedProperty?.room_type} roomId={selectedProperty?.id} onChangeStatus={onChangeStatus} guestList={guestList}/>
        </div>
      </div>
    )
  }

  // If status is booked, show the booked card component
  if (statusType === "booked") {
    return (
      <div
        className={`absolute top-4 right-4 transition-all duration-300 ${showHotelRoomDialog ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="relative">
          <button
            className="absolute top-2 right-2 z-10 p-1 rounded-full bg-white hover:bg-gray-100 transition-colors shadow-md"
            onClick={() => setShowHotelRoomDialog(false)}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
          <HotelBookedCard 
            booking={selectedProperty?.booking} 
            roomNumber={selectedProperty?.name} 
            roomType={selectedProperty?.room_type} 
            roomId={selectedProperty?.id}
            onChangeStatus={onChangeStatus} 
            guestList={guestList}
          />
        </div>
      </div>
    )
  }

  // For available status, show the original dialog
  return (
    <div
      className={`absolute top-4 right-4 transition-all duration-300 ${showHotelRoomDialog ? "translate-x-0" : "translate-x-full"}`}
    >
      <div className="max-w-sm bg-white rounded-2xl shadow p-5 border border-gray-100">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-gray-800">ห้อง {selectedProperty?.name || '101'}</h2>
          <div className="flex items-center gap-2">
            <span className={`${
              statusType === "available" ? "bg-green-100 text-green-700" :
              statusType === "booked" ? "bg-orange-100 text-orange-700" :
              "bg-red-100 text-red-700"
            } text-sm px-3 py-1 rounded-full`}>
              {statusType === "available" ? "ว่าง" :
               statusType === "booked" ? "จองแล้ว" :
               "เช็คอินแล้ว"}
            </span>
            <button
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => setShowHotelRoomDialog(false)}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Room Type + Price */}
        <div className="flex justify-between items-center border-b pb-3 mb-3">
          <div className="text-gray-500">
            <p className="text-sm">ประเภทห้อง</p>
            <p
              className="font-medium capitalize"
              style={{
                color: selectedProperty?.room_type
                  ? ROOM_TYPE_COLORS[selectedProperty.room_type as keyof typeof ROOM_TYPE_COLORS]?.primary || "#6b7280"
                  : selectedRoomType
                    ? ROOM_TYPE_COLORS[selectedRoomType]?.primary || "#6b7280"
                    : "#6b7280"
              }}
            >
              {selectedProperty?.room_type || selectedRoomType || 'standard'}
            </p>
          </div>
          {/* <div className="text-right">
            <p className="text-sm text-gray-500">ราคาต่อคืน</p>
            <p className="text-green-600 font-semibold text-lg">฿{selectedProperty?.d_price?.toLocaleString() || '1,500'}</p>
          </div> */}
        </div>

        {/* Status-specific content */}
        <div className="text-gray-700 space-y-2 mb-4">
          <p className="font-medium">ตรวจสอบความพร้อม</p>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
            <span>
              {selectedProperty?.booking?.start_date && selectedProperty?.booking?.end_date
                ? `${new Date(selectedProperty.booking.start_date).toLocaleDateString('th-TH')} - ${new Date(selectedProperty.booking.end_date).toLocaleDateString('th-TH')}`
                : '10 ต.ค. 2025 - 13 ต.ค. 2025'
              }
            </span>
          </div>
          <div className="flex items-center text-sm text-green-600">
            <CheckCircle className="w-4 h-4 mr-2" />
            <span>
              {statusType === "available"
                ? "ห้องว่างตามวันที่ต้องการ (3 คืน)"
                : statusType === "booked"
                  ? `ถูกจองโดย ${selectedProperty?.booking?.customer_id || 'ลูกค้า'}`
                  : statusType === "checkin"
                    ? `เช็คอินโดย ${selectedProperty?.booking?.customer_id || 'ลูกค้า'}`
                    : "ห้องว่างตามวันที่ต้องการ (3 คืน)"
              }
            </span>
          </div>
        </div>

        {/* Status-specific button */}
        {statusType === "available" ? (
          <button
            className="w-full bg-black text-white rounded-xl py-2.5 hover:bg-gray-800 transition"
            onClick={onConfirmHotelRoom}
          >
            ยืนยันการจอง
          </button>
        ) : statusType === "booked" ? (
          <button
            className="w-full bg-orange-500 text-white rounded-xl py-2.5 hover:bg-orange-600 transition"
            onClick={() => setShowHotelRoomDialog(false)}
          >
            ห้องถูกจองแล้ว
          </button>
        ) : statusType === "checkin" ? (
          <button
            className="w-full bg-red-500 text-white rounded-xl py-2.5 hover:bg-red-600 transition"
            onClick={() => setShowHotelRoomDialog(false)}
          >
            ห้องถูกเช็คอินแล้ว
          </button>
        ) : null}
      </div>
    </div>
  )
}