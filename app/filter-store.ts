import dayjs from "dayjs";
import { create } from "zustand";

interface FilterState {
  activeDate: string
  setActiveDate: (activeDate: string) => void
  floor: string
  setFloor: (floor: string) => void
  floorMas: Array<string>
  setFloorMas: (floorMas: Array<string>) => void
}

export const useFilterStore = create<FilterState>()((set) => ({
  activeDate: dayjs().format('YYYY-MM-DD'),
  setActiveDate: (activeDate: string) => set({ activeDate }),
  floor: "0",
  setFloor: (floor: string) => set({ floor }),
  floorMas: ["0"],
  setFloorMas: (floorMas: Array<string>) => set({ floorMas }),
}));