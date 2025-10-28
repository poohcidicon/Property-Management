import { getConnection } from "@/lib/db"
import { IResponse } from "../models/master"
import sql from "mssql"
import { CompensateUnit } from "../models/unit-matrix"

export interface IPayloadGetUnitBookingDateService {
  project_id: string
  year: number
  month: number,
  day: number
}

export const getUnitBookingDate = async ({ project_id, year, month, day }: IPayloadGetUnitBookingDateService): Promise<IResponse<Array<{[key: string]: string | number}>>> => {
  try{
    const pool = await getConnection();
    let result = await pool.request()
      .input("ProjectID", sql.NVarChar, project_id)
      .input("UnitID", sql.NVarChar, "")
      .input("Year", sql.Int, year)
      .input("Month", sql.Int, month)
      .input("Day", sql.Int, day)
      .execute<{[key: string]: string}>(`SP_DAILY_MATRIX_ONDAY`);

    return {
      success: true,
      data: result.recordset,
      message: "Success"
    }
  }
  catch (err: any) {
    return {
      success: false,
      error: err.message,
      data: [],
      message: 'Not found booking date'
    }
  }
}

export interface IPayloadGetmpensateUnits {
  project_id: string
  start_date: string
  end_date: string
}

export const getCompensateUnits = async (payload: IPayloadGetmpensateUnits): Promise<IResponse<CompensateUnit[]>> => {
  try{
    const pool = await getConnection()
    const result = await pool.request()
      .input("StartDate", sql.NVarChar, payload.start_date)
      .input("EndDate", sql.NVarChar, payload.end_date)
      .query(`
        SELECT CompUnitID, CompensateID, CompenDate, CU.BookingID, BK.CustomerID, CU.UnitID, CU.BookingDate
        FROM Sys_Daily_Compensate_Unit CU
        INNER JOIN Sys_Daily_Booking BK ON CU.BookingID = BK.BookingID
        WHERE CU.IsDeleted = 0 AND CU.Status = 'A'
        AND CONVERT(DATE, CU.CompenDate) BETWEEN @StartDate AND CONVERT(DATE, @EndDate)
      `)
    
    return {
      success: true,
      data: result.recordset,
      message: "Success"
    }
  }
  catch (err: any) {
    return {
      success: false,
      error: err.message,
      data: [],
      message: 'Not found booking date'
    }
  }
}