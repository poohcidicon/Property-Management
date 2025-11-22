import { bookUnitService } from "@/services/external/hotel/booking";
import { BookPayTrans, CheckinDetail, checkinService, getBookPayTrans, getCheckinDetail, IPayloadBookPayTrans, IPayloadCheckinDetail } from "@/services/external/hotel/checkin";
import { checkoutUnitService, preCheckout } from "@/services/external/hotel/checkout";
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
  create_by: string
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
  create_by: string;
  remark?: string
  damages: Array<{ id: string; material_id: string; material_name: string; price: number; qty: number }>;
  materials: Array<{
    action: string;
    paytrans_id?: string;
    id: string
    material_id: string
    material_name: string
    price: number
    qty: number
  }>
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

export interface IPayloadPreCheckout {
  unit_id: string;
  booking_id: string;
  book_room_id: string;
  room_number: string;
  update_by?: string;
  total_amount: number
}
export const preCheckoutController = async (payload: IPayloadPreCheckout): Promise<IResponse<boolean>> => {
  try{
    const res = await preCheckout(payload)
    if(!res){
      return {
        success: false,
        data: false,
        error: "Pre-checkout failed",
        message: "Pre-checkout failed"
      }
    }
    return {
      success: true,
      data: true,
      error: "",
      message: "Pre-checkout successful"
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

export const getCheckinDetailController = async (payload: IPayloadCheckinDetail): Promise<IResponse<CheckinDetail[]>> => {
  try{
    const result = await getCheckinDetail(payload)
    return {
      success: true,
      data: result,
      error: "",
      message: ""
    }
  }
  catch(err: any){
    return {
      success: false,
      data: [],
      error: err.message,
      message: err.message
    }
  }
}

export const getBookPayTransController = async (payload: IPayloadBookPayTrans): Promise<IResponse<BookPayTrans[]>> => {
  try{
    const result = await getBookPayTrans(payload)
    return {
      success: true,
      data: result,
      error: "",
      message: ""
    }
  }
  catch(err: any){
    return {
      success: false,
      data: [],
      error: err.message,
      message: err.message
    }
  }
}