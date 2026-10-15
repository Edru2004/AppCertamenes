
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
  crearRubrica,
  actualizarRubrica,
} from '../../services/api';

export default function RubricaFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const editId = params.id ? String(params.id) : null;
  const idCategoria_r = params.idCategoria_r
    ? Number(params.idCategoria_r)
    : null;

  const [pregunta, setPregunta] = useState<string>(
    params.pregunta ? String(params.pregunta) : ''
  );
  const [valorMaximo, setValorMaximo] = useState<string>(
    params.valor_maximo ? String(params.valor_maximo) : '10'
  );
  const [guardando, setGuardando] = useState(false);

  const handleGuardar = async () => {
    if (!idCategoria_r) {
      Alert.alert('Error', 'No se ha seleccionado ninguna categoría.');
      return;
    }

    if (!pregunta.trim()) {
      Alert.alert(
        'Atención',
        'Por favor ingresa la pregunta o criterio de evaluación.'
      );
      return;
    }

    const valor = Number(valorMaximo);

    if (!valorMaximo.trim() || !Number.isFinite(valor) || valor <= 0) {
      Alert.alert('Atención', 'Ingresa un valor máximo mayor a 0.');
      return;
    }

    try {
      setGuardando(true);

      const esEdicion = !!editId;

      const payload = {
        Id_categoriaRubrica: idCategoria_r,
        pregunta: pregunta.trim(),
        valor_maximo: valor,
      };

      if (esEdicion) {
        await actualizarRubrica(Number(editId), payload);
      } else {
        await crearRubrica(payload);
      }

      Alert.alert(
        '¡Éxito!',
        `El criterio ha sido ${
          esEdicion ? 'actualizado' : 'registrado'
        } correctamente.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setPregunta('');
              router.back();
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert(
        'Error al guardar',
        e?.message || 'No se pudo guardar el criterio.'
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {editId ? 'Editar Criterio' : 'Nuevo Criterio de Rúbrica'}
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>
          Pregunta / Criterio de Evaluación *
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="ej. 1.1 La solución es innovadora..."
          value={pregunta}
          onChangeText={setPregunta}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Valor Máximo (Puntaje) *</Text>
        <TextInput
          style={styles.input}
          placeholder="ej. 7, 10, 8..."
          keyboardType="numeric"
          value={valorMaximo}
          onChangeText={setValorMaximo}
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
              {editId ? 'Guardar Cambios' : 'Guardar Criterio'}
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
  textArea: {
    height: 80,
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
