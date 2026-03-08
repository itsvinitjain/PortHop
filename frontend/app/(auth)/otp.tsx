import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";
import { COLORS } from "../../utils/constants";

export default function OTPScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert("Error", "Please enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await api.verifyOTP(phone, otp);
      await login(res.token, res.user);
      if (!res.user.role) {
        router.replace("/(auth)/role");
      } else if (!res.user.name) {
        router.replace("/(auth)/setup");
      } else if (res.user.role === "captain") {
        router.replace("/(captain)");
      } else {
        router.replace("/(passenger)");
      }
    } catch (e: unknown) {
      Alert.alert("Invalid OTP", e instanceof Error ? e.message : "Try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <TouchableOpacity
        testID="back-btn"
        style={styles.backBtn}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.body}
      >
        <View style={styles.form}>
          <Text style={styles.emoji}>📱</Text>
          <Text style={styles.title}>Verify your number</Text>
          <Text style={styles.subtitle}>
            We sent a code to{" "}
            <Text style={styles.phone}>+91 {phone}</Text>
          </Text>

          <TextInput
            testID="otp-input"
            style={styles.otpInput}
            value={otp}
            onChangeText={setOtp}
            placeholder="Enter 6-digit OTP"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            textAlign="center"
          />

          <View style={styles.hint}>
            <Text style={styles.hintText}>🔑 Demo OTP: </Text>
            <Text style={styles.hintCode}>123456</Text>
          </View>

          <TouchableOpacity
            testID="verify-otp-btn"
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleVerify}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.btnText}>Verify & Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  backBtn: { padding: 20, paddingBottom: 0 },
  backText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 15,
    color: COLORS.primary,
  },
  body: { flex: 1 },
  form: {
    flex: 1,
    padding: 24,
    paddingTop: 24,
    alignItems: "center",
  },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 26,
    color: COLORS.textPrimary,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Manrope_400Regular",
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 36,
  },
  phone: {
    fontFamily: "Manrope_700Bold",
    color: COLORS.primary,
  },
  otpInput: {
    width: "100%",
    height: 64,
    backgroundColor: COLORS.subtle,
    borderRadius: 16,
    fontFamily: "Manrope_700Bold",
    fontSize: 28,
    color: COLORS.textPrimary,
    letterSpacing: 8,
    textAlign: "center",
    marginBottom: 16,
  },
  hint: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 32,
  },
  hintText: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  hintCode: {
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
    color: COLORS.accent,
  },
  btn: {
    width: "100%",
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 16,
    color: COLORS.white,
  },
});
