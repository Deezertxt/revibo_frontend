import { create } from "zustand";

interface DeviceStore {
  expoPushToken: string | null;
  deviceId: string | null;
  setExpoPushToken: (token: string) => void;
  setDeviceId: (id: string) => void;
  reset: () => void;
}

export const useDeviceStore = create<DeviceStore>((set) => ({
  expoPushToken: null,
  deviceId: null,

  setExpoPushToken: (token: string) => {
    set({ expoPushToken: token });
  },

  setDeviceId: (id: string) => {
    set({ deviceId: id });
  },

  reset: () => {
    set({
      expoPushToken: null,
      deviceId: null,
    });
  },
}));
