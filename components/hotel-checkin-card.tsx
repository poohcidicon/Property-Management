import React, { useState } from 'react';
import { Plus, Clock, X } from 'lucide-react';

interface HotelCheckinCardProps {
  booking?: {
    customer_id: string;
    status: string;
    start_date: string;
    end_date: string;
  } | null;
  roomNumber?: string;
  roomType?: string;
  onChangeStatus?: () => void;
}

export default function HotelCheckinCard({ booking, roomNumber, roomType, onChangeStatus }: HotelCheckinCardProps) {
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const handleCheckout = () => {
    console.log("checkout!");
  };

  return (
    <div className="max-w-sm mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
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
              <p className="text-xs text-gray-500">ราคาต่อคืน</p>
              <p className="text-sm font-semibold text-green-600">฿2,500</p>
            </div>
          </div>
        </div>

        {/* Booking Information */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-base font-bold text-gray-800 mb-3">ข้อมูลผู้เข้าพัก</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">ชื่อ:</span>
              <span className="font-medium text-gray-800">{booking?.customer_id || 'สมศรี โชติ'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">เบอร์โทร:</span>
              <span className="font-medium text-gray-800">081-234-5678</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">เช็คอินวันที่:</span>
              <span className="font-medium text-gray-800">
                {booking?.start_date ? new Date(booking.start_date).toLocaleDateString('th-TH') : '08 ต.ค. 2025'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">เช็คเอาท์วันที่:</span>
              <span className="font-medium text-gray-800">
                {booking?.end_date ? new Date(booking.end_date).toLocaleDateString('th-TH') : '11 ต.ค. 2025'}
              </span>
            </div>
            
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-gray-800 font-semibold">ยอดชำระ:</span>
              <span className="font-bold text-lg text-green-600">฿7,500</span>
            </div>
          </div>
        </div>

        {/* Expandable Section: Payment Details */}
        <div className="border-t border-gray-200 mt-4">
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
        </div>

        {/* Expandable Section: Notes */}
        <div className="border-t border-gray-200">
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
        </div>
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