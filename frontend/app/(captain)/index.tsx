import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";
import TripCard from "../../components/TripCard";
import { COLORS } from "../../utils/constants";

export default function CaptainHome() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const loadTrips = async () => {
    try {
      const data = await api.getMyTrips();
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
      loadTrips();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTrips();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.header}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.name}>{user?.name || "Captain"} ⚓</Text>
            </View>
          </View>
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
              isCaptainView
              onPress={() => router.push(`/trip/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🚢</Text>
              <Text style={styles.emptyTitle}>No trips yet</Text>
              <Text style={styles.emptyDesc}>
                Post your first trip to start accepting passengers
              </Text>
              <TouchableOpacity
                testID="post-first-trip-btn"
                style={styles.emptyBtn}
                onPress={() => router.push("/(captain)/post")}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyBtnText}>Post a Trip</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={
            trips.length === 0 ? styles.listEmpty : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingBottom: 24 },
  headerContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  greeting: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  name: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 22,
    color: COLORS.white,
    marginTop: 2,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingTop: 16, paddingBottom: 24 },
  listEmpty: { flex: 1 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
    paddingTop: 80,
  },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
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
    marginBottom: 32,
  },
  emptyBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 28,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  emptyBtnText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
    color: COLORS.primary,
  },
});
