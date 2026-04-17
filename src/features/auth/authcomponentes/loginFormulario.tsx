import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../authhooks/useAuth"; // Ajustado a tu nueva carpeta

export default function LoginFormulario() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // Traemos la lógica del hook
  const { handleLogin, loading, error } = useAuth();

  const onIngresar = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor, completa todos los campos.");
      return;
    }
    await handleLogin(email, password);
  };

  return (
    <View className="flex-1 justify-center p-6 bg-white">
      <Text className="text-3xl font-bold mb-8 text-center text-blue-600">
        REVIBO
      </Text>

      <Text className="text-xl font-semibold mb-6 text-center text-gray-800">
        Inicio de Sesión
      </Text>

      {/* Mensaje de Error Visual */}
      {error && (
        <View className="bg-red-100 p-3 rounded-lg mb-4 border border-red-200">
          <Text className="text-red-600 text-center text-sm font-medium">
            {error}
          </Text>
        </View>
      )}

      {/* Campo Correo */}
      <View className="mb-4">
        <Text className="text-gray-700 mb-2 font-medium">
          Correo electrónico
        </Text>
        <TextInput
          className="border border-gray-300 p-4 rounded-xl bg-gray-50 text-gray-900"
          placeholder="email@ejemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />
      </View>

      {/* Campo Contraseña */}
      <View className="mb-8">
        <Text className="text-gray-700 mb-2 font-medium">Contraseña</Text>
        <TextInput
          className="border border-gray-300 p-4 rounded-xl bg-gray-50 text-gray-900"
          placeholder="********"
          secureTextEntry={true}
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />
      </View>

      {/* Botón de Acción */}
      <Pressable
        className={`p-4 rounded-xl shadow-sm ${loading ? "bg-blue-300" : "bg-blue-600"}`}
        onPress={onIngresar}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-white text-center font-bold text-lg">
            Ingresar
          </Text>
        )}
      </Pressable>

      <Text className="mt-6 text-center text-gray-500 text-sm">
        ¿No tienes cuenta? Contacta al administrador
      </Text>
    </View>
  );
}
