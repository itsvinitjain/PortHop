import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { COLORS } from "../utils/constants";

interface AvatarProps {
  photo?: string | null;
  name?: string | null;
  size?: number;
  style?: object;
}

export default function Avatar({ photo, name, size = 44, style }: AvatarProps) {
  const initial = (name || "?")[0].toUpperCase();
  const radius = size / 2;

  if (photo) {
    const uri = photo.startsWith("data:") ? photo : `data:image/jpeg;base64,${photo}`;
    return (
      <Image
        source={{ uri }}
        style={[{ width: size, height: size, borderRadius: radius }, style]}
      />
    );
  }

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: radius },
        style,
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.38 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    color: COLORS.accent,
    fontFamily: "Manrope_700Bold",
    fontWeight: "700",
  },
});
