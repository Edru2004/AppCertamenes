import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function JuradoFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ juradoEditar?: string }>();

  const [idJurado, setIdJurado] = useState<number | null>(null);
  const [idUsuario, setIdUsuario] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [idSala, setIdSala] = useState('');
  const [institucion, setInstitucion] = useState('');
  const [areaParticipacion, setAreaParticipacion] = useState('');
  const [areaEspecializada, setAreaEspecializada] = useState('');
  const [curriculum, setCurriculum] = useState('');
  const [invitacion, setInvitacion] = useState<'Aceptada' | 'Pendiente' | 'Rechazada'>('Pendiente');

  // Carga automática si se seleccionó Editar
  useEffect(() => {
    if (typeof params.juradoEditar === 'string') {
      try {
        const data = JSON.parse(params.juradoEditar);
        setIdJurado(data.Id_jurado);
        setIdUsuario(data.Id_usuario ? data.Id_usuario.toString() : '');
        setNombreUsuario(data.Nombre_usuario || '');
        setIdSala(data.Id_sala ? data.Id_sala.toString() : '');
        setInstitucion(data.Institucion || '');
        setAreaParticipacion(data.Area_participacion || '');
        setAreaEspecializada(data.Area_especializada || '');
        setCurriculum(data.Curriculum || '');
        setInvitacion(data.Invitacion || 'Pendiente');
      } catch (e) {
        console.error('Error al parsear jurado a editar:', e);
      }
    } else {
      // Resetea a valores por defecto si es un nuevo registro
      setIdJurado(null);
      setIdUsuario('');
      setNombreUsuario('');
      setIdSala('');
      setInstitucion('');
      setAreaParticipacion('');
      setAreaEspecializada('');
      setCurriculum('');
      setInvitacion('Pendiente');
    }
  }, [params.juradoEditar]);

  const handleGuardar = () => {
    if (!nombreUsuario.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre del usuario evaluador.');
      return;
    }

    if (!institucion.trim() || !areaParticipacion.trim()) {
      Alert.alert('Error', 'Ingresa la institución y el área de participación.');
      return;
    }

    const juradoGuardar = {
      Id_jurado: idJurado ? idJurado : Date.now(),
      Id_usuario: idUsuario ? parseInt(idUsuario) : 100 + Math.floor(Math.random() * 50),
      Nombre_usuario: nombreUsuario,
      Id_sala: idSala ? parseInt(idSala) : null,
      Nombre_sala: idSala ? `Sala ${idSala}` : undefined,
      Curriculum: curriculum || 'Sin Curriculum adjunto',
      Institucion: institucion,
      Area_participacion: areaParticipacion,
      Area_especializada: areaEspecializada,
      Invitacion: invitacion,
    };

    const mensajeExito = idJurado
      ? 'Jurado actualizado correctamente.'
      : 'Jurado registrado correctamente.';

    Alert.alert('Éxito', mensajeExito, [
      {
        text: 'OK',
        onPress: () => {
          // Redirecciona al index dentro del módulo jurados
          router.push({
            pathname: '/gesJurados/' as any,
            params: { nuevoJurado: JSON.stringify(juradoGuardar) },
          });
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {idJurado ? 'Editar Jurado Evaluador' : 'Registro de Jurado Evaluador'}
      </Text>

      <Text style={styles.label}>Nombre Completo del Evaluador *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. Dr. Carlos Mendoza Juárez"
        value={nombreUsuario}
        onChangeText={setNombreUsuario}
      />

      <Text style={styles.label}>Institución u Organización *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. ITSSMT / CIDE / UAP"
        value={institucion}
        onChangeText={setInstitucion}
      />

      <Text style={styles.label}>Área de Participación *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. Sistemas e Inteligencia Artificial"
        value={areaParticipacion}
        onChangeText={setAreaParticipacion}
      />

      <Text style={styles.label}>Área Especializada</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. Ciberseguridad, Redes y Telecomunicaciones"
        value={areaEspecializada}
        onChangeText={setAreaEspecializada}
      />

      <Text style={styles.label}>Enlace a Curriculum Vitae (URL / Drive)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. https://drive.google.com/file/d/..."
        value={curriculum}
        onChangeText={setCurriculum}
      />

      <Text style={styles.label}>Estado de la Invitación</Text>
      <View style={styles.statusRow}>
        {(['Pendiente', 'Aceptada', 'Rechazada'] as const).map((estado) => (
          <TouchableOpacity
            key={estado}
            style={[
              styles.statusOption,
              invitacion === estado && styles.statusSelected,
            ]}
            onPress={() => setInvitacion(estado)}
          >
            <Ionicons
              name={invitacion === estado ? 'checkmark-circle' : 'ellipse-outline'}
              size={18}
              color={invitacion === estado ? '#002b45' : '#666'}
            />
            <Text
              style={[
                styles.statusOptionText,
                invitacion === estado && styles.statusTextSelected,
              ]}
            >
              {estado}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.btnSave} onPress={handleGuardar}>
        <Ionicons name="save-outline" size={20} color="#fff" />
        <Text style={styles.btnSaveText}>
          {idJurado ? 'Actualizar Jurado' : 'Guardar Jurado'}
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
  statusRow: { flexDirection: 'row', gap: 8, marginTop: 5 },
  statusOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderRadius: 8, flex: 1, gap: 6, borderWidth: 1, borderColor: '#eee' },
  statusSelected: { borderColor: '#002b45', backgroundColor: '#eaf4ff' },
  statusOptionText: { fontSize: 12, fontWeight: '600', color: '#333' },
  statusTextSelected: { color: '#002b45', fontWeight: 'bold' },
  btnSave: { flexDirection: 'row', backgroundColor: '#002b45', borderRadius: 10, height: 48, justifyContent: 'center', alignItems: 'center', marginTop: 30, marginBottom: 40, gap: 8 },
  btnSaveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});