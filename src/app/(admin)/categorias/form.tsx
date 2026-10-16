
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
    actualizarCategCertamen,
    crearCategCertamenes,
    getCategCertamenes,
    getCertamenes,
} from '../../../services/api';

export default function CategoriasFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const editId = params.id ? String(params.id) : null;

  const [certamenes, setCertamenes] = useState<any[]>([]);

  const [idCertamenSel, setIdCertamenSel] = useState<number | null>(
    params.idCertamen ? Number(params.idCertamen) : null
  );

  const [nombre, setNombre] = useState<string>(
    params.nombre ? String(params.nombre) : ''
  );

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      setCargando(true);

      // Cargar certámenes utilizando el servicio centralizado
      const respuestaCertamenes = await getCertamenes();

      const listaCertamenes: any[] = Array.isArray(respuestaCertamenes)
        ? respuestaCertamenes
        : Array.isArray(respuestaCertamenes?.data)
          ? respuestaCertamenes.data
          : [];

      setCertamenes(listaCertamenes);

      // Seleccionar el primer certamen cuando se crea una categoría
      if (!idCertamenSel && listaCertamenes.length > 0) {
        const primer = listaCertamenes[0];

        const primerId =
          primer.Id_certamen ??
          primer.idCertamen ??
          primer.id;

        if (primerId != null) {
          setIdCertamenSel(Number(primerId));
        }
      }

      // Si se está editando y no llegaron todos los datos
      // desde index.tsx, buscar la categoría en el listado.
      if (editId && (!params.nombre || !params.idCertamen)) {
        const respuestaCategorias = await getCategCertamenes();

        const listaCategorias: any[] = Array.isArray(respuestaCategorias)
          ? respuestaCategorias
          : Array.isArray(respuestaCategorias?.data)
            ? respuestaCategorias.data
            : [];

        const categoria = listaCategorias.find((cat: any) => {
          const id =
            cat.Id_categCertamen ??
            cat.idCategoria_certa ??
            cat.id;

          return String(id) === editId;
        });

        if (categoria) {
          setNombre(
            categoria.Nombre || categoria.nombre || ''
          );

          const idCertamen =
            categoria.Id_Certamen ??
            categoria.Id_certamen ??
            categoria.idCertamen;

          if (idCertamen != null) {
            setIdCertamenSel(Number(idCertamen));
          }
        }
      }
    } catch (e: any) {
      Alert.alert(
        'Error',
        e.message || 'No se pudieron obtener los datos de la base de datos'
      );
    } finally {
      setCargando(false);
    }
  };

  const handleGuardar = async () => {
    if (!idCertamenSel) {
      Alert.alert(
        'Atención',
        'Por favor selecciona un certamen de la lista.'
      );
      return;
    }

    if (!nombre.trim()) {
      Alert.alert(
        'Atención',
        'Por favor ingresa el nombre de la categoría.'
      );
      return;
    }

    try {
      setGuardando(true);

      const esEdicion = Boolean(editId);

      const payload = {
        Id_Certamen: idCertamenSel,
        Nombre: nombre.trim(),
      };

      // Registrar o actualizar mediante services/api.ts
      const respuesta = esEdicion
        ? await actualizarCategCertamen(Number(editId), payload)
        : await crearCategCertamenes(payload);

      // Las funciones actuales de api.ts devuelven el JSON.
      // Si Laravel devuelve errores de validación en el JSON,
      // mostrar el mensaje correspondiente.
      if (
        respuesta &&
        typeof respuesta === 'object' &&
        (respuesta.errors || respuesta.message === 'Unauthenticated.')
      ) {
        const mensaje = respuesta.errors
          ? Object.values(respuesta.errors).flat().join('\n')
          : respuesta.message;

        throw new Error(String(mensaje));
      }

      Alert.alert(
        '¡Éxito!',
        `La categoría "${nombre.trim()}" ha sido ${
          esEdicion ? 'actualizada' : 'registrada'
        } correctamente.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setNombre('');
              router.back();
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert(
        'Error al guardar',
        e.message || 'No se pudo guardar la categoría'
      );
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#002b45" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {editId ? 'Editar Categoría' : 'Registro de Categoría'}
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Certamen Asociado</Text>

        {certamenes.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.warningText}>
              No se encontraron certámenes en la base de datos.
            </Text>
          </View>
        ) : (
          <View style={styles.certamenList}>
            {certamenes.map((cert: any) => {
              const idCert = Number(
                cert.Id_certamen ??
                cert.idCertamen ??
                cert.id
              );

              const nombreCert =
                cert.Nombre ||
                cert.nombre ||
                `Certamen #${idCert}`;

              const isSelected = idCertamenSel === idCert;

              return (
                <TouchableOpacity
                  key={idCert}
                  style={[
                    styles.certItem,
                    isSelected ? styles.certItemActive : null,
                  ]}
                  onPress={() => setIdCertamenSel(idCert)}
                >
                  <View style={styles.certRow}>
                    <Text
                      style={[
                        styles.certIcon,
                        isSelected ? styles.certIconActive : null,
                      ]}
                    >
                      {isSelected ? '🔘' : '⚪'}
                    </Text>

                    <Text
                      style={[
                        styles.certText,
                        isSelected ? styles.certTextActive : null,
                      ]}
                    >
                      {nombreCert}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text style={styles.label}>Nombre de la Categoría</Text>

        <TextInput
          style={styles.input}
          placeholder="Ej. Agroindustria, Salud y Biotecnología..."
          value={nombre}
          onChangeText={setNombre}
        />

        <TouchableOpacity
          style={[
            styles.btnSave,
            (
              guardando ||
              !idCertamenSel ||
              certamenes.length === 0
            )
              ? styles.btnDisabled
              : null,
          ]}
          onPress={handleGuardar}
          disabled={
            guardando ||
            !idCertamenSel ||
            certamenes.length === 0
          }
        >
          {guardando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnSaveText}>
              {editId ? 'Guardar Cambios' : 'Guardar Categoría'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#002b45',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 8,
    marginTop: 12,
  },
  certamenList: {
    gap: 8,
    marginBottom: 12,
  },
  certItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  certItemActive: {
    borderColor: '#002b45',
    backgroundColor: '#e6f0f7',
  },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  certIcon: {
    fontSize: 14,
  },
  certIconActive: {
    color: '#002b45',
  },
  certText: {
    fontSize: 14,
    color: '#334155',
    flex: 1,
  },
  certTextActive: {
    fontWeight: 'bold',
    color: '#002b45',
  },
  emptyBox: {
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    marginBottom: 10,
  },
  warningText: {
    fontSize: 12,
    color: '#dc2626',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  btnSave: {
    backgroundColor: '#002b45',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },
  btnDisabled: {
    backgroundColor: '#94a3b8',
  },
  btnSaveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
