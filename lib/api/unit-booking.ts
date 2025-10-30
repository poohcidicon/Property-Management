import { ApiResponse, axiosPrivate, axiosPublic } from "../axios";

export interface UnitBookingDate {
  unit_number: string
  booking_date_list: {
    [key: string]: number
  }
}

export async function getUnitBookingDateApi (payload: {
  active_date: string
  project_id: string,
  year: number,
  month: number,
  day: number
}): Promise<ApiResponse<UnitBookingDate[]>> {
  try{
    const response = await axiosPublic.post<ApiResponse<UnitBookingDate[]>>('/api/unit-booking-date', payload);
    return response.data
  }
  catch (error: any) {
    console.error('Error fetching circles:', error);
    throw error;
  }
}

export interface IPayloadBookUnit {
  customer_id: string;
  booking_date: string;
  booking_type: string;
  booking_month: number;
  booking_year: number;
  amount: number;
  project_id: string;
  daily_booking_units: {
    unit_id: string;
    book_date: string;
    amount: number;
    product_group: string
    product_type: string
    compensate_id?: string | null
  }[];
}

export async function bookUnitApi (payload: IPayloadBookUnit): Promise<ApiResponse<boolean>> {
  try{
    const response = await axiosPrivate.post<ApiResponse<boolean>>('/api/book-unit', payload);
    return response.data
  }
  catch (error: any) {
    console.error('Error fetching circles:', error);
    throw error;
  }
}

export interface IPayloadGetCompensateUnits {
  customer_id: string;
}

export interface CompensateUnit {
  CompUnitID: string;
  CompensateID: string;
  BookingID: string;
  UnitID: string;
  BookingDate: string;
  CompenDate: string;
}

export async function compensateUnitsApi (payload: IPayloadGetCompensateUnits): Promise<ApiResponse<CompensateUnit[]>> {
  try{
    const response = await axiosPublic.post<ApiResponse<CompensateUnit[]>>('/api/compensate-units', payload);
    return response.data
  }
  catch (error: any) {
    console.error('Error fetching circles:', error);
    throw error;
  }
}

export interface ProductGroupMaster {
  ID: string;
  Name: string;
  NameEng: string;
  Value: string;
  Groups: string;
  isDelete: number;
  Sequence: number;
  UpdatedBy: string;
  UpdatedDate: string;
}

export async function getProductGroupApi (): Promise<ApiResponse<ProductGroupMaster[]>> {
  try{
    const response = await axiosPublic.get<ApiResponse<ProductGroupMaster[]>>('/api/product-group');
    return response.data
  }
  catch (error: any) {
    console.error('Error fetching circles:', error);
    throw error;
  }
}