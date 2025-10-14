import { getConnection } from "@/lib/db";

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