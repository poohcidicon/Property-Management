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

export interface IFloorMas {
  FloorID: number;
  FloorName: string;
  FileID: string;
  ImagePath: string;
}

export interface IGetFloorMas {
  project_id: string
}

export const getFloorMasApi = async (payload: IGetFloorMas): Promise<ApiResponse<IFloorMas[]>> => {
  try{
    const response = await axiosPublic.post<ApiResponse<IFloorMas[]>>('/api/hotel/get-floors', payload);
    return response.data
  }
  catch (error: any) {
    console.error('Error fetching unit matrix hotel:', error);
    return {
      success: false,
      data: [],
      error: error.message || 'Error fetching circles',
      message: 'Error fetching circles'
    }
  }
}

export interface IUpdateRoomStatus {
  unit_id: string;
  status: number;
  active_date: string
}

export const updateRoomStatusApi = async (payload: IUpdateRoomStatus): Promise<ApiResponse<boolean>> => {
  try{
    const response = await axiosPublic.post<ApiResponse<boolean>>('/api/hotel/update-room-status', payload);
    return response.data
  }
  catch (error: any) {
    console.error('Error fetching unit matrix hotel:', error);
    return {
      success: false,
      data: false,
      error: error.message || 'Error fetching circles',
      message: 'Error fetching circles'
    }
  }
}

export interface RoomTypeMaster {
  Id: number;
  Value: string;
  Name: string;
  NameEng: string;
  Sequence: number;
  color?: {
    primary: string;
    secondary: string;
    glow: string;
  };
}

export const getRoomTypeMasterApi = async (): Promise<ApiResponse<RoomTypeMaster[]>> => {
  try{
    const response = await axiosPublic.get<ApiResponse<RoomTypeMaster[]>>('/api/hotel/get-room-type');
    return response.data
  }
  catch (error: any) {
    console.error('Error fetching unit matrix hotel:', error);
    return {
      success: false,
      data: [],
      error: error.message || 'Error fetching circles',
      message: 'Error fetching circles'
    }
  }
}