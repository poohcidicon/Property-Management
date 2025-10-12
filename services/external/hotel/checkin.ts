import { getConnection } from "@/lib/db";
import sql from "mssql";
import dayjs from "dayjs";
import { db } from "./mock/units"

export interface IPayloadCheckinUnitService {
  unit_id: string;
  customers: Array<{ customer_id: string; name?: string }>;
  checkin_date: string; // ISO date string
}

export const checkinService = async (payload: IPayloadCheckinUnitService): Promise<boolean> => {
  // const pool = await getConnection();
  // let transaction = new sql.Transaction(pool);
  // await transaction.begin();
  try{
    // Placeholder for actual check-in logic
    // validate unit_id, customers, and checkin_date
    const customersValid = Array.isArray(payload.customers) && payload.customers.length > 0 && payload.customers.every(c => c.customer_id);
    if(!payload.unit_id || !customersValid || !payload.checkin_date){
      return false
    }
    // Simulate check-in process

    const unitIndex = db.units.findIndex(u => u.unit_id === payload.unit_id);
    if(unitIndex === -1){
      throw new Error("Unit not found");
    }
    db.units[unitIndex].status = 3
    db.units[unitIndex].status_desc = "Checkin"
    db.units[unitIndex].checkin_customers = payload.customers.map((c) => {
      return {
        customer_id: c.customer_id,
        start_date: payload.checkin_date,
        end_date: dayjs(payload.checkin_date, 'YYYY-MM-DD').add(3, 'day').format("YYYY-MM-DD"),
      }
    })

    // await transaction.commit();
    
    return true
  }
  catch(err: any){
    // await transaction.rollback();
    console.error('Error in checkinService:', err);
    return false
  }
}