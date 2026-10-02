import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SalaItem {
  id_sala: string;
  nombre: string;
  ubicacion: string;
  id_jurado: string;
  juradoNombre: string;
}

const DATA_SALAS_INICIAL: SalaItem[] = [
  {
    id_sala: 'SAL-01',
    nombre: 'Auditorio Central',
    ubicacion: 'Edificio K - Planta Alta',
    id_jurado: 'JUR-10',
    juradoNombre: 'Ing. Carlos Mendoza (Jurado A)',
  },
  {
    id_sala: 'SAL-02',
    nombre: 'Laboratorio de Cómputo 2',
    ubicacion: 'Edificio D - Primer Piso',
    id_jurado: 'JUR-12',
    juradoNombre: 'Dra. María Elena Ramos (Jurado B)',
  },
  {
    id_sala: 'SAL-03',
    nombre: 'Sala A-1 de Vinculación',
    ubicacion: 'Edificio de Vinculación',
    id_jurado: 'JUR-15',
    juradoNombre: 'Mtro. Roberto Gómez (Jurado C)',
  },
];

export default function SalasIndexScreen() {
  const [salas, setSalas] = useState<SalaItem[]>(DATA_SALAS_INICIAL);
  const [busqueda, setBusqueda] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  // Formulario Modal
  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [juradoNombre, setJuradoNombre] = useState('');

  const salasFiltradas = salas.filter(
    (s) =>
      s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.ubicacion.toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirModalNuevo = () => {
    setEditandoId(null);
    setNombre('');
    setUbicacion('');
    setJuradoNombre('Ing. Carlos Mendoza');
    setModalVisible(true);
  };

  const abrirModalEditar = (item: SalaItem) => {
    setEditandoId(item.id_sala);
    setNombre(item.nombre);
    setUbicacion(item.ubicacion);
    setJuradoNombre(item.juradoNombre);
    setModalVisible(true);
  };

  const handleGuardarSala = () => {
    if (!nombre.trim() || !ubicacion.trim()) {
      Alert.alert('Campos Obligatorios', 'Por favor ingresa el Nombre y la Ubicación de la sala.');
      return;
    }

    if (editandoId) {
      setSalas((prev) =>
        prev.map((s) =>
          s.id_sala === editandoId
            ? { ...s, nombre, ubicacion, juradoNombre }
            : s
        )
      );
      Alert.alert('Éxito', 'La sala ha sido actualizada correctamente.');
    } else {
      const nuevaSala: SalaItem = {
        id_sala: `SAL-0${salas.length + 1}`,
        nombre,
        ubicacion,
        id_jurado: `JUR-${salas.length + 20}`,
        juradoNombre: juradoNombre || 'Jurado Por Asignar',
      };
      setSalas((prev) => [...prev, nuevaSala]);
      Alert.alert('Éxito', 'La nueva sala fue agregada al inventario.');
    }

    setModalVisible(false);
  };

  const handleEliminarSala = (id: string, nombreSala: string) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Deseas eliminar la sala "${nombreSala}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setSalas((prev) => prev.filter((s) => s.id_sala !== id));
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Catálogo de Salas (Entidad Salas)</Text>
        <TouchableOpacity style={styles.btnNuevo} onPress={abrirModalNuevo}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.btnNuevoText}>Nueva Sala</Text>
        </TouchableOpacity>
      </View>

      {/* Buscador */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o ubicación..."
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      {/* Lista de Salas */}
      <FlatList
        data={salasFiltradas}
        keyExtractor={(item) => item.id_sala}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.idText}>{item.id_sala}</Text>
              <Text style={styles.juradoBadge}>
                <Ionicons name="person-outline" size={12} /> {item.juradoNombre}
              </Text>
            </View>

            <Text style={styles.nombreText}>{item.nombre}</Text>
            <Text style={styles.ubicacionText}>
              <Ionicons name="location-outline" size={14} color="#002b45" /> {item.ubicacion}
            </Text>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.btnAction, styles.btnEdit]}
                onPress={() => abrirModalEditar(item)}
              >
                <Ionicons name="create-outline" size={15} color="#fff" />
                <Text style={styles.btnActionText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnAction, styles.btnDelete]}
                onPress={() => handleEliminarSala(item.id_sala, item.nombre)}
              >
                <Ionicons name="trash-outline" size={15} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Modal Formulario Crear / Editar */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {editandoId ? 'Editar Sala' : 'Registrar Nueva Sala'}
            </Text>

            <Text style={styles.label}>Nombre de la Sala *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Auditorio Central, Sala B-2"
              value={nombre}
              onChangeText={setNombre}
            />

            <Text style={styles.label}>Ubicación / Edificio *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Edificio K - Planta Alta"
              value={ubicacion}
              onChangeText={setUbicacion}
            />

            <Text style={styles.label}>Jurado Asignado (Relación 1:1)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Ing. Carlos Mendoza"
              value={juradoNombre}
              onChangeText={setJuradoNombre}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnSaveModal}
                onPress={handleGuardarSala}
              >
                <Text style={styles.btnSaveModalText}>Guardar Sala</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 15 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#002b45', flex: 1 },
  btnNuevo: { flexDirection: 'row', backgroundColor: '#002b45', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', gap: 4 },
  btnNuevoText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 15 },
  searchInput: { flex: 1, height: 40, marginLeft: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  idText: { fontSize: 11, fontWeight: 'bold', color: '#888' },
  juradoBadge: { backgroundColor: '#eaf4ff', color: '#002b45', fontSize: 11, fontWeight: 'bold', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  nombreText: { fontSize: 16, fontWeight: 'bold', color: '#002b45', marginTop: 4 },
  ubicacionText: { fontSize: 13, color: '#555', marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 12, justifyContent: 'flex-end' },
  btnAction: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, gap: 4 },
  btnEdit: { backgroundColor: '#007bff' },
  btnDelete: { backgroundColor: '#dc3545' },
  btnActionText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  // Estilos del Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#002b45', marginBottom: 15 },
  label: { fontSize: 12, fontWeight: '600', color: '#333', marginTop: 10, marginBottom: 4 },
  input: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, height: 42, borderWidth: 1, borderColor: '#ccc' },
  modalButtonsRow: { flexDirection: 'row', gap: 10, marginTop: 20, justifyContent: 'flex-end' },
  btnCancel: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, backgroundColor: '#e0e0e0' },
  btnCancelText: { color: '#333', fontWeight: 'bold', fontSize: 13 },
  btnSaveModal: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, backgroundColor: '#002b45' },
  btnSaveModalText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});