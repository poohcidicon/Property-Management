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
      FROM VW_Hotel_RoomStatus u
      LEFT JOIN Sys_Hotel_CheckIn booking ON (u.UnitID = booking.UnitID AND booking.Status = 'W')
      WHERE u.ActiveDate = @ActiveDate
    `
    const result = await pool.request()
      .input("ActiveDate", dayjs().format('YYYY-MM-DD'))
      .query<IUnitMatrixHotelDB>(query)

    const mappingData = result.recordset.map<UnitMatrixHotel>((item, index) => {
      return {
        unit_id: item.UnitID,
        unit_number: item.RoomNumber,
        status: item.BookingStatus === 'W' ? 2 : item.Status,
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
        room_type: 'standard',
        status_desc: item.StatusText,
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