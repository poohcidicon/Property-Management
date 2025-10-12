import { getConnection } from "@/lib/db";
import sql from "mssql";
import dayjs from "dayjs";
import { db } from "./mock/units"

export interface IPayloadCheckoutUnitService {
  unit_id: string;
  checkout_date: string; // ISO date string
}

export const checkoutUnitService = async (payload: IPayloadCheckoutUnitService): Promise<boolean> => {
  // const pool = await getConnection();
  // let transaction = new sql.Transaction(pool);
  // await transaction.begin();
  try{
    const unitIndex = db.units.findIndex(u => u.unit_id === payload.unit_id);
    if(unitIndex === -1){
      return false
    }

    db.units[unitIndex].status = 1
    db.units[unitIndex].status_desc = "Available"
    db.units[unitIndex].booking = null
    db.units[unitIndex].checkin_customers = []
    // await transaction.commit();
    return true
  }
  catch(err: any){
    // await transaction.rollback();
    console.error('Error in checkoutUnitService:', err);
    return false
  }
}