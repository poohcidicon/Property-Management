import { getCompensateUnits, IPayloadGetmpensateUnits } from "@/services/external/test-rental/get-unit-booking";

export const getCompensateUnitsController = async (payload: IPayloadGetmpensateUnits) => {
  try{
    const res = await getCompensateUnits(payload);
    return res;
  }
  catch(err:any){
    return {
      success: false,
      error: err.message,
      data: null,
      message: err.message
    }
  }
}
