import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface AsignacionItem {
  id_asignacion: string;
  hora_inicio: string;
  id_equipo: string;
  equipoNombre: string;
  categoriaNombre: string;
  id_sala: string;
  salaNombre: string;
  ubicacion: string;
  id_usuario: string;
  juradoNombre: string;
}

const DATA_ASIGNACIONES: AsignacionItem[] = [
  {
    id_asignacion: 'ASIG-01',
    hora_inicio: '09:00 AM',
    id_equipo: 'EQ-01',
    equipoNombre: 'Innovadores ITSSMT',
    categoriaNombre: 'Sistemas e IA',
    id_sala: 'SAL-01',
    salaNombre: 'Auditorio Central',
    ubicacion: 'Edificio K - Planta Alta',
    id_usuario: 'USR-101',
    juradoNombre: 'Ing. Carlos Mendoza',
  },
  {
    id_asignacion: 'ASIG-02',
    hora_inicio: '09:40 AM',
    id_equipo: 'EQ-05',
    equipoNombre: 'Biotronics',
    categoriaNombre: 'Salud y Biotecnología',
    id_sala: 'SAL-02',
    salaNombre: 'Laboratorio Cómputo 2',
    ubicacion: 'Edificio D - Primer Piso',
    id_usuario: 'USR-102',
    juradoNombre: 'Dra. María Elena Ramos',
  },
];

