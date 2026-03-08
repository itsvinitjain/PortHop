import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";
import Avatar from "../../components/Avatar";
import { COLORS } from "../../utils/constants";

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "#FFF7ED", text: COLORS.accent, label: "Request Sent" },
  confirmed: { bg: "#F0FDF4", text: "#10B981", label: "Confirmed ✓" },
  declined: { bg: "#FFF5F5", text: "#EF4444", label: "Declined" },
};

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [trip, setTrip] = useState<any>(null);
  const [interests, setInterests] = useState<any[]>([]);
  const [myInterest, setMyInterest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isMyCaptainTrip = trip && user && trip.captain_id === user.id;
  const isPassenger = user?.role === "passenger";

  const loadAll = async () => {
    try {
      const tripData = await api.getTrip(id);
      setTrip(tripData);
      if (user?.role === "captain" && tripData.captain_id === user.id) {
        const interestData = await api.getTripInterests(id);
        setInterests(interestData);
      }
      if (user?.role === "passenger") {
        const myInt = await api.getMyInterest(id);
        setMyInterest(myInt);
      }
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to load trip");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [id, user])
  );

  const handleExpressInterest = async () => {
    setActionLoading("interest");
    try {
      const interest = await api.expressInterest(id);
      setMyInterest(interest);
      Alert.alert("Interest Sent! 🌊", "The captain will review your request");
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleInterestAction = async (
    interestId: string,
    status: "confirmed" | "declined"
  ) => {
    setActionLoading(interestId + status);
    try {
      const updated = await api.updateInterest(id, interestId, status);
      setInterests((prev) =>
        prev.map((i) => (i.id === interestId ? { ...i, status: updated.status } : i))
      );
      if (status === "confirmed") {
        setTrip((prev: any) =>
          prev ? { ...prev, available_seats: prev.available_seats - 1 } : prev
        );
      }
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setActionLoading(null);
    }
  };

  const goToChat = (otherUserId: string) => {
    router.push(`/chat/${id}_${otherUserId}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (!trip) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.header}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              testID="back-btn"
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: trip.status === "active" ? "#F0FDF4" : "#FFF5F5" },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: trip.status === "active" ? "#10B981" : "#EF4444" },
                ]}
              >
                {trip.status === "active" ? "Active" : trip.status}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Captain Info */}
        {trip.captain && (
          <View style={styles.captainCard}>
            <Avatar photo={trip.captain.photo} name={trip.captain.name} size={56} />
            <View style={styles.captainInfo}>
              <Text style={styles.captainName}>
                {isMyCaptainTrip ? "Your Trip" : trip.captain.name}
              </Text>
              <View style={styles.ratingRow}>
                <Text style={styles.star}>★</Text>
                <Text style={styles.ratingText}>
                  {trip.captain.rating?.toFixed(1) || "5.0"} · Captain
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Route Card */}
        <View style={styles.routeCard}>
          <View style={styles.routeSection}>
            <Text style={styles.portLabel}>FROM</Text>
            <Text style={styles.portName}>{trip.from_port}</Text>
          </View>
          <View style={styles.routeArrow}>
            <Text style={styles.arrowText}>⟶</Text>
          </View>
          <View style={[styles.routeSection, { alignItems: "flex-end" }]}>
            <Text style={styles.portLabel}>TO</Text>
            <Text style={styles.portName}>{trip.to_port}</Text>
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>📅 Date</Text>
              <Text style={styles.detailValue}>{trip.date}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>🕐 Time</Text>
              <Text style={styles.detailValue}>{trip.time}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>💺 Seats Available</Text>
              <Text style={styles.detailValue}>{trip.available_seats} / {trip.seats}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>💰 Price</Text>
              <Text style={[styles.detailValue, { color: COLORS.accent }]}>
                ₹{trip.price}
              </Text>
            </View>
          </View>
        </View>

        {/* Passenger Actions */}
        {isPassenger && (
          <View style={styles.actionsSection}>
            {!myInterest ? (
              <TouchableOpacity
                testID="express-interest-btn"
                style={[styles.primaryBtn, actionLoading === "interest" && styles.btnDisabled]}
                onPress={handleExpressInterest}
                activeOpacity={0.8}
                disabled={!!actionLoading}
              >
                {actionLoading === "interest" ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : (
                  <Text style={styles.primaryBtnText}>I'm Interested 🌊</Text>
                )}
              </TouchableOpacity>
            ) : (
              <>
                <View
                  style={[
                    styles.interestStatus,
                    { backgroundColor: STATUS_COLORS[myInterest.status]?.bg || COLORS.subtle },
                  ]}
                >
                  <Text
                    style={[
                      styles.interestStatusText,
                      { color: STATUS_COLORS[myInterest.status]?.text || COLORS.textSecondary },
                    ]}
                  >
                    {STATUS_COLORS[myInterest.status]?.label || myInterest.status}
                  </Text>
                </View>
                <TouchableOpacity
                  testID="chat-captain-btn"
                  style={styles.chatBtn}
                  onPress={() => goToChat(trip.captain_id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.chatBtnText}>💬 Chat with Captain</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Captain: Interests List */}
        {isMyCaptainTrip && (
          <View style={styles.interestsSection}>
            <Text style={styles.sectionTitle}>
              Interested Passengers ({interests.length})
            </Text>
            {interests.length === 0 ? (
              <View style={styles.noInterests}>
                <Text style={styles.noInterestsText}>
                  No one has expressed interest yet
                </Text>
              </View>
            ) : (
              interests.map((interest) => (
                <View key={interest.id} style={styles.interestCard} testID={`interest-card-${interest.id}`}>
                  <Avatar
                    photo={interest.passenger?.photo}
                    name={interest.passenger?.name}
                    size={44}
                  />
                  <View style={styles.interestInfo}>
                    <Text style={styles.passengerName}>
                      {interest.passenger?.name || "Passenger"}
                    </Text>
                    <View style={styles.interestMeta}>
                      <Text style={styles.star}>★</Text>
                      <Text style={styles.ratingSmall}>
                        {interest.passenger?.rating?.toFixed(1) || "5.0"}
                      </Text>
                      <View
                        style={[
                          styles.statusPill,
                          { backgroundColor: STATUS_COLORS[interest.status]?.bg || COLORS.subtle },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            { color: STATUS_COLORS[interest.status]?.text || COLORS.textSecondary },
                          ]}
                        >
                          {interest.status}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.interestActions}>
                    <TouchableOpacity
                      testID={`chat-passenger-${interest.passenger?.id}`}
                      style={styles.iconBtn}
                      onPress={() => goToChat(interest.passenger_id)}
                    >
                      <Text style={styles.iconBtnText}>💬</Text>
                    </TouchableOpacity>

                    {interest.status === "pending" && (
                      <>
                        <TouchableOpacity
                          testID={`confirm-btn-${interest.id}`}
                          style={[styles.actionSmallBtn, styles.confirmBtn]}
                          onPress={() => handleInterestAction(interest.id, "confirmed")}
                          disabled={!!actionLoading}
                        >
                          {actionLoading === interest.id + "confirmed" ? (
                            <ActivityIndicator color={COLORS.white} size="small" />
                          ) : (
                            <Text style={styles.confirmBtnText}>✓</Text>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          testID={`decline-btn-${interest.id}`}
                          style={[styles.actionSmallBtn, styles.declineBtn]}
                          onPress={() => handleInterestAction(interest.id, "declined")}
                          disabled={!!actionLoading}
                        >
                          {actionLoading === interest.id + "declined" ? (
                            <ActivityIndicator color={COLORS.white} size="small" />
                          ) : (
                            <Text style={styles.declineBtnText}>✕</Text>
                          )}
                        </TouchableOpacity>
                      </>
                    )}
                    {interest.status === "confirmed" && (
                      <TouchableOpacity
                        testID={`decline-confirmed-btn-${interest.id}`}
                        style={[styles.actionSmallBtn, styles.declineBtn]}
                        onPress={() => handleInterestAction(interest.id, "declined")}
                        disabled={!!actionLoading}
                      >
                        <Text style={styles.declineBtnText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  header: { paddingBottom: 16 },
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backBtn: { paddingVertical: 8 },
  backText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 15,
    color: COLORS.white,
  },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 12,
  },
  scroll: { padding: 20, paddingBottom: 40 },
  captainCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  captainInfo: { flex: 1 },
  captainName: {
    fontFamily: "Manrope_700Bold",
    fontSize: 17,
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  star: { color: COLORS.accent, fontSize: 13 },
  ratingText: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  routeCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  routeSection: { flex: 1 },
  portLabel: {
    fontFamily: "Manrope_500Medium",
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  portName: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 18,
    color: COLORS.white,
  },
  routeArrow: { paddingHorizontal: 12 },
  arrowText: { fontSize: 22, color: COLORS.accent },
  detailsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailRow: { flexDirection: "row", gap: 16 },
  detailItem: { flex: 1 },
  detailLabel: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    color: COLORS.textTertiary,
    marginBottom: 4,
  },
  detailValue: {
    fontFamily: "Manrope_700Bold",
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },
  actionsSection: { marginBottom: 14 },
  primaryBtn: {
    height: 56,
    backgroundColor: COLORS.accent,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 16,
    color: COLORS.primary,
  },
  interestStatus: {
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  interestStatusText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
  },
  chatBtn: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  chatBtnText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
    color: COLORS.white,
  },
  interestsSection: { marginTop: 8 },
  sectionTitle: {
    fontFamily: "Manrope_700Bold",
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  noInterests: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  noInterestsText: {
    fontFamily: "Manrope_400Regular",
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  interestCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  interestInfo: { flex: 1 },
  passengerName: {
    fontFamily: "Manrope_700Bold",
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  interestMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingSmall: {
    fontFamily: "Manrope_400Regular",
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statusPill: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusPillText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
  },
  interestActions: { flexDirection: "row", gap: 6, alignItems: "center" },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnText: { fontSize: 16 },
  actionSmallBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtn: { backgroundColor: "#10B981" },
  confirmBtnText: {
    fontSize: 16,
    color: COLORS.white,
    fontFamily: "Manrope_700Bold",
  },
  declineBtn: { backgroundColor: "#EF4444" },
  declineBtnText: {
    fontSize: 14,
    color: COLORS.white,
    fontFamily: "Manrope_700Bold",
  },
});
