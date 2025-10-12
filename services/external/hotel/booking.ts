import { getConnection } from "@/lib/db";
import sql from "mssql";
import dayjs from "dayjs";

import { db } from "./mock/units"

export interface IPayloadBookUnitService {
  unit_id: string;
  customer_id: string;
  booking_date: string; // ISO date string
}

export const bookUnitService = async (payload: IPayloadBookUnitService): Promise<boolean> => {
  // const pool = await getConnection();
  // let transaction = new sql.Transaction(pool);
  // await transaction.begin();
  try{
    // Placeholder for actual booking logic

    // Simulate booking by checking if unit exists in mock data
    const unitIndex = db.units.findIndex(u => u.unit_id === payload.unit_id);
    if(unitIndex === -1){
      throw new Error("Unit not found");
    }
    // Simulate inserting booking record
    db.units[unitIndex].status = 2
    db.units[unitIndex].status_desc = "Booked"
    db.units[unitIndex].booking = {
      customer_id: payload.customer_id,
      status: "booked",
      start_date: dayjs(payload.booking_date).format("YYYY-MM-DD"),
      end_date: dayjs(payload.booking_date).add(3, 'day').format("YYYY-MM-DD"),
    }

    // await transaction.commit();

    return true
  }
  catch(err: any){
    // await transaction.rollback();
    console.error("Error booking unit:", err);
    return false
  }
}