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
  create_by: string;
}

export const checkinService = async (payload: IPayloadCheckinUnitService): Promise<boolean> => {
  const pool = await getConnection();
  let transaction = new sql.Transaction(pool);
  await transaction.begin();

  try{
    const queryUpdateRoom = `
      UPDATE [dbo].[Sys_Hotel_CheckIn]
      SET Status = 'A', ModifyDate = GETDATE(), CreateBy = @CreateBy, ModifyBy = @CreateBy
      WHERE UnitID = @UnitID AND BookingID = @BookingID AND BookRoomID = @BookRoomID AND Status = 'W'
    `
    for(const customer of payload.customers){
      const updateRequest = transaction.request()
      updateRequest.input("UnitID", payload.unit_id)
      updateRequest.input("BookingID", customer.booking_id)
      updateRequest.input("BookRoomID", customer.book_room_id)
      updateRequest.input("CreateBy", payload.create_by)
      await updateRequest.query(queryUpdateRoom)
      delete updateRequest.parameters['UnitID']
      delete updateRequest.parameters['BookingID']
      delete updateRequest.parameters['BookRoomID']
      delete updateRequest.parameters['CreateBy']
    }

    if (payload.other_guests && payload.other_guests.length > 0) {
      const insertGuests = transaction.request()
      insertGuests.input("CreateBy", payload.create_by)
      const query = `
        INSERT INTO [dbo].[Sys_Hotel_BookGuest]
        ([BookRoomID]
        ,[GuestID]
        ,[GuestName]
        ,[MainGuest]
        ,[CreateBy]
        ,[ModifyBy]
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
          return `(@BookRoomID_${index}, @GuestID_${index}, @GuestName_${index}, @MainGuest_${index}, @CreateBy, @CreateBy, GETDATE())`
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