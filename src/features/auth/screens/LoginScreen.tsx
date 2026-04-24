import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoginFormulario() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const loading = false;

  return (
    <View
      style={{ flex: 1, backgroundColor: "#5B37D0", paddingTop: insets.top }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingHorizontal: 40, paddingVertical: 50 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 25,
              }}
            >
              <Ionicons name="person-outline" size={32} color="white" />
            </View>
            <Text
              style={{
                color: "white",
                fontSize: 38,
                fontWeight: "bold",
                letterSpacing: -1,
              }}
            >
              Bienvenido
            </Text>
            <Text
              style={{
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: 17,
                marginTop: 5,
              }}
            >
              Ingresa tu cuenta para continuar
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 45,
              borderTopRightRadius: 45,
              paddingHorizontal: 35,
              paddingTop: 50,
              paddingBottom: insets.bottom + 20,
            }}
          >
            {/* Correo */}
            <View style={{ marginBottom: 25 }}>
              <Text
                style={{
                  color: "#B29079",
                  fontSize: 15,
                  fontWeight: "bold",
                  marginBottom: 10,
                  marginLeft: 5,
                }}
              >
                Correo electrónico
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#E5E5E5",
                  borderRadius: 18,
                  padding: 16,
                  fontSize: 16,
                  backgroundColor: "#FFFFFF",
                  color: "#333",
                }}
                placeholder="usuario@correo.com"
                placeholderTextColor="#C0C0C0"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Contraseña */}
            <View style={{ marginBottom: 35 }}>
              <Text
                style={{
                  color: "#B29079",
                  fontSize: 15,
                  fontWeight: "bold",
                  marginBottom: 10,
                  marginLeft: 5,
                }}
              >
                Contraseña
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#E5E5E5",
                  borderRadius: 18,
                  paddingHorizontal: 16,
                  backgroundColor: "#FFFFFF",
                }}
              >
                <TextInput
                  style={{
                    flex: 1,
                    paddingVertical: 16,
                    fontSize: 16,
                    color: "#333",
                  }}
                  placeholder="••••••••"
                  placeholderTextColor="#C0C0C0"
                  secureTextEntry={!isPasswordVisible}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  <Ionicons
                    name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#D0D0D0"
                  />
                </Pressable>
              </View>
            </View>

            {/* Botón Principal con sombra y redondeado */}
            <Pressable
              style={{
                backgroundColor: "#5B37D0",
                paddingVertical: 18,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                // Sombras para que no se vea plano
                elevation: 4,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 5,
              }}
              onPress={() => console.log("Login clicked")}
            >
              <Text
                style={{ color: "white", fontWeight: "bold", fontSize: 18 }}
              >
                Iniciar sesión
              </Text>
            </Pressable>

            {/* Separador Visual */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 45,
              }}
            >
              <View
                style={{ flex: 1, height: 1, backgroundColor: "#EAEAEA" }}
              />
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  borderWidth: 2,
                  borderColor: "#EAEAEA",
                  marginHorizontal: 15,
                }}
              />
              <View
                style={{ flex: 1, height: 1, backgroundColor: "#EAEAEA" }}
              />
            </View>

            {/* Footer */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginTop: 35,
              }}
            >
              <Text style={{ color: "#999", fontSize: 15 }}>
                ¿No tienes cuenta?{" "}
              </Text>
              <Pressable onPress={() => router.push("/registro" as any)}>
                <Text
                  style={{ color: "#5B37D0", fontWeight: "800", fontSize: 15 }}
                >
                  Regístrate
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
