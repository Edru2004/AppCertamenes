
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import {
    actualizarCertamen,
    eliminarCertamen,
    getCertamenes,
} from '../../../services/api';

export default function CertamenesIndexScreen() {
  const router = useRouter();

  const [certamenes, setCertamenes] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<
    'TODOS' | 'Activo' | 'Inactivo'
  >('TODOS');
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      cargarCertamenes();
    }, [])
  );

  const cargarCertamenes = async () => {
    try {
      setCargando(true);

      const respuesta: any = await getCertamenes();

      const lista = Array.isArray(respuesta)
        ? respuesta
        : respuesta?.data || [];

      setCertamenes(lista);
    } catch (e: any) {
      Alert.alert(
        'Error',
        e?.message || 'Error de conexión con el servidor.'
      );
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = (id: number, nombre: string) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Deseas eliminar el certamen "${nombre}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const respuesta: any = await eliminarCertamen(id);

              // La función del servicio puede devolver un Response
              // o una respuesta JSON, según su implementación.
              if (
                respuesta &&
                typeof respuesta.ok === 'boolean' &&
                !respuesta.ok
              ) {
                let mensaje = 'No se pudo eliminar el certamen.';

                try {
                  const errorData = await respuesta.json();
                  mensaje = errorData.message || mensaje;
                } catch {}

                throw new Error(mensaje);
              }

              Alert.alert(
                '¡Éxito!',
                'Certamen eliminado correctamente.'
              );

              await cargarCertamenes();
            } catch (e: any) {
              Alert.alert(
                'Error al eliminar',
                e?.message || 'Error de conexión.'
              );
            }
          },
        },
      ]
    );
  };

  const handleToggleEstado = async (item: any) => {
    const id =
      item.Id_certamen ||
      item.Id_Certamen ||
      item.id_certamen ||
      item.id;

    const estadoActual = item.Estado || item.Estatus || 'Activo';
    const nuevoEstado =
      estadoActual === 'Activo' ? 'Inactivo' : 'Activo';

    try {
      const payload = {
        Nombre: item.Nombre || item.nombre,
        Fecha_evento:
          item.Fecha_evento || item.Fecha || item.fecha,
        Fecha: item.Fecha_evento || item.Fecha || item.fecha,
        Estado: nuevoEstado,
        Estatus: nuevoEstado,
      };

      await actualizarCertamen(Number(id), payload);

      await cargarCertamenes();
    } catch (e: any) {
      Alert.alert(
        'Error',
        e?.message || 'No se pudo cambiar el estado.'
      );
    }
  };

  // Filtrado de lista por búsqueda y estado
  const certamenesFiltrados = certamenes.filter((c) => {
    const nombre = (c.Nombre || c.nombre || '').toLowerCase();
    const estado = c.Estado || c.Estatus || 'Activo';

    const cumpleNombre = nombre.includes(
      busqueda.toLowerCase().trim()
    );

    const cumpleEstado =
      filtroEstado === 'TODOS' || estado === filtroEstado;

    return cumpleNombre && cumpleEstado;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Panel de Gestión de Certámenes
      </Text>

      {/* Botón para abrir el formulario de Nuevo Certamen */}
      <TouchableOpacity
        style={styles.btnNuevo}
        onPress={() => router.push('/registroEvento/form' as any)}
      >
        <Ionicons
          name="add-circle-outline"
          size={20}
          color="#fff"
        />
        <Text style={styles.btnNuevoText}>+ Nuevo Certamen</Text>
      </TouchableOpacity>

      {/* Campo de búsqueda */}
      <View style={styles.searchCard}>
        <Ionicons
          name="search-outline"
          size={18}
          color="#666"
        />
        <TextInput
          style={styles.inputSearch}
          placeholder="Buscar certamen por nombre..."
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      {/* Filtros de estado */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Estado:</Text>

        {(['TODOS', 'Activo', 'Inactivo'] as const).map((st) => (
          <TouchableOpacity
            key={st}
            style={[
              styles.chip,
              filtroEstado === st ? styles.chipActive : null,
            ]}
            onPress={() => setFiltroEstado(st)}
          >
            <Text
              style={[
                styles.chipText,
                filtroEstado === st ? styles.chipTextActive : null,
              ]}
            >
              {st}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista de certámenes */}
      {cargando ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#002b45" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {certamenesFiltrados.length === 0 ? (
            <Text style={styles.emptyText}>
              No hay certámenes registrados.
            </Text>
          ) : (
            certamenesFiltrados.map((item) => {
              const id =
                item.Id_certamen ||
                item.Id_Certamen ||
                item.id_certamen ||
                item.id;

              const nombre = item.Nombre || item.nombre || '';

              const fecha =
                item.Fecha_evento ||
                item.Fecha ||
                item.fecha ||
                'Sin fecha';

              const estado =
                item.Estado || item.Estatus || 'Activo';

              const isActivo = estado === 'Activo';

              return (
                <View key={id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardBadge}>
                      CERT-{id}
                    </Text>

                    <View
                      style={[
                        styles.statusBadge,
                        isActivo
                          ? styles.bgActive
                          : styles.bgInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          isActivo
                            ? styles.txtActive
                            : styles.txtInactive,
                        ]}
                      >
                        {estado}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardTitle}>{nombre}</Text>

                  <View style={styles.fechaRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color="#666"
                    />
                    <Text style={styles.fechaText}>
                      Fecha: {fecha}
                    </Text>
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[
                        styles.btnAction,
                        styles.btnEdit,
                      ]}
                      onPress={() =>
                        router.push({
                          pathname: '/registroEvento/form' as any,
                          params: {
                            id: String(id),
                            nombre,
                            fecha: String(fecha),
                            estado,
                          },
                        })
                      }
                    >
                      <Ionicons
                        name="create-outline"
                        size={16}
                        color="#fff"
                      />
                      <Text style={styles.btnActionText}>
                        Editar
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.btnAction,
                        styles.btnToggle,
                      ]}
                      onPress={() => handleToggleEstado(item)}
                    >
                      <Ionicons
                        name={
                          isActivo
                            ? 'pause-circle-outline'
                            : 'play-circle-outline'
                        }
                        size={16}
                        color="#fff"
                      />
                      <Text style={styles.btnActionText}>
                        {isActivo ? 'Desactivar' : 'Activar'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.btnAction,
                        styles.btnDelete,
                      ]}
                      onPress={() =>
                        handleEliminar(Number(id), nombre)
                      }
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color="#fff"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#002b45',
    marginBottom: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnNuevo: {
    flexDirection: 'row',
    backgroundColor: '#9eb23b',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  btnNuevoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
    marginBottom: 12,
  },
  inputSearch: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 15,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#002b45',
  },
  chipText: {
    fontSize: 12,
    color: '#333',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  scroll: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardBadge: {
    fontSize: 12,
    color: '#888',
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bgActive: {
    backgroundColor: '#d4edda',
  },
  bgInactive: {
    backgroundColor: '#f8d7da',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  txtActive: {
    color: '#155724',
  },
  txtInactive: {
    color: '#721c24',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#002b45',
    marginBottom: 8,
  },
  fechaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  fechaText: {
    fontSize: 13,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  btnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 4,
  },
  btnEdit: {
    backgroundColor: '#0284c7',
  },
  btnToggle: {
    backgroundColor: '#64748b',
  },
  btnDelete: {
    backgroundColor: '#dc2626',
  },
  btnActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#777',
    marginTop: 30,
  },
});
