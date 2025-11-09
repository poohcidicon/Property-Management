import { IResponse } from "../models/master";
import { BookingGuest, IGuest, SysHotelGuests } from "../models/customer";

import { db } from "./mock/guest-data"
import { getConnection } from "@/lib/db";
import { getCustomerRental } from "../test-rental/get-customer";

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
      , gbr.Status as BookingRoomStatus
      FROM VW_Hotel_BookingStatus g
      LEFT JOIN Sys_Hotel_CheckIn booking ON (g.BookingID = booking.BookingID AND g.BookRoomID = booking.BookRoomID and booking.Status = 'W')
      LEFT JOIN Sys_Hotel_CheckIn checkin ON (g.BookingID = checkin.BookingID AND g.BookRoomID = checkin.BookRoomID and checkin.Status = 'A')
      INNER JOIN Sys_Hotel_BookRoom gbr ON (g.BookRoomID = gbr.BookRoomID)
      WHERE g.CheckIn = @CheckInDate and gbr.Status <> 'P'
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
          room_number: item.CheckinRoomNumber
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
          room_number: item.BookRoomNumber
        } : null,
        checkin: checkin,
        book_status: item.BookingRoomStatus
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
    console.log(err)
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
  exclue_book_room_id?: string
}

export const getOtherGuestList = async (payload: IPayloadGetOtherGuestListController): Promise<IResponse<SysHotelGuests[]>> => {
  try{
    const customerList = await getCustomerRental(payload.keyword!)
    if (!customerList.data || customerList.data.length === 0){
      return {
        success: false,
        error: "Customer not found",
        data: [],
        message: "Customer not found"
      }
    }
    let mappingGuest = customerList.data.map<SysHotelGuests>((item) => {
      return {
        GuestID: item.id,
        GuestFirstName: item.firstName ? item.firstName : item.firstNameEng,
        GuestLastName: item.lastName ? item.lastName : item.lastNameEng,
        GuestCode: item.memberId,
        IsBooked: 0,
        GuestEmail: item.email,
        GuestPhone: item.mobile,
        GuestAddress: "",
        GuestPassport: item.citizenId,
        GuestMobileNumber: item.mobile,
        GuestNationalityID: item.citizenId ? item.citizenId : "",
        CreateDate: new Date().toISOString(),
        CreateBy: "system",
        ModifyDate: new Date().toISOString(),
        ModifyBy: "system",
        IsDeleted: false,
        GuestTitle: ""
      }
    })
    if (payload.exclue_book_room_id) {
      const pool = await getConnection();
      const { recordset: bookGuests } = await pool.request()
        .input("ExcludeBookRoomID", payload.exclue_book_room_id || null)
        .query<{
          BookRoomID: string;
          GuestID: string;
        }>(`
          SELECT bg.*
          FROM Sys_Hotel_BookGuest bg
          WHERE bg.BookRoomID = @ExcludeBookRoomID
        `)
      if (bookGuests.length > 0) {
        const guestIds = bookGuests.map(item => item.GuestID)
        mappingGuest = mappingGuest.filter(item => !guestIds.includes(item.GuestID))
      }
    }
    // const pool = await getConnection();
    // const query = `
    //   SELECT DISTINCT g.*
    //   ${payload.exclue_book_room_id ? `, (
    //     SELECT COUNT(*) FROM Sys_Hotel_BookGuest 
    //     WHERE BookRoomID = @ExcludeBookRoomID AND GuestID = g.GuestID
    //   ) as IsBooked` : ``}
    //   FROM Sys_Hotel_Guests g
    //   LEFT JOIN Sys_Hotel_BookGuest bg ON g.GuestID = bg.GuestID
    //   WHERE (g.GuestFirstName LIKE '%'+@Keyword+'%' 
    //   or g.GuestLastName LIKE '%'+@Keyword+'%'
    //   or g.GuestMobileNumber LIKE '%'+@Keyword+'%'
    //   or g.GuestNationalityID = @Keyword)
    // `
    // const result = await pool.request()
    //   .input("ExcludeBookRoomID", payload.exclue_book_room_id || null)
    //   .query<SysHotelGuests>(query)
    // if (payload.exclue_book_room_id && result.recordset.length > 0){
    //   // const availableList = mappingGuest.filter((item) => item.IsBooked === 0)
    //   return {
    //     success: true,
    //     data: mappingGuest,
    //     message: "Success",
    //     error: ""
    //   }
    // }
    return {
      success: true,
      data: mappingGuest,
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

export interface IPayloadGetOtherBookingGuest {
  book_room_id: string
}
export const getOtherBookingGuest = async (payload: IPayloadGetOtherBookingGuest): Promise<IResponse<SysHotelGuests[]>> => {
  try{
    const pool = await getConnection();
    const query = `
      SELECT g.ItemID as GuestID
      , CASE WHEN g.FirstName = '' THEN g.FirstNameEng ELSE isnull(g.FirstName, g.FirstNameEng) END as GuestFirstName
      , CASE WHEN g.LastName = '' THEN g.LastNameEng ELSE isnull(g.LastName, g.LastNameEng) END as GuestLastName
      , g.Email as GuestEmail
      , g.Tel1 as GuestMobileNumber
      , g.MemberID as GuestCode
      , g.PassportID as GuestPassport
      , g.CitizenID as GuestNationalityID
      , g.Tel1 as GuestPhone
      , g.CreateDate as CreateDate
      , g.CreateBy as CreateBy
      , g.ModifyDate as ModifyDate
      , g.IsDelete as IsDelete
      FROM Sys_CRM_Contacts g
      INNER JOIN Sys_Hotel_BookGuest bg ON g.ItemID = bg.GuestID
      WHERE bg.BookRoomID = @BookRoomID
    `
    const result = await pool.request()
      .input("BookRoomID", payload.book_room_id || null)
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