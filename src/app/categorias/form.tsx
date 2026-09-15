import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function CategoriasFormScreen() {
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [desafiosSeleccionados, setDesafiosSeleccionados] = useState<string[]>([]);

  const listaDesafios = [
    { id: 'DES-1', titulo: 'Optimización Energética en Pymes' },
    { id: 'DES-2', titulo: 'Diagnóstico Temprano mediante IA' },
    { id: 'DES-3', titulo: 'Reducción de Huella Hídrica en Agricultura' },
  ];

  const toggleDesafios = (id: string) => {
    if (desafiosSeleccionados.includes(id)) {
      setDesafiosSeleccionados((prev) => prev.filter((item) => item !== id));
    } else {
      setDesafiosSeleccionados((prev) => [...prev, id]);
    }
  };

  const handleGuardar = () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre de la categoría es obligatorio.');
      return;
    }

    if (nombre.trim().toLowerCase() === 'salud y biotecnología') {
      Alert.alert(
        'Categoría Duplicada',
        'Ya existe una categoría con este nombre dentro del mismo Certamen.'
      );
      return;
    }

    Alert.alert('Éxito', 'La categoría ha sido guardada correctamente.', [
      { text: 'OK', onPress: () => router.push('/categorias' as any) },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Registro de Categoría</Text>

      <Text style={styles.label}>Certamen Asociado (Id_Certamen)</Text>
      <View style={styles.pickerFake}>
        <Ionicons name="trophy-outline" size={20} color="#002b45" />
        <Text style={styles.pickerFakeText}>Certamen Nacional de Innovación 2026</Text>
      </View>

      <Text style={styles.label}>Nombre de la Categoría *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. Agroindustria, Electromovilidad"
        value={nombre}
        onChangeText={setNombre}
      />

      <Text style={styles.label}>Descripción y Lineamientos</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Especifica el alcance y nivel de madurez esperado..."
        multiline
        numberOfLines={4}
        value={descripcion}
        onChangeText={setDescripcion}
      />

      <Text style={styles.label}>Vincular Desafíos Específicos</Text>
      {listaDesafios.map((desafios) => {
        const selected = desafiosSeleccionados.includes(desafios.id);
        return (
          <TouchableOpacity
            key={desafios.id}
            style={[styles.desafioCard, selected && styles.desafioSelected]}
            onPress={() => toggleDesafios(desafios.id)}
          >
            <Ionicons
              name={selected ? 'checkbox' : 'square-outline'}
              size={22}
              color={selected ? '#002b45' : '#666'}
            />
            <Text style={styles.desafioText}>{desafios.titulo}</Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity style={styles.btnSave} onPress={handleGuardar}>
        <Ionicons name="save-outline" size={20} color="#fff" />
        <Text style={styles.btnSaveText}>Guardar Categoría</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 15 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#002b45', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#ccc' },
  textArea: { height: 90, textAlignVertical: 'top', paddingTop: 10 },
  pickerFake: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eaf4ff', padding: 12, borderRadius: 8, gap: 10 },
  pickerFakeText: { color: '#002b45', fontWeight: 'bold' },
  desafioCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8, gap: 10, borderWidth: 1, borderColor: '#eee' },
  desafioSelected: { borderColor: '#002b45', backgroundColor: '#f0f7ff' },
  desafioText: { fontSize: 13, color: '#333' },
  btnSave: { flexDirection: 'row', backgroundColor: '#002b45', borderRadius: 10, height: 48, justifyContent: 'center', alignItems: 'center', marginTop: 25, marginBottom: 40, gap: 8 },
  btnSaveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});