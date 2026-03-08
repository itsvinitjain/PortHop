import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";
import { COLORS } from "../../utils/constants";

export default function RoleScreen() {
  const [selected, setSelected] = useState<"captain" | "passenger" | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { updateUser } = useAuth();

  const handleContinue = async () => {
    if (!selected) {
      Alert.alert("Select a role", "Please choose Captain or Passenger");
      return;
    }
    setLoading(true);
    try {
      await api.updateProfile({ role: selected });
      updateUser({ role: selected });
      router.replace("/(auth)/setup");
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.header}
      >
        <Text style={styles.logo}>⚓ PortHop</Text>
        <Text style={styles.subtitle}>Who are you on this voyage?</Text>
      </LinearGradient>

      <View style={styles.body}>
        <Text style={styles.title}>I am a...</Text>

        <TouchableOpacity
          testID="role-captain-btn"
          style={[
            styles.roleCard,
            selected === "captain" && styles.roleCardSelected,
          ]}
          onPress={() => setSelected("captain")}
          activeOpacity={0.8}
        >
          <Text style={styles.roleEmoji}>⚓</Text>
          <View style={styles.roleInfo}>
            <Text
              style={[
                styles.roleName,
                selected === "captain" && styles.roleNameSelected,
              ]}
            >
              Captain
            </Text>
            <Text style={styles.roleDesc}>
              I operate a boat and offer sea trips
            </Text>
          </View>
          <View
            style={[
              styles.radio,
              selected === "captain" && styles.radioSelected,
            ]}
          >
            {selected === "captain" && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          testID="role-passenger-btn"
          style={[
            styles.roleCard,
            selected === "passenger" && styles.roleCardSelected,
          ]}
          onPress={() => setSelected("passenger")}
          activeOpacity={0.8}
        >
          <Text style={styles.roleEmoji}>🌊</Text>
          <View style={styles.roleInfo}>
            <Text
              style={[
                styles.roleName,
                selected === "passenger" && styles.roleNameSelected,
              ]}
            >
              Passenger
            </Text>
            <Text style={styles.roleDesc}>
              I want to find and join sea trips
            </Text>
          </View>
          <View
            style={[
              styles.radio,
              selected === "passenger" && styles.radioSelected,
            ]}
          >
            {selected === "passenger" && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          testID="role-continue-btn"
          style={[styles.btn, (!selected || loading) && styles.btnDisabled]}
          onPress={handleContinue}
          activeOpacity={0.8}
          disabled={!selected || loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.btnText}>Continue →</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  logo: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 28,
    color: COLORS.white,
  },
  subtitle: {
    fontFamily: "Manrope_400Regular",
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
    marginTop: 6,
  },
  body: {
    flex: 1,
    padding: 24,
    paddingTop: 32,
  },
  title: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 26,
    color: COLORS.textPrimary,
    marginBottom: 24,
  },
  roleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  roleCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#F0F4FF",
  },
  roleEmoji: { fontSize: 40, marginRight: 16 },
  roleInfo: { flex: 1 },
  roleName: {
    fontFamily: "Manrope_700Bold",
    fontSize: 18,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  roleNameSelected: { color: COLORS.primary },
  roleDesc: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { borderColor: COLORS.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  btn: {
    height: 56,
    backgroundColor: COLORS.accent,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 16,
    color: COLORS.primary,
  },
});
