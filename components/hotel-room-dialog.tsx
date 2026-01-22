"use client"

import { X, Calendar, CheckCircle } from "lucide-react"
import { Circle, ROOM_TYPE_COLORS } from "./canvas-map"
import HotelCheckinCard from "./hotel-checkin-card"
import HotelBookedCard from "./hotel-booked-card"
import { CheckedInBooking, PendingBooking } from "@/data/booking-mock-data"
import { Guest } from "@/lib/api/hotel/get-guest"
import { useEffect, useState } from "react"
import { format } from 'date-fns';
import { th } from 'date-fns/locale/th';
import { enUS } from 'date-fns/locale/en-US';
import HotelClearingCard from "./hotel-clearing-card"
import dayjs from "dayjs"
import { useRoomTypeStore } from "@/app/room-type-store"
import { useSelectLanguage } from "@/hooks/use-select-language"

interface HotelRoomDialogProps {
  showHotelRoomDialog: boolean
  setShowHotelRoomDialog: (show: boolean) => void
  selectedProperty: Circle | null
  selectedRoomType: "standard" | "family" | null
  onConfirmHotelRoom: () => void
  onChangeStatus?: (status: boolean) => void
  guestList: Guest[]
  statusType?: "available" | "booked" | "checkin" | "clearing" | "close"
  customerData?: any | null
  onDialogClose?: () => void // Add callback for dialog close
  selectGuest?: PendingBooking | null
}

