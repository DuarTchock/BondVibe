import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { ThemeProvider } from "./src/contexts/ThemeContext";

export default function App() {
  const [AppNavigator, setAppNavigator] = useState(null);

  useEffect(() => {
    // Cargar AppNavigator dinámicamente DESPUÉS de que React Native esté listo
    const loadNavigator = async () => {
      const nav = await import("./src/navigation/AppNavigator");
      setAppNavigator(() => nav.default);
    };
    loadNavigator();
  }, []);

  if (!AppNavigator) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0B0F1A",
        }}
      >
        <ActivityIndicator size="large" color="#FF6B9D" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}
