import { ApiResponse, axiosPublic } from "@/lib/axios";

export interface IPayloadBookUnitHotel {
  unit_id: string;
  booking_date: string;
  start_date: string;
  end_date: string;
  booking_id: string;
  book_room_id: string;
}
export const BookUnitHotelApi = async (payload: IPayloadBookUnitHotel): Promise<ApiResponse<boolean>> => {
  try{
    const res = await axiosPublic.post<ApiResponse<boolean>>('/api/hotel/book-unit', payload);
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
    const res = await axiosPublic.post<ApiResponse<boolean>>('/api/hotel/checkin', payload);
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
}

export const CheckoutUnitApi = async (payload: IPayloadCheckout): Promise<ApiResponse<boolean>> => {
  try{
    const res = await axiosPublic.post<ApiResponse<boolean>>('/api/hotel/checkout', payload);
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
