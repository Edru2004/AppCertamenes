import { Ionicons } from '@expo/vector-icons';
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

interface Criterio {
  id: string;
  pregunta: string;
  valorMax: number;
}

export default function RubricasConfigScreen() {
  const [puntuajeMax, setPuntuajeMax] = useState('100');
  const [criterios, setCriterios] = useState<Criterio[]>([
    { id: '1', pregunta: 'Innovación e Impacto Tecnológico', valorMax: 40 },
    { id: '2', pregunta: 'Factibilidad y Modelo de Negocio', valorMax: 30 },
  ]);

  const [nuevaPregunta, setNuevaPregunta] = useState('');
  const [nuevoValor, setNuevoValor] = useState('');

  const sumaActual = criterios.reduce((acc, curr) => acc + curr.valorMax, 0);
  const targetMax = parseInt(puntuajeMax) || 0;
  const esValido = sumaActual === targetMax;

  const handleAgregarCriterio = () => {
    if (!nuevaPregunta || !nuevoValor) {
      Alert.alert('Campos incompletos', 'Ingresa la pregunta y su valor máximo.');
      return;
    }

    const valor = parseInt(nuevoValor);
    if (isNaN(valor) || valor <= 0) {
      Alert.alert('Valor inválido', 'El valor debe ser mayor a 0.');
      return;
    }

    setCriterios((prev) => [
      ...prev,
      { id: Date.now().toString(), pregunta: nuevaPregunta, valorMax: valor },
    ]);
    setNuevaPregunta('');
    setNuevoValor('');
  };

  const handleGuardarRubrica = () => {
    if (!esValido) {
      Alert.alert(
        'Error de Validación',
        `La suma de los criterios (${sumaActual} pts) debe ser exactamente igual al Puntaje Máximo definido (${targetMax} pts).`
      );
      return;
    }

    Alert.alert('Rúbrica Configurada', 'Se asignaron correctamente los criterios de evaluación.');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Asignación de Rúbrica y Criterios</Text>

      <View style={styles.configCard}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Puntaje Máximo (Puntuaje_Max)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={puntuajeMax}
            onChangeText={setPuntuajeMax}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Total Preguntas</Text>
          <Text style={styles.counterText}>{criterios.length}</Text>
        </View>
      </View>

      <View style={[styles.valCard, esValido ? styles.valOk : styles.valError]}>
        <Ionicons
          name={esValido ? 'checkmark-circle' : 'alert-circle'}
          size={24}
          color={esValido ? '#155724' : '#721c24'}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.valTitle, { color: esValido ? '#155724' : '#721c24' }]}>
            Suma actual: {sumaActual} / {targetMax} pts
          </Text>
          <Text style={styles.valSubtext}>
            {esValido
              ? 'La suma coincide correctamente.'
              : `Faltan/Sobran ${Math.abs(targetMax - sumaActual)} puntos.`}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionHeader}>Agregar Criterio / Pregunta</Text>
      <View style={styles.addCard}>
        <TextInput
          style={styles.input}
          placeholder="Pregunta o Criterio..."
          value={nuevaPregunta}
          onChangeText={setNuevaPregunta}
        />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Valor Max (pts)"
            keyboardType="numeric"
            value={nuevoValor}
            onChangeText={setNuevoValor}
          />
          <TouchableOpacity style={styles.btnAdd} onPress={handleAgregarCriterio}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.btnAddText}>Agregar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionHeader}>Criterios Configurados</Text>
      {criterios.map((c) => (
        <View key={c.id} style={styles.criterioItem}>
          <Text style={styles.criterioText}>{c.pregunta}</Text>
          <Text style={styles.criterioPoints}>{c.valorMax} pts</Text>
        </View>
      ))}

      <TouchableOpacity style={styles.btnSave} onPress={handleGuardarRubrica}>
        <Ionicons name="checkbox-outline" size={20} color="#fff" />
        <Text style={styles.btnSaveText}>Guardar Rúbrica</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 15 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#002b45', marginBottom: 15 },
  configCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 10, gap: 15, marginBottom: 15 },
  inputGroup: { flex: 1 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#555', marginBottom: 4 },
  input: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, height: 42, borderWidth: 1, borderColor: '#ccc' },
  counterText: { fontSize: 22, fontWeight: 'bold', color: '#002b45', marginTop: 4 },
  valCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, gap: 10, marginBottom: 20 },
  valOk: { backgroundColor: '#d4edda' },
  valError: { backgroundColor: '#f8d7da' },
  valTitle: { fontSize: 14, fontWeight: 'bold' },
  valSubtext: { fontSize: 12, color: '#444' },
  sectionHeader: { fontSize: 14, fontWeight: 'bold', color: '#002b45', marginBottom: 10 },
  addCard: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 20 },
  btnAdd: { backgroundColor: '#28a745', borderRadius: 8, paddingHorizontal: 15, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 5 },
  btnAddText: { color: '#fff', fontWeight: 'bold' },
  criterioItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8 },
  criterioText: { fontSize: 13, color: '#333', flex: 1 },
  criterioPoints: { fontSize: 13, fontWeight: 'bold', color: '#002b45' },
  btnSave: { flexDirection: 'row', backgroundColor: '#002b45', borderRadius: 10, height: 48, justifyContent: 'center', alignItems: 'center', marginTop: 15, marginBottom: 40, gap: 8 },
  btnSaveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});