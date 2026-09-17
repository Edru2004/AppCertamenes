import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EquipoVinculado {
  id_equipo: string;
  nombreEquipo: string;
  id_categCertamen: string;
  reporteUrl: string;
  videoUrl: string;
  id_sala: string;
}

const DATA_EQUIPOS: EquipoVinculado[] = [
  {
    id_equipo: 'EQ-01',
    nombreEquipo: 'Innovadores ITSSMT',
    id_categCertamen: 'CAT-001 (Sistemas/IA)',
    reporteUrl: 'https://ejemplo.com/reporte.pdf',
    videoUrl: 'https://youtube.com/watch?v=123456',
    id_sala: 'Sala 03 - Edificio B',
  },
  {
    id_equipo: 'EQ-05',
    nombreEquipo: 'Biotronics',
    id_categCertamen: 'CAT-001 (Sistemas/IA)',
    reporteUrl: 'https://ejemplo.com/reporte2.pdf',
    videoUrl: '',
    id_sala: 'Sin Asignar',
  },
];

export default function EquiposDesafioScreen() {
  const abrirEnlace = (url: string) => {
    if (!url) {
      Alert.alert('No Disponible', 'El equipo aún no ha subido este entregable.');
      return;
    }
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monitoreo de Equipos (Entidad Equipo)</Text>
      <Text style={styles.subtitle}>Desafío: HackaHer • Total: {DATA_EQUIPOS.length} Equipos</Text>

      <FlatList
        data={DATA_EQUIPOS}
        keyExtractor={(item) => item.id_equipo}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.idText}>{item.id_equipo}</Text>
              <Text style={styles.salaBadge}>Sala: {item.id_sala}</Text>
            </View>

            <Text style={styles.nombreEquipo}>{item.nombreEquipo}</Text>
            <Text style={styles.categoriaText}>Categoría: {item.id_categCertamen}</Text>

            {/* Entregables: Reporte y Video */}
            <View style={styles.entregablesRow}>
              <TouchableOpacity
                style={[styles.btnLink, item.reporteUrl ? styles.btnPdf : styles.btnDisabled]}
                onPress={() => abrirEnlace(item.reporteUrl)}
              >
                <Ionicons name="document-text-outline" size={16} color="#fff" />
                <Text style={styles.btnLinkText}>Reporte PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnLink, item.videoUrl ? styles.btnVideo : styles.btnDisabled]}
                onPress={() => abrirEnlace(item.videoUrl)}
              >
                <Ionicons name="logo-youtube" size={16} color="#fff" />
                <Text style={styles.btnLinkText}>Video Demo</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 15 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#002b45' },
  subtitle: { fontSize: 12, color: '#666', marginBottom: 15, marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  idText: { fontSize: 11, fontWeight: 'bold', color: '#888' },
  salaBadge: { backgroundColor: '#eaf4ff', color: '#002b45', fontSize: 11, fontWeight: 'bold', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  nombreEquipo: { fontSize: 16, fontWeight: 'bold', color: '#002b45', marginTop: 4 },
  categoriaText: { fontSize: 12, color: '#555', marginTop: 2 },
  entregablesRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btnLink: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, gap: 5 },
  btnPdf: { backgroundColor: '#dc3545' },
  btnVideo: { backgroundColor: '#ff0000' },
  btnDisabled: { backgroundColor: '#ccc' },
  btnLinkText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
});