export default function HotelRoomDialog({
  showHotelRoomDialog,
  setShowHotelRoomDialog,
  selectedProperty,
  selectedRoomType,
  onConfirmHotelRoom,
  onChangeStatus,
  guestList,
  statusType = "available",
  customerData,
  selectGuest,
  onDialogClose
}: HotelRoomDialogProps) {
  console.log(selectGuest, 'selectGuest')
  const { roomTypesLowwer: ROOM_TYPE_COLORS } = useRoomTypeStore()

  const [guest, setGuest] = useState<Guest | null>(null);

  const { locale, language } = useSelectLanguage()
  const localeDate = language === 'th' ? th : enUS;

  const night = selectGuest?.checkOutDate ? Math.abs(dayjs(selectGuest?.checkInDate).diff(dayjs(selectGuest?.checkOutDate), 'day')): 3

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
            onClick={() => {
              setShowHotelRoomDialog(false)
              onDialogClose?.()
            }}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
          <HotelCheckinCard 
            booking={selectedProperty?.booking}
            total_amount={selectedProperty?.total_amount || 0}
            checkin_customers={selectedProperty?.checkin_customers || []} 
            roomNumber={selectedProperty?.name} 
            roomType={selectedProperty?.room_type} 
            roomTypeDesc={selectedProperty?.room_type_desc}
            roomId={selectedProperty?.id} 
            onChangeStatus={onChangeStatus} 
            guestList={guestList}
          />
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
            onClick={() => {
              setShowHotelRoomDialog(false)
              onDialogClose?.()
            }}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
          <HotelBookedCard 
            booking={selectedProperty?.booking} 
            roomNumber={selectedProperty?.name} 
            roomType={selectedProperty?.room_type} 
            roomTypeDesc={selectedProperty?.room_type_desc}
            roomId={selectedProperty?.id}
            onChangeStatus={onChangeStatus} 
            guestList={guestList}
          />
        </div>
      </div>
    )
  }

  if (statusType === 'clearing' || statusType === 'close') {
    return (
      <HotelClearingCard
        selectedProperty={selectedProperty}
        selectedRoomType={selectedRoomType}
        onChangeStatus={(status) => {
          if (status && onChangeStatus){
            onChangeStatus(status)
          }
          onDialogClose?.()
        }}
        onClose={(status) => {
          if (status){
            setShowHotelRoomDialog(false)
            onDialogClose?.()
          }
        }}
      />
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
          <h2 className="text-xl font-semibold text-gray-800">{locale?.room_dialog?.room_no || 'ห้อง'} {selectedProperty?.name || ''}</h2>
          <div className="flex items-center gap-2">
            <span className={`${
              statusType === "available" ? "bg-green-100 text-green-700" :
              statusType === "booked" ? "bg-orange-100 text-orange-700" :
              "bg-red-100 text-red-700"
            } text-sm px-3 py-1 rounded-full`}>
              {statusType === "available" ? locale?.main?.room_available || 'ว่าง' :
               statusType === "booked" ? locale?.main?.room_booked || 'จองแล้ว' :
               locale?.main?.room_checked_in || 'เช็คอินแล้ว'}
            </span>
            <button
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowHotelRoomDialog(false)
                onDialogClose?.()
              }}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Room Type + Price */}
        <div className="flex justify-between items-center border-b pb-3 mb-3">
          <div className="text-gray-500">
            <p className="text-sm">{locale?.room_dialog?.room_type || 'ประเภทห้อง'}</p>
            <p
              className="font-medium capitalize"
              style={{
                color: selectedProperty?.room_type
                  ? ROOM_TYPE_COLORS[selectedProperty.room_type.toLocaleLowerCase() as keyof typeof ROOM_TYPE_COLORS]?.primary || "#6b7280"
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
        <div className="text-gray-700 space-y-2 mb-4">
          <p className="font-medium">{locale?.room_dialog?.check_availability || 'ตรวจสอบความพร้อม'}</p>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
            <span>
              {selectGuest?.checkInDate && selectGuest?.checkOutDate 
                ? `${format(selectGuest?.checkInDate, "dd MMM", { locale: localeDate })} - ${format(selectGuest?.checkOutDate, "dd MMM yyyy", { locale: localeDate })}`
                : selectedProperty?.booking?.start_date && selectedProperty?.booking?.end_date
                ? `${new Date(selectedProperty.booking.start_date).toLocaleDateString('th-TH')} - ${new Date(selectedProperty.booking.end_date).toLocaleDateString('th-TH')}`
                // : `${new Intl.DateTimeFormat('th-TH', { month: 'short', day: 'numeric' }).format(new Date())}  -  ${new Intl.DateTimeFormat('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000))}`
                : `${format(new Date(), "dd MMM", { locale: localeDate })} - ${format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), "dd MMM yyyy", { locale: localeDate })}`
              }
            </span>
          </div>
          <div className="flex items-center text-sm text-green-600">
            <CheckCircle className="w-4 h-4 mr-2" />
            <span>
              {statusType === "available"
                ? `${locale?.room_dialog?.room_is_available || 'ห้องว่างตามวันที่ต้องการ'} (${night} ${night > 1 ? locale?.booking_card?.nights || 'คืน' : locale?.booking_card?.night || 'คืน'})`
                : statusType === "booked"
                  ? `ถูกจองโดย ${selectedProperty?.booking?.customer_id || 'ลูกค้า'}`
                  : statusType === "checkin"
                    ? `เช็คอินโดย ${selectedProperty?.booking?.customer_id || 'ลูกค้า'}`
                    : `${locale?.room_dialog?.room_is_available || 'ห้องว่างตามวันที่ต้องการ'} (3 ${locale?.booking_card?.nights || 'คืน'})`
              }
            </span>
          </div>
        </div>

        {/* Status-specific button */}
        {statusType === "available" ? (
          customerData ? (
            <button
              className="w-full bg-black text-white rounded-xl py-2.5 hover:bg-gray-800 transition"
              onClick={onConfirmHotelRoom}
            >
              {locale?.room_dialog?.confirm_booking || 'ยืนยันการจอง'}
            </button>
          ) : null
        ) : statusType === "booked" ? (
          <button
            className="w-full bg-orange-500 text-white rounded-xl py-2.5 hover:bg-orange-600 transition"
            onClick={() => {
              setShowHotelRoomDialog(false)
              onDialogClose?.()
            }}
          >
            {locale?.room_dialog?.is_booked || 'ห้องถูกจองแล้ว'}
          </button>
        ) : statusType === "checkin" ? (
          <button
            className="w-full bg-red-500 text-white rounded-xl py-2.5 hover:bg-red-600 transition"
            onClick={() => {
              setShowHotelRoomDialog(false)
              onDialogClose?.()
            }}
          >
            {locale?.room_dialog?.is_check_in || 'ห้องถูกเช็คอินแล้ว'}
          </button>
        ) : null}
      </div>
    </div>
  )
}