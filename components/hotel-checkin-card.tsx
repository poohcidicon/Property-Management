import React, { useEffect, useState } from 'react';
import { Plus, Clock, X } from 'lucide-react';
import { CheckoutUnitApi, IPayloadCheckout } from '@/lib/api/hotel/checkin';
import dayjs from 'dayjs';
import { getOtherBookingGuestsApi, Guest, SysHotelGuests } from '@/lib/api/hotel/get-guest';

interface HotelCheckinCardProps {
  booking?: {
    book_room_id?: string;
    booking_id?: string
    customer_id: string;
    status: string;
    start_date: string;
    end_date: string;
  } | null;
  checkin_customers: Array<{
    customer_id?: string; 
    name?: string
    booking_id: string; 
    book_room_id: string 
  }>
  roomNumber?: string;
  roomType?: string;
  roomId?: string;
  guestList: Guest[];
  total_amount: number;
  onChangeStatus?: (status: boolean) => void;
}

export default function HotelCheckinCard({ booking, roomNumber, roomType, onChangeStatus, roomId, guestList, checkin_customers, total_amount }: HotelCheckinCardProps) {
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [selectGuest, setSelectGuest] = useState<Guest | null>(null);
  const [otherGuests, setOtherGuests] = useState<SysHotelGuests[]>([]);

  const handleCheckout = async () => {
    const payloadCheckout = {
      unit_id: roomId || '',
      checkout_date: dayjs().format('YYYY-MM-DD'),
      total_amount: selectGuest?.total_amount
    } as IPayloadCheckout
    const result = await CheckoutUnitApi(payloadCheckout);
    if (result.data) {
      if (onChangeStatus) {
        onChangeStatus(true);
      }
    }
  };

  const handleSetGuest = () => {
    if (guestList.length > 0) {
      const guest = guestList.find((g) => {
        const foundCheckin = checkin_customers.find((c) => c.book_room_id === g.book_room_id);
        return foundCheckin
      })
      setSelectGuest(guest || null)
    }
  }

  const handleSetOtherGuest = async () => {
    const checkin_customer = checkin_customers[0]
    const result = await getOtherBookingGuestsApi({
      book_room_id: checkin_customer?.book_room_id || ''
    })
    if (result.data) {
      setOtherGuests(result.data)
    }
  }

  useEffect(() => {
    if (guestList.length > 0) {
      handleSetGuest()
    }
    if (checkin_customers.length > 0){
      handleSetOtherGuest()
    }
  }, [booking, checkin_customers, guestList])

  return (
    <div className="max-w-sm mx-auto w-80 bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 px-6 py-4">
        <h2 className="text-2xl font-bold text-gray-800">ห้อง {roomNumber || '202'}</h2>
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
              <p className="text-sm font-semibold text-gray-800 capitalize">{roomType}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-xs text-gray-500">ราคา</p>
              <p className="text-sm font-semibold text-green-600">฿ {selectGuest?.total_amount || total_amount?.toLocaleString() || 0 }</p>
            </div>
          </div>
        </div>

        {/* Booking Information */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-base font-bold text-gray-800 mb-3">ข้อมูลผู้เข้าพัก</h3>
          
          <div className="space-y-2 text-sm">
            {/* <div className="flex justify-between">
              <span className="text-gray-600">ชื่อ:</span>
              <span className="font-medium text-gray-800">{selectGuest?.full_name || ''}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">เบอร์โทร:</span>
              <span className="font-medium text-gray-800">{selectGuest?.mobile || ''}</span>
            </div> */}
            {otherGuests.map((guest) => {
              return (
                <div className='border-b mb-2 py-3' key={guest.GuestID}>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ชื่อ:</span>
                    <span className="font-medium text-gray-800">{guest?.GuestFirstName || ''} {guest?.GuestLastName || ''}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">เบอร์โทร:</span>
                    <span className="font-medium text-gray-800">{guest?.GuestPhone || '-'}</span>
                  </div>
                </div>
              )
            })}
            
            <div className="flex justify-between">
              <span className="text-gray-600">เช็คอินวันที่:</span>
              <span className="font-medium text-gray-800">
                {selectGuest?.start_booking ? new Date(selectGuest.start_booking).toLocaleDateString('th-TH') : '08 ต.ค. 2025'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">เช็คเอาท์วันที่:</span>
              <span className="font-medium text-gray-800">
                {selectGuest?.end_booking ? new Date(selectGuest.end_booking).toLocaleDateString('th-TH') : '11 ต.ค. 2025'}
              </span>
            </div>
            
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-gray-800 font-semibold">ยอดชำระ:</span>
              <span className="font-bold text-lg text-green-600">฿ {selectGuest?.total_amount || total_amount?.toLocaleString() || 0 }</span>
            </div>
          </div>
        </div>

        {/* Expandable Section: Payment Details */}
        {/* <div className="border-t border-gray-200 mt-4">
          <button 
            onClick={() => setShowPaymentDetails(!showPaymentDetails)}
            className="w-full flex items-center justify-between py-3 text-left"
          >
            <h3 className="text-base font-bold text-gray-800">บริการเพิ่มเติม</h3>
            <Plus className={`w-5 h-5 text-gray-600 transition-transform ${showPaymentDetails ? 'rotate-45' : ''}`} />
          </button>
          
          {showPaymentDetails && (
            <div className="pb-3 text-sm text-gray-600">
              ไม่มีรายการชำระเงิน
            </div>
          )}
        </div> */}

        {/* Expandable Section: Notes */}
        {/* <div className="border-t border-gray-200">
          <button 
            onClick={() => setShowNotes(!showNotes)}
            className="w-full flex items-center justify-between py-3 text-left"
          >
            <h3 className="text-base font-bold text-gray-800">ปัญหา/แจ้งเหตุ</h3>
            <Plus className={`w-5 h-5 text-gray-600 transition-transform ${showNotes ? 'rotate-45' : ''}`} />
          </button>
          
          {showNotes && (
            <div className="pb-3 text-sm text-gray-600">
              ไม่มีข้อมูลรายละเอียด
            </div>
          )}
        </div> */}
      </div>

      {/* Action Buttons */}
      <div className="px-6 pb-6">
        <button
          onClick={handleCheckout}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center"
        >
          เช็คเอาท์
        </button>
      </div>
    </div>
  );
}