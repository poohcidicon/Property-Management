import { ApiResponse, axiosPublic } from "@/lib/axios";

export interface Guest {
  id: string;
  member_id: string;
  book_room_id: string;
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

export interface SysHotelGuests {
  GuestID: string;
  GuestCode: string;
  GuestTitle: string;
  GuestFirstName: string;
  GuestLastName: string;
  GuestPassport: string;
  GuestNationalityID: string;
  GuestMobileNumber: string;
  GuestAddress: string;
  GuestEmail: string;
  GuestPhone: string;
  CreateDate: string;
  CreateBy: string;
  ModifyDate: string;
  ModifyBy: string;
  IsDeleted: boolean;
}


export const getOtherGuestListApi = async (payload: { keyword: string, exclue_book_room_id?: string }): Promise<ApiResponse<SysHotelGuests[]>> => {
  try{
    const response = await axiosPublic.post('/api/hotel/get-other-guests', {
      keyword: payload.keyword,
      exclue_book_room_id: payload.exclue_book_room_id
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

export const getOtherBookingGuestsApi = async (payload: { book_room_id: string }): Promise<ApiResponse<SysHotelGuests[]>> => {
  try{
    const response = await axiosPublic.post('/api/hotel/get-other-booking-guests', {
      book_room_id: payload.book_room_id
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