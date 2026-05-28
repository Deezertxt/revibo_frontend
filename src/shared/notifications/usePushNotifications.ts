import { useEffect, useRef, useState } from "react";
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from "react-native";
import * as Location from "expo-location";
import { Double } from "react-native/Libraries/Types/CodegenTypes";

const API_URL_DEPLOY = "https://revibo-backend.onrender.com/api/v1/device-token";
 
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);

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
            notificationListener.current?.remove()
            responseListener.current?.remove()
        }
    }, []);
}

async function registerForPushNotifications() {
    if(!Device.isDevice){
        console.log("Debe usar dispositivo fisico para notificaciones");
        return;
    }

    const { status: existingStatus} = await Notifications.getPermissionsAsync(); // se consulta si se tiene permisos de noti

    console.log("existing status: ", existingStatus);

    let finalStatus = existingStatus;

    if(existingStatus !== 'granted') { //sino hay permisos se solicita
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status; // y se actualiza
    }

    if (finalStatus !== 'granted') {
        console.log("Permisos no obtenidos");
        return;
    }

    console.log("final status: ", finalStatus);

    //console.log("exponcngf:   ", Constants.expoConfig);
    // ---------*-  Permisos de ubicacion -*----------
    const {status: locStatus} =
        await Location.requestForegroundPermissionsAsync();

    if (locStatus !== 'granted') return;
    const location = await Location.getCurrentPositionAsync({});
    const lat = location.coords.latitude;
    const lng = location.coords.longitude;

    console.log("primer lat, lng:  ", lat, lng);

    let token = null;

    for(let i = 0; i < 5; i++){
        try{
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: Constants.expoConfig?.extra?.eas?.projectId,
            });
            token = tokenData.data;
            break;
        }catch(error){
            console.log(`Inetnto: ${i+1} fallido`, error);
            await new Promise(resolve => setTimeout(resolve, 6000));
        }
    }

    if(!token){
        console.log("no se pudo obtener token push");
        return;
    }

    console.log("Expo piush token: ", token);
    await sendTokenToBackend(token, lat, lng);
}

async function sendTokenToBackend(token: string, lat: Double, lng: Double) {
    try {
        //console.log("ENVIANDO.. TOKEN FIRST TIME: ", token, "LAT: ", lat, "LNG: ", lng);
        const response = await fetch(API_URL_DEPLOY, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token,
                platform: Platform.OS,
                lng: lng,
                lat: lat
            })
        });

    const data = await response.json();
    console.log("respuesta del back", data);
    console.log("Token guardado con éxito:", data);
        
    } catch (error) {
        console.log("Error al enviar device token", error);
    }
}