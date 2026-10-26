import {
    actualizarEquipo,
    crearEquipo,
    getCategCertamenes,
    getDesafios,
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

  // Catálogos
  const [listaDesafios, setListaDesafios] = useState<any[]>([]);
  const [listaCategorias, setListaCategorias] = useState<any[]>([]);

  // Campos del Equipo
  const [nombre, setNombre] = useState('');
  const [idDesafio, setIdDesafio] = useState<number | null>(null);
  const [idCategCertamen, setIdCategCertamen] = useState<number | null>(null);
  const [video, setVideo] = useState('');
  const [reporte, setReporte] = useState('');

  // Control del Modal de Selección
  const [modalType, setModalType] = useState<'desafio' | 'categoria' | null>(null);

  const cargarCatalogos = async () => {
    try {
      setCargandoCatalogos(true);
      const [desafiosRes, categoriasRes] = await Promise.all([
        getDesafios().catch(() => []),
        getCategCertamenes().catch(() => []),
      ]);

      setListaDesafios(Array.isArray(desafiosRes) ? desafiosRes : []);
      setListaCategorias(Array.isArray(categoriasRes) ? categoriasRes : []);
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
          setVideo(data.Video || '');
          setReporte(data.Reporte || '');
        } catch (e) {
          console.error('Error al parsear datos:', e);
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
    setVideo('');
    setReporte('');
  };

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      Alert.alert('Atención', 'Ingresa el nombre de tu equipo.');
      return;
    }

    if (!idDesafio) {
      Alert.alert('Atención', 'Selecciona el desafío en el que participará el equipo.');
      return;
    }

    if (!idCategCertamen) {
      Alert.alert('Atención', 'Selecciona la categoría del certamen.');
      return;
    }

    const payload = {
      Nombre: nombre.trim(),
      Id_desafio: Number(idDesafio),
      Id_categCertamen: Number(idCategCertamen),
      Video: video.trim() || null,
      Reporte: reporte.trim() || null,
    };

    try {
      setGuardando(true);

      if (idEquipo) {
        await actualizarEquipo(idEquipo, payload);
        limpiarFormulario();
        router.setParams({ equipoEditar: undefined });
        router.replace('/equipos' as any);
      } else {
        await crearEquipo(payload);
        limpiarFormulario();
        router.replace('/equipos' as any);
      }
    } catch (error: any) {
      console.error('Error al guardar equipo:', error);
      Alert.alert('Error al guardar', error.message || 'Verifica los datos enviados.');
    } finally {
      setGuardando(false);
    }
  };

  const desafioSeleccionado = listaDesafios.find((d) => d.Id_desafio === idDesafio);
  const categoriaSeleccionada = listaCategorias.find((c) => c.Id_categCertamen === idCategCertamen);

  if (cargandoCatalogos) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#002b45" />
        <Text style={{ marginTop: 10, color: '#002b45', fontWeight: 'bold' }}>
          Cargando certámenes y desafíos...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {idEquipo ? 'Editar Registro de Equipo' : 'Alta de Nuevo Equipo'}
      </Text>

      {/* Nombre del Equipo */}
      <Text style={styles.label}>Nombre del Equipo *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. Innovatech / Alpha Software"
        value={nombre}
        onChangeText={setNombre}
      />

      {/* Desafío */}
      <Text style={styles.label}>Desafío en el que Participa *</Text>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setModalType('desafio')}
      >
        <Text style={desafioSeleccionado ? styles.selectText : styles.placeholderText}>
          {desafioSeleccionado
            ? (desafioSeleccionado.Nombre || `Desafío #${desafioSeleccionado.Id_desafio}`)
            : 'Toca para seleccionar un desafío'}
        </Text>
        <Ionicons name="chevron-down-outline" size={18} color="#666" />
      </TouchableOpacity>

      {/* Categoría */}
      <Text style={styles.label}>Categoría del Certamen *</Text>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setModalType('categoria')}
      >
        <Text style={categoriaSeleccionada ? styles.selectText : styles.placeholderText}>
          {categoriaSeleccionada
            ? (categoriaSeleccionada.Nombre || `Categoría #${categoriaSeleccionada.Id_categCertamen}`)
            : 'Toca para seleccionar una categoría'}
        </Text>
        <Ionicons name="chevron-down-outline" size={18} color="#666" />
      </TouchableOpacity>

      {/* Entregables */}
      <Text style={styles.label}>Enlace al Video Demostrativo (YouTube / Drive)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. https://youtube.com/watch?v=..."
        value={video}
        onChangeText={setVideo}
      />

      <Text style={styles.label}>Enlace al Reporte en PDF (URL / Drive)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. https://drive.google.com/file/d/..."
        value={reporte}
        onChangeText={setReporte}
      />

      {/* Botón Guardar */}
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
              {idEquipo ? 'Actualizar Equipo' : 'Registrar Equipo'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Modal para Selección de Desafío / Categoría */}
      <Modal visible={modalType !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === 'desafio' ? 'Selecciona un Desafío' : 'Selecciona una Categoría'}
              </Text>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={modalType === 'desafio' ? listaDesafios : listaCategorias}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    if (modalType === 'desafio') setIdDesafio(item.Id_desafio);
                    if (modalType === 'categoria') setIdCategCertamen(item.Id_categCertamen);
                    setModalType(null);
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {item.Nombre || `Opción #${item.Id_desafio || item.Id_categCertamen}`}
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