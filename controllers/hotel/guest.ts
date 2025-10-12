import { getGuestList } from "@/services/external/hotel/guest";
import { IGuest } from "@/services/external/models/customer";
import { IResponse } from "@/services/external/models/master";

export const getGuestListController = async (): Promise<IResponse<IGuest[]>> => {
  try {
    const result = await getGuestList()
    return result
  }
  catch (err: any) {
    return {
      success: false,
      error: err.message,
      data: [],
      message: err.message
    }
  }
}