import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const PRIMARY = '#5B3FD9';
const ACCENT = '#7C63E8';

type FormData = {
  nombreCompleto: string;
  correo: string;
  cargo: string;
  contrasena: string;
  confirmarContrasena: string;
};

const INSTITUCIONES = [
  'Policía Boliviana',
  'ABC – Adm. Boliviana de Carreteras',
  'Gobernación de Cochabamba',
  'GAMC – Gobierno Municipal',
];

const PASOS = ['Datos', 'Acceso', 'Institución'];

export default function RegisterAutoridadScreen() {
  const [paso, setPaso] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [institucionSeleccionada, setInstitucionSeleccionada] = useState('');
  const [permisos, setPermisos] = useState({
    crearReportes: false,
    editarReportes: false,
    eliminarReportes: false,
    programarCierres: false,
  });

  const { control, handleSubmit, watch, trigger } = useForm<FormData>({
    defaultValues: {
      nombreCompleto: '',
      correo: '',
      cargo: '',
      contrasena: '',
      confirmarContrasena: '',
    },
    mode: 'onChange',
  });

  const contrasena = watch('contrasena');

  const togglePermiso = (key: keyof typeof permisos) => {
    setPermisos(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const siguientePaso = async () => {
    let valido = false;
    if (paso === 0) {
      valido = await trigger(['nombreCompleto', 'correo', 'cargo']);
    } else if (paso === 1) {
      valido = await trigger(['contrasena', 'confirmarContrasena']);
    }
    if (valido) setPaso(paso + 1);
  };

  const onSubmit = () => {
    if (!institucionSeleccionada) {
      Alert.alert('Error', 'Selecciona una institución');
      return;
    }
    Alert.alert('¡Éxito!', 'Autoridad registrada correctamente', [
      { text: 'OK', onPress: () => setPaso(0) }
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.panelLabel}>‹ PANEL AUTORIDAD</Text>
        <Text style={styles.title}>Nueva autoridad</Text>
        <Text style={styles.subtitle}>
          {paso === 0 && 'Completa los datos del nuevo usuario'}
          {paso === 1 && 'Configura el acceso al sistema'}
          {paso === 2 && 'Asigna institución y permisos'}
        </Text>

        {/* Stepper */}
        <View style={styles.stepper}>
          {PASOS.map((label, i) => (
            <View key={i} style={styles.stepItem}>
              <Text style={[styles.stepLabel, i === paso && styles.stepLabelActive]}>
                {label}
              </Text>
              <View style={[styles.stepUnderline, i !== paso && { backgroundColor: 'transparent' }]} />
            </View>
          ))}
        </View>
      </View>

      {/* Card */}
      <View style={styles.card}>

        {/* PASO 1 - Datos */}
        {paso === 0 && (
          <>
            <Controller
              control={control}
              name="nombreCompleto"
              rules={{ required: 'Este campo es obligatorio' }}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, error && styles.labelError]}>
                    Nombre completo <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={[styles.inputRow, error && styles.inputError]}>
                    <Text style={styles.inputIcon}>👤</Text>
                    <TextInput
                      style={styles.inputFlex}
                      placeholder="Juan Carlos Mamani"
                      placeholderTextColor="#bbb"
                      value={value}
                      onChangeText={onChange}
                    />
                  </View>
                  {error && <Text style={styles.errorText}>{error.message}</Text>}
                </View>
              )}
            />

            <Controller
              control={control}
              name="correo"
              rules={{
                required: 'Este campo es obligatorio',
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: 'Formato de correo inválido',
                },
              }}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, error && styles.labelError]}>
                    Correo electrónico <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={[styles.inputRow, error && styles.inputError]}>
                    <Text style={styles.inputIcon}>✉️</Text>
                    <TextInput
                      style={styles.inputFlex}
                      placeholder="autoridad@correo.bo"
                      placeholderTextColor="#bbb"
                      value={value}
                      onChangeText={onChange}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  {error && <Text style={styles.errorText}>{error.message}</Text>}
                </View>
              )}
            />

            <Controller
              control={control}
              name="cargo"
              rules={{ required: 'Este campo es obligatorio' }}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, error && styles.labelError]}>
                    Cargo en la institución
                  </Text>
                  <View style={[styles.inputRow, error && styles.inputError]}>
                    <Text style={styles.inputIcon}>🗂️</Text>
                    <TextInput
                      style={styles.inputFlex}
                      placeholder="Ej. Inspector de tráfico"
                      placeholderTextColor="#bbb"
                      value={value}
                      onChangeText={onChange}
                    />
                  </View>
                  {error && <Text style={styles.errorText}>{error.message}</Text>}
                </View>
              )}
            />

            <TouchableOpacity style={styles.button} onPress={siguientePaso} activeOpacity={0.85}>
              <Text style={styles.buttonText}>Continuar →</Text>
            </TouchableOpacity>
          </>
        )}

        {/* PASO 2 - Acceso */}
        {paso === 1 && (
          <>
            <Controller
              control={control}
              name="contrasena"
              rules={{
                required: 'Este campo es obligatorio',
                validate: (v) =>
                  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(v) ||
                  'Mínimo 8 caracteres con mayúscula, minúscula, número y símbolo',
              }}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, error && styles.labelError]}>
                    Contraseña temporal <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={[styles.inputRow, error && styles.inputError]}>
                    <Text style={styles.inputIcon}>🔒</Text>
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
                      <Text style={styles.eye}>{showPass ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.indicators}>
                    <Text style={[styles.indicator, /^.{8,}$/.test(value) && styles.indicatorOk]}>
                      ● Mínimo 8 caracteres
                    </Text>
                    <Text style={[styles.indicator, /[A-Z]/.test(value) && styles.indicatorOk]}>
                      ● Al menos una mayúscula
                    </Text>
                    <Text style={[styles.indicator, /[0-9]/.test(value) && styles.indicatorOk]}>
                      ● Al menos un número
                    </Text>
                    <Text style={[styles.indicator, /[\W_]/.test(value) && styles.indicatorOk]}>
                      ● Al menos un símbolo
                    </Text>
                  </View>
                </View>
              )}
            />

            <Controller
              control={control}
              name="confirmarContrasena"
              rules={{
                required: 'Este campo es obligatorio',
                validate: (value) => value === contrasena || 'Las contraseñas no coinciden',
              }}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, error && styles.labelError]}>
                    Confirmar contraseña <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={[styles.inputRow, error && styles.inputError]}>
                    <Text style={styles.inputIcon}>🔒</Text>
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
                      <Text style={styles.eye}>{showConfirm ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                  </View>
                  {error && <Text style={styles.errorText}>{error.message}</Text>}
                </View>
              )}
            />

            <TouchableOpacity style={styles.button} onPress={siguientePaso} activeOpacity={0.85}>
              <Text style={styles.buttonText}>Continuar →</Text>
            </TouchableOpacity>
          </>
        )}

        {/* PASO 3 - Institución */}
        {paso === 2 && (
          <>
            <Text style={styles.label}>
              Institución <Text style={styles.required}>*</Text>
            </Text>
            {INSTITUCIONES.map((inst) => (
              <TouchableOpacity
                key={inst}
                style={[styles.institucionRow, institucionSeleccionada === inst && styles.institucionSelected]}
                onPress={() => setInstitucionSeleccionada(inst)}
              >
                <View style={[styles.radio, institucionSeleccionada === inst && styles.radioSelected]} />
                <Text style={styles.institucionText}>{inst}</Text>
              </TouchableOpacity>
            ))}

            <Text style={[styles.label, { marginTop: 20 }]}>Permisos</Text>

            {[
              { key: 'crearReportes', icon: '✏️', label: 'Crear reportes' },
              { key: 'editarReportes', icon: '📝', label: 'Editar reportes' },
              { key: 'eliminarReportes', icon: '🗑️', label: 'Eliminar reportes' },
              { key: 'programarCierres', icon: '📅', label: 'Programar cierres' },
            ].map(({ key, icon, label }) => (
              <View key={key} style={styles.permisoRow}>
                <Text style={styles.permisoIcon}>{icon}</Text>
                <Text style={styles.permisoLabel}>{label}</Text>
                <Switch
                  value={permisos[key as keyof typeof permisos]}
                  onValueChange={() => togglePermiso(key as keyof typeof permisos)}
                  trackColor={{ false: '#ddd', true: PRIMARY }}
                  thumbColor="#fff"
                />
              </View>
            ))}

            <TouchableOpacity style={[styles.button, { marginTop: 24 }]} onPress={onSubmit} activeOpacity={0.85}>
              <Text style={styles.buttonText}>👤 Registrar autoridad</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PRIMARY },
  header: {
    paddingTop: 55,
    paddingBottom: 20,
    paddingHorizontal: 25,
  },
  panelLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 16 },
  stepper: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  stepItem: { alignItems: 'center', minWidth: 70 },
  stepLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  stepLabelActive: { color: '#fff', fontWeight: 'bold' },
  stepUnderline: { height: 2, width: '100%', backgroundColor: '#fff', marginTop: 3 },
  card: {
    backgroundColor: '#F7F7FC',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 28,
    paddingTop: 32,
    flexGrow: 1,
  },
  fieldContainer: { marginBottom: 18 },
  label: { color: ACCENT, fontWeight: '600', fontSize: 13, marginBottom: 6 },
  labelError: { color: '#E53935' },
  required: { color: '#E53935' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E8F0',
    paddingRight: 12,
  },
  inputIcon: { paddingHorizontal: 12, fontSize: 16 },
  inputFlex: { flex: 1, padding: 14, fontSize: 15, color: '#1E1E2E' },
  inputError: { borderColor: '#E53935', backgroundColor: '#FFF5F5' },
  eye: { fontSize: 16 },
  errorText: { color: '#E53935', fontSize: 12, marginTop: 5 },
  indicators: { marginTop: 8, gap: 4 },
  indicator: { color: '#aaa', fontSize: 12 },
  indicatorOk: { color: PRIMARY },
  button: {
    backgroundColor: PRIMARY,
    padding: 17,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    elevation: 6,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  institucionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E8F0',
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  institucionSelected: {
    borderColor: PRIMARY,
    backgroundColor: '#F0EDFF',
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ccc',
  },
  radioSelected: {
    borderColor: PRIMARY,
    backgroundColor: PRIMARY,
  },
  institucionText: { color: '#1E1E2E', fontSize: 14 },
  permisoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8F0',
    gap: 10,
  },
  permisoIcon: { fontSize: 16 },
  permisoLabel: { flex: 1, color: '#1E1E2E', fontSize: 14 },
});