export default function AsignacionesProgramaScreen() {
  const [asignaciones, setAsignaciones] = useState<AsignacionItem[]>(DATA_ASIGNACIONES);
  const [filtroSala, setFiltroSala] = useState('TODAS');
  const [modalVisible, setModalVisible] = useState(false);

  // Formulario de Nueva Asignación
  const [equipoSeleccionado, setEquipoSeleccionado] = useState('Innovadores ITSSMT (EQ-01)');
  const [salaSeleccionada, setSalaSeleccionada] = useState('SAL-01');
  const [juradoSeleccionado, setJuradoSeleccionado] = useState('Ing. Carlos Mendoza (USR-101)');
  const [horaInicio, setHoraInicio] = useState('09:00 AM');

  const asignacionesFiltradas = asignaciones.filter(
    (a) => filtroSala === 'TODAS' || a.id_sala === filtroSala
  );

  const handleCrearAsignacion = () => {
    if (!horaInicio.trim()) {
      Alert.alert('Hora Requerida', 'Por favor especifica la Hora_inicio.');
      return;
    }

    // REGLA DE NEGOCIO 1: Validación Traslape en Sala
    const conflictoSala = asignaciones.find(
      (a) => a.id_sala === salaSeleccionada && a.hora_inicio.trim().toLowerCase() === horaInicio.trim().toLowerCase()
    );
    if (conflictoSala) {
      Alert.alert(
        'Empalme Detectado (Sala Ocupada)',
        `La sala ${conflictoSala.salaNombre} ya tiene asignado al equipo "${conflictoSala.equipoNombre}" a las ${horaInicio}.`
      );
      return;
    }

    // REGLA DE NEGOCIO 2: Validación Traslape en Jurado
    const conflictoJurado = asignaciones.find(
      (a) => a.juradoNombre.includes('Carlos') && a.hora_inicio.trim().toLowerCase() === horaInicio.trim().toLowerCase()
    );
    if (conflictoJurado && juradoSeleccionado.includes('Carlos')) {
      Alert.alert(
        'Empalme Detectado (Jurado Ocupado)',
        `El jurado seleccionado ya se encuentra evaluando en otra sala a las ${horaInicio}.`
      );
      return;
    }

    // Crear la asignación
    const nueva: AsignacionItem = {
      id_asignacion: `ASIG-0${asignaciones.length + 1}`,
      hora_inicio: horaInicio,
      id_equipo: 'EQ-08',
      equipoNombre: equipoSeleccionado.split(' (')[0],
      categoriaNombre: 'Sistemas e IA',
      id_sala: salaSeleccionada,
      salaNombre: salaSeleccionada === 'SAL-01' ? 'Auditorio Central' : 'Laboratorio Cómputo 2',
      ubicacion: 'Edificio K - Planta Alta',
      id_usuario: 'USR-105',
      juradoNombre: juradoSeleccionado.split(' (')[0],
    };

    setAsignaciones((prev) => [...prev, nueva]);
    Alert.alert('Éxito', 'Asignación programada correctamente y sincronizada con la entidad Equipo.');
    setModalVisible(false);
  };

  const handleEliminar = (id: string) => {
    Alert.alert('Eliminar Asignación', '¿Deseas cancelar esta presentación?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => setAsignaciones((prev) => prev.filter((a) => a.id_asignacion !== id)),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Panel de Asignación (Entidad Asignacion)</Text>
        <TouchableOpacity style={styles.btnAgendar} onPress={() => setModalVisible(true)}>
          <Ionicons name="calendar" size={16} color="#fff" />
          <Text style={styles.btnAgendarText}>Agendar</Text>
        </TouchableOpacity>
      </View>

      {/* Filtro por Sala */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Filtrar Sala:</Text>
        <TouchableOpacity
          style={[styles.chip, filtroSala === 'TODAS' && styles.chipActive]}
          onPress={() => setFiltroSala('TODOS')}
        >
          <Text style={[styles.chipText, filtroSala === 'TODAS' && styles.chipTextActive]}>Todas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, filtroSala === 'SAL-01' && styles.chipActive]}
          onPress={() => setFiltroSala('SAL-01')}
        >
          <Text style={[styles.chipText, filtroSala === 'SAL-01' && styles.chipTextActive]}>Auditorio</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, filtroSala === 'SAL-02' && styles.chipActive]}
          onPress={() => setFiltroSala('SAL-02')}
        >
          <Text style={[styles.chipText, filtroSala === 'SAL-02' && styles.chipTextActive]}>Lab Cómputo</Text>
        </TouchableOpacity>
      </View>

      {/* Tabla de Asignaciones */}
      <FlatList
        data={asignacionesFiltradas}
        keyExtractor={(item) => item.id_asignacion}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.timeBadge}>
                <Ionicons name="time-outline" size={14} color="#002b45" />
                <Text style={styles.timeText}>{item.hora_inicio}</Text>
              </View>
              <Text style={styles.idText}>{item.id_asignacion}</Text>
            </View>

            <Text style={styles.equipoText}>{item.equipoNombre}</Text>
            <Text style={styles.subtext}>Categoría: {item.categoriaNombre}</Text>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                <Ionicons name="easel-outline" size={13} /> <Text style={{ fontWeight: 'bold' }}>{item.salaNombre}</Text> ({item.ubicacion})
              </Text>
              <Text style={styles.infoText}>
                <Ionicons name="person-outline" size={13} /> Jurado: {item.juradoNombre}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.btnDeleteAction}
              onPress={() => handleEliminar(item.id_asignacion)}
            >
              <Ionicons name="trash-outline" size={14} color="#dc3545" />
              <Text style={styles.btnDeleteText}>Eliminar Asignación</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Modal Formulario Modal Crear Asignación */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContainer}>
            <Text style={styles.modalTitle}>Crear Nueva Asignación</Text>

            <Text style={styles.label}>Seleccionar Equipo (Id_Equipo) *</Text>
            <View style={styles.pickerFake}>
              <Text style={styles.pickerFakeText}>{equipoSeleccionado}</Text>
            </View>

            <Text style={styles.label}>Seleccionar Sala (Id_sala) *</Text>
            <View style={styles.pickerFake}>
              <Text style={styles.pickerFakeText}>SAL-01: Auditorio Central</Text>
            </View>

            <Text style={styles.label}>Seleccionar Jurado / Evaluador (Id_usuario) *</Text>
            <View style={styles.pickerFake}>
              <Text style={styles.pickerFakeText}>{juradoSeleccionado}</Text>
            </View>

            <Text style={styles.label}>Hora de Inicio (Hora_inicio) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. 09:00 AM, 10:20 AM"
              value={horaInicio}
              onChangeText={setHoraInicio}
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
                onPress={handleCrearAsignacion}
              >
                <Text style={styles.btnSaveModalText}>Agendar Asignación</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 15 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#002b45', flex: 1 },
  btnAgendar: { flexDirection: 'row', backgroundColor: '#002b45', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', gap: 4 },
  btnAgendarText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 15 },
  filterLabel: { fontSize: 13, fontWeight: 'bold', color: '#444' },
  chip: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 15, backgroundColor: '#e0e0e0' },
  chipActive: { backgroundColor: '#002b45' },
  chipText: { fontSize: 11, color: '#333' },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eaf4ff', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, gap: 4 },
  timeText: { fontSize: 12, fontWeight: 'bold', color: '#002b45' },
  idText: { fontSize: 11, fontWeight: 'bold', color: '#888' },
  equipoText: { fontSize: 16, fontWeight: 'bold', color: '#002b45', marginTop: 8 },
  subtext: { fontSize: 12, color: '#555', marginTop: 2 },
  infoBox: { backgroundColor: '#f8f9fa', padding: 10, borderRadius: 8, marginTop: 10, gap: 4 },
  infoText: { fontSize: 12, color: '#333' },
  btnDeleteAction: { flexDirection: 'row', alignItems: 'center', marginTop: 10, alignSelf: 'flex-end', gap: 4 },
  btnDeleteText: { fontSize: 11, color: '#dc3545', fontWeight: 'bold' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#002b45', marginBottom: 15 },
  label: { fontSize: 12, fontWeight: '600', color: '#333', marginTop: 10, marginBottom: 4 },
  input: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, height: 42, borderWidth: 1, borderColor: '#ccc' },
  pickerFake: { backgroundColor: '#eaf4ff', padding: 12, borderRadius: 8 },
  pickerFakeText: { color: '#002b45', fontWeight: 'bold', fontSize: 12 },
  modalButtonsRow: { flexDirection: 'row', gap: 10, marginTop: 20, justifyContent: 'flex-end' },
  btnCancel: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, backgroundColor: '#e0e0e0' },
  btnCancelText: { color: '#333', fontWeight: 'bold', fontSize: 13 },
  btnSaveModal: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, backgroundColor: '#002b45' },
  btnSaveModalText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});