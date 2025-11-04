import { ApiResponse, axiosPrivate, axiosPublic } from "@/lib/axios";

export interface IPayloadBookUnitHotel {
  unit_id: string;
  room_number: string;
  booking_date: string;
  start_date: string;
  end_date: string;
  booking_id: string;
  book_room_id: string;
}
export const BookUnitHotelApi = async (payload: IPayloadBookUnitHotel): Promise<ApiResponse<boolean>> => {
  try{
    const res = await axiosPrivate.post<ApiResponse<boolean>>('/api/hotel/book-unit', payload);
    return res.data
  }
  catch (error: any) {
    console.error('Error fetching circles:', error);
    return {
      success: false,
      data: false,
      error: error.message || 'Error fetching circles',
      message: 'Error fetching circles'
    }
  }
}

export interface IPayloadCheckin {
  unit_id: string;
  checkin_date: string;
  customers: Array<{
    booking_id: string;
    book_room_id: string;
  }>;
  other_guests?: Array<{
    book_room_id: string;
    guest_id: string;
    gest_name: string;
  }>
}

export const CheckinUnitApi = async (payload: IPayloadCheckin): Promise<ApiResponse<boolean>> => {
  try{
    const res = await axiosPrivate.post<ApiResponse<boolean>>('/api/hotel/checkin', payload);
    return res.data
  }
  catch (error: any) {
    console.error('Error fetching circles:', error);
    return {
      success: false,
      data: false,
      error: error.message || 'Error fetching circles',
      message: 'Error fetching circles'
    }
  }
}

export interface IPayloadCheckout {
  unit_id: string;
  checkout_date: string;
  total_amount: number;
  project_id?: string;
  payment_method: string;
  book_room_id: string;
}

export const CheckoutUnitApi = async (payload: IPayloadCheckout): Promise<ApiResponse<boolean>> => {
  try{
    const res = await axiosPrivate.post<ApiResponse<boolean>>('/api/hotel/checkout', payload);
    return res.data
  }
  catch (error: any) {
    console.error('Error fetching circles:', error);
    return {
      success: false,
      data: false,
      error: error.message || 'Error fetching circles',
      message: 'Error fetching circles'
    }
  }
}

export interface IMaterial {
  MaterialID: string;
  MaterialName: string;
  MaterialNameEN: string;
  MaterialTypeID: string;
  CategoryID: string;
  IsDelete: boolean;
  IsShow: boolean;
  CreateDate: Date;
  CreateBy: string;
  ModifyDate: Date;
  ModifyBy: string;
}

export const GetMaterialApi = async (): Promise<ApiResponse<IMaterial[]>> => {
  try{
    const res = await axiosPublic.get<ApiResponse<IMaterial[]>>('/api/hotel/get-material');
    return res.data
  }
  catch (error: any) {
    console.error('Error fetching circles:', error);
    return {
      success: false,
      data: [],
      error: error.message || 'Error fetching circles',
      message: 'Error fetching circles'
    }
  }
}

export interface IBookMaterialOption {
  ID: number;
  BookingID: string;
  BookRoomID: string;
  MaterialID: string;
  MaterialName: string;
  Price: number;
  Quantity: number;
  CreateDate: Date;
}

export const GetBookMaterialOptionApi = async (payload: { book_room_id: string; booking_id: string }): Promise<ApiResponse<IBookMaterialOption[]>> => {
  try{
    const res = await axiosPublic.post<ApiResponse<IBookMaterialOption[]>>('/api/hotel/get-book-material', payload);
    return res.data
  }
  catch (error: any) {
    console.error('Error fetching circles:', error);
    return {
      success: false,
      data: [],
      error: error.message || 'Error fetching circles',
      message: 'Error fetching circles'
    }
  }
}

export interface IPayloadInsertMaterialOption {
  booking_id: string;
  book_room_id: string;
  material_id: string;
  price: number;
  qty: number;
}

export const InsBookMaterialOptionApi = async (payload: IPayloadInsertMaterialOption): Promise<ApiResponse<boolean>> => {
  try{
    const res = await axiosPrivate.post<ApiResponse<boolean>>('/api/hotel/ins-book-material', payload);
    return res.data
  }
  catch (error: any) {
    console.error('Error fetching circles:', error);
    return {
      success: false,
      data: false,
      error: error.message || 'Error fetching circles',
      message: 'Error fetching circles'
    }
  }
}

export interface IPayloadDeleteBookMaterialOption {
  id: number;
  booking_id: string;
  book_room_id: string;
}

export const DelBookMaterialOptionApi = async (payload: IPayloadDeleteBookMaterialOption): Promise<ApiResponse<boolean>> => {
  try{
    const res = await axiosPublic.post<ApiResponse<boolean>>('/api/hotel/delete-book-material', payload);
    return res.data
  }
  catch (error: any) {
    return {
      success: false,
      data: false,
      error: error.message || 'Error fetching circles',
      message: 'Error fetching circles'
    }
  }
}

export interface IPayloadPreCheckout {
  unit_id: string;
  booking_id: string;
  book_room_id: string;
  total_amount: number;
}

export const PreCheckoutApi = async (payload: IPayloadPreCheckout) => {
  try{
    const res = await axiosPrivate.post<ApiResponse<boolean>>('/api/hotel/pre-checkout', payload);
    return res.data
  }
  catch (error: any) {
    return {
      success: false,
      data: false,
      error: error.message || 'Error fetching circles',
      message: 'Error fetching circles'
    }
  }
}

export interface CheckinDetail {
  BookRoomID: string;
  BookingID: string;
  CheckIn: string;
  RoomNumber: string;
  Status: string;
  Amount: number;
  GuestFullName: string;
  GuestPhone: string
}

export const GetCheckinDetailApi = async (payload: { book_room_id: string }): Promise<ApiResponse<CheckinDetail[]>> => {
  try{
    const res = await axiosPublic.post<ApiResponse<CheckinDetail[]>>('/api/hotel/get-checkin-detail', payload);
    return res.data
  }
  catch (error: any) {
    return {
      success: false,
      data: [],
      error: error.message || 'Error fetching circles',
      message: 'Error fetching circles'
    }
  }
}