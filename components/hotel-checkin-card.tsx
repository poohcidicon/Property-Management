import React, { useEffect, useState } from 'react';
import { Plus, Clock, X, Trash, ChevronDown } from 'lucide-react';
import { CheckoutUnitApi, DelBookMaterialOptionApi, GetBookMaterialOptionApi, getBookPayTransApi, GetCheckinDetailApi, GetMaterialApi, IBookMaterialOption, IMaterial, InsBookMaterialOptionApi, IPayloadCheckout, IPayloadCheckoutMaterials, IPayloadDeleteBookMaterialOption, IPayloadInsertMaterialOption, IPayloadPreCheckout, PreCheckoutApi } from '@/lib/api/hotel/checkin';
import dayjs from 'dayjs';
import { getOtherBookingGuestsApi, Guest, SysHotelGuests } from '@/lib/api/hotel/get-guest';
import Spinner from './ui/Spinner';
import SpinnerSmall from './ui/spinner-small';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { format, set } from 'date-fns';
import { th } from 'date-fns/locale/th';
import { enUS } from 'date-fns/locale/en-US';
import { useProjectStore } from '@/app/project-store';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { TooltipPortal } from '@radix-ui/react-tooltip';
import FormattedInput from './ui/formatted-input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { useFilterStore } from '@/app/filter-store';
import { useSelectLanguage } from '@/hooks/use-select-language';

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

interface CheckinData {
  booking_id: string;
  book_room_id: string;
  check_in: string;
  check_out: string;
  room_number: string;
  status: string;
  amount: number;
}

interface MaterialPrice {
  id: string;
  material_id: string | null;
  material_name: string;
  qty: number;
  price: number;
}

interface MaterialPriceWithAction extends MaterialPrice {
  action: string;
  paytrans_id?: string
}

