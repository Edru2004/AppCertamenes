
import { Ionicons } from '@expo/vector-icons';
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
import {
    eliminarRubrica,
    getCategCertamenes,
    getRubricas,
} from '../../../services/api';

export default function RubricasIndexScreen() {
  const router = useRouter();

  const [categorias, setCategorias] = useState<any[]>([]);
  const [categoriaSel, setCategoriaSel] = useState<number | null>(null);
  const [criterios, setCriterios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      cargarCategorias();
    }, [])
  );

  const cargarCategorias = async () => {
    try {
      setCargando(true);

      const respuesta = await getCategCertamenes();
      const lista = Array.isArray(respuesta)
        ? respuesta
        : respuesta?.data || [];

      setCategorias(lista);

      const categoriaExiste = lista.some((cat: any) => {
        const id = Number(
          cat.Id_categCertamen ??
          cat.idCategoria_certa ??
          cat.id
        );
        return id === categoriaSel;
      });

      if (!categoriaSel || !categoriaExiste) {
        const primerId = lista.length
          ? Number(
              lista[0].Id_categCertamen ??
              lista[0].idCategoria_certa ??
              lista[0].id
            )
          : null;

        setCategoriaSel(primerId);
        if (primerId) {
          await cargarRubricas(primerId);
        } else {
          setCriterios([]);
        }
      } else {
        await cargarRubricas(categoriaSel);
      }
    } catch (e: any) {
      Alert.alert(
        'Error',
        e?.message || 'No se pudieron cargar las categorías.'
      );
    } finally {
      setCargando(false);
    }
  };

  const cargarRubricas = async (idCategoria: number) => {
    try {
      const respuesta = await getRubricas(idCategoria);
      const lista = Array.isArray(respuesta)
        ? respuesta
        : respuesta?.data || [];

      setCriterios(lista);
    } catch (e: any) {
      setCriterios([]);
      Alert.alert(
        'Error',
        e?.message || 'No se pudieron cargar los criterios.'
      );
    }
  };

  const seleccionarCategoria = async (id: number) => {
    setCategoriaSel(id);
    setCargando(true);

    try {
      await cargarRubricas(id);
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = (
    idRubrica: number,
    pregunta: string
  ) => {
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
              await eliminarRubrica(idRubrica);

              Alert.alert(
                '¡Éxito!',
                'Criterio eliminado correctamente.'
              );

              if (categoriaSel) {
                await cargarRubricas(categoriaSel);
              }
            } catch (e: any) {
              Alert.alert(
                'Error',
                e?.message || 'No se pudo eliminar el criterio.'
              );
            }
          },
        },
      ]
    );
  };

  const totalPuntos = criterios.reduce(
    (sum: number, item: any) =>
      sum +
      Number(
        item.Valor_Max ??
        item.valor_maximo ??
        item['valor maximo'] ??
        0
      ),
    0
  );

  return (
    <View style={styles.container}>
      <Text style={styles.labelHeader}>
        Selecciona la Categoría:
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
      >
        {categorias.map((cat: any) => {
          const id = Number(
            cat.Id_categCertamen ??
            cat.idCategoria_certa ??
            cat.id
          );
          const nombre = cat.Nombre || cat.nombre || 'Sin nombre';
          const isSelected = categoriaSel === id;

          return (
            <TouchableOpacity
              key={id}
              style={[
                styles.catChip,
                isSelected ? styles.catChipActive : null,
              ]}
              onPress={() => seleccionarCategoria(id)}
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

      <View style={styles.panelHeader}>
        <View>
          <Text style={styles.panelTitle}>
            Criterios de Evaluación
          </Text>
          <Text style={styles.totalPuntosText}>
            Puntaje Máximo Total: {totalPuntos} pts
          </Text>
        </View>

        <TouchableOpacity
          style={styles.btnNuevo}
          onPress={() =>
            router.push({
              pathname: '/Rubricas/form' as any,
              params: { idCategoria_r: String(categoriaSel) },
            })
          }
          disabled={!categoriaSel}
        >
          <Ionicons
            name="add-circle-outline"
            size={18}
            color="#fff"
          />
          <Text style={styles.btnNuevoText}>Agregar Criterio</Text>
        </TouchableOpacity>
      </View>

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
            criterios.map((item: any, index: number) => {
              const id =
                item.Id_rubrica ??
                item.idRubrica ??
                item.id;

              const preguntaText =
                item.Pregunta ||
                item.pregunta ||
                'Sin pregunta';

              const vMax =
                item.Valor_Max ??
                item.valor_maximo ??
                item['valor maximo'] ??
                0;

              return (
                <View key={id ?? index} style={styles.card}>
                  <View style={styles.cardRow}>
                    <View style={styles.infoCol}>
                      <Text style={styles.preguntaText}>
                        {preguntaText}
                      </Text>
                      <Text style={styles.puntosBadge}>
                        Valor Máximo:{' '}
                        <Text style={styles.bold}>
                          {vMax} pts
                        </Text>
                      </Text>
                    </View>

                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={[styles.btnAction, styles.btnEdit]}
                        onPress={() =>
                          router.push({
                            pathname: '/Rubricas/form' as any,
                            params: {
                              id: String(id),
                              idCategoria_r: String(categoriaSel),
                              pregunta: String(preguntaText),
                              valor_maximo: String(vMax),
                            },
                          })
                        }
                      >
                        <Ionicons
                          name="create-outline"
                          size={16}
                          color="#fff"
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.btnAction, styles.btnDelete]}
                        onPress={() =>
                          handleEliminar(Number(id), preguntaText)
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 6,
  },
  catScroll: {
    maxHeight: 45,
    marginBottom: 15,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    marginRight: 8,
    justifyContent: 'center',
  },
  catChipActive: {
    backgroundColor: '#002b45',
  },
  catChipText: {
    fontSize: 13,
    color: '#334155',
  },
  catChipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#002b45',
  },
  totalPuntosText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  btnNuevo: {
    flexDirection: 'row',
    backgroundColor: '#9eb23b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    gap: 6,
  },
  btnNuevoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  scroll: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    elevation: 1,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
    marginRight: 10,
  },
  preguntaText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
    marginBottom: 4,
  },
  puntosBadge: {
    fontSize: 12,
    color: '#64748b',
  },
  bold: {
    fontWeight: 'bold',
    color: '#002b45',
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  btnAction: {
    padding: 8,
    borderRadius: 6,
  },
  btnEdit: {
    backgroundColor: '#0284c7',
  },
  btnDelete: {
    backgroundColor: '#dc2626',
  },
  emptyText: {
    textAlign: 'center',
    color: '#777',
    marginTop: 30,
  },
});
