import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { setRegistered } from "../../../shared/store/authStore";
import { loginUser } from "../services/auth.service";

export default function LoginFormulario() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [cargando, setCargando] = useState<boolean>(false);
  const [mostrarPassword, setMostrarPassword] = useState<boolean>(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Atención", "Ingresa correo y contraseña.");
      return;
    }

    setCargando(true);
    try {
      const resultado = await loginUser({
        correo: email,
        contrasena: password,
      });

      setRegistered({
        accessToken: resultado.accessToken,
        idUsuario: resultado.user.id_usuario,
        name: resultado.user.nombre,
        email: resultado.user.correo,
        rol: resultado.user.rol || "usuario",
      });

      const rolUser = resultado.user.rol || "usuario";
      const rolFormateado = rolUser.charAt(0).toUpperCase() + rolUser.slice(1);

      Alert.alert(
        `Bienvenido ${rolFormateado}`,
        `Hola ${resultado.user.nombre}, has iniciado sesión correctamente.`,
        [
          {
            text: "Continuar",
            onPress: () => {
              if (rolUser.toLowerCase() === "admin") {
                router.replace("/(tabs)/admin");
              } else {
                router.replace("/(tabs)");
              }
            },
          },
        ],
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Credenciales incorrectas");
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#5B37D0" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* SECCIÓN SUPERIOR */}
          <View
            style={{
              paddingHorizontal: 35,
              paddingTop: insets.top + 60,
              paddingBottom: 40,
            }}
          >
            <Text style={{ fontSize: 32, fontWeight: "bold", color: "white" }}>
              Bienvenido
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: "rgba(255, 255, 255, 0.8)",
                marginTop: 5,
              }}
            >
              Ingresa tu cuenta para continuar
            </Text>
          </View>

          {/* TARJETA BLANCA */}
          <View
            style={{
              flex: 1,
              backgroundColor: "white",
              borderTopLeftRadius: 40,
              borderTopRightRadius: 40,
              paddingHorizontal: 35,
              paddingTop: 40,
              paddingBottom: insets.bottom + 20,
            }}
          >
            {/* Email */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: "#7A7A7A",
                  fontSize: 14,
                  fontWeight: "bold",
                  marginBottom: 8,
                }}
              >
                Correo electrónico
              </Text>
              <TextInput
                style={styles.input}
                placeholder="usuario@correo.com"
                placeholderTextColor="rgba(0, 0, 0, 0.25)" // Stateholder más transparente
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Contraseña */}
            <View style={{ marginBottom: 40 }}>
              <Text
                style={{
                  color: "#7A7A7A",
                  fontSize: 14,
                  fontWeight: "bold",
                  marginBottom: 8,
                }}
              >
                Contraseña
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(0, 0, 0, 0.25)" // Stateholder más transparente
                  secureTextEntry={!mostrarPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setMostrarPassword(!mostrarPassword)}
                  activeOpacity={0.6}
                >
                  <Ionicons
                    name={mostrarPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#A0A0A0"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View>
              <TouchableOpacity
                onPress={handleLogin}
                disabled={cargando}
                activeOpacity={0.7}
                style={{
                  backgroundColor: cargando ? "#8A6CE0" : "#5B37D0",
                  height: 55,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 30,
                  marginTop: 10,
                }}
              >
                {cargando ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text
                    style={{ color: "white", fontWeight: "bold", fontSize: 18 }}
                  >
                    Iniciar sesión
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 25,
              }}
            >
              <View
                style={{ flex: 1, height: 1, backgroundColor: "#E0E0E0" }}
              />
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#E0E0E0",
                  marginHorizontal: 15,
                }}
              />
              <View
                style={{ flex: 1, height: 1, backgroundColor: "#E0E0E0" }}
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <Text style={{ color: "#7A7A7A", fontSize: 15 }}>
                ¿No tienes cuenta?{" "}
              </Text>
              <Pressable onPress={() => router.push("/registro" as any)}>
                <Text
                  style={{ color: "#5B37D0", fontWeight: "bold", fontSize: 15 }}
                >
                  Regístrate aquí
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 55,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#333",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 55,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    paddingHorizontal: 15,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
});
