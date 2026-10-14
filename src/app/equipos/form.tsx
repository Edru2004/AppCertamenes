import {
  actualizarEquipo,
  crearEquipo,
  getCategCertamenes,
  getDesafios,
  getSalas,
} from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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

export default function EquipoFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ equipoEditar?: string }>();

  const [idEquipo, setIdEquipo] = useState<number | null>(null);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Listas de catálogos
  const [listaDesafios, setListaDesafios] = useState<any[]>([]);
  const [listaCategorias, setListaCategorias] = useState<any[]>([]);
  const [listaSalas, setListaSalas] = useState<any[]>([]);

  // Estados de los campos
  const [nombre, setNombre] = useState('');
  const [idDesafio, setIdDesafio] = useState<number | null>(null);
  const [idCategCertamen, setIdCategCertamen] = useState<number | null>(null);
  const [idSala, setIdSala] = useState<number | null>(null);
  const [video, setVideo] = useState('');
  const [reporte, setReporte] = useState('');

  // Control de Modales para Selección
  const [modalType, setModalType] = useState<'desafio' | 'categoria' | 'sala' | null>(null);

  const cargarCatalogos = async () => {
    try {
      setCargandoCatalogos(true);
      const [desafiosRes, categoriasRes, salasRes] = await Promise.all([
        getDesafios().catch(() => []),
        getCategCertamenes().catch(() => []),
        getSalas().catch(() => []),
      ]);

      setListaDesafios(Array.isArray(desafiosRes) ? desafiosRes : []);
      setListaCategorias(Array.isArray(categoriasRes) ? categoriasRes : []);
      setListaSalas(Array.isArray(salasRes) ? salasRes : []);
    } catch (e) {
      console.error('Error al cargar catálogos:', e);
    } finally {
      setCargandoCatalogos(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarCatalogos();

      if (typeof params.equipoEditar === 'string' && params.equipoEditar.trim() !== '') {
        try {
          const data = JSON.parse(params.equipoEditar);
          setIdEquipo(data.Id_equipo);
          setNombre(data.Nombre || '');
          setIdDesafio(data.Id_desafio ? Number(data.Id_desafio) : null);
          setIdCategCertamen(data.Id_categCertamen ? Number(data.Id_categCertamen) : null);
          setIdSala(data.Id_sala ? Number(data.Id_sala) : null);
          setVideo(data.Video || '');
          setReporte(data.Reporte || '');
        } catch (e) {
          console.error('Error al parsear datos de edición:', e);
        }
      } else {
        limpiarFormulario();
      }
    }, [params.equipoEditar])
  );

  const limpiarFormulario = () => {
    setIdEquipo(null);
    setNombre('');
    setIdDesafio(null);
    setIdCategCertamen(null);
    setIdSala(null);
    setVideo('');
    setReporte('');
  };

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      Alert.alert('Atención', 'Ingresa el nombre del equipo.');
      return;
    }

    if (!idDesafio) {
      Alert.alert('Atención', 'Selecciona un desafío de la lista.');
      return;
    }

    if (!idCategCertamen) {
      Alert.alert('Atención', 'Selecciona una categoría de certamen.');
      return;
    }

    // Estructura exacta que espera la validación de Laravel
    const payload = {
      Nombre: nombre.trim(),
      Id_desafio: Number(idDesafio),
      Id_categCertamen: Number(idCategCertamen),
      Id_sala: idSala ? Number(idSala) : null,
      Video: video.trim() || null,
      Reporte: reporte.trim() || null,
    };

    try {
      setGuardando(true);

      if (idEquipo) {
        // EDICIÓN
        await actualizarEquipo(idEquipo, payload);
        limpiarFormulario();
        router.setParams({ equipoEditar: undefined });
        // Redirecciona al panel principal de equipos
        router.replace('/equipos' as any);
      } else {
        // CREACIÓN
        await crearEquipo(payload);
        limpiarFormulario();
        // Redirecciona al panel principal de equipos
        router.replace('/equipos' as any);
      }
    } catch (error: any) {
      console.error('Error guardando/editando equipo:', error);
      Alert.alert(
        'Error al guardar',
        error.message || 'Ocurrió un error al guardar en la base de datos.'
      );
    } finally {
      setGuardando(false);
    }
  };

  // Nombres seleccionados para la UI
  const desafioSeleccionado = listaDesafios.find((d) => d.Id_desafio === idDesafio);
  const categoriaSeleccionada = listaCategorias.find((c) => c.Id_categCertamen === idCategCertamen);
  const salaSeleccionada = listaSalas.find((s) => s.Id_sala === idSala);

  if (cargandoCatalogos) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#002b45" />
        <Text style={{ marginTop: 10, color: '#002b45', fontWeight: 'bold' }}>
          Cargando datos...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {idEquipo ? 'Editar Equipo' : 'Registro de Equipo'}
      </Text>

      {/* Nombre del Equipo */}
      <Text style={styles.label}>Nombre del Equipo *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. Alpha Tech"
        value={nombre}
        onChangeText={setNombre}
      />

      {/* Selector Personalizado: Desafío */}
      <Text style={styles.label}>Selecciona Desafío *</Text>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setModalType('desafio')}
      >
        <Text style={desafioSeleccionado ? styles.selectText : styles.placeholderText}>
          {desafioSeleccionado ? (desafioSeleccionado.Nombre || `Desafío #${desafioSeleccionado.Id_desafio}`) : 'Selecciona un desafío'}
        </Text>
        <Ionicons name="chevron-down-outline" size={18} color="#666" />
      </TouchableOpacity>

      {/* Selector Personalizado: Categoría */}
      <Text style={styles.label}>Selecciona Categoría Certamen *</Text>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setModalType('categoria')}
      >
        <Text style={categoriaSeleccionada ? styles.selectText : styles.placeholderText}>
          {categoriaSeleccionada ? (categoriaSeleccionada.Nombre || `Categoría #${categoriaSeleccionada.Id_categCertamen}`) : 'Selecciona una categoría'}
        </Text>
        <Ionicons name="chevron-down-outline" size={18} color="#666" />
      </TouchableOpacity>

      {/* Selector Personalizado: Sala */}
      <Text style={styles.label}>Sala Asignada (Opcional)</Text>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setModalType('sala')}
      >
        <Text style={salaSeleccionada ? styles.selectText : styles.placeholderText}>
          {salaSeleccionada ? (salaSeleccionada.Nombre || `Sala #${salaSeleccionada.Id_sala}`) : 'Sin Sala'}
        </Text>
        <Ionicons name="chevron-down-outline" size={18} color="#666" />
      </TouchableOpacity>

      {/* Entregables */}
      <Text style={styles.label}>Enlace del Video Demostrativo (URL)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. https://youtube.com/watch?v=..."
        value={video}
        onChangeText={setVideo}
      />

      <Text style={styles.label}>Enlace del Reporte en PDF (URL / Drive)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. https://drive.google.com/file/d/..."
        value={reporte}
        onChangeText={setReporte}
      />

      {/* Botón Guardar / Actualizar */}
      <TouchableOpacity
        style={[styles.btnSave, guardando && { opacity: 0.7 }]}
        onPress={handleGuardar}
        disabled={guardando}
      >
        {guardando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="save-outline" size={20} color="#fff" />
            <Text style={styles.btnSaveText}>
              {idEquipo ? 'Actualizar Equipo' : 'Guardar Equipo'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* MODAL DE SELECCIÓN */}
      <Modal visible={modalType !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === 'desafio' && 'Selecciona un Desafío'}
                {modalType === 'categoria' && 'Selecciona una Categoría'}
                {modalType === 'sala' && 'Selecciona una Sala'}
              </Text>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={
                modalType === 'desafio'
                  ? listaDesafios
                  : modalType === 'categoria'
                  ? listaCategorias
                  : [{ Id_sala: null, Nombre: 'Sin Sala' }, ...listaSalas]
              }
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    if (modalType === 'desafio') setIdDesafio(item.Id_desafio);
                    if (modalType === 'categoria') setIdCategCertamen(item.Id_categCertamen);
                    if (modalType === 'sala') setIdSala(item.Id_sala);
                    setModalType(null);
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {item.Nombre || `Opción #${item.Id_desafio || item.Id_categCertamen || item.Id_sala}`}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 15 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#002b45', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#ccc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: { color: '#333', fontSize: 14 },
  placeholderText: { color: '#999', fontSize: 14 },
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
  btnSaveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Estilos del Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '70%',
    padding: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#002b45' },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: { fontSize: 14, color: '#333' },
});