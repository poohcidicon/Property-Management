import { getConnection } from "@/lib/db";
import { IResponse } from "../models/master";
import { IUnitMatrixHotelDB, UnitMatrixHotel } from "../models/unit-matrix";
import { db } from './mock/units'
import dayjs from "dayjs";

export const getUnitsHotelService = async (payload: {
  project_id: string;
  floor: number;
}): Promise<IResponse<UnitMatrixHotel[]>> => {
  try{
    const pool = await getConnection();
    const query = `
      SELECT DISTINCT u.*
      , booking.BookingID, Booking.BookRoomID, booking.Status as BookingStatus
      , room.RoomType
      FROM VW_Hotel_RoomStatus u
      LEFT JOIN Sys_Hotel_CheckIn booking ON (u.UnitID = booking.UnitID AND booking.Status = 'W')
      LEFT JOIN Sys_Hotel_Room room ON (u.UnitID = room.UnitID)
      WHERE u.ActiveDate = @ActiveDate
    `
    const result = await pool.request()
      .input("ActiveDate", dayjs().format('YYYY-MM-DD'))
      .query<IUnitMatrixHotelDB>(query)
    
    const checkinList = await pool.request()
      .input("CheckInDate", dayjs().format('YYYY-MM-DD'))
      .query<{
        UnitID: string;
        RoomNumber: string;
        BookingID: string;
        BookRoomID: string;
        Status: string;
        CheckIn: string;
      }>(`
        SELECT * FROM Sys_Hotel_CheckIn
        WHERE Status = 'A'
      `)

    const mappingData = result.recordset.map<UnitMatrixHotel>((item, index) => {
      let checkInstartDate = ""
      let checkInendDate = ""
      const checkin_customers = checkinList.recordset.filter(c => (
        c.UnitID === item.UnitID
      )).reduce<Array<{book_room_id: string; booking_id: string; end_date: string; start_date: string}>>((acc, curr, index) => {
        if (index === 0) {
          checkInstartDate = curr.CheckIn
        }
        else if (index === checkinList.recordset.length - 1) {
          checkInendDate = curr.CheckIn
        }
        const foundBooking = acc.find(a => a.booking_id === curr.BookingID && a.book_room_id === curr.BookRoomID)
        if (!foundBooking) {
          acc.push({
            book_room_id: curr.BookRoomID,
            booking_id: curr.BookingID,
            end_date: checkInendDate,
            start_date: checkInstartDate
          })
        }
        return acc
      }, [])
      return {
        unit_id: item.UnitID,
        unit_number: item.RoomNumber,
        status: checkin_customers.length > 0 ? 3
          : item.BookingStatus === 'W' ? 2 
          : item.Status,
        x: item.X || db.units[index+1]?.x || null,
        y: item.Y || db.units[index+1]?.y || null,
        booking: item.BookingID ? {
          booking_id: item.BookingID,
          book_room_id: item.BookRoomID,
          customer_id: '',
          status: 'booked',
          start_date: '',
          end_date: '',
        } : null,
        d_price: 0,
        floor: "1",
        room_type: item.RoomType.toLocaleLowerCase(),
        status_desc: checkin_customers.length > 0 ? 'Checkin' : item.BookingStatus === 'W' ? 'Booked' : 'Available',
        total_amount: item.TotalAmount ? Number(item.TotalAmount) : 0,
        checkin_customers: checkin_customers.map((c) => {
          return {
            book_room_id: c.book_room_id,
            booking_id: c.booking_id,
            end_date: checkInendDate,
            start_date: checkInstartDate
          }
        })
      }
    })
    // use mock data for x,y
    // const mappingData = db.units.filter((u) => u.floor === payload.floor)
    return {
      success: true,
      data: mappingData as unknown as UnitMatrixHotel[],
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