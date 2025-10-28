import { getFloorMas, getUnitsHotelService, IFloorMas, IUpdateRoomStatus, updateRoomStatusService } from "@/services/external/hotel/get-unit"
import { IResponse } from "@/services/external/models/master"
import { UnitMatrixHotel } from "@/services/external/models/unit-matrix"

export interface IPayloadGetUnitMatrixHotelController {
  project_id: string;
  floor: number;
  active_date: string
}

export const getUnitMatrixHotelController = async (payload: IPayloadGetUnitMatrixHotelController): Promise<IResponse<UnitMatrixHotel[]>> => {
  try{
    const unitMatrix = await getUnitsHotelService(payload)
    return unitMatrix
  }
  catch (err: any) {
    return {
      success: false,
      data: [],
      error: err.message,
      message: err.message
    }
  }
}

export interface IFloorMasController {
  FloorID: number;
  FloorName: string;
  FileID: string
  ImagePath: string
}

export const getFloorMasController = async (payload: { project_id: string }): Promise<IResponse<IFloorMasController[]>> => {
  try{
    const unitMatrix = await getFloorMas(payload)
    const mappingData = unitMatrix.data?.map((item) => {
      return {
        ...item,
        ImagePath: `${process.env.NEXT_PUBLIC_SERVER_HOST}/api/image/plan/${item.FileID}`
      } as IFloorMasController
    }) || []
    return {
      success: true,
      data: mappingData,
      message: "Success"
    }
  }
  catch (err: any) {
    return {
      success: false,
      data: [],
      error: err.message,
      message: err.message
    }
  }
}

export const updateRoomStatusController = async (payload: IUpdateRoomStatus): Promise<IResponse<boolean>> => {
  try{
    const updateRoomStatus = await updateRoomStatusService(payload);
    return updateRoomStatus;
  }
  catch (err: any) {
    return {
      success: false,
      data: false,
      error: err.message,
      message: err.message
    }
  }
};