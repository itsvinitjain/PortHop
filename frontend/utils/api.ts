import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "";
const TOKEN_KEY = "porthop_token";

// Cross-platform token storage: localStorage on web, AsyncStorage on native
export const getToken = async (): Promise<string | null> => {
  if (Platform.OS === "web") {
    try {
      return (typeof window !== "undefined" && window.localStorage)
        ? window.localStorage.getItem(TOKEN_KEY)
        : null;
    } catch {
      return null;
    }
  }
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = async (token: string): Promise<void> => {
  if (Platform.OS === "web") {
    try {
      if (typeof window !== "undefined" && window.localStorage)
        window.localStorage.setItem(TOKEN_KEY, token);
    } catch {}
    return;
  }
  try { await AsyncStorage.setItem(TOKEN_KEY, token); } catch {}
};

export const removeToken = async (): Promise<void> => {
  if (Platform.OS === "web") {
    try {
      if (typeof window !== "undefined" && window.localStorage)
        window.localStorage.removeItem(TOKEN_KEY);
    } catch {}
    return;
  }
  try { await AsyncStorage.removeItem(TOKEN_KEY); } catch {}
};

const request = async (path: string, options: RequestInit = {}) => {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}/api${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
};

export const api = {
  sendOTP: (phone: string) =>
    request("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),
  verifyOTP: (phone: string, otp: string) =>
    request("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone, otp }),
    }),
  getMe: () => request("/auth/me"),
  updateProfile: (data: Record<string, unknown>) =>
    request("/auth/profile", { method: "PUT", body: JSON.stringify(data) }),
  updatePushToken: (token: string) =>
    request("/auth/push-token", {
      method: "PUT",
      body: JSON.stringify({ token }),
    }),

  getPorts: () => request("/ports"),

  searchTrips: (params: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request(`/trips${query ? "?" + query : ""}`);
  },
  createTrip: (data: Record<string, unknown>) =>
    request("/trips", { method: "POST", body: JSON.stringify(data) }),
  getMyTrips: () => request("/trips/captain/my"),
  getTrip: (id: string) => request(`/trips/${id}`),
  getTripInterests: (id: string) => request(`/trips/${id}/interests`),
  getMyInterest: (tripId: string) => request(`/trips/${tripId}/my-interest`),
  expressInterest: (tripId: string) =>
    request(`/trips/${tripId}/interest`, { method: "POST" }),
  updateInterest: (tripId: string, interestId: string, status: string) =>
    request(`/trips/${tripId}/interest/${interestId}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  getMessages: (tripId: string, otherUserId: string) =>
    request(`/chat/${tripId}/${otherUserId}`),
  sendMessage: (tripId: string, otherUserId: string, text: string) =>
    request(`/chat/${tripId}/${otherUserId}`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  getNotifications: () => request("/notifications"),
  markAllRead: () => request("/notifications/read-all", { method: "PUT" }),
};
