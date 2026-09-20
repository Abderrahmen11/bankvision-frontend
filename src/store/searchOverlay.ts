import { create } from 'zustand'

interface SearchOverlayState {
  isOpen: boolean
  open: () => void
  close: () => void
}

/**
 * Owns the full-screen search overlay's open state so any surface can open
 * it: the navbar search button, the global Ctrl+K controller (including on
 * public pages where the navbar does not exist), etc.
 */
export const useSearchOverlayStore = create<SearchOverlayState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))

export const closeSearchOverlay = () => useSearchOverlayStore.getState().close()
