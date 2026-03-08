import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS } from "../utils/constants";
import Avatar from "./Avatar";

interface TripCardProps {
  trip: {
    id: string;
    from_port: string;
    to_port: string;
    date: string;
    time: string;
    price: number;
    available_seats: number;
    seats: number;
    captain?: {
      name?: string;
      photo?: string;
      rating?: number;
    };
    interests_count?: number;
    pending_count?: number;
    confirmed_count?: number;
    status?: string;
  };
  onPress: () => void;
  isCaptainView?: boolean;
}

export default function TripCard({ trip, onPress, isCaptainView }: TripCardProps) {
  const captain = trip.captain;

  return (
    <TouchableOpacity
      testID={`trip-card-${trip.id}`}
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.accentBar} />
      <View style={styles.content}>
        {!isCaptainView && captain && (
          <View style={styles.captainRow}>
            <Avatar photo={captain.photo} name={captain.name} size={40} />
            <View style={styles.captainInfo}>
              <Text style={styles.captainName}>{captain.name || "Captain"}</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.star}>★</Text>
                <Text style={styles.ratingText}>
                  {captain.rating?.toFixed(1) || "5.0"}
                </Text>
              </View>
            </View>
            <Text style={styles.price}>₹{trip.price}</Text>
          </View>
        )}

        <View style={styles.routeRow}>
          <View style={styles.portBox}>
            <Text style={styles.portLabel}>FROM</Text>
            <Text style={styles.portName}>{trip.from_port}</Text>
          </View>
          <View style={styles.arrowBox}>
            <Text style={styles.arrow}>⟶</Text>
          </View>
          <View style={[styles.portBox, { alignItems: "flex-end" }]}>
            <Text style={styles.portLabel}>TO</Text>
            <Text style={styles.portName}>{trip.to_port}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{trip.date}</Text>
          <View style={styles.dot} />
          <Text style={styles.metaText}>{trip.time}</Text>
          <View style={{ flex: 1 }} />
          {isCaptainView ? (
            <View style={styles.interestBadge}>
              <Text style={styles.interestText}>
                {String(trip.pending_count || 0)} pending
              </Text>
            </View>
          ) : (
            <View style={styles.seatBadge}>
              <Text style={styles.seatText}>{String(trip.available_seats)} seats</Text>
            </View>
          )}
          {!!isCaptainView && (
            <Text style={styles.captainPrice}>{"₹" + trip.price}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    marginHorizontal: 20,
    marginVertical: 8,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    overflow: "hidden",
  },
  accentBar: {
    width: 4,
    backgroundColor: COLORS.accent,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  captainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  captainInfo: {
    flex: 1,
  },
  captainName: {
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 1,
  },
  star: {
    color: COLORS.accent,
    fontSize: 12,
  },
  ratingText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  price: {
    fontFamily: "Manrope_700Bold",
    fontSize: 18,
    color: COLORS.primary,
  },
  captainPrice: {
    fontFamily: "Manrope_700Bold",
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 8,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  portBox: {
    flex: 1,
  },
  portLabel: {
    fontFamily: "Manrope_500Medium",
    fontSize: 10,
    color: COLORS.textTertiary,
    letterSpacing: 0.8,
  },
  portName: {
    fontFamily: "Manrope_700Bold",
    fontSize: 14,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  arrowBox: {
    paddingHorizontal: 4,
  },
  arrow: {
    fontSize: 18,
    color: COLORS.accent,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.textTertiary,
  },
  seatBadge: {
    backgroundColor: COLORS.subtle,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  seatText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    color: COLORS.primary,
  },
  interestBadge: {
    backgroundColor: "#FFF7ED",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  interestText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    color: COLORS.accent,
  },
});
