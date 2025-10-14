import { SysHotelGuests } from "@/services/external/models/customer";
import { create } from "zustand";

interface ModalOtherGuestState {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  lastOtherGuest: SysHotelGuests | null;
  setLastOtherGuest: (guest: SysHotelGuests) => void;
}

export const useModalOtherGuestStore = create<ModalOtherGuestState>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  lastOtherGuest: null,
  setLastOtherGuest: (guest: SysHotelGuests) => set({ lastOtherGuest: guest }),
}));