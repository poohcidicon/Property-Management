import { X } from "lucide-react"
import { Circle, ROOM_TYPE_COLORS } from "./canvas-map"
import { IUpdateRoomStatus, updateRoomStatusApi } from "@/lib/api/hotel/unit-matrix-hotel"
import dayjs from "dayjs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { useState } from "react"
import { Button } from "./ui/button"
import { useRoomTypeStore } from "@/app/room-type-store"
import { useFilterStore } from "@/app/filter-store"
import { useSelectLanguage } from "@/hooks/use-select-language"

interface HotelClearingCardProps {
  selectedProperty: Circle | null
  selectedRoomType: "standard" | "family" | null
  onChangeStatus?: (status: boolean) => void
  onClose?: (status: boolean) => void
}

export default function HotelClearingCard ({ selectedProperty, selectedRoomType, onChangeStatus, onClose }: HotelClearingCardProps) {
  const { roomTypesLowwer: ROOM_TYPE_COLORS } = useRoomTypeStore()
  const { activeDate } = useFilterStore()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const { locale } = useSelectLanguage()

  const handleChangeStatusRoom = async (status: number) => {
    const payload = {
      active_date: activeDate,
      status: status,
      unit_id: selectedProperty?.id
    } as IUpdateRoomStatus
    const result = await updateRoomStatusApi(payload)
    if (result.data){
      if (onChangeStatus){
        onChangeStatus(true)
      }
    }
    else{
      if (onChangeStatus){
        onChangeStatus(false)
      }
    }
  }

  return (
    <div
      className={`absolute top-4 right-4 transition-all duration-300 translate-x-0`}
    >
      <div className="max-w-sm w-80 bg-white rounded-2xl shadow p-5 border border-gray-100">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-gray-800">{locale?.room_dialog?.room_no || 'Room'} {selectedProperty?.name || '101'}</h2>
          <div className="flex items-center gap-2">
            <span className={`bg-gray-100 text-gray-700" text-sm px-3 py-1 rounded-full`}>
              {selectedProperty?.status === 'clearing' ? locale?.main?.room_cleaning || 'รอทำความสะอาด' : locale?.main?.room_maintenance || 'ปิดปรับปรุง'}
            </span>
            <button
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => {
                if (onClose){
                  onClose(true)
                }
              }}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Room Type + Price */}
        <div className="flex justify-between items-center border-b pb-3 mb-3">
          <div className="text-gray-500">
            <p className="text-sm">{locale?.room_dialog?.room_type || 'Room Type'}</p>
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
              {selectedProperty?.room_type_desc || selectedRoomType || 'standard'}
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
            onClick={() => setShowConfirmDialog(true)}
          >
            {locale?.room_dialog?.open_room || 'เปิดห้อง'}
          </button>
          {/* <button
            className="w-full bg-gray-600 text-white rounded-xl py-2.5 hover:bg-gray-800 transition"
            onClick={() => handleChangeStatusRoom(4)}
          >
            ซ่อมบำรุง
          </button> */}
        </div>
      </div>
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {locale?.room_dialog?.confirm_open_room || 'ยืนยันการเปิดห้อง'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">{locale?.room_dialog?.confirm_open_room_description || 'คุณต้องการเปิดห้องนี้หรือไม่?'}</p>
          </div>
          <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmDialog(false)
                }}
              >
              {locale?.main?.cancel || 'ยกเลิก'}
            </Button>
            <Button
              variant="default"
              onClick={() => {
                handleChangeStatusRoom(0)
              }}
            >
              {locale?.main?.confirm || 'ยืนยัน'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}