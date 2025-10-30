import { IResponse } from "@/services/external/models/master";
import { getUnitBookingDate } from "@/services/external/test-rental/get-unit-booking";
import dayjs from "dayjs";

export interface IPayloadGetUnitBookingDateController {
  active_date: string;
  project_id: string;
  unit_id: string | null;
  year: number;
  month: number;
  day: number;
}

export interface IResponseGetUnitBookingDateController {
  unit_number: string;
  booking_date_list: {
    [key: string]: number
  }
}

export const getUnitBookingDateController = async (payload: IPayloadGetUnitBookingDateController): Promise<IResponse<IResponseGetUnitBookingDateController[]>> => {
  try{
    const unitBookingData = await getUnitBookingDate({
      active_date: payload.active_date,
      project_id: payload.project_id,
      year: payload.year,
      month: payload.month,
      day: payload.day
    })
    const responseUnitBookingDateList = unitBookingData.data?.map((item: {[key: string]: string | number}) => {
      const unit_number = item['UnitNumber'] as string
      delete item['UnitNumber']
      const activeBookingDateList = Object.keys(item).reduce<{[key: string]: number}>((acc, dateKey) => {
        const isActive = dayjs(dateKey).isAfter(dayjs(payload.active_date), 'day') || dayjs(dateKey).isSame(dayjs(payload.active_date), 'day') ? 1 : 0
        if (isActive === 1) {
          acc[dateKey] = item[dateKey] as number
        }
        return acc
      }, {})
      return {
        unit_number: unit_number,
        booking_date_list: activeBookingDateList as {[key: string]: number}
      }
    }) || []
    return {
      success: true,
      data: responseUnitBookingDateList,
      message: unitBookingData.message || "Success",
    }
  }
  catch (error: any) {
    return {
      success: false,
      error: error.message,
      data: [],
      message: error.message
    }
  }
}