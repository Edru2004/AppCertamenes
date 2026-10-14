import AsyncStorage from '@react-native-async-storage/async-storage';
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

const API_URL = 'http://192.168.1.99:8000/api';

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
      const token = await AsyncStorage.getItem('userToken');
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // 1. Cargar certámenes registrados
      let listCert: any[] = [];
      try {
        let resCert = await fetch(`${API_URL}/certamens`, { headers });

        if (!resCert.ok) {
          resCert = await fetch(`${API_URL}/certamenes`, { headers });
        }

        if (resCert.ok) {
          const dataCert = await resCert.json();

          if (Array.isArray(dataCert)) {
            listCert = dataCert;
          } else if (dataCert && Array.isArray(dataCert.data)) {
            listCert = dataCert.data;
          }
        }
      } catch (err) {
        console.log('Error al consultar certámenes:', err);
      }

      setCertamenes(listCert);

      // Seleccionar por defecto el primer certamen de la lista
      if (!idCertamenSel && listCert.length > 0) {
        const primer = listCert[0];
        const primerId = primer.Id_certamen || primer.idCertamen || primer.id;
        if (primerId) setIdCertamenSel(Number(primerId));
      }

      // 2. Si es edición, cargar datos de la categoría
      if (editId && !params.nombre) {
        const resCat = await fetch(`${API_URL}/categoria-certamens/${editId}`, { headers });
        if (resCat.ok) {
          const dataCat = await resCat.json();
          setNombre(dataCat.Nombre || dataCat.nombre || '');
          const idCert = dataCat.Id_Certamen || dataCat.idCertamen || dataCat.Id_certamen;
          if (idCert) setIdCertamenSel(Number(idCert));
        }
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudieron obtener los datos de la base de datos');
    } finally {
      setCargando(false);
    }
  };

  const handleGuardar = async () => {
    if (!idCertamenSel) {
      Alert.alert('Atención', 'Por favor selecciona un certamen de la lista.');
      return;
    }

    if (!nombre.trim()) {
      Alert.alert('Atención', 'Por favor ingresa el nombre de la categoría.');
      return;
    }

    try {
      setGuardando(true);
      const token = await AsyncStorage.getItem('userToken');
      const esEdicion = !!editId;

      const url = esEdicion
        ? `${API_URL}/categoria-certamens/${editId}`
        : `${API_URL}/categoria-certamens`;

      const method = esEdicion ? 'PUT' : 'POST';

      const payload = {
        Id_Certamen: idCertamenSel,
        Nombre: nombre.trim(),
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg =
          data.message ||
          (data.errors
            ? Object.values(data.errors).flat().join('\n')
            : 'Error al procesar la solicitud');
        throw new Error(errorMsg);
      }

      Alert.alert(
        '¡Éxito!',
        `La categoría "${nombre.trim()}" ha sido ${esEdicion ? 'actualizada' : 'registrada'} correctamente.`,
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
      Alert.alert('Error al guardar', e.message);
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
              const idCert = Number(cert.Id_certamen || cert.idCertamen || cert.id);
              const nombreCert = cert.Nombre || cert.nombre || `Certamen #${idCert}`;
              const isSelected = idCertamenSel === idCert;

              return (
                <TouchableOpacity
                  key={idCert}
                  style={[styles.certItem, isSelected ? styles.certItemActive : null]}
                  onPress={() => setIdCertamenSel(idCert)}
                >
                  <View style={styles.certRow}>
                    <Text style={[styles.certIcon, isSelected ? styles.certIconActive : null]}>
                      {isSelected ? '🔘' : '⚪'}
                    </Text>
                    <Text style={[styles.certText, isSelected ? styles.certTextActive : null]}>
                      {nombreCert}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text style={styles.label}>Nombre de la Categoría *</Text>
        <TextInput
          style={styles.input}
          placeholder="ej. Agroindustria, Salud y Biotecnología..."
          value={nombre}
          onChangeText={setNombre}
        />

        <TouchableOpacity
          style={[
            styles.btnSave,
            (guardando || !idCertamenSel || certamenes.length === 0) ? styles.btnDisabled : null,
          ]}
          onPress={handleGuardar}
          disabled={guardando || !idCertamenSel || certamenes.length === 0}
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
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 15 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#002b45', marginBottom: 15 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, elevation: 2 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 8, marginTop: 12 },
  certamenList: { gap: 8, marginBottom: 12 },
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
  certRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  certIcon: { fontSize: 14 },
  certIconActive: { color: '#002b45' },
  certText: { fontSize: 14, color: '#334155', flex: 1 },
  certTextActive: { fontWeight: 'bold', color: '#002b45' },
  emptyBox: { padding: 12, backgroundColor: '#fef2f2', borderRadius: 8, marginBottom: 10 },
  warningText: { fontSize: 12, color: '#dc2626', textAlign: 'center' },
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
  btnDisabled: { backgroundColor: '#94a3b8' },
  btnSaveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});