import React, { useState } from "react";
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
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../utils/api";
import { COLORS } from "../../utils/constants";

export default function PhoneScreen() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendOTP = async () => {
    const trimmed = phone.trim();
    if (!trimmed || trimmed.length < 6) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }
    setLoading(true);
    try {
      await api.sendOTP(trimmed);
      router.push({ pathname: "/(auth)/otp", params: { phone: trimmed } });
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.header}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <Text style={styles.logo}>⚓ PortHop</Text>
            <Text style={styles.tagline}>Hop across the sea, together.</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.body}
      >
        <View style={styles.form}>
          <Text style={styles.title}>Welcome aboard</Text>
          <Text style={styles.subtitle}>
            Enter your mobile number to get started
          </Text>

          <View style={styles.inputWrapper}>
            <View style={styles.countryCode}>
              <Text style={styles.countryText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              testID="phone-input"
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter mobile number"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="phone-pad"
              maxLength={10}
              autoFocus
            />
          </View>

          <TouchableOpacity
            testID="send-otp-btn"
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSendOTP}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.btnText}>Get OTP</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.demo}>Demo: Any number works • OTP is 123456</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingBottom: 40 },
  headerContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  logo: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 32,
    color: COLORS.white,
    marginTop: 8,
  },
  tagline: {
    fontFamily: "Manrope_400Regular",
    fontSize: 16,
    color: "rgba(255,255,255,0.75)",
    marginTop: 6,
  },
  body: { flex: 1 },
  form: {
    flex: 1,
    padding: 24,
    paddingTop: 36,
  },
  title: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 26,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Manrope_400Regular",
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 32,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.subtle,
    borderRadius: 16,
    marginBottom: 20,
    height: 56,
    overflow: "hidden",
  },
  countryCode: {
    paddingHorizontal: 14,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    height: "100%",
    justifyContent: "center",
  },
  countryText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  input: {
    flex: 1,
    height: 56,
    paddingHorizontal: 14,
    fontFamily: "Manrope_500Medium",
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  btn: {
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
  demo: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    color: COLORS.textTertiary,
    textAlign: "center",
    marginTop: 20,
  },
});
