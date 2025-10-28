import { getConnection } from "@/lib/db";
import sql from "mssql";
import dayjs from "dayjs";
import { db } from "./mock/units"

export interface IPayloadCheckinUnitService {
  unit_id: string;
  customers: Array<{ 
    customer_id?: string; 
    name?: string
    booking_id: string; 
    book_room_id: string
  }>;
  other_guests?: Array<{
    book_room_id: string;
    guest_id: string;
    gest_name: string;
  }>
  checkin_date: string; // ISO date string
}

export const checkinService = async (payload: IPayloadCheckinUnitService): Promise<boolean> => {
  const pool = await getConnection();
  let transaction = new sql.Transaction(pool);
  await transaction.begin();

  try{
    // Placeholder for actual check-in logic
    // validate unit_id, customers, and checkin_date
    // const customersValid = Array.isArray(payload.customers) && payload.customers.length > 0 && payload.customers.every(c => c.customer_id);
    // if(!payload.unit_id || !customersValid || !payload.checkin_date){
    //   return false
    // }
    // // Simulate check-in process

    // const unitIndex = db.units.findIndex(u => u.unit_id === payload.unit_id);
    // if(unitIndex === -1){
    //   throw new Error("Unit not found");
    // }
    // db.units[unitIndex].status = 3
    // db.units[unitIndex].status_desc = "Checkin"
    // db.units[unitIndex].checkin_customers = payload.customers.map((c) => {
    //   return {
    //     customer_id: c.customer_id,
    //     start_date: payload.checkin_date,
    //     end_date: dayjs(payload.checkin_date, 'YYYY-MM-DD').add(3, 'day').format("YYYY-MM-DD"),
    //   }
    // })
    const queryUpdateRoom = `
      UPDATE [dbo].[Sys_Hotel_CheckIn]
      SET Status = 'A', ModifyDate = GETDATE()
      WHERE UnitID = @UnitID AND BookingID = @BookingID AND BookRoomID = @BookRoomID AND Status = 'W'
    `
    for(const customer of payload.customers){
      const updateRequest = transaction.request()
      updateRequest.input("UnitID", payload.unit_id)
      updateRequest.input("BookingID", customer.booking_id)
      updateRequest.input("BookRoomID", customer.book_room_id)
      await updateRequest.query(queryUpdateRoom)
      delete updateRequest.parameters['UnitID']
      delete updateRequest.parameters['BookingID']
      delete updateRequest.parameters['BookRoomID']
    }

    if (payload.other_guests && payload.other_guests.length > 0) {
      const insertGuests = transaction.request()
      const query = `
        INSERT INTO [dbo].[Sys_Hotel_BookGuest]
        ([BookRoomID]
        ,[GuestID]
        ,[GuestName]
        ,[MainGuest]
        ,[CreateDate])
        VALUES
        ${payload.other_guests.map((guest, index) => {
          insertGuests.input(`BookRoomID_${index}`, guest.book_room_id)
          insertGuests.input(`GuestID_${index}`, guest.guest_id)
          insertGuests.input(`GuestName_${index}`, guest.gest_name)
          if (index === 0){
            insertGuests.input(`MainGuest_${index}`, 1)
          }
          else{
            insertGuests.input(`MainGuest_${index}`, 0)
          }
          return `(@BookRoomID_${index}, @GuestID_${index}, @GuestName_${index}, @MainGuest_${index}, GETDATE())`
        }).join(',')}
      `
      await insertGuests.query(query)
    }

    await transaction.commit();
    
    return true
  }
  catch(err: any){
    await transaction.rollback();
    console.error('Error in checkinService:', err);
    return false
  }
}