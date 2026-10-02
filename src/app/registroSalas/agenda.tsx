import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CronogramaItem {
  hora: string;
  equipo: string;
  categoria: string;
  sala: string;
  ubicacion: string;
}

const PROGRAMA_OFICIAL: CronogramaItem[] = [
  {
    hora: '09:00 AM',
    equipo: 'Innovadores ITSSMT',
    categoria: 'Sistemas e IA',
    sala: 'Auditorio Central',
    ubicacion: 'Edificio K - Planta Alta',
  },
  {
    hora: '09:40 AM',
    equipo: 'Biotronics',
    categoria: 'Salud y Biotecnología',
    sala: 'Laboratorio Cómputo 2',
    ubicacion: 'Edificio D - Primer Piso',
  },
  {
    hora: '10:20 AM',
    equipo: 'EcoAgro Tech',
    categoria: 'Agroindustria',
    sala: 'Sala A-1 de Vinculación',
    ubicacion: 'Edificio de Vinculación',
  },
];

export default function AgendaOficialScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Programa Oficial de Presentaciones</Text>
      <Text style={styles.subtitle}>Consulta de salas y horarios del Certamen 2026</Text>

      <FlatList
        data={PROGRAMA_OFICIAL}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.timelineRow}>
            <View style={styles.timeBox}>
              <Text style={styles.timeText}>{item.hora}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.equipoTitle}>{item.equipo}</Text>
              <Text style={styles.catText}>{item.categoria}</Text>
              <View style={styles.divider} />
              <Text style={styles.locText}>
                <Ionicons name="location" size={13} color="#002b45" /> <Text style={{ fontWeight: 'bold' }}>{item.sala}</Text>
              </Text>
              <Text style={styles.subLocText}>{item.ubicacion}</Text>
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
  subtitle: { fontSize: 12, color: '#666', marginBottom: 15 },
  timelineRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  timeBox: { width: 75, backgroundColor: '#002b45', borderRadius: 8, justifyContent: 'center', alignItems: 'center', padding: 8 },
  timeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, elevation: 2 },
  equipoTitle: { fontSize: 15, fontWeight: 'bold', color: '#002b45' },
  catText: { fontSize: 12, color: '#666', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
  locText: { fontSize: 12, color: '#002b45' },
  subLocText: { fontSize: 11, color: '#888', marginTop: 1 },
});