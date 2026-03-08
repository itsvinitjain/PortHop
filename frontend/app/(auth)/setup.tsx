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
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { api } from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";
import Avatar from "../../components/Avatar";
import { COLORS } from "../../utils/constants";

export default function SetupScreen() {
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshUser } = useAuth();

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Allow photo access to set profile picture");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setPhoto(result.assets[0].base64);
    }
  };

  const handleGetStarted = async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter your name");
      return;
    }
    setLoading(true);
    try {
      const update: Record<string, string> = { name: name.trim() };
      if (photo) update.photo = photo;
      await api.updateProfile(update);
      await refreshUser();
      // Refresh user will update role from auth context and index will redirect
      const me = await api.getMe();
      if (me.role === "captain") {
        router.replace("/(captain)");
      } else {
        router.replace("/(passenger)");
      }
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Set up your profile</Text>
          <Text style={styles.subtitle}>
            Add your name and a photo so others can recognize you
          </Text>

          <TouchableOpacity
            testID="photo-picker-btn"
            style={styles.avatarContainer}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            <Avatar photo={photo} name={name} size={100} />
            <View style={styles.cameraIcon}>
              <Text style={styles.cameraText}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.photoHint}>Tap to add photo</Text>

          <TextInput
            testID="name-input"
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your full name"
            placeholderTextColor={COLORS.textTertiary}
            autoCapitalize="words"
            returnKeyType="done"
          />

          <TouchableOpacity
            testID="get-started-btn"
            style={[styles.btn, (loading || !name.trim()) && styles.btnDisabled]}
            onPress={handleGetStarted}
            activeOpacity={0.8}
            disabled={loading || !name.trim()}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.btnText}>Get Started 🚢</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: {
    padding: 24,
    paddingTop: 48,
    alignItems: "center",
  },
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
  avatarContainer: {
    position: "relative",
    marginBottom: 4,
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.accent,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  cameraText: { fontSize: 14 },
  photoHint: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    color: COLORS.textTertiary,
    marginBottom: 32,
    marginTop: 4,
  },
  input: {
    width: "100%",
    height: 56,
    backgroundColor: COLORS.subtle,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontFamily: "Manrope_500Medium",
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 24,
  },
  btn: {
    width: "100%",
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 16,
    color: COLORS.white,
  },
});
