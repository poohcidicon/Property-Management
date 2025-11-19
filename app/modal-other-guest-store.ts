import { SysHotelBookGuests, SysHotelGuests } from "@/services/external/models/customer";
import { create } from "zustand";

interface ModalOtherGuestState {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  lastOtherGuest: SysHotelGuests | null;
  bookOtherGuests: SysHotelBookGuests[]
  setLastOtherGuest: (guest: SysHotelGuests) => void;
  setBookOtherGuests: (guest: SysHotelBookGuests[]) => void
  lastRoomId: string | null
  setLastRoomId: (roomId: string) => void
}

export const useModalOtherGuestStore = create<ModalOtherGuestState>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  lastOtherGuest: null,
  bookOtherGuests: [],
  setLastOtherGuest: (guest: SysHotelGuests) => set({ lastOtherGuest: guest }),
  setBookOtherGuests: (guest: SysHotelBookGuests[]) => set({ bookOtherGuests: guest }),
  lastRoomId: null,
  setLastRoomId: (roomId: string) => set({ lastRoomId: roomId }),
}));