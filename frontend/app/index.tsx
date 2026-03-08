import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { COLORS } from "../utils/constants";

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/(auth)/phone");
    } else if (!user.role) {
      router.replace("/(auth)/role");
    } else if (!user.name) {
      router.replace("/(auth)/setup");
    } else if (user.role === "captain") {
      router.replace("/(captain)");
    } else {
      router.replace("/(passenger)");
    }
  }, [user, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={COLORS.accent} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
