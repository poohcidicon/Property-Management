export interface UnitMatrix {
  UnitID: string;
  UnitNumber: string;
  UnitStatus: number;
  X: number;
  Y: number;
  M_Price: number;
  D_Price: number;
}

export interface FloorPlan {
  ProjectID: string;
  FloorPlanName: string;
  X: number;
  Y: number;
  FloorPlanPath: string;
  FileID: string;
}

export interface UnitMatrixHotel{
  unit_id: string;
  unit_number: string;
  status: number;
  x: number | null;
  y: number | null;
  d_price: number;
  room_type: string;
  status_desc: string;
  floor: string;
  total_amount: number;
  booking: {
    customer_id: string;
    status: string;
    start_date: string;
    end_date: string;
  } | null;
  checkin_customers: Array<{
    booking_id: string;
    book_room_id: string;
    start_date: string;
    end_date: string;
  }> | null;
}

// from database hotel
export interface IUnitMatrixHotelDB {
  UnitID: string;
  RoomNumber: string;
  Area: string;
  X: number | null;
  Y: number | null;
  TowerID: string;
  TowerName: string;
  FloorID: string;
  FloorName: string;
  ActiveDate: string;
  DateType: string;
  StatusText: string;
  Status: number;
  LeadGuest: string;
  LeadPhone: string;
  CheckIn: string;
  CheckOut: string;
  TotalAmount: string;
  BookingID: string | null;
  BookRoomID: string | null;
  BookingStatus: string | null;
  RoomType: string;
  RoomTypeName: string;
  RoomTypeNameEng: string;
}