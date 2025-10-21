import { X } from "lucide-react"
import { Circle, ROOM_TYPE_COLORS } from "./canvas-map"

interface HotelClearingCardProps {
  selectedProperty: Circle | null
  selectedRoomType: "standard" | "family" | null 
}

export default function HotelClearingCard ({ selectedProperty, selectedRoomType }: HotelClearingCardProps) {
  return (
    <div
      className={`absolute top-4 right-4 transition-all duration-300 translate-x-0`}
    >
      <div className="max-w-sm w-80 bg-white rounded-2xl shadow p-5 border border-gray-100">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-gray-800">ห้อง {selectedProperty?.name || '101'}</h2>
          <div className="flex items-center gap-2">
            <span className={`bg-gray-100 text-gray-700" text-sm px-3 py-1 rounded-full`}>
              รอทำความสะอาด
            </span>
            <button
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => {
                // setShowHotelRoomDialog(false)
                // onDialogClose?.()
              }}
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
        <div className="flex gap-2">
          <button
            className="w-full bg-green-600 text-white rounded-xl py-2.5 hover:bg-gray-800 transition"
            // onClick={onConfirmHotelRoom}
          >
            เปิดห้อง
          </button>
          <button
            className="w-full bg-gray-600 text-white rounded-xl py-2.5 hover:bg-gray-800 transition"
            // onClick={onConfirmHotelRoom}
          >
            ซ่อมบำรุง
          </button>
        </div>
      </div>
    </div>
  )
}