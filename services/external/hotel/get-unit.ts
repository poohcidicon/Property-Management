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
      SELECT * FROM VW_Hotel_RoomStatus 
      WHERE ActiveDate = @ActiveDate
    `
    const result = await pool.request()
      .input("ActiveDate", dayjs().format('YYYY-MM-DD'))
      .query<IUnitMatrixHotelDB>(query)

    // const mappingData = result.recordset.map<UnitMatrixHotel>((item, index) => {
    //   return {
    //     unit_id: item.UnitID,
    //     unit_number: item.RoomNumber,
    //     status: item.Status,
    //     x: item.X || db.units[index+1]?.x || null,
    //     y: item.Y || db.units[index+1]?.y || null,
    //     booking: null,
    //     d_price: 0,
    //     floor: "1",
    //     room_type: 'standard',
    //     status_desc: item.StatusText,
    //   }
    // })
    // use mock data for x,y
    const mappingData = db.units.filter((u) => u.floor === payload.floor)
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