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
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "../../utils/api";
import { COLORS } from "../../utils/constants";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const TYPE_META: Record<string, { emoji: string; color: string }> = {
  new_interest: { emoji: "🌊", color: "#EFF6FF" },
  confirmed: { emoji: "🎉", color: "#F0FDF4" },
  declined: { emoji: "❌", color: "#FFF5F5" },
  reminder: { emoji: "⏰", color: "#FFF7ED" },
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const handleMarkAllRead = async () => {
    try {
      await api.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silent
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.header}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <TouchableOpacity
                testID="mark-all-read-btn"
                onPress={handleMarkAllRead}
              >
                <Text style={styles.markRead}>Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          testID="notifications-list"
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const meta = TYPE_META[item.type] || { emoji: "🔔", color: COLORS.subtle };
            return (
              <View
                testID={`notification-item-${item.id}`}
                style={[
                  styles.notifCard,
                  { backgroundColor: meta.color },
                  !item.read && styles.unread,
                ]}
              >
                <Text style={styles.notifEmoji}>{meta.emoji}</Text>
                <View style={styles.notifInfo}>
                  <Text style={styles.notifTitle}>{item.title}</Text>
                  <Text style={styles.notifBody}>{item.body}</Text>
                  <Text style={styles.notifTime}>
                    {dayjs(item.created_at).fromNow()}
                  </Text>
                </View>
                {!item.read && <View style={styles.unreadDot} />}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔔</Text>
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          }
          contentContainerStyle={
            notifications.length === 0 ? styles.listEmpty : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
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
  header: { paddingBottom: 20 },
  headerContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 24,
    color: COLORS.white,
  },
  markRead: {
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    color: COLORS.accent,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 16 },
  listEmpty: { flex: 1 },
  notifCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  unread: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  notifEmoji: { fontSize: 28 },
  notifInfo: { flex: 1 },
  notifTitle: {
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  notifBody: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  notifTime: {
    fontFamily: "Manrope_400Regular",
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginTop: 4,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
