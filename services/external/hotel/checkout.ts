import { getConnection } from "@/lib/db";
import sql from "mssql";
import dayjs from "dayjs";
import { db } from "./mock/units"
import { getRunNumberHotel } from "./genRunNumberHotel";

export interface IPayloadCheckoutUnitService {
  unit_id: string;
  checkout_date: string; // ISO date string
  total_amount: number;
  project_id: string
  payment_method: string
  book_room_id: string
  create_by: string
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
      .input("BookRoomID", payload.book_room_id)
      .query(`
        SELECT Top 1 BookRoomID
        ,BookingID
        ,Status
        ,CreateDate
        FROM Sys_Hotel_CheckIn
        WHERE UnitID = @UnitID
        AND BookRoomID = @BookRoomID
        AND Status = 'A'
      `)
    if (!bookingData) {
      await transaction.rollback();
      return false
    }

    const runningNumber = await getRunNumberHotel({
      projectID: payload.project_id,
      runKey: process.env.RUN_KEY || 'Receipt_Hotel',
      fixWord: "",
      runningDate: dayjs(payload.checkout_date).toDate(),
      sbuid: "",
      userID: "system"
    }, transaction.request())

    if (!runningNumber) {
      await transaction.rollback();
      return false
    }

    // set payment
    const VAT = 0.07
    const baseAmount = Number((payload.total_amount / (1 + VAT)).toFixed(2))
    const vatAmount = baseAmount * VAT
    const queryInsReceipt = `
      INSERT INTO [dbo].[Sys_Hotel_Receipt]
        ([ReceiptID]
        ,[ReceiptDate]
        ,[GuestID]
        ,[BaseAmount]
        ,[VATPercent]
        ,[VATAmount]
        ,[WHTPercent]
        ,[WHTAmount]
        ,[TotalAmount]
        ,[Status]
        ,[CreateDate]
        ,[CreateBy]
        ,[ModifyDate]
        ,[ModifyBy])
      VALUES
        (@ReceiptID
        ,GETDATE()
        ,1
        ,@BaseAmount
        ,@Vat
        ,@VatAmount
        ,0
        ,0
        ,@TotalAmount
        ,'A'
        ,GETDATE()
        ,@CreateBy
        ,GETDATE()
        ,@CreateBy)
    `
    await transaction.request()
      .input("ReceiptID", runningNumber)
      .input("BaseAmount", baseAmount)
      .input("Vat", VAT*100)
      .input("VatAmount", vatAmount)
      .input("TotalAmount", payload.total_amount)
      .input("CreateBy", payload.create_by || process.env.DEFAULT_SALE_ID || "system")
      .query(queryInsReceipt)

    const queryPayment = `
      INSERT INTO [dbo].[Sys_Hotel_Payment]
        ([BookRoomID]
        ,[PaymentDate]
        ,[PaymentType]
        ,[ReceiptID]
        ,[BaseAmount]
        ,[VATPercent]
        ,[VATAmount]
        ,[FeeAmount]
        ,[FeeVATAmount]
        ,[TotalFee]
        ,[WHTPercent]
        ,[WHTAmount]
        ,[TotalAmount]
        ,[Status]
        ,[CreateDate]
        ,[CreateBy]
        ,[ModifyDate]
        ,[ModifyBy])
     VALUES
        (@BookRoomID
        ,GETDATE()
        ,@PaymentType
        ,@ReceiptID
        ,@BaseAmount
        ,@VATPercent
        ,@VATAmount
        ,0
        ,0
        ,0
        ,0
        ,0
        ,@TotalAmount
        ,'A'
        ,GETDATE()
        ,@CreateBy
        ,GETDATE()
        ,@CreateBy)
    `
    await transaction.request()
      .input("BookRoomID", payload.book_room_id)
      .input("PaymentType", payload.payment_method)
      .input("ReceiptID", runningNumber)
      .input("BaseAmount", baseAmount)
      .input("VATPercent", VAT*100)
      .input("VATAmount", vatAmount)
      .input("TotalAmount", payload.total_amount)
      .input("CreateBy", payload.create_by || process.env.DEFAULT_SALE_ID || "system")
      .query(queryPayment)

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
      ,CreateBy
      ,ModifyBy
      )
      SELECT Top 1 BookRoomID
      ,BookingID
      ,GETDATE()
      ,@CheckOutDate
      ,@TotalAmount
      ,Status
      ,CreateDate
      ,@CreateBy
      ,@CreateBy
      FROM Sys_Hotel_CheckIn
      WHERE UnitID = @UnitID
      AND BookRoomID = @BookRoomID
    `
    await transaction.request()
      .input("BookRoomID", payload.book_room_id)
      .input("UnitID", payload.unit_id)
      .input("CheckOutDate", dayjs(payload.checkout_date).format('YYYY-MM-DD'))
      .input("TotalAmount", payload.total_amount)
      .input("CreateBy", payload.create_by || process.env.DEFAULT_SALE_ID || "system")
      .query(queryInsertCheckout)
    
    // set unint
    await transaction.request()
      .input("UnitID", payload.unit_id)
      .input("ActiveDate", dayjs(payload.checkout_date).format('YYYY-MM-DD'))
      .query(`
        UPDATE Sys_Hotel_RoomStatus
        SET Status = '3'
        WHERE UnitID = @UnitID AND ActiveDate = @ActiveDate
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