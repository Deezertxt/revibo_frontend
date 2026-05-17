import { useEffect, useRef } from "react";
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from "react-native";

const DEFAULT_API_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:8000/api/v1"
    : "http://localhost:8000/api/v1";
const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(
  /\/$/,
  "",
);

export function usePushNotifications() {
    const notificationListener = useRef<any>();
    const responseListener = useRef<any>();

    useEffect(() => {
        registerForPushNotifications();

        notificationListener.current = 
            Notifications.addNotificationReceivedListener(
                notification => {
                    console.log("Notificacion recibida: ", notification);
                }
            );

        responseListener.current =
            Notifications.addNotificationResponseReceivedListener(
                response => {
                    console.log("Usuario pusheo :v la noti ", response);
                }
            );
        
        return () => {
            if(notificationListener.current)
                Notifications.removeNotificationSubscription(notificationListener.current);   
        
            if(responseListener.current)
                Notifications.removeNotificationSubscription(responseListener.current);
        }
    }, []);

}

async function registerForPushNotifications() {
    if(!Device.isDevice){
        console.log("Debe usar dispositivo fisico para notificaciones");
        return;
    }

    const { status: existingStatus} = await Notifications.getPermissionsAsync(); // se consulta si se tiene permisos de noti

    let finalStatus = existingStatus;

    if(existingStatus !== 'granted') { //sino hay permisos se solicita
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status; // y se actualiza
    }

    if (finalStatus !== 'granted') {
        console.log("Permisos no obtenidos");
        return;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });

    const token = tokenData.data;

    console.log("Expo push token", token);

    await sendTokenToBackend(token);
}

async function sendTokenToBackend(token: string) {
    try {
        const response = await fetch(`${API_URL}/device-token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token,
                platform: Platform.OS
            })
        });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al guardar el token");
    }

    const data = await response.json();
    console.log("Token guardado con éxito:", data);
        
    } catch (error) {
        console.log("Error al enviar device token", error);
    }
}