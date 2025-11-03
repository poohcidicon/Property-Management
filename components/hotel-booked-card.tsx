import { CheckinUnitApi, IPayloadCheckin } from '@/lib/api/hotel/checkin';
import { Guest, SysHotelGuests } from '@/lib/api/hotel/get-guest';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import SelectHotelOtherGuest from './select-hotel-other-guest';
import { useModalOtherGuestStore } from '@/app/modal-other-guest-store';
import { format } from 'date-fns';
import { th } from 'date-fns/locale/th';
import { genMemberIdApi } from '@/lib/api/unit-booking';
import { useFilterStore } from '@/app/filter-store';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';

interface HotelBookedCardProps {
  booking?: {
    book_room_id?: string;
    booking_id?: string
    customer_id: string;
    status: string;
    start_date: string;
    end_date: string;
  } | null;
  roomNumber?: string;
  roomId?: string;
  roomType?: string;
  guestList: Guest[];
  onChangeStatus?: (status: boolean) => void;
}

export default function HotelBookedCard({ booking, roomNumber, roomType, roomId, onChangeStatus, guestList }: HotelBookedCardProps) {
  const { lastOtherGuest, ...modalOtherGuests } = useModalOtherGuestStore()
  const [selectGuest, setSelectGuest] = useState<Guest | null>(null);
  const [otherGuests, setOtherGuests] = useState<SysHotelGuests[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const handleCheckIn = async () => {
    const payloadGenMemberIdList = otherGuests.filter(g => !g.GuestCode).map(g => {
      return genMemberIdApi({ item_id: g.GuestID })
    })
    await Promise.all(payloadGenMemberIdList)
    const payloadCheckin = {
      unit_id: roomId,
      checkin_date: dayjs().format('YYYY-MM-DD'),
      customers: [{ booking_id: booking?.booking_id, book_room_id: booking?.book_room_id }], // แก้ทีหลัง
      other_guests: otherGuests.map(g => {
        return {
          book_room_id: booking?.book_room_id,
          guest_id: g.GuestID,
          gest_name: `${g.GuestFirstName} ${g.GuestLastName}`,
        }
      })
    } as IPayloadCheckin
    const result = await CheckinUnitApi(payloadCheckin)
    if (result.data){
      if (onChangeStatus){
        onChangeStatus(true)
      }
    }
    else if (onChangeStatus){
      onChangeStatus(false)
    }
  };

  const handleSetGuest = () => {
    if (guestList.length > 0) {
      const guest = guestList.find(g => g.id === booking?.booking_id)
      setSelectGuest(guest || null)
    }
  }

  const handleAddGuest = () => {
    modalOtherGuests.onOpen()
  }

  const handleDelete = (c: SysHotelGuests) => {
    const found = otherGuests.find(g => g.GuestID === c.GuestID)
    if (found){
      setOtherGuests(otherGuests.filter(g => g.GuestID !== c.GuestID))
    }
  }

  const handleSetOtherGuest = (c: SysHotelGuests) => {
    const found = otherGuests.find(g => g.GuestID === c.GuestID)
    if (!found){
      setOtherGuests([...otherGuests, c])
    }
  }

  useEffect(() => {
    if (guestList.length > 0){
      handleSetGuest()
    }
  }, [booking])

  useEffect(() => {
    if (lastOtherGuest){
      handleSetOtherGuest(lastOtherGuest)
    }
  }, [lastOtherGuest])

  return (
    <div className="max-w-sm mx-auto w-80 bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 px-6 py-4">
        <h2 className="text-2xl font-bold text-gray-800">ห้อง {roomNumber || '206'}</h2>
        <p className="text-sm text-gray-600 mt-1 capitalize">{roomType || 'ห้องคอร์'}</p>
      </div>

      {/* Room Details */}
      <div className="px-6 py-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <div>
              <p className="text-xs text-gray-500">ประเภทห้องพัก</p>
              <p className="text-sm font-semibold text-gray-800 capitalize">{roomType || 'Deluxe'}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-xs text-gray-500">ราคาห้องพัก</p>
              <p className="text-sm font-semibold text-blue-600">฿ {selectGuest?.total_amount?.toLocaleString() || '0'}</p>
            </div>
          </div>
        </div>

        {/* Booking Information */}
        <div className="border-t border-gray-200 pt-4">
          <div className="text-base font-bold text-gray-800 mb-3 flex justify-between align-center">
            <div>ข้อมูลผู้จอง</div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">ชื่อ:</span>
              <span className="font-medium text-gray-800">{selectGuest?.full_name || ''}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">เบอร์โทร:</span>
              <span className="font-medium text-gray-800">{selectGuest?.mobile || ''}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">เช็คอินวันที่:</span>
              <span className="font-medium text-gray-800">
                {/* {selectGuest?.start_booking ? new Date(selectGuest?.start_booking).toLocaleDateString('th-TH') : '08 ต.ค. 2025'} */}
                {selectGuest?.start_booking ? format(new Date(selectGuest?.start_booking), "dd MMM yyyy", { locale: th }) : '-'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">เช็คเอาท์วันที่:</span>
              <span className="font-medium text-gray-800">
                {selectGuest?.end_booking ? format(new Date(selectGuest?.end_booking), "dd MMM yyyy", { locale: th }) : '-'}
              </span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-4">
          <div className="text-base font-bold text-gray-800 mb-3 flex justify-between align-center">
            <div>ข้อมูลผู้เข้าพัก</div>
            <div className="flex justify-end">
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded"
                onClick={handleAddGuest}
              >
                +
              </button>
            </div>
          </div>
          
          {otherGuests.map((otherGuest, index) => {
            return (
              <div className='flex justify-between gap-5 mb-4' key={otherGuest.GuestID}>
                <div className="space-y-2 text-sm w-full">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ชื่อ:</span>
                    <span className="font-medium text-gray-800">{otherGuest?.GuestFirstName || ''} {otherGuest?.GuestLastName || ''}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">เบอร์โทร:</span>
                    <span className="font-medium text-gray-800">{otherGuest?.GuestMobileNumber || ''}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">เช็คอินวันที่:</span>
                    <span className="font-medium text-gray-800">
                      {selectGuest?.start_booking ? new Date(selectGuest?.start_booking).toLocaleDateString('th-TH') : '08 ต.ค. 2025'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">เช็คเอาท์วันที่:</span>
                    <span className="font-medium text-gray-800">
                      {selectGuest?.end_booking ? new Date(selectGuest?.end_booking).toLocaleDateString('th-TH') : '11 ต.ค. 2025'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-end items-start">
                  <button 
                    onClick={() => handleDelete(otherGuest)}
                    className="bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            )
          })}
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="text-gray-800 font-semibold">ค่าจองทั้งหมด:</span>
            <span className="font-bold text-lg text-green-600">฿ {selectGuest?.total_amount?.toLocaleString() || '0'}</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="px-6 pb-6">
        <button 
          onClick={() => {
            setShowConfirmDialog(true)
          }}
          className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          เช็คอิน
        </button>
      </div>
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              ยืนยันเช็คอิน
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false)
              }}
            >
              ยกเลิก
            </Button>
            <Button
              variant="default"
              onClick={() => {
                handleCheckIn()
                setShowConfirmDialog(false)
              }}
            >
              ยืนยัน
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}