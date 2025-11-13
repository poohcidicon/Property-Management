import { getGuestList, getOtherBookingGuest, getOtherGuestList } from "@/services/external/hotel/guest";
import { IGuest, SysHotelGuests } from "@/services/external/models/customer";
import { IResponse } from "@/services/external/models/master";
import dayjs from "dayjs";

export interface IPayloadGetGuestListController {
  checkin_date: string; // ISO date string
  project_id: string
}

export const getGuestListController = async (payload: IPayloadGetGuestListController): Promise<IResponse<IGuest[]>> => {
  try {
    const result = await getGuestList({
      checkin_date: payload.checkin_date,
      project_id: payload.project_id
    })
    return result
  }
  catch (err: any) {
    return {
      success: false,
      error: err.message,
      data: [],
      message: err.message
    }
  }
}

export interface IPayloadGetOtherGuestListController {
  keyword: string;
  exclue_book_room_id?: string;
}

export const getOtherGuestListController = async (payload: IPayloadGetOtherGuestListController): Promise<IResponse<SysHotelGuests[]>> => {
  try {
    const result = await getOtherGuestList({
      keyword: payload.keyword,
      exclue_book_room_id: payload.exclue_book_room_id
    })
    return result
  }
  catch (err: any) {
    return {
      success: false,
      error: err.message,
      data: [],
      message: err.message
    }
  }
}

export interface IPayloadGetOtherBookingGuest {
  book_room_id: string;
}

export const getOtherBookingGuestController = async (payload: IPayloadGetOtherBookingGuest): Promise<IResponse<SysHotelGuests[]>> => {
  try {
    const result = await getOtherBookingGuest({
      book_room_id: payload.book_room_id
    })
    return result
  }
  catch (err: any) {
    return {
      success: false,
      error: err.message,
      data: [],
      message: err.message
    }
  }
}