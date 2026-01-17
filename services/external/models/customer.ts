export interface ICustomer {
  id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  firstNameEng: string;
  lastNameEng: string;
  fullNameEng: string;
  citizenId: string;
  gender: string;
  type: string;
  mobile: string;
  email: string;
  opportunityCount: number;
  createDate: string;
}

export interface IGuest {
  id: string;
  member_id: string;
  book_room_id: string;
  first_name?: string;
  last_name?: string;
  full_name: string;
  first_name_eng?: string;
  last_name_eng?: string;
  full_name_eng?: string;
  citizen_id?: string;
  gender?: string;
  type?: string;
  mobile: string;
  email?: string;
  opportunity_count?: number;
  create_date?: string;
  night: number;
  adults: number;
  children: number;
  total_amount: number;
  room_type: string;
  start_booking: string; // ISO date string
  end_booking: string;   // ISO date string
  booking: {
    unit_id: string;
    status: string;
    checkin_date: string; // ISO date string
    checkout_date: string; // ISO date string
    room_number: string
  } | null;
  checkin: {
    unit_id: string;
    status: string;
    checkin_date: string; // ISO date string
    checkout_date: string; // ISO date string
    room_number: string
  } | null;
  book_status: string;
}

// from Database
export interface BookingGuest {
  BookingID: string,
  BookRoomID: string,
  LeadGuest: string,
  LeadPhone: string,
  RoomType: string,
  CheckIn: string,
  CheckOut: string,
  Night: string,
  Adults: string,
  Children: string,
  TotalAmount: string,
  StatusText: string,
  BookRoomNumber: string,
  BookUnitID: string,
  CheckinUnitID: string,
  CheckinRoomNumber: string,
  BookingRoomStatus: string,
  AssignedRoomNumber: string
}

export interface SysHotelGuests {
  GuestID: string;
  GuestCode: string;
  GuestTitle: string;
  GuestFirstName: string;
  GuestLastName: string;
  GuestPassport: string;
  GuestNationalityID: string;
  GuestMobileNumber: string;
  GuestAddress: string;
  GuestEmail: string;
  GuestPhone: string;
  CreateDate: string;
  CreateBy: string;
  ModifyDate: string;
  ModifyBy: string;
  IsDeleted: boolean;
  IsBooked?: number;
}

export interface SysHotelBookGuests extends SysHotelGuests {
  book_room_id: string;
}
