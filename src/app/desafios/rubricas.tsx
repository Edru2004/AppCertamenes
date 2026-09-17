import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RubricaPregunta {
  id_pregunta: string;
  pregunta: string;
  valorMax: number;
}

export default function DesafioRubricaScreen() {
  const [nombreRubrica, setNombreRubrica] = useState('Rúbrica de Evaluación Semiconductores');
  const [puntuajeMax, setPuntuajeMax] = useState('100');
  
  const [preguntas, setPreguntas] = useState<RubricaPregunta[]>([
    { id_pregunta: 'P1', pregunta: 'Innovación del Prototipo y Viabilidad Técnica', valorMax: 50 },
    { id_pregunta: 'P2', pregunta: 'Presentación y Calidad del Pitched Deck', valorMax: 50 },
  ]);

  const [nuevaPregunta, setNuevaPregunta] = useState('');
  const [nuevoValor, setNuevoValor] = useState('');

  const sumaActual = preguntas.reduce((acc, p) => acc + p.valorMax, 0);
  const targetMax = parseInt(puntuajeMax) || 0;
  const esValido = sumaActual === targetMax;

  const handleAgregarPregunta = () => {
    if (!nuevaPregunta.trim() || !nuevoValor) {
      Alert.alert('Incompleto', 'Ingresa la pregunta y su Valor_Max.');
      return;
    }

    const valor = parseInt(nuevoValor);
    if (isNaN(valor) || valor <= 0) {
      Alert.alert('Valor Incorrecto', 'El Valor_Max debe ser un entero positivo.');
      return;
    }

    setPreguntas((prev) => [
      ...prev,
      { id_pregunta: `P${prev.length + 1}`, pregunta: nuevaPregunta, valorMax: valor },
    ]);
    setNuevaPregunta('');
    setNuevoValor('');
  };

  const handleGuardarRubrica = () => {
    // Regla de Negocio: Validar Suma de Preguntas === Puntuaje_Max
    if (!esValido) {
      Alert.alert(
        'Validación de Rúbrica Fallida',
        `La suma acumulada de las preguntas (${sumaActual} pts) debe ser exactamente igual a Puntuaje_Max (${targetMax} pts).`
      );
      return;
    }

    Alert.alert('Rúbrica Guardada', 'La Categorie_rubrice de relación 1:1 ha sido configurada.');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Asignación Categorie_rubrice (Relación 1:1)</Text>

      {/* Categorie_rubrice */}
      <Text style={styles.label}>Nombre de la Rúbrica (Categorie_rubrice.Nombre)</Text>
      <TextInput
        style={styles.input}
        value={nombreRubrica}
        onChangeText={setNombreRubrica}
      />

      <View style={styles.configCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sublabel}>Puntuaje_Max</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={puntuajeMax}
            onChangeText={setPuntuajeMax}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sublabel}>Total_preguntas</Text>
          <Text style={styles.counterText}>{preguntas.length}</Text>
        </View>
      </View>

      {/* Semáforo de Validación */}
      <View style={[styles.valCard, esValido ? styles.valOk : styles.valError]}>
        <Ionicons
          name={esValido ? 'checkmark-circle' : 'alert-circle'}
          size={22}
          color={esValido ? '#155724' : '#721c24'}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.valTitle, { color: esValido ? '#155724' : '#721c24' }]}>
            Suma actual: {sumaActual} / {targetMax} pts
          </Text>
          <Text style={styles.valSubtext}>
            {esValido ? 'Suma válida con Puntuaje_Max.' : `Diferencia de ${Math.abs(targetMax - sumaActual)} pts.`}
          </Text>
        </View>
      </View>

      {/* Formulario Preguntas */}
      <Text style={styles.sectionHeader}>Agregar Criterio / Pregunta (Entidad Rubrica)</Text>
      <View style={styles.addCard}>
        <TextInput
          style={styles.input}
          placeholder="Texto de la pregunta..."
          value={nuevaPregunta}
          onChangeText={setNuevaPregunta}
        />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Valor_Max"
            keyboardType="numeric"
            value={nuevoValor}
            onChangeText={setNuevoValor}
          />
          <TouchableOpacity style={styles.btnAdd} onPress={handleAgregarPregunta}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.btnAddText}>Agregar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Preguntas Lista */}
      <Text style={styles.sectionHeader}>Preguntas Asignadas</Text>
      {preguntas.map((p) => (
        <View key={p.id_pregunta} style={styles.preguntaItem}>
          <Text style={styles.preguntaText}>{p.pregunta}</Text>
          <Text style={styles.preguntaValor}>{p.valorMax} pts</Text>
        </View>
      ))}

      <TouchableOpacity style={styles.btnSave} onPress={handleGuardarRubrica}>
        <Ionicons name="save-outline" size={20} color="#fff" />
        <Text style={styles.btnSaveText}>Guardar Categorie_rubrice</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 15 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#002b45', marginBottom: 15 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },
  sublabel: { fontSize: 11, fontWeight: 'bold', color: '#666', marginBottom: 4 },
  input: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, height: 42, borderWidth: 1, borderColor: '#ccc' },
  configCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 10, gap: 12, marginTop: 10, marginBottom: 15 },
  counterText: { fontSize: 22, fontWeight: 'bold', color: '#002b45', marginTop: 4 },
  valCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, gap: 10, marginBottom: 15 },
  valOk: { backgroundColor: '#d4edda' },
  valError: { backgroundColor: '#f8d7da' },
  valTitle: { fontSize: 13, fontWeight: 'bold' },
  valSubtext: { fontSize: 11, color: '#444' },
  sectionHeader: { fontSize: 14, fontWeight: 'bold', color: '#002b45', marginTop: 10, marginBottom: 8 },
  addCard: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 15 },
  btnAdd: { backgroundColor: '#28a745', borderRadius: 8, paddingHorizontal: 15, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 4 },
  btnAddText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  preguntaItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 6 },
  preguntaText: { fontSize: 12, color: '#333', flex: 1 },
  preguntaValor: { fontSize: 12, fontWeight: 'bold', color: '#002b45' },
  btnSave: { flexDirection: 'row', backgroundColor: '#002b45', borderRadius: 10, height: 48, justifyContent: 'center', alignItems: 'center', marginTop: 20, marginBottom: 40, gap: 8 },
  btnSaveText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});