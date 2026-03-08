import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "../../utils/api";
import { COLORS, PORTS } from "../../utils/constants";
import TripCard from "../../components/TripCard";

type PickerField = "from" | "to" | null;

export default function PassengerHome() {
  const [fromPort, setFromPort] = useState("");
  const [toPort, setToPort] = useState("");
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerField, setPickerField] = useState<PickerField>(null);
  const router = useRouter();

  const loadTrips = async (from?: string, to?: string) => {
    try {
      const params: Record<string, string> = {};
      if (from) params.from_port = from;
      if (to) params.to_port = to;
      const data = await api.searchTrips(params);
      setTrips(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTrips(fromPort, toPort);
    }, [])
  );

  const handleSearch = () => {
    setLoading(true);
    loadTrips(fromPort, toPort);
  };

  const openPicker = (field: PickerField) => {
    setPickerField(field);
    setPickerVisible(true);
  };

  const selectPort = (port: string) => {
    if (pickerField === "from") setFromPort(port);
    else setToPort(port);
    setPickerVisible(false);
  };

  const clearFilters = () => {
    setFromPort("");
    setToPort("");
    setLoading(true);
    loadTrips();
  };

  const hasFilters = fromPort || toPort;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.header}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>⚓ PortHop</Text>
            <Text style={styles.headerSub}>Find your next sea voyage</Text>
          </View>

          <View style={styles.searchBox}>
            <TouchableOpacity
              testID="from-port-picker"
              style={styles.portBtn}
              onPress={() => openPicker("from")}
              activeOpacity={0.8}
            >
              <Text style={styles.portBtnLabel}>FROM</Text>
              <Text
                style={[
                  styles.portBtnValue,
                  !fromPort && styles.portBtnPlaceholder,
                ]}
                numberOfLines={1}
              >
                {fromPort || "Any port"}
              </Text>
            </TouchableOpacity>

            <View style={styles.searchDivider} />

            <TouchableOpacity
              testID="to-port-picker"
              style={styles.portBtn}
              onPress={() => openPicker("to")}
              activeOpacity={0.8}
            >
              <Text style={styles.portBtnLabel}>TO</Text>
              <Text
                style={[
                  styles.portBtnValue,
                  !toPort && styles.portBtnPlaceholder,
                ]}
                numberOfLines={1}
              >
                {toPort || "Any port"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="search-btn"
              style={styles.searchBtn}
              onPress={handleSearch}
              activeOpacity={0.8}
            >
              <Text style={styles.searchBtnText}>Search</Text>
            </TouchableOpacity>
          </View>

          {hasFilters && (
            <TouchableOpacity
              testID="clear-filters-btn"
              style={styles.clearBtn}
              onPress={clearFilters}
            >
              <Text style={styles.clearBtnText}>✕ Clear filters</Text>
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <FlatList
          testID="trips-list"
          data={trips}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TripCard
              trip={item}
              onPress={() => router.push(`/trip/${item.id}`)}
            />
          )}
          ListHeaderComponent={
            <Text style={styles.resultsLabel}>
              {trips.length} trip{trips.length !== 1 ? "s" : ""} available
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🌊</Text>
              <Text style={styles.emptyTitle}>No trips found</Text>
              <Text style={styles.emptyDesc}>
                {hasFilters
                  ? "Try different ports or check back later"
                  : "No trips available right now"}
              </Text>
            </View>
          }
          contentContainerStyle={
            trips.length === 0 ? styles.listEmpty : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadTrips(fromPort, toPort);
              }}
              tintColor={COLORS.primary}
            />
          }
        />
      )}

      <Modal visible={pickerVisible} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {pickerField === "from" ? "From" : "To"} Port
            </Text>
            <TouchableOpacity
              style={styles.portOptionAny}
              onPress={() => selectPort("")}
            >
              <Text style={styles.portOptionAnyText}>🌐 Any port</Text>
            </TouchableOpacity>
            {PORTS.map((port) => (
              <TouchableOpacity
                key={port}
                testID={`port-option-${port}`}
                style={styles.portOption}
                onPress={() => selectPort(port)}
                activeOpacity={0.7}
              >
                <Text style={styles.portOptionText}>⚓ {port}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingBottom: 20 },
  headerContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 16,
  },
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
  searchBox: {
    marginHorizontal: 20,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    height: 68,
  },
  portBtn: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: "center",
  },
  portBtnLabel: {
    fontFamily: "Manrope_500Medium",
    fontSize: 10,
    color: COLORS.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  portBtnValue: {
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  portBtnPlaceholder: {
    color: COLORS.textTertiary,
    fontFamily: "Manrope_400Regular",
  },
  searchDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
  },
  searchBtn: {
    backgroundColor: COLORS.accent,
    height: "100%",
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtnText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
    color: COLORS.primary,
  },
  clearBtn: {
    alignSelf: "center",
    marginTop: 10,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  clearBtnText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  resultsLabel: {
    fontFamily: "Manrope_700Bold",
    fontSize: 14,
    color: COLORS.textSecondary,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 4,
  },
  listContent: { paddingBottom: 24 },
  listEmpty: { flex: 1 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
    paddingTop: 64,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 22,
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDesc: {
    fontFamily: "Manrope_400Regular",
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
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
    maxHeight: "65%",
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
    marginBottom: 12,
    textAlign: "center",
  },
  portOptionAny: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  portOptionAnyText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 15,
    color: COLORS.textSecondary,
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
