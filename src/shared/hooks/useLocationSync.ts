import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import Constants from "expo-constants";

const API_URL = "https://revibo-backend.onrender.com/api/v1/device-token/sync";

export const useLocationSync = (authToken?: string) => {
    useEffect(() => {
        let subscription: Location.LocationSubscription;

        const startTraking = async () => {
            const { status } =
                await Location.requestForegroundPermissionsAsync();

            if (status !== "granted") {
                console.log("Permiso de ubicacion denegado");
                return;
            }

            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Balanced,
                    timeInterval: 10 * 60 * 1000,
                    distanceInterval: 1000,
                },
                async (location) => {
                    try {
                        const tokenData =
                            await Notifications.getExpoPushTokenAsync({
                                projectId:
                                    Constants.expoConfig?.extra?.eas?.projectId,
                            });
                        const token = tokenData.data;

                        console.log(
                            "sync ubicacion",
                            location.coords.latitude,
                            location.coords.longitude,
                        );

                        await fetch(API_URL, {
                            method: "POST",
                            headers: {
                                "Content-type": "application/json",
                                ...(authToken
                                    ? { Authorization: `Bearer ${authToken}` }
                                    : {}),
                            },
                            body: JSON.stringify({
                                token: token,
                                lat: location.coords.latitude,
                                lng: location.coords.longitude,
                            }),
                        });
                    } catch (error) {
                        console.log("error al sync ubicacion", error);
                    }
                },
            );
            startTraking();
            return () => {
                subscription?.remove();
            };
        };
    }, [authToken]);
};
