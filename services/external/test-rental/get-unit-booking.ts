import { getConnection } from "@/lib/db"
import { IResponse } from "../models/master"
import sql from "mssql"
import { CompensateUnit, ProductGroupMaster } from "../models/unit-matrix"

export interface IPayloadGetUnitBookingDateService {
  active_date: string
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
  customer_id: string
}

export const getCompensateUnits = async (payload: IPayloadGetmpensateUnits): Promise<IResponse<CompensateUnit[]>> => {
  try{
    const pool = await getConnection()
    const result = await pool.request()
      .input("CustomerID", sql.NVarChar, payload.customer_id)
      .query(`
        SELECT CompUnitID, CompensateID, CompenDate, CU.BookingID, BK.CustomerID, CU.UnitID, CU.BookingDate
        FROM Sys_Daily_Compensate_Unit CU
        INNER JOIN Sys_Daily_Booking BK ON CU.BookingID = BK.BookingID
        WHERE CU.IsDeleted = 0 AND CU.Status = 'A'
        AND BK.CustomerID = @CustomerID
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

export const getProductGroupMaster = async (): Promise<IResponse<ProductGroupMaster[]>> => {
  try{
    const pool = await getConnection()
    const result = await pool.request()
      .query(`
        select * from Sys_Master_AllType where Groups = 'ProductGroup'
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
      message: 'Not found Product Group Master'
    }
  }
}