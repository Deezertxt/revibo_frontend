import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../authhooks/useAuth";

export default function LoginFormulario() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);

  const { handleLogin, loading } = useAuth();

  const onIngresar = async (): Promise<void> => {
    if (email && password) {
      await handleLogin(email, password);
    }
  };

  return (
    // Contenedor principal con el color de fondo morado
    <View
      className="flex-1 bg-[#5B37D0]"
      style={{ paddingTop: insets.top }} // Esto reemplaza al SafeAreaView y funciona en Android
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* SECCIÓN SUPERIOR: Icono y bienvenida */}
          <View className="px-10 py-12">
            <View className="bg-white/20 w-16 h-16 rounded-[20px] items-center justify-center mb-6">
              <Ionicons name="person-outline" size={32} color="white" />
            </View>
            <Text className="text-white text-[38px] font-bold tracking-tight">
              Bienvenido
            </Text>
            <Text className="text-white/90 text-[17px] mt-1 font-medium">
              Ingresa tu cuenta para continuar
            </Text>
          </View>

          {/* SECCIÓN BLANCA: Formulario */}
          <View
            className="flex-1 bg-white rounded-t-[45px] px-9 pt-12"
            style={{ paddingBottom: insets.bottom + 20 }} // Asegura espacio abajo en celulares modernos
          >
            {/* Input Correo */}
            <View className="mb-6">
              <Text className="text-[#B29079] text-[15px] font-bold mb-2 ml-1">
                Correo electrónico
              </Text>
              <TextInput
                className="border border-[#E5E5E5] p-4 rounded-[18px] bg-white text-gray-800 text-[16px]"
                placeholder="usuario@correo.com"
                placeholderTextColor="#C0C0C0"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </View>

            {/* Input Contraseña */}
            <View className="mb-2">
              <Text className="text-[#B29079] text-[15px] font-bold mb-2 ml-1">
                Contraseña
              </Text>
              <View className="flex-row items-center border border-[#E5E5E5] rounded-[18px] bg-white px-4">
                <TextInput
                  className="flex-1 py-4 text-gray-800 text-[16px]"
                  placeholder="••••••••"
                  placeholderTextColor="#C0C0C0"
                  secureTextEntry={!isPasswordVisible}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
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

            <Pressable className="items-end mb-9 pt-2">
              <Text className="text-[#5B37D0] font-bold text-[14px]"></Text>
            </Pressable>

            {/* Botón */}
            <Pressable
              className={`py-[18px] rounded-[22px] shadow-sm active:opacity-80 ${
                loading ? "bg-[#7c5de0]" : "bg-[#5B37D0]"
              }`}
              onPress={onIngresar}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-center font-bold text-[18px]">
                  Iniciar sesión
                </Text>
              )}
            </Pressable>

            {/* Separador */}
            <View className="flex-row justify-center items-center mt-12">
              <View className="h-[1px] bg-[#EAEAEA] flex-1" />
              <View className="w-[10px] h-[10px] rounded-full border-2 border-[#EAEAEA] mx-4" />
              <View className="h-[1px] bg-[#EAEAEA] flex-1" />
            </View>

            {/* Footer */}
            <View className="flex-row justify-center mt-9">
              <Text className="text-gray-400 text-[15px]">
                ¿No tienes cuenta?{" "}
              </Text>
              <Pressable>
                <Text className="text-[#5B37D0] font-extrabold text-[15px]">
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
