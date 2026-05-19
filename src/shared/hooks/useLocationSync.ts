import * as Location from "expo-location";
import * as Notifications from 'expo-notifications';
import { useEffect } from "react";
import Constants from 'expo-constants';

const API_URL = 'https://revibo-backend.onrender.com/api/v1/device-token/sync'



export const useLocationSync = (authToken?: string) => {
    useEffect(()=>{
        
        const interval = setInterval(async () => {
            const pushToken = await Notifications.getExpoPushTokenAsync({
                projectId: Constants.expoConfig?.extra?.eas?.projectId,
            }); 
            const location = await Location.getCurrentPositionAsync({});
            console.log("actulizacion lat lng", location.coords.latitude, location.coords.longitude);
            await fetch('https://revibo-backend.onrender.com/api/v1/device-token/sync', {
                method: "POST",
                headers: {
                    "Content-type": "application/json",
                    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
                },
                body: JSON.stringify({
                    token: pushToken.data,
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                }),
            });
        }, 5 * 60 * 1000)
        return () => clearInterval(interval);
    }, [authToken]);
};