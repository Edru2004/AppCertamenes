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
import { useRouter } from 'expo-router';

export default function DesafiosFormScreen() {
  const router = useRouter();

  const [idCertamen, setIdCertamen] = useState('CERT-2026');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const handleGuardar = () => {
    // Validaciones
    if (!idCertamen) {
      Alert.alert('Error', 'Debes asociar obligatoriamente un Id_certamen válido.');
      return;
    }
    if (!nombre.trim()) {
      Alert.alert('Error', 'El Nombre del desafío es un campo obligatorio.');
      return;
    }
    if (!descripcion.trim()) {
      Alert.alert('Error', 'Ingresa la Descripción detallada del desafío.');
      return;
    }

    Alert.alert('Registro Exitoso', 'El Desafío ha sido guardado correctamente.', [
      { text: 'OK', onPress: () => router.push('/desafios' as any) },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Registro de Desafío (Entidad Desafios)</Text>

      {/* Certamen Asociado */}
      <Text style={styles.label}>Certamen Asociado (Id_certamen) *</Text>
      <View style={styles.pickerFake}>
        <Ionicons name="trophy-outline" size={20} color="#002b45" />
        <Text style={styles.pickerFakeText}>CERT-2026: Certamen Nacional 2026</Text>
      </View>

      {/* Nombre del Desafío */}
      <Text style={styles.label}>Nombre del Desafío (Nombre) *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. HackaHer, Semiconductores y Electromovilidad"
        value={nombre}
        onChangeText={setNombre}
      />

      {/* Descripción */}
      <Text style={styles.label}>Descripción Breve y Detallada (Descripcion) *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Detalla la problemática real, verticales tecnológicas y objetivos a resolver..."
        multiline
        numberOfLines={5}
        value={descripcion}
        onChangeText={setDescripcion}
      />

      {/* Botón Guardar */}
      <TouchableOpacity style={styles.btnSave} onPress={handleGuardar}>
        <Ionicons name="save-outline" size={20} color="#fff" />
        <Text style={styles.btnSaveText}>Guardar Desafío</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 15 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#002b45', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#ccc' },
  textArea: { height: 110, textAlignVertical: 'top', paddingTop: 10 },
  pickerFake: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eaf4ff', padding: 12, borderRadius: 8, gap: 10 },
  pickerFakeText: { color: '#002b45', fontWeight: 'bold', fontSize: 13 },
  btnSave: { flexDirection: 'row', backgroundColor: '#002b45', borderRadius: 10, height: 48, justifyContent: 'center', alignItems: 'center', marginTop: 30, marginBottom: 40, gap: 8 },
  btnSaveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});