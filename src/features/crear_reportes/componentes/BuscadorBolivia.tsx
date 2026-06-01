import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface BuscadorBoliviaProps {
  onLocationSelect: (direccion: string, lat: number, lon: number) => void;
  valorInicial?: string;
}

export function BuscadorBolivia({
  onLocationSelect,
  valorInicial = "",
}: BuscadorBoliviaProps) {
  const [searchQuery, setSearchQuery] = useState(valorInicial);
  const [suggestions, setSuggestions] = useState<Array<any>>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery,
        )}&addressdetails=1&limit=6&countrycodes=bo`;

        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            "Accept-Language": "es",
            "User-Agent": "Revibo/1.0",
          },
        });

        if (cancelled) return;

        if (!res.ok) {
          setSuggestions([]);
          setLoadingSuggestions(false);
          return;
        }

        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch (e) {
        if ((e as any)?.name === "AbortError") return;
        setSuggestions([]);
      } finally {
        if (!cancelled) setLoadingSuggestions(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [searchQuery]);

  return (
    <View style={styles.searchContainer}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Buscar calle, plaza o avenida..."
          placeholderTextColor="#AAA"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable
            onPress={() => setSearchQuery("")}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#AAA" />
          </Pressable>
        )}
      </View>

      {searchQuery.length > 0 && (
        <View style={styles.suggestionsBoxInline}>
          {loadingSuggestions ? (
            <View style={styles.loaderRow}>
              <ActivityIndicator size="small" color="#6347D1" />
            </View>
          ) : suggestions.length > 0 ? (
            <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {suggestions.map((s) => (
                <Pressable
                  key={s.place_id ?? s.osm_id ?? s.lat + s.lon}
                  onPress={() => {
                    const lat = parseFloat(s.lat);
                    const lon = parseFloat(s.lon);

                    setSuggestions([]);
                    setSearchQuery("");
                    onLocationSelect(s.display_name, lat, lon);
                  }}
                  style={styles.suggestionRow}
                >
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color="#6347D1"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.suggestionText} numberOfLines={2}>
                    {s.display_name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.loaderRow}>
              <Text style={{ color: "#999", fontSize: 13 }}>
                Sin resultados encontrados
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    zIndex: 999,
    position: "relative",
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  clearButton: {
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  suggestionsBoxInline: {
    position: "absolute",
    top: 54,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
    maxHeight: 200,
  },
  loaderRow: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: "#444",
  },
});
