import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const API_URL = 'http://192.168.1.99:8000/api';

export default function CertamenFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const editId = params.id ? String(params.id) : null;

  const [nombre, setNombre] = useState(params.nombre ? String(params.nombre) : '');
  const [fecha, setFecha] = useState<Date>(new Date());
  const [fechaTexto, setFechaTexto] = useState(params.fecha ? String(params.fecha) : '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [estado, setEstado] = useState<'Activo' | 'Inactivo'>(
    params.estado === 'Inactivo' ? 'Inactivo' : 'Activo'
  );
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (params.fecha) {
      setFechaTexto(String(params.fecha));
    }
  }, [params.fecha]);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre del certamen es obligatorio.');
      return;
    }

    if (!fechaTexto) {
      Alert.alert('Error', 'Por favor selecciona la fecha del evento.');
      return;
    }

    try {
      setGuardando(true);
      const token = await AsyncStorage.getItem('userToken');
      const esEdicion = !!editId;

      const url = esEdicion
        ? `${API_URL}/certamens/${editId}`
        : `${API_URL}/certamens`;

      const method = esEdicion ? 'PUT' : 'POST';

      const payload = {
        Nombre: nombre.trim(),
        Fecha_evento: fechaTexto,
        Fecha: fechaTexto,
        Estado: estado,
        Estatus: estado,
      };

      let res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      // Fallback si la ruta singular responde 404
      if (!res.ok && res.status === 404) {
        const urlAlt = esEdicion
          ? `${API_URL}/certamenes/${editId}`
          : `${API_URL}/certamenes`;
        res = await fetch(urlAlt, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        const errorMsg =
          data.message ||
          (data.errors
            ? Object.values(data.errors).flat().join('\n')
            : 'Error al procesar la solicitud');
        throw new Error(errorMsg);
      }

      Alert.alert(
        '¡Éxito!',
        `El certamen ha sido ${esEdicion ? 'actualizado' : 'guardado'} correctamente en la base de datos.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setNombre('');
              setFechaTexto('');
              router.back();
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert('Error al guardar', e.message || 'Error de conexión');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {editId ? 'Editar Certamen' : 'Registro de Certamen'}
      </Text>

      {/* Nombre */}
      <Text style={styles.label}>Nombre del Certamen *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. Certamen Nacional de Innovación 2026"
        value={nombre}
        onChangeText={setNombre}
      />

      {/* Selector de Fecha */}
      <Text style={styles.label}>Fecha del Evento *</Text>
      <TouchableOpacity
        style={styles.datePickerButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Ionicons name="calendar-outline" size={20} color="#002b45" />
        <Text style={[styles.datePickerText, !fechaTexto ? styles.placeholderText : null]}>
          {fechaTexto ? fechaTexto : 'Seleccionar fecha en el calendario'}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={fecha}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(event, selectedDate) => {
            if (Platform.OS === 'android') {
              setShowDatePicker(false);
            }
            if (selectedDate) {
              setFecha(selectedDate);
              setFechaTexto(formatDate(selectedDate));
            }
          }}
        />
      )}

      {/* Estado */}
      <Text style={styles.label}>Estado del Evento</Text>
      <View style={styles.statusRow}>
        <TouchableOpacity
          style={[
            styles.statusOption,
            estado === 'Activo' ? styles.statusSelectedActive : null,
          ]}
          onPress={() => setEstado('Activo')}
        >
          <Ionicons
            name={estado === 'Activo' ? 'checkmark-circle' : 'ellipse-outline'}
            size={20}
            color={estado === 'Activo' ? '#155724' : '#666'}
          />
          <Text
            style={[
              styles.statusOptionText,
              estado === 'Activo' ? styles.statusTextActive : null,
            ]}
          >
            Activo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statusOption,
            estado === 'Inactivo' ? styles.statusSelectedInactive : null,
          ]}
          onPress={() => setEstado('Inactivo')}
        >
          <Ionicons
            name={estado === 'Inactivo' ? 'checkmark-circle' : 'ellipse-outline'}
            size={20}
            color={estado === 'Inactivo' ? '#721c24' : '#666'}
          />
          <Text
            style={[
              styles.statusOptionText,
              estado === 'Inactivo' ? styles.statusTextInactive : null,
            ]}
          >
            Inactivo
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.btnSave, guardando ? styles.btnDisabled : null]}
        onPress={handleGuardar}
        disabled={guardando}
      >
        {guardando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="save-outline" size={20} color="#fff" />
            <Text style={styles.btnSaveText}>
              {editId ? 'Guardar Cambios' : 'Guardar Certamen'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 15 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#002b45', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#ccc' },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#ccc',
    gap: 10,
  },
  datePickerText: { fontSize: 14, color: '#333' },
  placeholderText: { color: '#888' },
  statusRow: { flexDirection: 'row', gap: 12, marginTop: 5 },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    gap: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  statusSelectedActive: { borderColor: '#28a745', backgroundColor: '#d4edda' },
  statusSelectedInactive: { borderColor: '#dc3545', backgroundColor: '#f8d7da' },
  statusOptionText: { fontSize: 14, fontWeight: '600', color: '#333' },
  statusTextActive: { color: '#155724' },
  statusTextInactive: { color: '#721c24' },
  btnSave: {
    flexDirection: 'row',
    backgroundColor: '#002b45',
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
    gap: 8,
  },
  btnDisabled: { backgroundColor: '#6c757d' },
  btnSaveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});