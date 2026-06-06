import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Option {
  label: string;
  value: string;
  icon?: string;
  color?: string;
}

interface SelectorProps {
  label: string;
  options: Option[];
  selectedValue: string | null;
  onSelect: (value: any) => void;
  columns?: number;
}

export const Selector = ({
  label,
  options,
  selectedValue,
  onSelect,
  columns = 2,
}: SelectorProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label} <Text style={{ color: "red" }}>*</Text>
      </Text>
      <View style={styles.grid}>
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => onSelect(option.value)}
              style={[
                styles.optionCard,
                { width: `${100 / columns - 2}%` },
                isSelected && styles.selectedCard,
                isSelected && option.color
                  ? {
                      borderColor: option.color,
                      backgroundColor: option.color + "15",
                    }
                  : null,
              ]}
            >
              {option.icon && (
                <Ionicons
                  name={option.icon as any}
                  size={20}
                  color={isSelected ? option.color || "#6347D1" : "#666"}
                />
              )}
              <Text
                style={[styles.optionText, isSelected && styles.selectedText]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 10 },
  label: { color: "#333", fontSize: 16, fontWeight: "600", marginBottom: 10 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  optionCard: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectedCard: {
    borderColor: "#6347D1",
    backgroundColor: "#F0EEFF",
  },
  optionText: { color: "#666", fontSize: 13, fontWeight: "500" },
  selectedText: { color: "#6347D1", fontWeight: "bold" },
});
