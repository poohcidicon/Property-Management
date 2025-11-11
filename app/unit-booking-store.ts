import { create } from "zustand";

type UnitBooking = {
  unit_number: string;
  booking_date_list: Record<string, number>;
};

type UnitBookingList = {
  unit_booking_list: UnitBooking[];
  setUnitBookingList: (unit_booking_list: UnitBooking[]) => void;
};

export const useUnitBookingStore = create<UnitBookingList>((set) => ({
  unit_booking_list: [],
  setUnitBookingList: (unit_booking_list: UnitBooking[]) => set({ unit_booking_list }),
}));