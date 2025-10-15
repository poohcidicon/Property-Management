import { bookUnitService } from "@/services/external/hotel/booking";
import { checkinService } from "@/services/external/hotel/checkin";
import { checkoutUnitService } from "@/services/external/hotel/checkout";
import { IResponse } from "@/services/external/models/master";

export interface IPayloadBookUnit {
  unit_id: string;
  booking_date: string; // ISO date string
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  booking_id: string;
  book_room_id: string;
  room_number: string;
}
export const bookUnitController = async (payload: IPayloadBookUnit): Promise<IResponse<boolean>> => {
  try{
    // Placeholder for actual booking logic
    const result = await bookUnitService(payload)
    if(!result){
      return {
        success: false,
        data: false,
        error: "Booking failed",
        message: "Booking failed"
      }
    }
    return {
      success: true,
      data: result,
      error: "",
      message: "Unit booked successfully"
    }
  }
  catch(err: any){
    return {
      success: false,
      data: false,
      error: err.message,
      message: err.message
    }
  }
}

export interface IPayloadCheckinUnit {
  unit_id: string;
  customers: Array<{
    customer_id?: string; 
    name?: string
    booking_id: string; 
    book_room_id: string 
  }>;
  checkin_date: string; // ISO date string
}

export const checkinUnitController = async (payload: IPayloadCheckinUnit): Promise<IResponse<boolean>> => {
  try{
    // Placeholder for actual check-in logic
    // validate unit_id, customers, and checkin_date
    const customersValid = Array.isArray(payload.customers) && payload.customers.length > 0 && payload.customers.every(c => c.booking_id && c.book_room_id);
    if(!payload.unit_id || !customersValid || !payload.checkin_date){
      return {
        success: false,
        data: false,
        error: "Invalid input data",
        message: "Invalid input data"
      }
    }
    const result = await checkinService(payload)
    if(!result){
      return {
        success: false,
        data: false,
        error: "Check-in failed",
        message: "Check-in failed"
      }
    }
    return {
      success: true,
      data: true,
      error: "",
      message: "Check-in successful"
    }
  }
  catch(err: any){
    return {
      success: false,
      data: false,
      error: err.message,
      message: err.message
    }
  }
}

export interface IPayloadCheckoutUnit {
  unit_id: string;
  checkout_date: string; // ISO date string
  total_amount: number
  project_id: string;
  payment_method: string
  book_room_id: string
}

export const checkoutUnitController = async (payload: IPayloadCheckoutUnit): Promise<IResponse<boolean>> => {
  try{
    // Placeholder for actual check-out logic
    const result = await checkoutUnitService(payload)
    if(!result){
      return {
        success: false,
        data: false,
        error: "Check-out failed",
        message: "Check-out failed"
      }
    }
    return {
      success: true,
      data: true,
      error: "",
      message: "Check-out successful"
    }
  }
  catch (err: any){
    return {
      success: false,
      data: false,
      error: err.message,
      message: err.message
    }
  }
}