import { create } from 'zustand';

interface UIState {
  isModalOpen: boolean;
  modalType: 'video' | 'confirmDelete' | 'settings' | null;
  isVideoRecording: boolean;

  // Actions
  openModal: (type: UIState['modalType']) => void;
  closeModal: () => void;
  setVideoRecording: (recording: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isModalOpen: false,
  modalType: null,
  isVideoRecording: false,

  openModal: (modalType) => set({ isModalOpen: true, modalType }),
  closeModal: () => set({ isModalOpen: false, modalType: null }),
  setVideoRecording: (isVideoRecording) => set({ isVideoRecording }),
}));
