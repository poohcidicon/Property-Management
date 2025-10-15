import { getConnection } from "@/lib/db";
import sql from "mssql";

export interface IMaterial {
  materialID: string;
  materialName: string;
  materialNameEN: string;
  materialTypeID: string;
  categoryID: string;
  isDelete: boolean;
  isShow: boolean;
  createDate: Date;
  createBy: string;
  modifyDate: Date;
  modifyBy: string;
}
export const getMaterial = async (): Promise<IMaterial[]> => {
  try{
    const pool = await getConnection();
    const query = `
      SELECT * FROM Sys_Hotel_Material
    `
    const result = await pool.request().query(query);
    return result.recordset
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
  BookingID: string;
  BookRoomID: string;
  MaterialID: string;
  Price: number;
  Quantity: number;
  CreateDate: Date;
}
export const getBookMaterialOption = async (payload: IPayloadGetBookMaterialOption): Promise<IBookMaterialOption[]> => {
  const pool = await getConnection();
  const query = `
    SELECT * FROM Sys_Hotel_BookOptions WHERE BookingID = @BookingID AND BookRoomID = @BookRoomID
  `
  const result = await pool.request()
    .input("BookingID", payload.booking_id)
    .input("BookRoomID", payload.book_room_id)
    .query(query)
  return result.recordset
}