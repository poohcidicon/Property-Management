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

    const insertPayTransQuery = `
      INSERT INTO [dbo].[Sys_Hotel_PayTrans]
        ([PayTransID]
        ,[BookRoomID]
        ,[TransacDate]
        ,[EffectDate]
        ,[Description]
        ,[RefType]
        ,[RefID]
        ,[Quantity]
        ,[Price]
        ,[Discount]
        ,[FeeQuantity]
        ,[BaseAmount]
        ,[VATPercent]
        ,[VATAmount]
        ,[TotalAmount]
        ,[PaidAmount]
        ,[PayID]
        ,[Status]
        ,[CreateDate]
        ,[CreateBy]
        ,[ModifyDate]
        ,[ModifyBy])
     VALUES
        (@PayTransID
        ,@BookRoomID
        ,GETDATE()
        ,@EffectDate
        ,@Description
        ,@RefType
        ,@RefID
        ,@Quantity
        ,@Price
        ,@Discount
        ,@FeeQuantity
        ,@BaseAmount
        ,@VATPercent
        ,@VATAmount
        ,@TotalAmount
        ,0
        ,null
        ,'A'
        ,GETDATE()
        ,@UpdateBy
        ,GETDATE()
        ,@UpdateBy)
    `
    const checkinQuery = `
      SELECT * FROM Sys_Hotel_Booking
      WHERE BookingID = @BookingID
    `
    const {recordset: bookingResult=[]} = await transaction.request()
      .input("BookingID", payload.customers[0].booking_id)
      .query(checkinQuery)
    if(bookingResult.length === 0){
      await transaction.rollback();
      return false
    }
    const { recordset: checkinResult=[]} = await transaction.request()
      .input("BookingID", payload.customers[0].booking_id)
      .input("BookRoomID", payload.customers[0].book_room_id)
      .query(`
        select * from Sys_Hotel_CheckIn
        WHERE BookingID = @BookingID AND BookRoomID = @BookRoomID
      `)
    const VAT = 0.07
    const baseAmount = Number((bookingResult[0].Amount / (1 + VAT)).toFixed(2))
    const vatAmount = baseAmount * VAT

    for (const checkin of checkinResult){
      const { recordset: [payTransID] } = await transaction.request().query(`
        SELECT ISNULL(MAX(PayTransID), 0) + 1 as PayTransID FROM Sys_Hotel_PayTrans
      `)
      const insertPayTrans = transaction.request()
      insertPayTrans.input("PayTransID", payTransID.PayTransID)
      insertPayTrans.input("BookRoomID", checkin.BookRoomID)
      insertPayTrans.input("EffectDate", checkin.CheckIn)
      insertPayTrans.input("Description", "เช่ารายวัน")
      insertPayTrans.input("RefType", "Book")
      insertPayTrans.input("RefID", checkin.BookingID)
      insertPayTrans.input("Quantity", 1)
      insertPayTrans.input("Price", bookingResult[0].Amount)
      insertPayTrans.input("Discount", 0)
      insertPayTrans.input("FeeQuantity", 0)
      insertPayTrans.input("BaseAmount", baseAmount)
      insertPayTrans.input("VATPercent", VAT*100)
      insertPayTrans.input("VATAmount", vatAmount)
      insertPayTrans.input("TotalAmount", bookingResult[0].Amount)
      insertPayTrans.input("UpdateBy", payload.create_by)
      await insertPayTrans.query(insertPayTransQuery)
      delete insertPayTrans.parameters['BookRoomID']
      delete insertPayTrans.parameters['EffectDate']
      delete insertPayTrans.parameters['Description']
      delete insertPayTrans.parameters['RefType']
      delete insertPayTrans.parameters['RefID']
      delete insertPayTrans.parameters['Quantity']
      delete insertPayTrans.parameters['Price']
      delete insertPayTrans.parameters['Discount']
      delete insertPayTrans.parameters['FeeQuantity']
      delete insertPayTrans.parameters['BaseAmount']
      delete insertPayTrans.parameters['VATPercent']
      delete insertPayTrans.parameters['VATAmount']
      delete insertPayTrans.parameters['TotalAmount']
      delete insertPayTrans.parameters['UpdateBy']
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