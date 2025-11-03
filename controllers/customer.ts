import { ICustomer } from "@/services/external/models/customer";
import { IResponse } from "@/services/external/models/master";
import { genMemberIdRental, getCustomerRental } from "@/services/external/test-rental/get-customer";

export const getCustomerController = async (keyword: string): Promise<IResponse<ICustomer[]>> => {
  try {
    const response = await getCustomerRental(keyword);
    return {
      success: true,
      data: response.data as ICustomer[],
      message: "Success"
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
      data: [],
      message: err.message
    }
  }
}

export const genGenMemberIDController = async (payload: { item_id: string }): Promise<IResponse<{ member_id: string } | null>> => {
  try {
    const response = await genMemberIdRental(payload);
    return {
      success: true,
      data: response.data ? {
        member_id: response.data 
      } : null,
      message: "Success"
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
      data: null,
      message: err.message
    }
  }
}

