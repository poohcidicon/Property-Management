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
      SELECT DISTINCT u.UnitID, u.ProjectID, u.RoomNumber
      , u.Area, u.X, u.Y, u.TowerID, u.TowerName, u.FloorID, u.FloorName, u.RoomType
      , u.ActiveDate, u.DateType, u.StatusText, u.Status
      , booking.BookingID, Booking.BookRoomID, booking.Status as BookingStatus
      FROM VW_Hotel_RoomStatus u
      LEFT JOIN Sys_Hotel_CheckIn booking ON (u.UnitID = booking.UnitID AND booking.Status = 'W' AND booking.CheckIn = convert(date, @ActiveDate))
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
        SELECT c.* FROM Sys_Hotel_CheckIn c
        INNER JOIN Sys_Hotel_BookRoom br ON (c.BookRoomID = br.BookRoomID)
        WHERE c.Status = 'A'
        AND (
          @CheckInDate between br.CheckIn and br.CheckOut
        )
      `)

    // AND (
    //       CheckIn = convert(date, @CheckInDate)
    //       OR CheckIn = DATEADD(day, -1, CONVERT(date, @CheckInDate))
    //     )

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
    // const result = await pool.request()
    //   .input("ProjectID", payload.project_id)
    //   .input("CreateBy", process.env.DEFAULT_SALE_ID || '429ca1b6-874e-4071-be63-8753ea7473f3')
    //   .query<IFloorMas>(`
    //     select vr.FloorID, vr.FloorName 
    //     , F.Id FileID
    //     from VW_Hotel_RoomStatus vr
    //     inner join Sys_Daily_Floor_Plan dp on vr.FloorID = dp.FloorID
    //     LEFT JOIN Sys_REM_FileData F ON Convert(nvarchar(10), dp.FloorPlanID) = F.RefID
    //     AND ISNULL(F.Isdelete,0) = 0
    //     AND F.Process = 'floorplan'
    //     AND F.CreateBy = @CreateBy
    //     where vr.ProjectID = @ProjectID
    //     group by vr.FloorID, vr.FloorName, F.Id
    //   `)
    const result = await pool.request()
      .input("ProjectID", payload.project_id)
      .query<IFloorMas>(`
        SELECT vr.FloorID, vr.FloorName , F.Id FileID
        FROM VW_Hotel_RoomStatus vr
        INNER JOIN Sys_Daily_Floor_Plan dp on vr.FloorID = dp.FloorID AND dp.IsDeleted = 0
        LEFT JOIN Sys_REM_FileData F ON Convert(nvarchar(10), dp.FloorPlanID) = F.RefID AND F.Process = 'floorplan' AND F.ProjectID = dp.ProjectID
        AND ISNULL(F.Isdelete,0) = 0
        WHERE vr.ProjectID = @ProjectID
        GROUP BY vr.FloorID, vr.FloorName, F.Id
      `)
    const unqineResult = result.recordset.reduce((acc: IFloorMas[], curr: IFloorMas) => {
      const existingIndex = acc.findIndex((item) => item.FloorID === curr.FloorID)
      if (existingIndex === -1) {
        acc.push(curr)
      }
      else if (!acc[existingIndex].FileID) {
        acc[existingIndex] = curr
      }
      return acc
    }, [])
    return {
      success: true,
      data: unqineResult,
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

// mock
export const ROOM_TYPE_COLORS = {
  "standard": {
    primary: "#6b7280", // gray-500 - plain, normal color
    secondary: "#4b5563",
    glow: "rgba(107, 114, 128, 0.6)",
  },
  "Standard Double": {
    primary: "#6b7280", // gray-500 - plain, normal color
    secondary: "#4b5563",
    glow: "rgba(107, 114, 128, 0.6)",
  },
  "family": {
    primary: "#f59e0b", // amber-500 - premium color for special privileges
    secondary: "#d97706",
    glow: "rgba(245, 158, 11, 0.6)",
  },
  "superior": {
    primary: "#3b82f6" ,
    secondary: "#3baef6ff",
    glow: "rgba(112, 11, 245, 0.6)",
  },
  "deluxe": {
    primary: "#7b0f81ff" ,
    secondary: "#ca3bf6ff",
    glow: "rgba(105, 11, 245, 0.6)",
  },
  "suite": {
    primary: "#FF1493",
    secondary: "#ca3bf6ff",
    glow: "rgba(206, 11, 245, 0.6)",
  }
} as const

const mappingColorRoomType = (roomType: RoomTypeMaster) => {
  let color = ROOM_TYPE_COLORS[roomType.Value as keyof typeof ROOM_TYPE_COLORS]
  if (!color) {
    color = {
      primary: "#6b7280", // gray-500 - plain, normal color
      secondary: "#4b5563",
      glow: "rgba(107, 114, 128, 0.6)",
    }
  }
  return {...roomType, color}
}

export const getRoomTypeMasService = async ({ project_id }: { project_id?: string }): Promise<IResponse<RoomTypeMaster[]>> => {
  try{
    const pool = await getConnection();
    const result = await pool.request()
      .input("ProjectID", sql.NVarChar, project_id)
      .query(`
        SELECT RT.RoomTypeID, RoomTypeName, RoomTypeColor, RTJ.ID, RTJ.ProjectID 
        FROM Sys_Hotel_RoomType RT
        INNER JOIN Sys_Hotel_RoomType_Proj RTJ ON RT.RoomTypeID = RTJ.RoomTypeID AND ISNULL(RTJ.IsDelete,0) = 0
        ${project_id ? 'and ProjectID = @ProjectID' : ''}
      `)

    const mappedResult = result.recordset.map<RoomTypeMaster>((item, index) => {
      return {
        Id: item.ID,
        Value: item.RoomTypeName,
        Name: item.RoomTypeName,
        NameEng: item.RoomTypeName,
        Sequence: index+1,
        color: {
          primary: item.RoomTypeColor,
          secondary: item.RoomTypeColor,
          glow: item.RoomTypeColor,
        }
      }
    })
    return {
      success: true,
      data: mappedResult,
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