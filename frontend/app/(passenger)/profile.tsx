// Re-export captain profile logic for passenger
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { api } from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";
import Avatar from "../../components/Avatar";
import { COLORS } from "../../utils/constants";

export default function PassengerProfile() {
  const { user, logout, refreshUser } = useAuth();
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editPhoto, setEditPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleEditPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setEditPhoto(result.assets[0].base64);
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const update: Record<string, string> = { name: editName.trim() };
      if (editPhoto) update.photo = editPhoto;
      await api.updateProfile(update);
      await refreshUser();
      setEditVisible(false);
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.header}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <Avatar
              photo={user?.photo}
              name={user?.name}
              size={80}
              style={styles.avatar}
            />
            <Text style={styles.name}>{user?.name || "Passenger"}</Text>
            <View style={styles.ratingRow}>
              <Text style={styles.star}>★</Text>
              <Text style={styles.rating}>
                {user?.rating?.toFixed(1) || "5.0"} · Passenger
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📱 Phone</Text>
            <Text style={styles.infoValue}>{user?.phone}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🌊 Role</Text>
            <Text style={styles.infoValue}>Passenger</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>⭐ Rating</Text>
            <Text style={styles.infoValue}>
              {user?.rating?.toFixed(1) || "5.0"} / 5.0
            </Text>
          </View>
        </View>

        <TouchableOpacity
          testID="edit-profile-btn"
          style={styles.actionBtn}
          onPress={() => {
            setEditName(user?.name || "");
            setEditPhoto(null);
            setEditVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnText}>✏️  Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="logout-btn"
          style={[styles.actionBtn, styles.logoutBtn]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionBtnText, styles.logoutText]}>
            🚪 Logout
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={editVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity
              testID="edit-avatar-btn"
              onPress={handleEditPhoto}
              style={styles.editAvatar}
            >
              <Avatar
                photo={editPhoto || user?.photo}
                name={editName || user?.name}
                size={80}
              />
              <View style={styles.cameraIcon}>
                <Text>📷</Text>
              </View>
            </TouchableOpacity>
            <TextInput
              testID="edit-name-input"
              style={styles.editInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor={COLORS.textTertiary}
              autoCapitalize="words"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="save-profile-btn"
                style={styles.saveBtn}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingBottom: 32 },
  headerContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    alignItems: "center",
  },
  avatar: { marginBottom: 12, borderWidth: 3, borderColor: COLORS.accent },
  name: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 24,
    color: COLORS.white,
    marginBottom: 4,
  },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  star: { color: COLORS.accent, fontSize: 16 },
  rating: {
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  body: { padding: 20 },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 4,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  infoLabel: {
    fontFamily: "Manrope_500Medium",
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 16 },
  actionBtn: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  actionBtnText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 16,
    color: COLORS.primary,
  },
  logoutBtn: { borderWidth: 1, borderColor: "#FEE2E2" },
  logoutText: { color: COLORS.error },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 20,
    color: COLORS.textPrimary,
    marginBottom: 20,
  },
  editAvatar: { position: "relative", marginBottom: 20 },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.accent,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  editInput: {
    width: "100%",
    height: 52,
    backgroundColor: COLORS.subtle,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontFamily: "Manrope_500Medium",
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 20,
  },
  modalActions: { flexDirection: "row", gap: 12, width: "100%" },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  saveBtn: {
    flex: 1,
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
    color: COLORS.white,
  },
});
