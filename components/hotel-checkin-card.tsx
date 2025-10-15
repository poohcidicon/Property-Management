import React, { useEffect, useState } from 'react';
import { Plus, Clock, X } from 'lucide-react';
import { CheckoutUnitApi, GetBookMaterialOptionApi, GetMaterialApi, IBookMaterialOption, IMaterial, InsBookMaterialOptionApi, IPayloadCheckout, IPayloadInsertMaterialOption } from '@/lib/api/hotel/checkin';
import dayjs from 'dayjs';
import { getOtherBookingGuestsApi, Guest, SysHotelGuests } from '@/lib/api/hotel/get-guest';
import Spinner from './ui/Spinner';
import SpinnerSmall from './ui/spinner-small';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { format } from 'date-fns';
import { th } from 'date-fns/locale/th';

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
  const [isLoadingOtherGuests, setIsLoadingOtherGuests] = useState(false)
  const [showDialogCheckout, setShowDialogCheckout] = useState(false)
  const [showDialogMaterial, setShowDialogMaterial] = useState(false)
  const [materialMas, setMeterialMas] = useState<IMaterial[]>([])
  const [selectMaterialId, setSelectMaterialId] = useState<string | null>(null)
  const [materialPrice, setMaterialPrice] = useState<number>(0)
  const [bookMaterialList, setBookMaterialList] = useState<IBookMaterialOption[]>([])
  const [damagesPrice, setDamagesPrice] = useState<number>(0)
  const [minibarPrice, setMinibarPrice] = useState<number>(0)
  const [summaryMaterialPrice, setSummaryMaterialPrice] = useState<number>(0)

  const summaryPrice = (
    selectGuest?.total_amount || total_amount || 0
  ) + (
    damagesPrice
  ) + (
    minibarPrice
  ) + (
    summaryMaterialPrice
  )

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
    setIsLoadingOtherGuests(true)
    const result = await getOtherBookingGuestsApi({
      book_room_id: checkin_customer?.book_room_id || ''
    })
    if (result.data) {
      setOtherGuests(result.data)
    }
    setIsLoadingOtherGuests(false)
  }

  const loadMaterial = async () => {
    const result = await GetMaterialApi()
    if (result.data && result.data?.length > 0){
      setMeterialMas(result.data)
    }
    else{
      setMeterialMas([])
    }
  }

  const loadBookMaterialOption = async () => {
    const checkinData = checkin_customers[0]
    if (!checkinData){
      return
    }
    const result = await GetBookMaterialOptionApi({
      book_room_id: checkinData.book_room_id,
      booking_id: checkinData.booking_id
    })
    if (result.data && result.data?.length > 0){
      setBookMaterialList(result.data)
      const summaryPrice = result.data.reduce<number>((acc, curr) => {
        return acc + (curr.Price || 0)
      }, 0)
      setSummaryMaterialPrice(summaryPrice)
    }
    else{
      setBookMaterialList([])
    }
  }

  const handleBookMaterial = async () => {
    if (!selectMaterialId){
      return
    }
    const checkinData = checkin_customers[0]
    const payload = {
      book_room_id: checkinData.book_room_id,
      booking_id: checkinData.booking_id,
      material_id: selectMaterialId,
      price: materialPrice || 0,
      qty: 1
    } as IPayloadInsertMaterialOption

    const result = await InsBookMaterialOptionApi(payload)
    if (result.data){
      setShowDialogMaterial(false)
      loadBookMaterialOption()
    }
  }

  useEffect(() => {
    if (guestList.length > 0) {
      handleSetGuest()
    }
    if (checkin_customers.length > 0){
      handleSetOtherGuest()
      loadBookMaterialOption()
    }
  }, [booking, checkin_customers, guestList])

  useEffect(() => {
    loadMaterial()
  }, [])

  return (
    <div className="max-w-sm mx-auto w-80 bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 px-6 py-4">
        <h2 className="text-2xl font-bold text-gray-800">ห้อง {roomNumber || '202'}</h2>
        <p className="text-sm text-gray-600 mt-1 capitalize">{roomType || 'ห้องคอร์'}</p>
      </div>

      {/* Room Details */}
      <div className="px-6 py-4 overflow-auto h-full max-h-[450px]">
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
              <p className="text-sm font-semibold text-green-600">฿ {selectGuest?.total_amount?.toLocaleString() || total_amount?.toLocaleString() || 0 }</p>
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
            <SpinnerSmall loading={isLoadingOtherGuests}>
              {isLoadingOtherGuests && <div className='w-3 h-4'></div>}
            </SpinnerSmall>
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
              <span className="font-bold text-lg text-green-600">฿ {selectGuest?.total_amount?.toLocaleString() || total_amount?.toLocaleString() || 0 }</span>
            </div>
          </div>
        </div>

        {/* Expandable Section: Payment Details */}
        <div className="border-t border-gray-200 mt-4">
          <button 
            // onClick={() => setShowPaymentDetails(!showPaymentDetails)}
            onClick={() => setShowDialogMaterial(true)}
            className="w-full flex items-center justify-between py-3 text-left"
          >
            <h3 className="text-base font-bold text-gray-800">บริการเพิ่มเติม</h3>
            <Plus className={`w-5 h-5 text-gray-600 transition-transform ${showPaymentDetails ? 'rotate-45' : ''}`} />
          </button>
          
          {bookMaterialList.length > 0 && (
            <div className="pb-3 text-sm text-gray-600">
              {bookMaterialList.map((bm) => {
                return (
                  <div className="flex justify-between pt-2 border-gray-200" key={bm.ID}>
                    <div className="text-sm flex flex-col gap-2">
                      <span>{bm.MaterialName}</span>
                      <span className='text-xs'>{format(new Date(bm.CreateDate), "dd MMM yyyy HH:mm", { locale: th })}</span>
                    </div>
                    <div className="text-sm font-bold text-lg text-green-600">฿ {bm.Price?.toLocaleString() || 0 }</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

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
          onClick={() => {
            setShowDialogCheckout(true)
            // handleCheckout()
          }}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center"
        >
          เช็คเอาท์
        </button>
      </div>
      <Dialog open={showDialogCheckout} onOpenChange={(open) => {
        setShowDialogCheckout(open);
      }}>
        <DialogContent 
          className="max-w-xl max-h-[90vh] w-full overflow-hidden flex flex-col border-2 border-blue-200 shadow-xl">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DialogTitle className="text-xl flex items-center gap-2 flex flex-col items-start">
              <div>เช็คเอาท์</div>
              <div className='text-[#888888] text-sm'>
                <span>กรุณาระบุค่าใช้จ่ายเพิ่มเติม (ถ้ามี)</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-1">
            <div className='flex flex-col gap-1'>
              <div className='flex flex-col gap-2 text-sm'>
                <label>ค่าความเสียหาย (บาท)</label>
                <input
                  type="number"
                  value={damagesPrice}
                  onChange={e => setDamagesPrice(Number(e.target.value))}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className='flex flex-col gap-2 text-sm'>
                <label>ค่า Minibar (บาท)</label>
                <input
                  type="number"
                  value={minibarPrice}
                  onChange={e => setMinibarPrice(Number(e.target.value))}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className='flex flex-col gap-2 text-sm'>
                <label>หมายเหตุ</label>
                <textarea
                  // value={keyword}
                  // onChange={e => setKeyword(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="border-t border-gray-300 mt-6 pt-4 pb-4 flex flex-col gap-1 text-sm">
              <div className='flex justify-between'>
                <div>
                  ค่าห้องพัก
                </div>
                <div>฿ {selectGuest?.total_amount || total_amount?.toLocaleString() || 0 }</div>
              </div>
              <div className='flex justify-between'>
                <div>
                  ค่าบริการเพิ่มเติม
                </div>
                <div>฿ {summaryMaterialPrice?.toLocaleString() || 0}</div>
              </div>
              <div className='flex justify-between'>
                <div>
                  ค่าความเสียหาย
                </div>
                <div>฿ {damagesPrice?.toLocaleString() || 0}</div>
              </div>
              <div className='flex justify-between'>
                <div>
                  ค่า Minibar
                </div>
                <div>฿ {minibarPrice?.toLocaleString() || 0}</div>
              </div>
            </div>
            <div className="border-t border-gray-300 mt-2 pt-4 pb-4 flex flex-col gap-4 text-xl">
              <div className='flex justify-between'>
                <div className='font-semibold'>ยอดรวมทั้งหมด</div>
                <div className='text-green-600 font-semibold'>฿ {summaryPrice?.toLocaleString() || 0}</div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  // onClick={() => setShowDialog(false)}
                >
                  ยกเลิก
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="mt-2"
                  // onClick={() => setShowDialog(false)}
                >
                  ยืนยันเช็คเอาท์
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showDialogMaterial} onOpenChange={(open) => {
        setShowDialogMaterial(open);
      }}>
        <DialogContent 
          className="max-w-xl max-h-[90vh] w-full overflow-hidden flex flex-col border-2 border-blue-200 shadow-xl">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DialogTitle className="text-xl flex items-center gap-2 flex flex-col items-start">
              <div>เพิ่มบริการ</div>
              <div className='text-[#888888] text-sm'>
                <span>บันทึกบริการเพิ่มเติม</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col flex-1 overflow-auto p-1 gap-8">
            <div className='flex flex-col gap-4'>
              <div className='flex flex-col gap-2 text-sm'>
                <label>ชื่อบริการ</label>
                <div style={{ width: "100%" }}>
                  <Select
                    value={selectMaterialId || undefined} 
                    onValueChange={(value) => setSelectMaterialId(value)}
                  >
                    <SelectTrigger className="w-full h-8 text-sm">
                      <SelectValue placeholder="ยังไม่ได้เลือกบริการเสริม..."/>
                    </SelectTrigger>
                    <SelectContent className='w-full'>
                      {materialMas.map((m, index) => {
                        return (
                          <SelectItem key={index} value={m.MaterialID}>
                            {m.MaterialName}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className='flex flex-col gap-2 text-sm'>
                <label>ราคา (บาท)</label>
                <input
                  type="number"
                  value={materialPrice}
                  onChange={e => setMaterialPrice(Number(e.target.value))}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setShowDialogMaterial(false)}
              >
                ยกเลิก
              </Button>
              <Button
                variant="default"
                size="sm"
                className="mt-2"
                onClick={() => handleBookMaterial()}
              >
                ยืนยัน
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}