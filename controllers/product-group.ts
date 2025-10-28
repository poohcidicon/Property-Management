import { IResponse } from "@/services/external/models/master";
import { ProductGroupMaster } from "@/services/external/models/unit-matrix";
import { getProductGroupMaster } from "@/services/external/test-rental/get-unit-booking";

export const getProductGroupController = async (): Promise<IResponse<ProductGroupMaster[]>> => {
  try{
    const res = await getProductGroupMaster();
    return res;
  }
  catch(err:any){
    return {
      success: false,
      error: err.message,
      data: [],
      message: err.message
    }
  }
}