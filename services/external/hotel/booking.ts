import { getConnection } from "@/lib/db";
import sql from "mssql";
import dayjs from "dayjs";

import { db } from "./mock/units"

export interface IPayloadBookUnitService {
  unit_id: string;
  booking_date: string; // ISO date string
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  booking_id: string;
  book_room_id: string;
}

export const bookUnitService = async (payload: IPayloadBookUnitService): Promise<boolean> => {
  const pool = await getConnection();
  let transaction = new sql.Transaction(pool);
  await transaction.begin();
  try{
    // Placeholder for actual booking logic
    const queryUpdateRoom = `
      UPDATE [dbo].[VW_Hotel_RoomStatus]
      SET Status = 'I'
      WHERE UnitID = @UnitID
    `
    await transaction.request()
      .input("UnitID", payload.unit_id)
      .query(queryUpdateRoom)
    
    const checkinBooking = transaction.request()
    let insertListOnDate = []
    for(let d = dayjs(payload.start_date); d.isBefore(dayjs(payload.end_date)); d = d.add(1, 'day')){
      checkinBooking.input('UnitID', payload.unit_id)
      checkinBooking.input('BookingID', payload.booking_id || null)
      checkinBooking.input('BookingRoomID', payload.book_room_id || null)
      checkinBooking.input('RoomNumber', payload.unit_id)
      checkinBooking.input('TransacDate', dayjs().format('YYYY-MM-DD'))
      checkinBooking.input('CheckIn', d.format('YYYY-MM-DD'))
      checkinBooking.input('Status', 'W')
      insertListOnDate.push(`
        (@UnitID
        , @BookingID
        , @BookingRoomID
        , @RoomNumber
        , @TransacDate
        , @CheckIn
        , @Status
        , GETDATE()
        )
      `)
    }
    const queryInsertCheckin = `
      INSERT INTO [dbo].[Hotel_CheckIn]
      ([UnitID]
      ,[BookingID]
      ,[BookingRoomID]
      ,[RoomNumber]
      ,[TransactionDate]
      ,[CheckIn]
      ,[Status]
      ,[CreateDate]
      )
      VALUES ${insertListOnDate.join(',')}
    `
    await checkinBooking.query(queryInsertCheckin)
    

    // Simulate booking by checking if unit exists in mock data
    // const unitIndex = db.units.findIndex(u => u.unit_id === payload.unit_id);
    // if(unitIndex === -1){
    //   throw new Error("Unit not found");
    // }
    // // Simulate inserting booking record
    // db.units[unitIndex].status = 2
    // db.units[unitIndex].status_desc = "Booked"
    // db.units[unitIndex].booking = {
    //   customer_id: payload.customer_id,
    //   status: "booked",
    //   start_date: dayjs(payload.booking_date).format("YYYY-MM-DD"),
    //   end_date: dayjs(payload.booking_date).add(3, 'day').format("YYYY-MM-DD"),
    // }

    await transaction.commit();

    return true
  }
  catch(err: any){
    await transaction.rollback();
    console.error("Error booking unit:", err);
    return false
  }
}