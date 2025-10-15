import { getBookMaterialOption, getMaterial, IBookMaterialOption, insBookMaterialOption, IPayloadGetBookMaterialOption } from "@/services/external/hotel/material"
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

export interface IPayloadInsertMaterialOption {
  booking_id: string;
  book_room_id: string;
  material_id: string;
  price: number;
  qty: number;
}

export const insBookMaterialOptionController = async (payload: IPayloadInsertMaterialOption): Promise<IResponse<boolean>> => {
  try{
    const result = await insBookMaterialOption(payload)
    return {
      success: true,
      data: result,
      error: "",
      message: ""
    }
  }catch(err: any){
    return {
      success: false,
      data: false,
      error: 'failed',
      message: 'failed'
    }
  }
}

export const getBookMaterialOptionController = async (payload: IPayloadGetBookMaterialOption): Promise<IResponse<IBookMaterialOption[]>> => {
  try{
    const materialList = await getBookMaterialOption(payload)
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