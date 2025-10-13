import { IResponse } from "../models/master";
import { BookingGuest, IGuest } from "../models/customer";

import { db } from "./mock/guest-data"
import { getConnection } from "@/lib/db";

export interface IPayloadGetGuestListService {
  checkin_date?: string; // ISO date string
}
export const getGuestList = async (payload: IPayloadGetGuestListService): Promise<IResponse<IGuest[]>> => {
  try {
    // fetch from mock data
    const pool = await getConnection();
    const query = `
      SELECT * FROM VW_Hotel_BookingStatus 
      WHERE CheckIn = @CheckInDate
    `
    const result = await pool.request()
      .input("CheckInDate", payload.checkin_date || null)
      .query<BookingGuest>(query)

    const mappingData = result.recordset.map<IGuest>((item) => {
      return {
        id: item.BookRoomID,
        member_id: item.BookRoomID,
        full_name: item.LeadGuest,
        mobile: item.LeadPhone,
        start_booking: item.CheckIn,
        end_booking: item.CheckOut,
        room_type: item.RoomType.toLowerCase(),
        night: Number(item.Night) || 1,
        adults: Number(item.Adults) || 1,
        children: Number(item.Children) || 0,
        total_amount: item.TotalAmount ? Number(item.TotalAmount) : 0,
        booking: item.RoomNumber ? {
          unit_id: item.RoomNumber,
          status: 'booked',
          checkin_date: item.CheckIn,
          checkout_date: item.CheckOut,
        } : null,
        checkin: null,
      }
    })

    return {
      success: true,
      data: mappingData,
      message: "Success",
      error: ""
    }
  }
  catch (err) {
    return {
      success: false,
      error: (err as Error).message,
      data: [],
      message: (err as Error).message
    }
  }
}