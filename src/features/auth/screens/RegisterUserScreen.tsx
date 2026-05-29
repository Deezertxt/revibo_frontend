import { registerUser } from "@/features/auth/services/auth.service";
import { setRegistered } from "@/shared/store/authStore";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

type FormData = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const PRIMARY = "#5B3FD9";
const ACCENT = "#7C63E8";

export default function RegisterUserScreen() {
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const { control, handleSubmit, watch } = useForm<FormData>({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const password = watch("password");

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);

    try {
      const result = await registerUser({
        nombre: data.username,
        correo: data.email,
        contrasena: data.password,
        confirmacion_contrasena: data.confirmPassword,
      });

      setRegistered({
        accessToken: result.accessToken,
        idUsuario: result.user.id_usuario,
        name: result.user.nombre,
        email: result.user.correo,
      });

      Alert.alert("¡Éxito!", "Cuenta creada correctamente en el backend", [
        { text: "OK", onPress: () => router.replace("/(tabs)/perfil") },
      ]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo registrar el usuario.";
      Alert.alert("Error", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      style={{ backgroundColor: PRIMARY }}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid={true}
      extraScrollHeight={100}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Text style={styles.iconText}>👤</Text>
        </View>
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>Ingresa tus datos para registrarte</Text>
      </View>

      <View style={styles.card}>
        <Controller
          control={control}
          name="username"
          rules={{
            required: "Este campo es obligatorio",
            minLength: { value: 4, message: "Mínimo 4 caracteres" },
          }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, error && styles.labelError]}>
                Nombre de usuario
              </Text>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="juan_perez"
                placeholderTextColor="#bbb"
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
              />
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </View>
          )}
        />

        <Controller
          control={control}
          name="email"
          rules={{
            required: "Este campo es obligatorio",
            pattern: {
              value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
              message: "Formato de correo inválido",
            },
          }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, error && styles.labelError]}>
                Correo electrónico
              </Text>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="usuario@correo.com"
                placeholderTextColor="#bbb"
                value={value}
                onChangeText={onChange}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </View>
          )}
        />

        <Controller
          control={control}
          name="password"
          rules={{
            validate: (v) =>
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(v) ||
              "Mínimo 8 caracteres con mayúscula, minúscula, número y símbolo",
          }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, error && styles.labelError]}>
                Contraseña
              </Text>
              <View style={[styles.inputRow, error && styles.inputError]}>
                <TextInput
                  style={styles.inputFlex}
                  placeholder="••••••••"
                  placeholderTextColor="#bbb"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Text style={styles.eye}>{showPass ? "🙈" : "👁️"}</Text>
                </TouchableOpacity>
              </View>
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </View>
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          rules={{
            required: "Este campo es obligatorio",
            validate: (value: string) =>
              value === password || "Las contraseñas no coinciden",
          }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, error && styles.labelError]}>
                Confirmar contraseña
              </Text>
              <View style={[styles.inputRow, error && styles.inputError]}>
                <TextInput
                  style={styles.inputFlex}
                  placeholder="••••••••"
                  placeholderTextColor="#bbb"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  <Text style={styles.eye}>{showConfirm ? "🙈" : "👁️"}</Text>
                </TouchableOpacity>
              </View>
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </View>
          )}
        />

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleSubmit(onSubmit)}
          activeOpacity={0.85}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Registrarse</Text>
          )}
        </TouchableOpacity>

        <View style={styles.separatorContainer}>
          <View style={styles.separatorLine} />
          <View style={styles.separatorDot} />
          <View style={styles.separatorLine} />
        </View>

        <TouchableOpacity onPress={() => router.push("/login")}>
          <Text style={styles.link}>
            ¿Ya tienes cuenta?{" "}
            <Text style={styles.linkBold}>Inicia sesión</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingTop: 35,
    paddingBottom: 20,
    paddingHorizontal: 25,
  },
  iconBox: {
    backgroundColor: "rgba(255,255,255,0.2)",
    width: 65,
    height: 65,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  iconText: { fontSize: 30 },
  title: { color: "#fff", fontSize: 28, fontWeight: "bold", marginBottom: 8 },
  subtitle: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  card: {
    backgroundColor: "#F7F7FC",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 28,
    paddingTop: 32,
    flexGrow: 1,
  },
  fieldContainer: { marginBottom: 18 },
  label: { color: ACCENT, fontWeight: "600", fontSize: 13, marginBottom: 6 },
  labelError: { color: "#E53935" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E8E8F0",
    padding: 14,
    fontSize: 15,
    color: "#1E1E2E",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E8E8F0",
    paddingRight: 12,
  },
  inputFlex: { flex: 1, padding: 14, fontSize: 15, color: "#1E1E2E" },
  inputError: { borderColor: "#E53935", backgroundColor: "#FFF5F5" },
  eye: { fontSize: 16 },
  errorText: { color: "#E53935", fontSize: 12, marginTop: 5 },
  button: {
    backgroundColor: PRIMARY,
    padding: 17,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  separatorLine: { flex: 1, height: 1, backgroundColor: "#E0E0E8" },
  separatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#C0C0D0",
    marginHorizontal: 10,
  },
  link: { color: "#888", textAlign: "center", fontSize: 14 },
  linkBold: { color: ACCENT, fontWeight: "bold" },
});
