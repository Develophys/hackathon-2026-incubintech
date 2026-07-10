import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ConsentState {
  hasConsented: boolean;
  consentedAt: string | null;
  grant: () => void;
  revoke: () => void;
}

export const useConsentStore = create<ConsentState>()(
  persist(
    (set) => ({
      hasConsented: false,
      consentedAt: null,
      grant: () => set({ hasConsented: true, consentedAt: new Date().toISOString() }),
      revoke: () => set({ hasConsented: false, consentedAt: null }),
    }),
    { name: "zelo.consent" },
  ),
);
