import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
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
  const [loading, setLoading] = useState<boolean>(false);

  const validateEmail = (text: string) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(text);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor completa todos los campos.");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Formato inválido", "Ingresa un correo electrónico válido.");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Error", "La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);
    try {
      console.log("Iniciando sesión...");
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.mainContainer, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <View style={styles.iconBox}>
              <Ionicons name="person-outline" size={32} color="white" />
            </View>
            <Text style={styles.welcomeText}>Bienvenido</Text>
            <Text style={styles.instructionText}>
              Ingresa tu cuenta para continuar
            </Text>
          </View>

          <View
            style={[
              styles.formContainer,
              { paddingBottom: insets.bottom + 20 },
            ]}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Correo electrónico</Text>
              <TextInput
                style={styles.input}
                placeholder="usuario@correo.com"
                placeholderTextColor="#C0C0C0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroupLarge}>
              <Text style={styles.fieldLabel}>Contraseña</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor="#C0C0C0"
                  secureTextEntry={!isPasswordVisible}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
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

            <Pressable
              style={({ pressed }) => [
                styles.loginButton,
                { opacity: pressed || loading ? 0.8 : 1 },
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? "Cargando..." : "Iniciar sesión"}
              </Text>
            </Pressable>

            <View style={styles.separatorContainer}>
              <View style={styles.line} />
              <View style={styles.dot} />
              <View style={styles.line} />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿No tienes cuenta? </Text>
              <Pressable onPress={() => router.push("/registro" as any)}>
                <Text style={styles.registerText}>Regístrate</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#5B37D0" },
  headerContainer: { paddingHorizontal: 40, paddingVertical: 50 },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 25,
  },
  welcomeText: {
    color: "white",
    fontSize: 38,
    fontWeight: "bold",
    letterSpacing: -1,
  },
  instructionText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 17,
    marginTop: 5,
  },
  formContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    paddingHorizontal: 35,
    paddingTop: 50,
  },
  inputGroup: { marginBottom: 25 },
  inputGroupLarge: { marginBottom: 35 },
  fieldLabel: {
    color: "#B29079",
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 10,
    marginLeft: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 18,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: "#333",
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 18,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  passwordInput: { flex: 1, paddingVertical: 16, fontSize: 16, color: "#333" },
  loginButton: {
    backgroundColor: "#5B37D0",
    paddingVertical: 18,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  loginButtonText: { color: "white", fontWeight: "bold", fontSize: 18 },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 45,
  },
  line: { flex: 1, height: 1, backgroundColor: "#EAEAEA" },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#EAEAEA",
    marginHorizontal: 15,
  },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 35 },
  footerText: { color: "#999", fontSize: 15 },
  registerText: { color: "#5B37D0", fontWeight: "800", fontSize: 15 },
});
