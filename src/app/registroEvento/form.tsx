import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function CertamenFormScreen() {
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState<Date>(new Date());
  const [fechaTexto, setFechaTexto] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [estado, setEstado] = useState<'Activo' | 'Inactivo'>('Activo');

  // Formato AAAA-MM-DD
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setFecha(selectedDate);
      setFechaTexto(formatDate(selectedDate));
    }
  };

  const handleGuardar = () => {
    if (!nombre.trim()) {
        Alert.alert('Error', 'El nombre del certamen es obligatorio.');
        return;
    }

    if (!fechaTexto) {
        Alert.alert('Error', 'Por favor selecciona la fecha del evento.');
        return;
    }

    const nuevoCertamen = {
        Id_certamen: Date.now(), // ID temporal único
        Nombre: nombre,
        Fecha_evento: fechaTexto,
        Estado: estado,
    };

    Alert.alert('Éxito', 'El certamen ha sido guardado correctamente.', [
        {
        text: 'OK',
        onPress: () => {
            router.push({
            pathname: '/registroEvento',
            params: { nuevoEvento: JSON.stringify(nuevoCertamen) },
            });
        },
        },
    ]);
    };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Registro de Certamen</Text>

      {/* Nombre */}
      <Text style={styles.label}>Nombre del Certamen *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. Certamen Nacional de Innovación 2026"
        value={nombre}
        onChangeText={setNombre}
      />

      {/* Selector de Fecha con Calendario */}
      <Text style={styles.label}>Fecha del Evento *</Text>
      <TouchableOpacity
        style={styles.datePickerButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Ionicons name="calendar-outline" size={20} color="#002b45" />
        <Text style={[styles.datePickerText, !fechaTexto && styles.placeholderText]}>
          {fechaTexto ? fechaTexto : 'Seleccionar fecha en el calendario'}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
            value={fecha}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onValueChange={(event, selectedDate) => {
            if (Platform.OS === 'android') {
                setShowDatePicker(false);
            }
            if (selectedDate) {
                setFecha(selectedDate);
                setFechaTexto(formatDate(selectedDate));
            }
            }}
            onDismiss={() => setShowDatePicker(false)}
        />
        )}

      {/* Estado */}
      <Text style={styles.label}>Estado del Evento</Text>
      <View style={styles.statusRow}>
        <TouchableOpacity
          style={[styles.statusOption, estado === 'Activo' && styles.statusSelectedActive]}
          onPress={() => setEstado('Activo')}
        >
          <Ionicons
            name={estado === 'Activo' ? 'checkmark-circle' : 'ellipse-outline'}
            size={20}
            color={estado === 'Activo' ? '#155724' : '#666'}
          />
          <Text style={[styles.statusOptionText, estado === 'Activo' && styles.statusTextActive]}>
            Activo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statusOption, estado === 'Inactivo' && styles.statusSelectedInactive]}
          onPress={() => setEstado('Inactivo')}
        >
          <Ionicons
            name={estado === 'Inactivo' ? 'checkmark-circle' : 'ellipse-outline'}
            size={20}
            color={estado === 'Inactivo' ? '#721c24' : '#666'}
          />
          <Text style={[styles.statusOptionText, estado === 'Inactivo' && styles.statusTextInactive]}>
            Inactivo
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.btnSave} onPress={handleGuardar}>
        <Ionicons name="save-outline" size={20} color="#fff" />
        <Text style={styles.btnSaveText}>Guardar Certamen</Text>
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
  statusOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 8, flex: 1, gap: 8, borderWidth: 1, borderColor: '#eee' },
  statusSelectedActive: { borderColor: '#28a745', backgroundColor: '#d4edda' },
  statusSelectedInactive: { borderColor: '#dc3545', backgroundColor: '#f8d7da' },
  statusOptionText: { fontSize: 14, fontWeight: '600', color: '#333' },
  statusTextActive: { color: '#155724' },
  statusTextInactive: { color: '#721c24' },
  btnSave: { flexDirection: 'row', backgroundColor: '#002b45', borderRadius: 10, height: 48, justifyContent: 'center', alignItems: 'center', marginTop: 30, marginBottom: 40, gap: 8 },
  btnSaveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});