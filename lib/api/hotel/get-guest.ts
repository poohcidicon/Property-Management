import { ApiResponse, axiosPublic } from "@/lib/axios";

export interface Guest {
  id: string;
  member_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  first_name_eng: string;
  last_name_eng: string;
  full_name_eng: string;
  citizen_id: string;
  gender: string;
  type: string;
  mobile: string;
  email: string;
  opportunity_count: number;
  create_date: string;
  room_type: string;
  total_amount: number;
  start_booking: string;
  end_booking: string;
  night: number;
  booking: {
    unit_id: string;
    unit_name: string;
    status: string;
    start_date: string;
    end_date: string;
  } | null;
  checkin: {
    unit_id: string;
    unit_name: string;
    status: string;
    checkin_date: string;
    checkout_date: string;
  } | null;
}

export interface GetGuestListPayload {
  checkin_date: string; // ISO date string
}
export const getGuestListApi = async (payload: GetGuestListPayload): Promise<ApiResponse<Guest[]>> => {
  try{
    const response = await axiosPublic.post('/api/hotel/get-guests', {
      checkin_date: payload.checkin_date
    });
    return response.data
  }
  catch (error: any) {
    console.error('Error fetching guest list:', error);
    return {
      success: false,
      data: [],
      error: error.message || 'Error fetching guest list',
      message: 'Error fetching guest list'
    }
  }
}