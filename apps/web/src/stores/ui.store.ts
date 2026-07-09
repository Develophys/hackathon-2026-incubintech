import { create } from "zustand";

interface UiState {
  isHealthBannerDismissed: boolean;
  dismissHealthBanner: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isHealthBannerDismissed: false,
  dismissHealthBanner: () => set({ isHealthBannerDismissed: true }),
}));
