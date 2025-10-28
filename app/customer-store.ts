import { create } from "zustand";

type Customer = {
  id: string;
  memberId: string;
  name: string;
  citizenId: string;
  mobile: string;
  type: string;
  book_room_id?: string;
}

type CustomerState = {
  customer: Customer | null;
  setCustomer: (customer: Customer | null) => void;
};

export const useCustomerStore = create<CustomerState>((set) => ({
  customer: null,
  setCustomer: (customer) => set({ customer }),
}));