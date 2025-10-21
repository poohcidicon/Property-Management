import { getConnection } from "@/lib/db";
import { IResponse } from "../models/master";
import { IUnitMatrixHotelDB, UnitMatrixHotel } from "../models/unit-matrix";
import { db } from './mock/units'
import sql from 'mssql';

export const getUnitsHotelService = async (payload: {
  project_id: string;
  floor: number;
  active_date: string;
}): Promise<IResponse<UnitMatrixHotel[]>> => {
  try{
    const pool = await getConnection();
    const query = `
      SELECT DISTINCT u.*
      , booking.BookingID, Booking.BookRoomID, booking.Status as BookingStatus
      FROM VW_Hotel_RoomStatus u
      LEFT JOIN Sys_Hotel_CheckIn booking ON (u.UnitID = booking.UnitID AND booking.Status = 'W')
      LEFT JOIN Sys_Hotel_Room room ON (u.UnitID = room.UnitID)
      WHERE u.ActiveDate = @ActiveDate and isNull(u.FloorID, 0) = @Floor
      AND u.ProjectID = @ProjectID
    `
    const result = await pool.request()
      .input("ActiveDate", payload.active_date)
      .input("Floor", payload.floor)
      .input("ProjectID", payload.project_id)
      .query<IUnitMatrixHotelDB>(query)
    
    const checkinList = await pool.request()
      .input("CheckInDate", payload.active_date)
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
          : Number(item.Status) === 3 ? 4
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
        floor: item.FloorID?.toString() || '0',
        room_type: item.RoomType?.toLocaleLowerCase() || 'other',
        status_desc: checkin_customers.length > 0 ? 'Checkin' : item.BookingStatus === 'W' ? 'Booked' : Number(item.Status) === 3 ? 'Clearing' : 'Available',
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

export interface IFloorMas {
  FloorID: number;
  FloorName: string;
  FileID: string
}

export const getFloorMas = async (payload: { project_id: string }): Promise<IResponse<IFloorMas[]>> => {
  try{
    const pool = await getConnection();
    const result = await pool.request()
      .input("ProjectID", payload.project_id)
      .input("CreateBy", process.env.DEFAULT_SALE_ID || '429ca1b6-874e-4071-be63-8753ea7473f3')
      .query<IFloorMas>(`
        select vr.FloorID, vr.FloorName 
        , F.Id FileID
        from VW_Hotel_RoomStatus vr
        inner join Sys_Daily_Floor_Plan dp on vr.FloorID = dp.FloorID
        LEFT JOIN Sys_REM_FileData F ON Convert(nvarchar(10), dp.FloorPlanID) = F.RefID
        AND ISNULL(F.Isdelete,0) = 0
        AND F.Process = 'floorplan'
        AND F.CreateBy = @CreateBy
        where vr.ProjectID = @ProjectID
        group by vr.FloorID, vr.FloorName, F.Id
      `)
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

export interface IUpdateRoomStatus {
  unit_id: string;
  status: number
  active_date: string
}
export const updateRoomStatusService = async (payload: IUpdateRoomStatus): Promise<IResponse<boolean>> => {
  const pool = await getConnection();
  let transaction = new sql.Transaction(pool);
  await transaction.begin();
  try{
    const queryUpdateRoomStatus = `
      UPDATE [dbo].[Sys_Hotel_RoomStatus]
      SET Status = @Status
      WHERE UnitID = @UnitID and CONVERT(date, ActiveDate) = @ActiveDate
    `
    await transaction.request()
      .input("UnitID", payload.unit_id)
      .input("Status", payload.status)
      .input("ActiveDate", payload.active_date)
      .query(queryUpdateRoomStatus)
    await transaction.commit();
    return {
      success: true,
      data: true,
      message: "Success",
      error: ""
    }
  }
  catch (err) {
    return {
      success: false,
      error: (err as Error).message,
      data: false,
      message: (err as Error).message
    }
  }
}