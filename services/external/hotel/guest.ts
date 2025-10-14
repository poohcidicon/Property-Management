import { IResponse } from "../models/master";
import { BookingGuest, IGuest, SysHotelGuests } from "../models/customer";

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
      SELECT DISTINCT g.*
      , booking.UnitID as BookUnitID, booking.RoomNumber as BookRoomNumber
      , checkin.UnitID as CheckinUnitID, checkin.RoomNumber as CheckinRoomNumber
      FROM VW_Hotel_BookingStatus g
      LEFT JOIN Sys_Hotel_CheckIn booking ON (g.BookingID = booking.BookingID AND g.BookRoomID = booking.BookRoomID and booking.Status = 'W')
      LEFT JOIN Sys_Hotel_CheckIn checkin ON (g.BookingID = checkin.BookingID AND g.BookRoomID = checkin.BookRoomID and checkin.Status = 'A')
      INNER JOIN Sys_Hotel_Booking gb ON (g.BookingID = gb.BookingID)
      WHERE g.CheckIn = @CheckInDate AND gb.Status = 'R'
    `
    const result = await pool.request()
      .input("CheckInDate", payload.checkin_date || null)
      .query<BookingGuest>(query)
    
    const haveSetCheckin: Record<string, boolean> = {}

    const mappingData = result.recordset.map<IGuest>((item) => {
      let checkin: IGuest['checkin'] | null = null
      if (item.CheckinUnitID && !haveSetCheckin[item.CheckinUnitID]) {
        haveSetCheckin[item.CheckinUnitID] = true
        checkin = {
          unit_id: item.CheckinUnitID,
          status: 'checkin',
          checkin_date: item.CheckIn,
          checkout_date: item.CheckOut,
        }
      }
      return {
        id: item.BookingID,
        member_id: item.BookingID,
        book_room_id: item.BookRoomID,
        full_name: item.LeadGuest,
        mobile: item.LeadPhone,
        start_booking: item.CheckIn,
        end_booking: item.CheckOut,
        room_type: item.RoomType.toLowerCase(),
        night: Number(item.Night) || 1,
        adults: Number(item.Adults) || 1,
        children: Number(item.Children) || 0,
        total_amount: item.TotalAmount ? Number(item.TotalAmount) : 0,
        booking: item.BookUnitID ? {
          unit_id: item.BookUnitID,
          status: 'booked',
          checkin_date: item.CheckIn,
          checkout_date: item.CheckOut,
        } : null,
        checkin: checkin
      }
    })

    // mappingData.push(db.customer[1] as unknown as IGuest)
    // mappingData.push(db.customer[2] as unknown as IGuest)
    // mappingData.push(db.customer[3] as unknown as IGuest)
    // mappingData.push(db.customer[4] as unknown as IGuest)

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

export interface IPayloadGetOtherGuestListController {
  keyword?: string; // ISO date string
}

export const getOtherGuestList = async (payload: IPayloadGetOtherGuestListController): Promise<IResponse<SysHotelGuests[]>> => {
  try{
    const pool = await getConnection();
    const query = `
      SELECT * FROM Sys_Hotel_Guests
      WHERE GuestFirstName LIKE '%@Keyword%' 
      or GuestLastName LIKE '%@Keyword%'
      or GuestMobileNumber LIKE '%@Keyword%'
      or GuestNationalityID = @Keyword
    `
    const result = await pool.request()
      .input("Keyword", payload.keyword || null)
      .query<SysHotelGuests>(query)
    return {
      success: true,
      data: result.recordset,
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