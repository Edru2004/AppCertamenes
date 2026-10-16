
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
    actualizarDesafio,
    crearDesafio,
    getCertamenes,
    getDesafios,
} from '../../../services/api';

export default function DesafiosFormScreen() {
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
  const [descrip, setDescrip] = useState<string>(
    params.descrip ? String(params.descrip) : ''
  );

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      setCargando(true);

      // 1. Cargar certámenes desde services/api.ts
      let listCert: any[] = [];

      try {
        const dataCert: any = await getCertamenes();
        const rawData = Array.isArray(dataCert)
          ? dataCert
          : dataCert?.data || [];

        listCert = rawData.map((item: any) => ({
          id:
            item.Id_certamen ||
            item.id_certamen ||
            item.idCertamen ||
            item.id,
          nombre:
            item.Nombre ||
            item.nombre ||
            `Certamen #${item.id}`,
        }));

        listCert = listCert.filter((item: any) => item.id != null);
      } catch (e) {
        console.log('Error consultando certámenes:', e);
      }

      setCertamenes(listCert);

      if (!idCertamenSel && listCert.length > 0) {
        setIdCertamenSel(Number(listCert[0].id));
      }

      // 2. Si se edita y no llegaron los datos por los parámetros,
      // buscar el desafío en la lista del servicio.
      if (editId && !params.nombre) {
        const dataDes: any = await getDesafios();
        const lista = Array.isArray(dataDes)
          ? dataDes
          : dataDes?.data || [];

        const desafio = lista.find(
          (item: any) =>
            String(item.idDesafio || item.id) === editId
        );

        if (desafio) {
          setNombre(desafio.Nombre || desafio.nombre || '');
          setDescrip(
            desafio.descrip || desafio.descripcion || ''
          );

          const idCert =
            desafio.idCertamen ||
            desafio.Id_certamen ||
            desafio.id_certamen;

          if (idCert) {
            setIdCertamenSel(Number(idCert));
          }
        }
      }
    } catch (e) {
      Alert.alert(
        'Error',
        'No se pudieron cargar los datos de la base de datos'
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
        'Por favor ingresa el nombre del desafío.'
      );
      return;
    }

    if (!descrip.trim()) {
      Alert.alert(
        'Atención',
        'Por favor ingresa la descripción del desafío.'
      );
      return;
    }

    try {
      setGuardando(true);

      const esEdicion = !!editId;

      const payload = {
        idCertamen: idCertamenSel,
        Nombre: nombre.trim(),
        descrip: descrip.trim(),
      };

      // Guardar utilizando las funciones centralizadas.
      if (esEdicion) {
        await actualizarDesafio(Number(editId), payload);
      } else {
        await crearDesafio(payload);
      }

      Alert.alert(
        '¡Éxito!',
        `El desafío "${nombre.trim()}" ha sido ${
          esEdicion ? 'actualizado' : 'registrado'
        } correctamente.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setNombre('');
              setDescrip('');
              router.back();
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert(
        'Error al guardar',
        e?.message || 'No se pudo guardar el desafío.'
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
        {editId ? 'Editar Desafío' : 'Registro de Desafío'}
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Certamen Asociado *</Text>

        {certamenes.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.warningText}>
              No se encontraron certámenes en la base de datos.
            </Text>
          </View>
        ) : (
          <View style={styles.certamenList}>
            {certamenes.map((cert) => {
              const idCert = Number(cert.id);
              const nombreCert = cert.nombre;
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

        <Text style={styles.label}>Nombre del Desafío *</Text>
        <TextInput
          style={styles.input}
          placeholder="ej. APROVECHAMIENTO TETRA PAK, FUGAS DE AGUA..."
          value={nombre}
          onChangeText={setNombre}
        />

        <Text style={styles.label}>Descripción *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Escribe la problemática o planteamiento del desafío..."
          value={descrip}
          onChangeText={setDescrip}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={[
            styles.btnSave,
            guardando || !idCertamenSel || certamenes.length === 0
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
              {editId ? 'Guardar Cambios' : 'Guardar Desafío'}
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 10,
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
