import { create } from "zustand";

interface projectState {
  projectId: string | null | undefined;
  setProjectId: (projectId: string | null | undefined) => void;
}

export const useProjectStore = create<projectState>()((set) => ({
  projectId: null,
  setProjectId: (projectId: string | null | undefined) => set({ projectId }),
}));