import { create } from "zustand";

interface UiState {
  isHealthBannerDismissed: boolean;
  dismissHealthBanner: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isHealthBannerDismissed: false,
  dismissHealthBanner: () => set({ isHealthBannerDismissed: true }),
}));
// ci-verify 2026-07-12T03:09:11Z
