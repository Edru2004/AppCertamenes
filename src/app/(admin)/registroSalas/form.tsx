
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
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
    actualizarSala,
    crearSala,
} from '../../../services/api';

export default function SalasFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const editId = params.id ? String(params.id) : null;

  const [nombre, setNombre] = useState<string>(
    params.nombre ? String(params.nombre) : ''
  );
  const [ubicacion, setUbicacion] = useState<string>(
    params.ubicacion ? String(params.ubicacion) : ''
  );
  const [guardando, setGuardando] = useState(false);

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      Alert.alert('Atención', 'Por favor ingresa el nombre de la sala.');
      return;
    }

    if (!ubicacion.trim()) {
      Alert.alert('Atención', 'Por favor ingresa la ubicación.');
      return;
    }

    try {
      setGuardando(true);

      const esEdicion = !!editId;

      const payload = {
        Nombre: nombre.trim(),
        Ubicacion: ubicacion.trim(),
      };

      if (esEdicion) {
        await actualizarSala(Number(editId), payload);
      } else {
        await crearSala(payload);
      }

      Alert.alert(
        '¡Éxito!',
        `La sala "${nombre.trim()}" ha sido ${
          esEdicion ? 'actualizada' : 'registrada'
        } correctamente.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setNombre('');
              setUbicacion('');
              router.back();
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert(
        'Error al guardar',
        e?.message || 'No se pudo guardar la sala.'
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {editId ? 'Editar Sala' : 'Registro de Sala'}
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nombre de la Sala *</Text>
        <TextInput
          style={styles.input}
          placeholder="ej. VACIA, IMPACTO SOCIAL, IND ELECTR..."
          value={nombre}
          onChangeText={setNombre}
        />

        <Text style={styles.label}>Ubicación *</Text>
        <TextInput
          style={styles.input}
          placeholder="ej. EB02, EB10, EB11..."
          value={ubicacion}
          onChangeText={setUbicacion}
        />

        <TouchableOpacity
          style={[
            styles.btnSave,
            guardando ? styles.btnDisabled : null,
          ]}
          onPress={handleGuardar}
          disabled={guardando}
        >
          {guardando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnSaveText}>
              {editId ? 'Guardar Cambios' : 'Guardar Sala'}
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
