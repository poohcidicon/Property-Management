import { getConnection } from "@/lib/db";
import sql from "mssql";
import dayjs from "dayjs";
import { db } from "./mock/units"

export interface IPayloadCheckoutUnitService {
  unit_id: string;
  checkout_date: string; // ISO date string
  total_amount: number;
}

export const checkoutUnitService = async (payload: IPayloadCheckoutUnitService): Promise<boolean> => {
  const pool = await getConnection();
  let transaction = new sql.Transaction(pool);
  await transaction.begin();
  try{
    // const unitIndex = db.units.findIndex(u => u.unit_id === payload.unit_id);
    // if(unitIndex === -1){
    //   return false
    // }

    // db.units[unitIndex].status = 1
    // db.units[unitIndex].status_desc = "Available"
    // db.units[unitIndex].booking = null
    // db.units[unitIndex].checkin_customers = []

    const { recordset: [bookingData] } = await transaction.request()
      .input("UnitID", payload.unit_id)
      .query(`
        SELECT Top 1 BookRoomID
        ,BookingID
        ,Status
        ,CreateDate
        FROM Sys_Hotel_CheckIn
        WHERE UnitID = @UnitID
      `)
    if (!bookingData) {
      await transaction.rollback();
      return false
    }

    const queryUpdateRoom = `
      UPDATE [dbo].[VW_Hotel_RoomStatus]
      SET Status = '0'
      WHERE UnitID = @UnitID
    `
    await transaction.request()
      .input("UnitID", payload.unit_id)
      .query(queryUpdateRoom)
    
    const queryInsertCheckout = `
      INSERT INTO [dbo].[Sys_Hotel_CheckOut]
      (BookRoomID
      ,BookingID
      ,TransacDate
      ,CheckOut
      ,TotalAmount
      ,Status
      ,CreateDate
      )
      SELECT Top 1 BookRoomID
      ,BookingID
      ,GETDATE()
      ,@CheckOutDate
      ,@TotalAmount
      ,Status
      ,CreateDate
      FROM Sys_Hotel_CheckIn
      WHERE UnitID = @UnitID
    `
    await transaction.request()
      .input("UnitID", payload.unit_id)
      .input("CheckOutDate", dayjs(payload.checkout_date).format('YYYY-MM-DD'))
      .input("TotalAmount", payload.total_amount)
      .query(queryInsertCheckout)
    
    // set unint
    await transaction.request()
      .input("UnitID", payload.unit_id)
      .query(`
        UPDATE Sys_Hotel_Room
        SET Status = '3'
        WHERE UnitID = @UnitID
      `)
    
    // set checkin
    await transaction.request()
      .input("UnitID", payload.unit_id)
      .query(`
        UPDATE Sys_Hotel_CheckIn
        SET Status = 'P'
        WHERE UnitID = @UnitID AND Status = 'A'
      `)
    
    // set hotel booking
    await transaction.request()
      .input("BookingID", bookingData.BookingID)
      .query(`
        UPDATE Sys_Hotel_Booking
        SET Status = 'P'
        WHERE BookingID = @BookingID
      `)

    // set hotel book Room
    await transaction.request()
      .input("BookingID", bookingData.BookingID)
      .input("BookRoomID", bookingData.BookRoomID)
      .query(`
        UPDATE Sys_Hotel_BookRoom
        SET Status = 'P'
        WHERE BookingID = @BookingID AND BookRoomID = @BookRoomID
      `)


    await transaction.commit();
    return true
  }
  catch(err: any){
    await transaction.rollback();
    console.error('Error in checkoutUnitService:', err);
    return false
  }
}