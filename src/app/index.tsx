import LoginFormulario from "@/features/auth/screens/LoginScreen";
import { StyleSheet, View } from "react-native";

export default function Page() {
  return (
    <View style={styles.container}>
      <LoginFormulario />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
