import { getMaterial } from "@/services/external/hotel/material"
import { IResponse } from "@/services/external/models/master"

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

export const getMaterialController = async (): Promise<IResponse<IMaterial[]>> => {
  try{
    const materialList = await getMaterial()
    return {
      success: true,
      data: materialList,
      error: "",
      message: ""
    }
  }catch(err: any){
    return {
      success: false,
      data: [],
      error: err.message,
      message: err.message
    }
  }
}