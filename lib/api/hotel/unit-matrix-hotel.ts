import { ApiResponse, axiosPublic } from "@/lib/axios";

export interface UnitMatrixHotel{
  unit_id: string;
  unit_number: string;
  status: number;
  x: number | null;
  y: number | null;
  d_price: number;
  room_type: string;
  status_desc: string;
  total_amount: number;
  booking: {
    customer_id: string;
    status: string;
    start_date: string;
    end_date: string;
  } | null;
  checkin_customers?: Array<{
    customer_id?: string; 
    name?: string
    booking_id: string; 
    book_room_id: string 
  }>
}

export interface IPayloadGetUnitHotel {
  project_id: string;
  floor: number;
  active_date: string
}

export const getUnitMatrixHotelApi = async (payload: IPayloadGetUnitHotel): Promise<ApiResponse<UnitMatrixHotel[]>> => {
  try{
    const response = await axiosPublic.post<ApiResponse<UnitMatrixHotel[]>>('/api/hotel/unit-matrix', payload);
    return response.data
  }
  catch (error: any) {
    console.error('Error fetching unit matrix hotel:', error);
    throw error;
  }
}