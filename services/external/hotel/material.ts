import { getConnection } from "@/lib/db";
import sql from "mssql";

export interface IMaterial {
  MaterialID: string;
  MaterialName: string;
  MaterialNameEN: string;
  MaterialTypeID: string;
  CategoryID: string;
  IsDelete: boolean;
  IsShow: boolean;
  CreateDate: Date;
  CreateBy: string;
  ModifyDate: Date;
  ModifyBy: string;
  PriceList: Array<{
    MaterialPriceID: string;
    StartDate: Date;
    EndDate: Date;
    Price: number
  }>
}
export const getMaterial = async (): Promise<IMaterial[]> => {
  try{
    const pool = await getConnection();
    const query = `
      select m.*
      , mp.MaterialPriceID, mp.StartDate, mp.EndDate, mp.Price
      from Sys_Hotel_Material m
      left join Sys_Hotel_MaterialPrice mp on m.MaterialID = mp.MaterialID
      where m.IsDelete = 0 and m.IsShow = 1
    `
    const result = await pool.request().query(query);
    const mapping = result.recordset.reduce<IMaterial[]>((acc, cur) => {
      const index = acc.findIndex((g: IMaterial) => g.MaterialID === cur.MaterialID);
      if (index === -1) {
        acc.push({
          MaterialID: cur.MaterialID,
          MaterialName: cur.MaterialName,
          MaterialNameEN: cur.MaterialNameEN,
          CategoryID: cur.CategoryID,
          CreateBy: cur.CreateBy,
          CreateDate: cur.CreateDate,
          IsDelete: cur.IsDelete,
          IsShow: cur.IsShow,
          MaterialTypeID: cur.MaterialTypeID,
          ModifyBy: cur.ModifyBy,
          ModifyDate: cur.ModifyDate,
          PriceList: [{
            MaterialPriceID: cur.MaterialPriceID, StartDate: cur.StartDate, EndDate: cur.EndDate, Price: cur.Price
          }]
        });
      } else {
        acc[index].PriceList.push({
          MaterialPriceID: cur.MaterialPriceID, StartDate: cur.StartDate, EndDate: cur.EndDate, Price: cur.Price
        });
      }
      return acc;
    }, [] as IMaterial[])
    return mapping
  }catch(e){
    return []
  }
}

export interface IPayloadInsertMaterialOption {
  booking_id: string;
  book_room_id: string;
  material_id: string;
  price: number;
  qty: number;
  create_by?: string;
}

export const insBookMaterialOption = async (payload: IPayloadInsertMaterialOption): Promise<boolean> => {
  const pool = await getConnection();
  let transaction = new sql.Transaction(pool);
  await transaction.begin();
  try{
    const query = `
      INSERT INTO [dbo].[Sys_Hotel_BookOptions]
      ([BookingID]
      ,[BookRoomID]
      ,[MaterialID]
      ,[Price]
      ,[Quantity]
      ,[CreateDate]
      )
      VALUES
      (@BookingID
      ,@BookRoomID
      ,@MaterialID
      ,@Price
      ,@Qty
      ,GETDATE()
      )
    `
    await transaction.request()
      .input("BookingID", payload.booking_id)
      .input("BookRoomID", payload.book_room_id)
      .input("MaterialID", payload.material_id)
      .input("Price", payload.price)
      .input("Qty", payload.qty)
      .query(query)

    const VAT = 0.07
    const amount = payload.price * payload.qty
    const baseAmount = Number((amount / (1 + VAT)).toFixed(2))
    const vatAmount = baseAmount * VAT

    const { recordset: [material] } = await transaction.request()
      .input("MaterialID", payload.material_id)
      .query(`SELECT * FROM Sys_Hotel_Material WHERE MaterialID = @MaterialID`)
    if (!material) {
      await transaction.rollback();
      return false
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
    const { recordset: [payTransID] } = await transaction.request().query(`
        SELECT ISNULL(MAX(PayTransID), 0) + 1 as PayTransID FROM Sys_Hotel_PayTrans
      `)
    await transaction.request()
      .input("PayTransID", payTransID.PayTransID)
      .input("BookRoomID", payload.book_room_id)
      .input("EffectDate", new Date())
      .input("Description", material.MaterialName ? material.MaterialName : material.MaterialNameEN)
      .input("RefType", "Service")
      .input("RefID", material.MaterialID)
      .input("Quantity", payload.qty)
      .input("Price", payload.price)
      .input("Discount", 0)
      .input("FeeQuantity", 0)
      .input("BaseAmount", baseAmount)
      .input("VATPercent", VAT * 100)
      .input("VATAmount", vatAmount)
      .input("TotalAmount", amount)
      .input("UpdateBy", payload.create_by || process.env.DEFAULT_SALE_ID || "system")
      .query(insertPayTransQuery)

    await transaction.commit();
    return true
  }
  catch(e){
    console.log(e)
    await transaction.rollback();
    return false
  }
}

export interface IPayloadGetBookMaterialOption {
  booking_id: string;
  book_room_id: string;
}

export interface IBookMaterialOption {
  ID: number;
  BookingID: string;
  BookRoomID: string;
  MaterialID: string;
  MaterialName: string;
  Price: number;
  Quantity: number;
  CreateDate: Date;
}
export const getBookMaterialOption = async (payload: IPayloadGetBookMaterialOption): Promise<IBookMaterialOption[]> => {
  const pool = await getConnection();
  const query = `
    SELECT bo.*
    , m.MaterialName
    FROM Sys_Hotel_BookOptions bo
    INNER JOIN Sys_Hotel_Material m ON bo.MaterialID = m.MaterialID
    WHERE bo.BookingID = @BookingID AND bo.BookRoomID = @BookRoomID
  `
  const result = await pool.request()
    .input("BookingID", payload.booking_id)
    .input("BookRoomID", payload.book_room_id)
    .query(query)
  return result.recordset
}

export interface IPayloadDeleteBookMaterialOption {
  id: string;
  booking_id: string;
  book_room_id: string;
}

export const deleteBookMaterialOption = async (payload: IPayloadDeleteBookMaterialOption): Promise<boolean> => {
  const pool = await getConnection();
  let transaction = new sql.Transaction(pool);
  await transaction.begin();
  try{
    const {recordset: [foundBookOption]} = await transaction.request()
      .input("ID", payload.id)
      .query(`select * from Sys_Hotel_BookOptions where ID = @ID`)
    if (!foundBookOption) {
      await transaction.rollback();
      return false
    }

    const query = `
      DELETE FROM Sys_Hotel_BookOptions 
      WHERE ID = @ID AND BookingID = @BookingID AND BookRoomID = @BookRoomID
    `
    await transaction.request()
      .input("ID", payload.id)
      .input("BookingID", payload.booking_id)
      .input("BookRoomID", payload.book_room_id)
      .query(query)
    
    const {recordset: [foundPayTrans]} = await transaction.request()
      .input("RefID", foundBookOption.MaterialID)
      .input("RefType", "Service")
      .input("BookRoomID", payload.book_room_id)
      .query(`select * from Sys_Hotel_PayTrans where RefID = @RefID AND RefType = @RefType AND BookRoomID = @BookRoomID`)
    if (foundPayTrans){
      await transaction.request()
        .input("PayTransID", foundPayTrans.PayTransID)
        .query(`delete from Sys_Hotel_PayTrans where PayTransID = @PayTransID`)
    }
    await transaction.commit();
    return true
  }
  catch(e){
    await transaction.rollback();
    return false
  }
}