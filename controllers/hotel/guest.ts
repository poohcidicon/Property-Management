import { getGuestList } from "@/services/external/hotel/guest";
import { IGuest } from "@/services/external/models/customer";
import { IResponse } from "@/services/external/models/master";
import dayjs from "dayjs";

export interface IPayloadGetGuestListController {
  checkin_date: string; // ISO date string
}

export const getGuestListController = async (payload: IPayloadGetGuestListController): Promise<IResponse<IGuest[]>> => {
  try {
    const result = await getGuestList({
      checkin_date: payload.checkin_date
    })
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