export default function HotelCheckinCard({ booking, roomNumber, roomType, onChangeStatus, roomId, guestList, checkin_customers, total_amount }: HotelCheckinCardProps) {
  const { activeDate } = useFilterStore()
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [otherGuests, setOtherGuests] = useState<SysHotelGuests[]>([]);
  const [isLoadingOtherGuests, setIsLoadingOtherGuests] = useState(false)
  const [showDialogCheckout, setShowDialogCheckout] = useState(false)
  const [showDialogMaterial, setShowDialogMaterial] = useState(false)
  const [materialMas, setMeterialMas] = useState<IMaterial[]>([])
  const [selectMaterialId, setSelectMaterialId] = useState<string | null>(null)
  const [materialPrice, setMaterialPrice] = useState<number>(0)
  const [bookMaterialList, setBookMaterialList] = useState<IBookMaterialOption[]>([])
  const [damagesPrice, setDamagesPrice] = useState<number>(0)
  const [damagesPriceList, setDamagePriceList] = useState<MaterialPrice[]>([])
  const [materialPriceList, setMaterialPriceList] = useState<MaterialPriceWithAction[]>([])
  const [minibarPrice, setMinibarPrice] = useState<number>(0)
  const [minibarPriceList, setMinibarPriceList] = useState<MaterialPrice[]>([])
  const [, setSummaryMaterialPrice] = useState<number>(0)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [payInDate, setPayInDate] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
  const [paymentRemark, setPaymentRemark] = useState<string | null>()
  const [openDeleteMaterialId, setDeleteMaterialId] = useState<number | null>(null)
  const [checkinDetail, setCheckinDetail] = useState<CheckinData | null>(null)
  const [showConfirmCheckoutDialog, setShowConfirmCheckoutDialog] = useState(false)
  const [selectMaterialDamage, setSelectMaterialDamage] = useState<string | null>(null)
  const [selectMaterial, setSelectMaterial] = useState<string | null>(null)
  const [loadingBookPayTrans, setLoadingBookPayTrans] = useState(false)
  const [deleteActionMaterialPriceList, setDeleteActionMaterialPriceList] = useState<MaterialPriceWithAction[]>([])
  const [selectMaterialMinibar, setSelectMaterialMinibar] = useState<string | null>(null)
  const [counter, setCounter] = useState(0)
  const { projectId } = useProjectStore()

  const { locale, language } = useSelectLanguage()
  const localeDate = language === 'th' ? th : enUS;

  const summaryMaterialPrice = materialPriceList.reduce((acc, curr) => acc+(curr.price * curr.qty), 0)
  const summaryDamage = damagesPriceList.reduce((acc, curr) => acc+(curr.price * curr.qty), 0)
  const summaryPrice = (
    checkinDetail?.amount || total_amount || 0
  ) + (
    summaryDamage
  ) + (
    minibarPrice
  ) + (
    summaryMaterialPrice
  )

  const gotoReservationsRental = (book_room_id: string) => {
    const url = (process.env.NEXT_PUBLIC_RENTAL_URL !== "" ? process.env.NEXT_PUBLIC_RENTAL_URL : '/') + `/Hotel/Reservations/Reservations.aspx?p=${projectId}&brid=${book_room_id}&s=O`
    window.open(url, '_blank')
  }

  const handleCheckout = async () => {
    const checkin_customer = checkin_customers[0]
    const damages = damagesPriceList.map<{ id: string; material_id: string; material_name: string; price: number; qty: number }>((damage) => {
      return {
        id: damage.id,
        material_id: damage.material_id || "",
        material_name: damage.material_name,
        price: damage.price,
        qty: damage.qty
      }
    })
    console.log(deleteActionMaterialPriceList, 'deleteActionMaterialPriceList')
    const materials = [
      ...materialPriceList.map<IPayloadCheckoutMaterials>((material) => ({
        action: material.action,
        id: material.id,
        paytrans_id: material.paytrans_id,
        material_name: material.material_name,
        price: material.price,
        qty: material.qty,
        material_id: material.material_id || ""
      })),
      ...deleteActionMaterialPriceList.map<IPayloadCheckoutMaterials>((material) => ({
        action: 'delete',
        id: material.id,
        paytrans_id: material.paytrans_id,
        material_name: material.material_name,
        price: material.price,
        qty: material.qty,
        material_id: material.material_id || ""
      }))
    ]
    const payloadCheckout = {
      unit_id: roomId || '',
      checkout_date: activeDate || dayjs().format('YYYY-MM-DD'),
      total_amount: summaryPrice,
      project_id: projectId,
      payment_method: paymentMethod,
      book_room_id: checkin_customer.book_room_id,
      remark: paymentRemark || null,
      damages,
      materials: materials
    } as IPayloadCheckout
    const result = await CheckoutUnitApi(payloadCheckout);
    if (result.data) {
      gotoReservationsRental(checkin_customer.book_room_id)
      if (onChangeStatus) {
        onChangeStatus(true);
      }
    }
  };

  const handleSetCheckin = async () => {
    const checkin = checkin_customers[0]
    if (!checkin || !checkin?.book_room_id) return
    const checkinDetail = await GetCheckinDetailApi({
      book_room_id: checkin?.book_room_id
    })
    if (!checkinDetail.data) return
    const sortedCheckinDetail = checkinDetail.data.sort((a, b) => {
      const dateA = new Date(a.CheckIn);
      const dateB = new Date(b.CheckIn);
      return dateA.getTime() - dateB.getTime();
    })
    setCheckinDetail({
      booking_id: sortedCheckinDetail[0].BookingID,
      book_room_id: sortedCheckinDetail[0].BookRoomID,
      check_in: sortedCheckinDetail[0].CheckIn,
      check_out: sortedCheckinDetail[0].CheckOut,
      room_number: sortedCheckinDetail[0].RoomNumber,
      status: sortedCheckinDetail[0].Status,
      amount: sortedCheckinDetail[0].Amount
    })
    // if (guestList.length > 0) {
    //   const guest = guestList.find((g) => {
    //     const foundCheckin = checkin_customers.find((c) => c.book_room_id === g.book_room_id);
    //     return foundCheckin
    //   })
    //   setSelectGuest(guest || null)
    // }
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

  const handleDeleteBookMaterial = async (input: IBookMaterialOption) => {
    const payload = {
      id: input.ID,
      book_room_id: input.BookRoomID,
      booking_id: input.BookingID
    } as IPayloadDeleteBookMaterialOption

    const result = await DelBookMaterialOptionApi(payload)
    if (result.data){
      loadBookMaterialOption()
    }
  }

  const handleSetBookServicePayTrans = async () => {
    setLoadingBookPayTrans(true)
    const payload = {
      book_room_id: checkin_customers[0].book_room_id,
      status: 'A',
      ref_type: 'Service'
    }
    const result = await getBookPayTransApi(payload)
    if (result.data){
      const mapping = result.data.map<MaterialPriceWithAction>((item) => ({
        id: item.PayTransID,
        material_id: item.RefID,
        paytrans_id: item.PayTransID,
        action: "edit",
        material_name: item.Description,
        price: item.Price,
        qty: item.Quantity
      }))
      setMaterialPriceList(mapping)
    }
    setLoadingBookPayTrans(false)
  }

  const addDamagePriceList = () => {
    setDamagePriceList([
      ...damagesPriceList,
      {
        id: `damage-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        material_id: null,
        material_name: "",
        qty: 1,
        price: 0
      }
    ])
  }

  const addMaterialPriceList = () => {
    setMaterialPriceList([
      ...materialPriceList,
      {
        id: `material-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        material_id: null,
        material_name: "",
        qty: 1,
        price: 0,
        action: "add"
      }
    ])
  }

  const addMinibarPriceList = () => {
    setMinibarPriceList([
      ...minibarPriceList,
      {
        id: `damage-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        material_id: null,
        material_name: "",
        qty: 1,
        price: 0
      }
    ])
  }

  const deleteDamagePriceList = (id: string) => {
    setDamagePriceList(damagesPriceList.filter((item) => item.id !== id))
  }

  const deleteMaterialPriceList = (item: MaterialPriceWithAction) => {
    if (item.action === 'edit' && item.paytrans_id) {
      setDeleteActionMaterialPriceList([...deleteActionMaterialPriceList, item])
    }
    setMaterialPriceList(materialPriceList.filter((item) => item.id !== item.id))
  }

  const deleteMinibarPriceList = (id: string) => {
    setMinibarPriceList(minibarPriceList.filter((item) => item.id === id))
  }

  const handlePreCheckout = async () => {
    const checkin_customer = checkin_customers[0]
    const payload = {
      unit_id: roomId,
      book_room_id: checkin_customer.book_room_id,
      booking_id: checkin_customer.booking_id,
      total_amount: summaryPrice
    } as IPayloadPreCheckout
    const res = await PreCheckoutApi(payload)
    if (res.data){
      setShowPaymentDialog(true)
    }
    // console.log(payload, 'payload')
  }

  useEffect(() => {
    handleSetCheckin()
    if (checkin_customers.length > 0){
      handleSetOtherGuest()
      loadBookMaterialOption()
    }
  }, [booking, checkin_customers, guestList])

  useEffect(() => {
    loadMaterial()
  }, [])

  const handleDialogAddService = (open : any) => {
    let trigger = open
    setShowDialogMaterial(trigger)
    if (trigger === false){
      setMaterialPrice(0)
      setSelectMaterialId(null)
    }
  }

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
              {/* <p className="text-sm font-semibold text-green-600">฿ {selectGuest?.total_amount?.toLocaleString() || total_amount?.toLocaleString() || 0 }</p> */}
              <p className="text-sm font-semibold text-green-600">฿ {checkinDetail?.amount?.toLocaleString() || total_amount?.toLocaleString() || 0 }</p> 
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
                {/* {selectGuest?.start_booking ? new Date(selectGuest.start_booking).toLocaleDateString('th-TH') : '08 ต.ค. 2025'} */}
                {checkinDetail?.check_in ? format(new Date(checkinDetail?.check_in ), "dd MMM yyyy", { locale: th }) : '-'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">เช็คเอาท์วันที่:</span>
              <span className="font-medium text-gray-800">
                {/* {selectGuest?.end_booking ? new Date(selectGuest.end_booking).toLocaleDateString('th-TH') : '11 ต.ค. 2025'} */}
                {checkinDetail?.check_out ? format(new Date(checkinDetail.check_out), "dd MMM yyyy", { locale: th }) : '-'}
              </span>
            </div>
            
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-gray-800 font-semibold">ยอดชำระ:</span>
              <span className="font-bold text-lg text-green-600">฿ {checkinDetail?.amount?.toLocaleString() || total_amount?.toLocaleString() || 0 }</span>
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
                      <span className='text-xs'>{format(new Date(bm.CreateDate), "dd MMM yyyy", { locale: th })}</span>
                    </div>
                    <div className="text-sm font-bold text-lg text-green-600 flex gap-2">
                      <div>฿ {bm.Price?.toLocaleString() || 0 }</div>
                      <div>
                        <TooltipProvider delayDuration={0}>
                          <Tooltip open={bm.ID === openDeleteMaterialId}>
                            <TooltipTrigger asChild>
                              <div className='rounded-full border p-1 cursor-pointer' onClick={() => {
                                setDeleteMaterialId((prev) => {
                                  return prev === bm.ID ? null : bm.ID
                                })
                              }}>
                                <Trash className='text-gray-600' size={12}/>
                              </div>
                            </TooltipTrigger>
                            <TooltipPortal>
                              <TooltipContent className="TooltipContent" sideOffset={5}>
                                <div className='flex flex-col gap-2'>
                                  <span>ยืนยันการลบ</span>
                                  <div className='flex gap-2'>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      className='text-xs bg-red-500'
                                      onClick={() => handleDeleteBookMaterial(bm)}
                                    >
                                      ลบ
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className='text-xs'
                                      onClick={() => {
                                        setDeleteMaterialId((prev) => {
                                          return prev === bm.ID ? null : bm.ID
                                        })
                                      }}
                                    >
                                      ยกเลิก
                                    </Button>
                                  </div>
                                </div>
                              </TooltipContent>
                            </TooltipPortal>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
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
            handleSetBookServicePayTrans()
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
            <div className='flex flex-col gap-6'>
              <div className='flex flex-col'>
                <div className="flex gap-4 items-center justify-between">
                  <label>ค่าบริการเพิ่มเติม</label>
                  <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded"
                    onClick={addMaterialPriceList}
                  >
                    +
                  </button>
                </div>
                {loadingBookPayTrans && (
                  <SpinnerSmall loading={loadingBookPayTrans}>
                    <div className='w-14 h-14'></div>
                  </SpinnerSmall>
                )}
                <div className="flex flex-col gap-2">
                  {materialPriceList.map((material, materialIndex) => {
                    return (
                      <div
                        key={material.id}
                        className="flex gap-4 items-end"
                      >
                        <div className='w-full max-w-41'>
                          <Popover open={selectMaterial === material.id} onOpenChange={(e) => {
                            const eventTarget = document.activeElement
                            if (!(eventTarget instanceof HTMLInputElement)) {
                              setSelectMaterial(null)
                            }
                            else if (selectMaterialDamage === material.id) {
                              setSelectMaterial(null)
                            }
                            else{
                              setSelectMaterial(material.id)
                            }
                          }}>
                            <PopoverTrigger asChild>
                              <input
                                type="text"
                                placeholder="ระบุบริการเสริม"
                                value={material.material_name}
                                onChange={(e) => {
                                  setMaterialPriceList((prev) => {
                                    prev[materialIndex].material_name = e.target.value
                                    return prev
                                  })
                                  setCounter((prev) => prev+1)
                                }}
                                className="flex-1 w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </PopoverTrigger>
                            <PopoverContent className="p-0">
                              <Command shouldFilter={false}>
                                {/* <CommandInput 
                                  placeholder="ค้นหา..." 
                                  className="h-9"
                                  // value={searchProductGroup}
                                  // onValueChange={(value) => {
                                  //   setSearchProductGroup(value)
                                  // }}
                                /> */}
                                <CommandList>
                                  <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                                  <CommandGroup>
                                    {materialMas.map((materialMasterData) => {
                                      return (
                                        <CommandItem
                                          key={materialMasterData.MaterialID}
                                          value={materialMasterData.MaterialID}
                                          onSelect={(curr) => {
                                            if (materialIndex !== -1 && (curr !== material.material_id)) {
                                              if (material.action === 'edit'){
                                                setDeleteActionMaterialPriceList((prev) => {
                                                  return [...prev, {...material}]
                                                })
                                              }
                                              setMaterialPriceList((prev) => {
                                                prev[materialIndex].action = 'add'
                                                prev[materialIndex].id = `material-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
                                                prev[materialIndex].paytrans_id = undefined
                                                prev[materialIndex].material_id = curr
                                                prev[materialIndex].material_name = materialMasterData.MaterialName
                                                prev[materialIndex].price = 0
                                                return prev
                                              })
                                              setSelectMaterial(null)
                                            }
                                          }}
                                          data-selected={!(material.material_id === materialMasterData.MaterialID)}
                                        >
                                          {materialMasterData.MaterialName}
                                        </CommandItem>
                                      )
                                    })}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className='flex flex-col gap-2 max-w-16'>
                          <label className='text-sm'>จำนวน</label>
                          <FormattedInput
                            label=""
                            type="number"
                            displayInt
                            value={material.qty}
                            onChange={(e) => {
                              setMaterialPriceList((prev) => {
                                prev[materialIndex].qty = e
                                return prev
                              })
                              setCounter((prev) => prev+1)
                            }}
                          />
                        </div>
                        <div className='flex flex-col gap-2 max-w-28'>
                          <label className='text-sm'>ราคาต่อหน่วย</label>
                          <FormattedInput
                            label=""
                            type="number"
                            value={material.price}
                            onChange={(e) => {
                              setMaterialPriceList((prev) => {
                                prev[materialIndex].price = e
                                return prev
                              })
                              setCounter((prev) => prev+1)
                            }}
                          />
                        </div>
                        <div 
                          className='rounded-full border p-1 cursor-pointer'
                          onClick={() => deleteMaterialPriceList(material)}
                        >
                          <Trash className='text-gray-600' size={12}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className='flex flex-col'>
                <div className="flex gap-4 items-center justify-between">
                  <label>ค่าความเสียหาย (บาท)</label>
                  <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded"
                    onClick={addDamagePriceList}
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {damagesPriceList.map((damage, damageIndex) => {
                    return (
                      <div
                        key={damage.id}
                        className="flex gap-4 items-end"
                      >
                        <div className='w-full max-w-41'>
                          <Popover open={selectMaterialDamage === damage.id} onOpenChange={() => {
                            if (selectMaterialDamage === damage.id) {
                              setSelectMaterialDamage(null)
                            }
                            else{
                              setSelectMaterialDamage(damage.id)
                            }
                          }}>
                            <PopoverTrigger asChild>
                              <input
                                type="text"
                                placeholder="ระบุความเสียหาย"
                                value={damage.material_name}
                                onChange={(e) => {
                                  setDamagePriceList((prev) => {
                                    prev[damageIndex].material_name = e.target.value
                                    return prev
                                  })
                                  setCounter((prev) => prev+1)
                                }}
                                className="flex-1 w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </PopoverTrigger>
                            <PopoverContent className="p-0">
                              <Command shouldFilter={false}>
                                {/* <CommandInput 
                                  placeholder="ค้นหา..." 
                                  className="h-9"
                                  // value={searchProductGroup}
                                  // onValueChange={(value) => {
                                  //   setSearchProductGroup(value)
                                  // }}
                                /> */}
                                <CommandList>
                                  <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                                  <CommandGroup>
                                    {materialMas.map((material) => {
                                      return (
                                        <CommandItem
                                          key={material.MaterialID}
                                          value={material.MaterialID}
                                          onSelect={(curr) => {
                                            if (damageIndex !== -1){
                                              console.log(damageIndex, 'damageIndex')
                                              setDamagePriceList((prev) => {
                                                prev[damageIndex].material_id = curr
                                                prev[damageIndex].material_name = material.MaterialName
                                                prev[damageIndex].price = 0
                                                return prev
                                              })
                                              setSelectMaterialDamage(null)
                                            }
                                          }}
                                          data-selected={!(damage.material_id === material.MaterialID)}
                                        >
                                          {material.MaterialName}
                                        </CommandItem>
                                      )
                                    })}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className='flex flex-col gap-2 max-w-16'>
                          <label className='text-sm'>จำนวน</label>
                          <FormattedInput
                            label=""
                            type="number"
                            displayInt
                            value={damage.qty}
                            onChange={(e) => {
                              setDamagePriceList((prev) => {
                                prev[damageIndex].qty = e
                                return prev
                              })
                              setCounter((prev) => prev+1)
                            }}
                          />
                        </div>
                        <div className='flex flex-col gap-2 max-w-28'>
                          <label className='text-sm'>ราคาต่อหน่วย</label>
                          <FormattedInput
                            label=""
                            type="number"
                            value={damage.price}
                            onChange={(e) => {
                              setDamagePriceList((prev) => {
                                prev[damageIndex].price = e
                                return prev
                              })
                              setCounter((prev) => prev+1)
                            }}
                          />
                        </div>
                        <div 
                          className='rounded-full border p-1 cursor-pointer'
                          onClick={() => deleteDamagePriceList(damage.id)}
                        >
                          <Trash className='text-gray-600' size={12}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className='flex flex-col gap-2 text-sm'>
                <label>หมายเหตุ</label>
                <textarea
                  value={paymentRemark || ""}
                  onChange={e => setPaymentRemark(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="border-t border-gray-300 mt-6 pt-4 pb-4 flex flex-col gap-1 text-sm">
              <div className='flex justify-between'>
                <div>
                  ค่าห้องพัก
                </div>
                <div>฿ {checkinDetail?.amount.toLocaleString()  || total_amount?.toLocaleString() || 0 }</div>
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
                <div>฿ {summaryDamage?.toLocaleString() || 0}</div>
              </div>
              {/* <div className='flex justify-between'>
                <div>
                  ค่า Minibar
                </div>
                <div>฿ {minibarPrice?.toLocaleString() || 0}</div>
              </div> */}
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
                  onClick={() => setShowDialogCheckout(false)}
                >
                  ยกเลิก
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    // setShowDialogCheckout(false)
                    // handlePreCheckout()
                    setShowConfirmCheckoutDialog(true)
                  }}
                >
                  ยืนยันเช็คเอาท์
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showDialogMaterial} onOpenChange={(open) => {
        handleDialogAddService(open)
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
                    onValueChange={(value) => {
                      if(value !== selectMaterialId){
                        setMaterialPrice(0)
                      }
                      setSelectMaterialId(value)
                    }}
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
              <FormattedInput
                label="ราคา (บาท)"
                type="number"
                value={materialPrice}
                onChange={setMaterialPrice}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => handleDialogAddService(false)}
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
      <Dialog open={showPaymentDialog} onOpenChange={(open) => {
        setShowPaymentDialog(open);
      }}>
        <DialogContent 
          className="max-w-xl max-h-[90vh] w-full overflow-hidden flex flex-col border-2 border-blue-200 shadow-xl">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DialogTitle className="text-xl flex items-center gap-2 flex flex-col items-start">
              <div>Checkout</div>
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col flex-1 overflow-auto p-1 gap-8">
            <div>
              <div className='flex flex-col gap-4'>
                <div className='flex flex-col gap-2 text-sm'>
                  <label>วันที่</label>
                  <div className='flex flex-col gap-2 text-sm'>
                    <input
                      type='date'
                      defaultValue={dayjs().format('YYYY-MM-DD')}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className='flex flex-col gap-2 text-sm'>
                  <label>ประเภท</label>
                  <div className='flex flex-col gap-2 text-sm'>
                    <Select
                      value={paymentMethod || undefined} 
                      onValueChange={(value) => setPaymentMethod(value)}
                      required
                    >
                      <SelectTrigger className="w-full h-8 text-sm">
                        <SelectValue placeholder="เลือกช่องทางขำระเงิน..."/>
                      </SelectTrigger>
                      <SelectContent className='w-full'>
                        <SelectItem value="CR">
                          เงินสด
                        </SelectItem>
                        <SelectItem value="CA">
                          บัตรเครดิต
                        </SelectItem>
                        <SelectItem value="TR">
                          เงินโอน
                        </SelectItem>
                        <SelectItem value="QR">
                          QR Code
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className='flex flex-col gap-2 text-sm'>
                  <label>จำนวนเงิน</label>
                  <div className='flex flex-col gap-2 text-sm'>
                    <input
                      type='number'
                      value={summaryPrice}
                      onChange={() => {}}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className='flex flex-col gap-2 text-sm'>
                  <label>หมายเหตุ</label>
                  <textarea
                    value={paymentRemark || ""}
                    onChange={e => setPaymentRemark(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowPaymentDialog(false)}
                >
                  ยกเลิก
                </Button>
                <Button
                  disabled={!paymentMethod}
                  variant="default"
                  size="sm"
                  className="mt-2"
                  onClick={() => handleCheckout()}
                >
                  ยืนยันการชำระ
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showConfirmCheckoutDialog} onOpenChange={setShowConfirmCheckoutDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              ยืนยันเช็คเอาท์
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmCheckoutDialog(false)
              }}
            >
              ยกเลิก
            </Button>
            <Button
              variant="default"
              onClick={() => {
                handleCheckout()
                setShowDialogCheckout(false)
                setShowConfirmCheckoutDialog(false)
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