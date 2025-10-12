import { IResponse } from "../models/master";
import { IGuest } from "../models/customer";

import { db } from "./mock/guest-data"

export const getGuestList = async (): Promise<IResponse<IGuest[]>> => {
  try {
    // fetch from mock data
    return {
      success: true,
      data: db.customer as IGuest[],
      message: "Success",
      error: ""
    }
  }
  catch (err) {
    return {
      success: false,
      error: (err as Error).message,
      data: [],
      message: (err as Error).message
    }
  }
}