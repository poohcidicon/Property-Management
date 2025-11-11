import { create } from "zustand";

type User = {
  id: string;
  username: string;
  user_id: string;
  view_only: boolean;
}

type UserState = {
  user: User | null;
  setUser: (user: User | null) => void;
};

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));