import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface FollowUpState {
  answer: "yes" | "no" | null;
  answeredAt: string | null;
  recordAnswer: (answer: "yes" | "no") => void;
}

export const useFollowUpStore = create<FollowUpState>()(
  persist(
    (set) => ({
      answer: null,
      answeredAt: null,
      recordAnswer: (answer) => set({ answer, answeredAt: new Date().toISOString() }),
    }),
    { name: "zelo.followup", storage: createJSONStorage(() => localStorage) },
  ),
);
