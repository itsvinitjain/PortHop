import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import { PlayfairDisplay_700Bold } from "@expo-google-fonts/playfair-display";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

SplashScreen.preventAutoHideAsync();

// This component lives inside AuthProvider so it can access auth state.
// It acts as a persistent auth guard — whenever user becomes null and we
// are not already in the auth group, it redirects to the login screen.
function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      // User logged out or no session — go to login
      // Use setTimeout to ensure navigation happens after current render cycle
      setTimeout(() => {
        router.replace("/(auth)/phone");
      }, 0);
    }
  }, [user, loading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(captain)" />
      <Stack.Screen name="(passenger)" />
      <Stack.Screen name="trip/[id]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="chat/[chatId]" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_700Bold,
    PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootLayoutNav />
    </AuthProvider>
  );
}
