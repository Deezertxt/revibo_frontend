import { ThemedText } from "@/shared/components/themed-text";
import { ThemedView } from "@/shared/components/themed-view";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { logoutUser } from "@/features/auth/services/auth.service";

export default function PerfilScreen() {
  const router = useRouter();
  const { isRegistered, accessToken, user } = useAuthStore();
  const logout = useAuthStore((state) => state.logout);
  const [cargando, setCargando] = useState(false);

  const handleLogout = async () => {
    setCargando(true);
    try {
      // token actual
      if (accessToken) {
        await logoutUser(accessToken);
      }
    } catch (error: any) {
      console.log("Error al cerrar sesión en el servidor:", error.message);
    } finally {
      logout();
      setCargando(false);

      //redirección
      router.replace("/(tabs)");
    }
  };

  // Usuario deslogueado y sin sesión
  if (!isRegistered) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title">Mi Perfil</ThemedText>
          <ThemedText
            style={{ marginTop: 10, textAlign: "center", color: "#7A7A7A" }}
          >
            Inicia sesión para ver tu información y gestionar tu cuenta.
          </ThemedText>
        </View>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push("/login")}
        >
          <ThemedText style={styles.buttonText}>Iniciar Sesión</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // Usuario
  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Mi Perfil</ThemedText>
        <ThemedText style={styles.roleTag}>
          {user?.rol?.toUpperCase()}
        </ThemedText>
      </View>

      <ThemedView style={styles.infoCard}>
        <ThemedText type="defaultSemiBold">Nombre</ThemedText>
        <ThemedText>{user?.nombre ?? "Sin nombre"}</ThemedText>

        <View style={{ height: 15 }} />

        <ThemedText type="defaultSemiBold">Correo Electrónico</ThemedText>
        <ThemedText>{user?.correo ?? "Sin correo"}</ThemedText>
      </ThemedView>

      <TouchableOpacity
        style={[
          styles.logoutButton,
          { backgroundColor: cargando ? "#A58DFF" : "#5B37D0" },
        ]}
        onPress={handleLogout}
        disabled={cargando}
      >
        {cargando ? (
          <ActivityIndicator color="white" />
        ) : (
          <ThemedText style={styles.buttonText}>Cerrar Sesión</ThemedText>
        )}
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  roleTag: {
    fontSize: 12,
    color: "#5B37D0",
    fontWeight: "bold",
    backgroundColor: "#E8E4F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
    marginTop: 5,
  },
  infoCard: {
    backgroundColor: "rgba(0,0,0,0.03)",
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: "#5B37D0",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutButton: {
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    minHeight: 55,
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
