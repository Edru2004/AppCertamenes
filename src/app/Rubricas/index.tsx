import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const API_URL = 'http://192.168.1.99:8000/api';

export default function RubricasIndexScreen() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<any[]>([]);
  const [categoriaSel, setCategoriaSel] = useState<number | null>(null);
  const [criterios, setCriterios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [categoriaSel])
  );

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const token = await AsyncStorage.getItem('userToken');
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // 1. Cargar categorías de certamen
      const resCat = await fetch(`${API_URL}/categoria-certamens`, { headers });
      if (resCat.ok) {
        const dataCat = await resCat.json();
        const listCat = Array.isArray(dataCat) ? dataCat : dataCat.data || [];
        setCategorias(listCat);

        if (!categoriaSel && listCat.length > 0) {
          const primerId =
            listCat[0].Id_categCertamen ||
            listCat[0].idCategoria_certa ||
            listCat[0].id;
          setCategoriaSel(Number(primerId));
        }
      }

      // 2. Cargar rúbricas de la categoría seleccionada
      if (categoriaSel) {
        let resRub = await fetch(
          `${API_URL}/rubricas?Id_categoriaRubrica=${categoriaSel}`,
          { headers }
        );

        if (!resRub.ok) {
          resRub = await fetch(
            `${API_URL}/rubricas?idCategoria_r=${categoriaSel}`,
            { headers }
          );
        }

        if (resRub.ok) {
          const dataRub = await resRub.json();
          const listRub = Array.isArray(dataRub) ? dataRub : dataRub.data || [];
          setCriterios(listRub);
        }
      }
    } catch (e) {
      console.log('Error al cargar datos de rúbricas');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = (idRubrica: number, pregunta: string) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Deseas eliminar el criterio "${pregunta}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              const res = await fetch(`${API_URL}/rubricas/${idRubrica}`, {
                method: 'DELETE',
                headers: {
                  Accept: 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
              });

              if (res.ok) {
                Alert.alert('¡Éxito!', 'Criterio eliminado correctamente.');
                cargarDatos();
              } else {
                Alert.alert('Error', 'No se pudo eliminar el criterio.');
              }
            } catch (e) {
              Alert.alert('Error', 'Error de conexión.');
            }
          },
        },
      ]
    );
  };

  // Cálculo acumulado del valor máximo total
  const totalPuntos = criterios.reduce(
    (sum, item) =>
      sum +
      Number(
        item.Valor_Max || item.valor_maximo || item['valor maximo'] || 0
      ),
    0
  );

  return (
    <View style={styles.container}>
      <Text style={styles.labelHeader}>Selecciona la Categoría:</Text>

      {/* Selector Horizontal de Categorías */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
      >
        {categorias.map((cat) => {
          const id = Number(
            cat.Id_categCertamen || cat.idCategoria_certa || cat.id
          );
          const nombre = cat.Nombre || cat.nombre;
          const isSelected = categoriaSel === id;

          return (
            <TouchableOpacity
              key={id}
              style={[
                styles.catChip,
                isSelected ? styles.catChipActive : null,
              ]}
              onPress={() => setCategoriaSel(id)}
            >
              <Text
                style={[
                  styles.catChipText,
                  isSelected ? styles.catChipTextActive : null,
                ]}
              >
                {nombre}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Cabecera del Panel */}
      <View style={styles.panelHeader}>
        <View>
          <Text style={styles.panelTitle}>Criterios de Evaluación</Text>
          <Text style={styles.totalPuntosText}>
            Puntaje Máximo Total: {totalPuntos} pts
          </Text>
        </View>

        <TouchableOpacity
          style={styles.btnNuevo}
          onPress={() =>
            router.push({
              pathname: '/Rubricas/form' as any,
              params: { idCategoria_r: categoriaSel },
            })
          }
          disabled={!categoriaSel}
        >
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.btnNuevoText}>Agregar Criterio</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Criterios */}
      {cargando ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#002b45" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {criterios.length === 0 ? (
            <Text style={styles.emptyText}>
              No hay criterios registrados para esta categoría.
            </Text>
          ) : (
            criterios.map((item, index) => {
              const id = item.Id_rubrica || item.idRubrica || item.id;
              const preguntaText = item.Pregunta || item.pregunta || 'Sin pregunta';
              const vMax =
                item.Valor_Max || item.valor_maximo || item['valor maximo'] || 0;

              return (
                <View key={id || index} style={styles.card}>
                  <View style={styles.cardRow}>
                    <View style={styles.infoCol}>
                      <Text style={styles.preguntaText}>{preguntaText}</Text>
                      <Text style={styles.puntosBadge}>
                        Valor Máximo: <Text style={styles.bold}>{vMax} pts</Text>
                      </Text>
                    </View>

                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={[styles.btnAction, styles.btnEdit]}
                        onPress={() =>
                          router.push({
                            pathname: '/Rubricas/form' as any,
                            params: {
                              id,
                              idCategoria_r: categoriaSel,
                              pregunta: preguntaText,
                              valor_maximo: vMax,
                            },
                          })
                        }
                      >
                        <Ionicons name="create-outline" size={16} color="#fff" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.btnAction, styles.btnDelete]}
                        onPress={() => handleEliminar(id, preguntaText)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
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
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 15 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  labelHeader: { fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 6 },
  catScroll: { maxHeight: 45, marginBottom: 15 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    marginRight: 8,
    justifyContent: 'center',
  },
  catChipActive: { backgroundColor: '#002b45' },
  catChipText: { fontSize: 13, color: '#334155' },
  catChipTextActive: { color: '#fff', fontWeight: 'bold' },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  panelTitle: { fontSize: 16, fontWeight: 'bold', color: '#002b45' },
  totalPuntosText: { fontSize: 12, color: '#666', marginTop: 2 },
  btnNuevo: {
    flexDirection: 'row',
    backgroundColor: '#9eb23b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    gap: 6,
  },
  btnNuevoText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  scroll: { paddingBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 10, elevation: 1 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoCol: { flex: 1, marginRight: 10 },
  preguntaText: { fontSize: 14, color: '#1e293b', fontWeight: '600', marginBottom: 4 },
  puntosBadge: { fontSize: 12, color: '#64748b' },
  bold: { fontWeight: 'bold', color: '#002b45' },
  actions: { flexDirection: 'row', gap: 6 },
  btnAction: { padding: 8, borderRadius: 6 },
  btnEdit: { backgroundColor: '#0284c7' },
  btnDelete: { backgroundColor: '#dc2626' },
  emptyText: { textAlign: 'center', color: '#777', marginTop: 30 },
});