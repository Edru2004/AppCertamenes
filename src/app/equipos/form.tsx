import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
} from 'react-native';

export default function EquipoFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ equipoEditar?: string }>();

  const [idEquipo, setIdEquipo] = useState<number | null>(null);

  // Campos de la tabla Equipo
  const [nombre, setNombre] = useState('');
  const [idDesafio, setIdDesafio] = useState('');
  const [idCategCertamen, setIdCategCertamen] = useState('');
  const [idSala, setIdSala] = useState('');
  const [video, setVideo] = useState('');
  const [reporte, setReporte] = useState('');

  // Limpieza y carga de datos cada vez que la vista entra en foco
  useFocusEffect(
    useCallback(() => {
      if (typeof params.equipoEditar === 'string' && params.equipoEditar.trim() !== '') {
        try {
          const data = JSON.parse(params.equipoEditar);
          setIdEquipo(data.Id_equipo);
          setNombre(data.Nombre || '');
          setIdDesafio(data.Id_desafio ? data.Id_desafio.toString() : '');
          setIdCategCertamen(data.Id_categCertamen ? data.Id_categCertamen.toString() : '');
          setIdSala(data.Id_sala ? data.Id_sala.toString() : '');
          setVideo(data.Video || '');
          setReporte(data.Reporte || '');
        } catch (e) {
          console.error('Error al parsear el equipo a editar:', e);
        }
      } else {
        // 🟢 Si no hay parámetros de edición (o se presionó la pestaña directamente), limpiamos el formulario
        limpiarFormulario();
      }
    }, [params.equipoEditar])
  );

  const limpiarFormulario = () => {
    setIdEquipo(null);
    setNombre('');
    setIdDesafio('');
    setIdCategCertamen('');
    setIdSala('');
    setVideo('');
    setReporte('');
  };

  const handleGuardar = () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre del equipo.');
      return;
    }

    if (!idDesafio.trim() || !idCategCertamen.trim()) {
      Alert.alert('Error', 'Ingresa los IDs requeridos de Desafío y Categoría Certamen.');
      return;
    }

    const equipoGuardar = {
      Id_equipo: idEquipo ? idEquipo : Date.now(),
      Id_desafio: parseInt(idDesafio),
      Nombre_desafio: `Desafío #${idDesafio}`,
      Id_categCertamen: parseInt(idCategCertamen),
      Nombre_categoria: `Categoría #${idCategCertamen}`,
      Id_sala: idSala ? parseInt(idSala) : null,
      Nombre_sala: idSala ? `Sala ${idSala}` : undefined,
      Nombre: nombre,
      Video: video || undefined,
      Reporte: reporte || undefined,
    };

    const mensajeExito = idEquipo
      ? 'Equipo actualizado correctamente.'
      : 'Equipo registrado correctamente.';

    Alert.alert('Éxito', mensajeExito, [
      {
        text: 'OK',
        onPress: () => {
          // Limpiamos los parámetros de la ruta antes de regresar
          router.setParams({ equipoEditar: undefined });
          limpiarFormulario();

          router.navigate({
            pathname: '/equipos' as any,
            params: { nuevoEquipo: JSON.stringify(equipoGuardar) },
          });
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {idEquipo ? 'Editar Equipo' : 'Registro de Equipo'}
      </Text>

      <Text style={styles.label}>Nombre del Equipo *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. Alpha Tech"
        value={nombre}
        onChangeText={setNombre}
      />

      <Text style={styles.label}>ID del Desafío *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. 10"
        keyboardType="numeric"
        value={idDesafio}
        onChangeText={setIdDesafio}
      />

      <Text style={styles.label}>ID Categoría de Certamen *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. 2"
        keyboardType="numeric"
        value={idCategCertamen}
        onChangeText={setIdCategCertamen}
      />

      <Text style={styles.label}>ID de Sala Asignada (Opcional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. 1"
        keyboardType="numeric"
        value={idSala}
        onChangeText={setIdSala}
      />

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

      <TouchableOpacity style={styles.btnSave} onPress={handleGuardar}>
        <Ionicons name="save-outline" size={20} color="#fff" />
        <Text style={styles.btnSaveText}>
          {idEquipo ? 'Actualizar Equipo' : 'Guardar Equipo'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 15 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#002b45', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#ccc' },
  btnSave: { flexDirection: 'row', backgroundColor: '#002b45', borderRadius: 10, height: 48, justifyContent: 'center', alignItems: 'center', marginTop: 30, marginBottom: 40, gap: 8 },
  btnSaveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});