import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "../../utils/api";
import { COLORS, PORTS } from "../../utils/constants";

type PickerField = "from" | "to" | null;

export default function PostTripScreen() {
  const [fromPort, setFromPort] = useState("");
  const [toPort, setToPort] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState("4");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerField, setPickerField] = useState<PickerField>(null);
  const router = useRouter();

  const openPicker = (field: PickerField) => {
    setPickerField(field);
    setPickerVisible(true);
  };

  const selectPort = (port: string) => {
    if (pickerField === "from") setFromPort(port);
    else setToPort(port);
    setPickerVisible(false);
  };

  const handlePost = async () => {
    if (!fromPort || !toPort || !date || !time || !price) {
      Alert.alert("Missing fields", "Please fill all fields");
      return;
    }
    if (fromPort === toPort) {
      Alert.alert("Invalid route", "From and To ports cannot be the same");
      return;
    }
    const seatsNum = parseInt(seats) || 0;
    const priceNum = parseFloat(price) || 0;
    if (seatsNum < 1 || seatsNum > 20) {
      Alert.alert("Invalid seats", "Seats must be between 1 and 20");
      return;
    }
    if (priceNum <= 0) {
      Alert.alert("Invalid price", "Price must be greater than 0");
      return;
    }
    setLoading(true);
    try {
      await api.createTrip({
        from_port: fromPort,
        to_port: toPort,
        date,
        time,
        seats: seatsNum,
        price: priceNum,
      });
      Alert.alert("Trip Posted! 🎉", "Your trip is now live", [
        { text: "OK", onPress: () => router.replace("/(captain)") },
      ]);
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to post trip");
    } finally {
      setLoading(false);
    }
  };

  const adjustSeats = (delta: number) => {
    const cur = parseInt(seats) || 1;
    const next = Math.max(1, Math.min(20, cur + delta));
    setSeats(String(next));
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.header}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>New Trip</Text>
            <Text style={styles.headerSub}>List your sea voyage</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>Route</Text>
          <View style={styles.routeRow}>
            <TouchableOpacity
              testID="from-port-picker"
              style={styles.portPicker}
              onPress={() => openPicker("from")}
              activeOpacity={0.8}
            >
              <Text style={styles.portPickerLabel}>FROM</Text>
              <Text
                style={[
                  styles.portPickerValue,
                  !fromPort && styles.placeholderText,
                ]}
              >
                {fromPort || "Select port"}
              </Text>
            </TouchableOpacity>
            <Text style={styles.arrow}>⟶</Text>
            <TouchableOpacity
              testID="to-port-picker"
              style={styles.portPicker}
              onPress={() => openPicker("to")}
              activeOpacity={0.8}
            >
              <Text style={styles.portPickerLabel}>TO</Text>
              <Text
                style={[
                  styles.portPickerValue,
                  !toPort && styles.placeholderText,
                ]}
              >
                {toPort || "Select port"}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>When</Text>
          <View style={styles.row}>
            <View style={[styles.inputBox, { flex: 1.2 }]}>
              <Text style={styles.inputLabel}>DATE</Text>
              <TextInput
                testID="date-input"
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="DD/MM/YYYY"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={[styles.inputBox, { flex: 1 }]}>
              <Text style={styles.inputLabel}>TIME</Text>
              <TextInput
                testID="time-input"
                style={styles.input}
                value={time}
                onChangeText={setTime}
                placeholder="HH:MM"
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>
          </View>

          <Text style={styles.sectionLabel}>Details</Text>
          <View style={styles.row}>
            <View style={[styles.inputBox, { flex: 1 }]}>
              <Text style={styles.inputLabel}>SEATS</Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  testID="seats-decrement"
                  style={styles.stepBtn}
                  onPress={() => adjustSeats(-1)}
                >
                  <Text style={styles.stepBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepValue}>{seats}</Text>
                <TouchableOpacity
                  testID="seats-increment"
                  style={styles.stepBtn}
                  onPress={() => adjustSeats(1)}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={[styles.inputBox, { flex: 1.2 }]}>
              <Text style={styles.inputLabel}>PRICE (₹)</Text>
              <TextInput
                testID="price-input"
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="0"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity
            testID="post-trip-btn"
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handlePost}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Text style={styles.btnText}>Post Trip 🚢</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={pickerVisible} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              Select {pickerField === "from" ? "Departure" : "Destination"} Port
            </Text>
            <FlatList
              data={PORTS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  testID={`port-option-${item}`}
                  style={styles.portOption}
                  onPress={() => selectPort(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.portOptionText}>⚓ {item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingBottom: 24 },
  headerContent: { paddingHorizontal: 24, paddingTop: 16 },
  headerTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 26,
    color: COLORS.white,
  },
  headerSub: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },
  form: { padding: 20, paddingBottom: 40 },
  sectionLabel: {
    fontFamily: "Manrope_700Bold",
    fontSize: 12,
    color: COLORS.textTertiary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 16,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  portPicker: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 64,
    justifyContent: "center",
  },
  portPickerLabel: {
    fontFamily: "Manrope_500Medium",
    fontSize: 10,
    color: COLORS.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  portPickerValue: {
    fontFamily: "Manrope_700Bold",
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  placeholderText: { color: COLORS.textTertiary, fontFamily: "Manrope_400Regular" },
  arrow: { fontSize: 18, color: COLORS.accent },
  row: { flexDirection: "row", gap: 12, marginBottom: 4 },
  inputBox: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputLabel: {
    fontFamily: "Manrope_500Medium",
    fontSize: 10,
    color: COLORS.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
    color: COLORS.textPrimary,
    height: 28,
    padding: 0,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: {
    fontSize: 18,
    color: COLORS.primary,
    fontFamily: "Manrope_700Bold",
  },
  stepValue: {
    fontFamily: "Manrope_700Bold",
    fontSize: 18,
    color: COLORS.textPrimary,
    minWidth: 24,
    textAlign: "center",
  },
  btn: {
    height: 56,
    backgroundColor: COLORS.accent,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 16,
    color: COLORS.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "60%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 18,
    color: COLORS.textPrimary,
    marginBottom: 16,
    textAlign: "center",
  },
  portOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  portOptionText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 16,
    color: COLORS.textPrimary,
  },
});
