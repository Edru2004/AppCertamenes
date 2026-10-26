// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  actualizarJurado,
  crearJurado,
  getCertamenes,
  getSalas,
  getUsuariosParaJurado
} from '../../../services/api';

const extraerLista = (respuesta: any): any[] => {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.data)) return respuesta.data;
  if (Array.isArray(respuesta?.data?.data)) return respuesta.data.data;
  if (Array.isArray(respuesta?.usuarios)) return respuesta.usuarios;
  if (Array.isArray(respuesta?.certamenes)) return respuesta.certamenes;
  if (Array.isArray(respuesta?.salas)) return respuesta.salas;
  return [];
};
const primerValor = (valor: any) => Array.isArray(valor) ? valor[0] : valor;
const idCertamenDe = (item: any) => Number(item?.Id_certamen ?? item?.Id_Certamen ?? item?.id_certamen ?? item?.idCertamen ?? item?.id);
const idUsuarioDe = (item: any) => Number(item?.Id_usuario ?? item?.id_usuario ?? item?.id);
const idSalaDe = (item: any) => Number(item?.Id_sala ?? item?.id_sala ?? item?.id);
const nombreUsuarioDe = (item: any) => String(item?.Nombre ?? item?.nombre ?? item?.name ?? item?.Usuario ?? `Usuario #${idUsuarioDe(item)}`);
const tipoVisible = (tipo: any) => {
  const t = String(tipo ?? '').trim().toUpperCase();
  if (t === 'RALLY') return 'Rally';
  if (t === 'INNOVATEC' || t === 'INNOVATECNM') return 'InnovaTecNM';
  return t || 'Tipo no especificado';
};
const esInnova = (certamen: any) => ['INNOVATEC', 'INNOVATECNM'].includes(String(certamen?.Tipo ?? certamen?.tipo ?? '').trim().toUpperCase());

const resultadoInicial = { visible: false, titulo: '', mensaje: '', exito: false };

export default function JuradoFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ juradoEditar?: string; idCertamen?: string }>();
  const juradoParam = primerValor(params.juradoEditar);
  const idCertamenParam = primerValor(params.idCertamen);
  const [idJurado, setIdJurado] = useState<number | null>(null);
  const [certamenes, setCertamenes] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [salas, setSalas] = useState<any[]>([]);
  const [idCertamen, setIdCertamen] = useState<number | null>(idCertamenParam ? Number(idCertamenParam) : null);
  const [idUsuario, setIdUsuario] = useState<number | null>(null);
  const [idSala, setIdSala] = useState<number | null>(null);
  const [institucion, setInstitucion] = useState('');
  const [puesto, setPuesto] = useState('');
  const [sexo, setSexo] = useState('');
  const [areaParticipacion, setAreaParticipacion] = useState('');
  const [areaEspecializada, setAreaEspecializada] = useState('');
  const [curriculum, setCurriculum] = useState('');
  const [invitacion, setInvitacion] = useState<'Aceptada' | 'Pendiente' | 'Rechazada'>('Pendiente');
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [selectorUsuario, setSelectorUsuario] = useState(false);
  const [selectorSala, setSelectorSala] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [cargandoSalas, setCargandoSalas] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [confirmarVisible, setConfirmarVisible] = useState(false);
  const [resultado, setResultado] = useState(resultadoInicial);

  const certamenSeleccionado = certamenes.find((item) => idCertamenDe(item) === Number(idCertamen)) ?? null;
  const esCertamenInnova = esInnova(certamenSeleccionado);
  const usuarioSeleccionado = usuarios.find((item) => idUsuarioDe(item) === Number(idUsuario)) ?? null;
  const salaSeleccionada = salas.find((item) => idSalaDe(item) === Number(idSala)) ?? null;
  const usuariosFiltrados = useMemo(() => {
    const termino = busquedaUsuario.trim().toLocaleLowerCase();
    if (!termino) return usuarios;
    return usuarios.filter((item) => [nombreUsuarioDe(item), item?.Correo, item?.email, item?.Usuario].some((v) => String(v ?? '').toLocaleLowerCase().includes(termino)));
  }, [usuarios, busquedaUsuario]);

  const mostrarResultado = (titulo: string, mensaje: string, exito = false) => setResultado({ visible: true, titulo, mensaje, exito });

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      setCargando(true);
      try {
        let original: any = null;
        if (juradoParam) {
          try { original = JSON.parse(String(juradoParam)); } catch { original = null; }
        }
        const [respCertamenes, respUsuarios] = await Promise.all([getCertamenes(), getUsuariosParaJurado()]);
        if (!activo) return;
        const listaCertamenes = extraerLista(respCertamenes).filter((x) => Number.isFinite(idCertamenDe(x)) && idCertamenDe(x) > 0);
        const listaUsuarios = extraerLista(respUsuarios).filter((x) => Number.isFinite(idUsuarioDe(x)) && idUsuarioDe(x) > 0);
        setCertamenes(listaCertamenes);
        setUsuarios(listaUsuarios);

        if (original) {
          setIdJurado(Number(original.Id_jurado) || null);
          setIdUsuario(Number(original.Id_usuario) || null);
          setIdSala(original.Id_sala == null || original.Id_sala === '' ? null : Number(original.Id_sala));
          setInstitucion(String(original.Institucion ?? ''));
          setPuesto(String(original.Puesto ?? original.puesto ?? ''));
          setSexo(String(original.Sexo ?? original.sexo ?? ''));
          setAreaParticipacion(String(original.Area_participacion ?? ''));
          setAreaEspecializada(String(original.Area_especializada ?? ''));
          setCurriculum(String(original.Curriculum ?? ''));
          setInvitacion(['Aceptada', 'Pendiente', 'Rechazada'].includes(original.Invitacion) ? original.Invitacion : 'Pendiente');
        }
        const idOriginal = Number(original?.Id_certamen ?? original?.id_certamen ?? original?.certamen?.Id_certamen ?? idCertamenParam);
        const porDefecto = listaCertamenes.find((x) => idCertamenDe(x) === idOriginal)
          ?? listaCertamenes.find((x) => String(x.Tipo ?? x.tipo).toUpperCase() === 'RALLY')
          ?? listaCertamenes[0]
          ?? null;
        setIdCertamen(porDefecto ? idCertamenDe(porDefecto) : null);
        if (original && !listaUsuarios.some((u) => idUsuarioDe(u) === Number(original.Id_usuario))) {
          mostrarResultado('Usuario no disponible', 'El usuario asociado a este jurado ya no aparece en el catálogo de usuarios. Selecciona otro usuario válido antes de guardar.', false);
        }
      } catch (error: any) {
        if (activo) mostrarResultado('No se pudieron cargar los datos', error?.message || 'No fue posible cargar certámenes y usuarios desde el servidor.', false);
      } finally {
        if (activo) setCargando(false);
      }
    };
    void cargar();
    return () => { activo = false; };
  }, [juradoParam, idCertamenParam]);

  useEffect(() => {
    let activo = true;
    const cargarSalasCertamen = async () => {
      if (!idCertamen || !esCertamenInnova) {
        setSalas([]);
        setIdSala(null);
        return;
      }
      setCargandoSalas(true);
      try {
        const respuesta = await getSalas(idCertamen);
        if (activo) {
          const lista = extraerLista(respuesta).filter((s) => Number(s.Id_certamen ?? s.id_certamen ?? idCertamen) === Number(idCertamen));
          setSalas(lista);
          setIdSala((actual) => actual != null && lista.some((s) => idSalaDe(s) === Number(actual)) ? actual : null);
        }
      } catch (error: any) {
        if (activo) {
          setSalas([]);
          mostrarResultado('No se pudieron cargar las salas', error?.message || 'No fue posible consultar las salas de este certamen.', false);
        }
      } finally {
        if (activo) setCargandoSalas(false);
      }
    };
    void cargarSalasCertamen();
    return () => { activo = false; };
  }, [idCertamen, esCertamenInnova]);

  const seleccionarCertamen = (id: number) => {
    if (Number(idCertamen) !== Number(id)) setIdSala(null);
    setIdCertamen(Number(id));
  };

  const validar = () => {
    if (!idCertamen || !certamenSeleccionado) { mostrarResultado('Falta el certamen', 'Selecciona el certamen al que pertenecerá este jurado.', false); return false; }
    if (!idUsuario || !usuarioSeleccionado) { mostrarResultado('Falta seleccionar usuario', 'Selecciona un usuario existente. No se generan IDs aleatorios; el jurado debe estar vinculado a un usuario real.', false); return false; }
    if (!institucion.trim() || !areaParticipacion.trim()) { mostrarResultado('Datos incompletos', 'Ingresa la institución y el área de participación.', false); return false; }
    if (idSala && !esCertamenInnova) { mostrarResultado('Sala no permitida', 'Las salas solo se pueden asignar a jurados de InnovaTecNM.', false); return false; }
    if (idSala && !salas.some((s) => idSalaDe(s) === Number(idSala))) { mostrarResultado('Sala no válida', 'La sala seleccionada no pertenece a este certamen InnovaTecNM.', false); return false; }
    return true;
  };

  const guardar = async () => {
    if (guardando || !validar()) return;
    setConfirmarVisible(true);
  };

  const confirmarGuardado = async () => {
    if (guardando || !idCertamen || !idUsuario) return;
    setConfirmarVisible(false);
    setGuardando(true);
    try {
      const payload = {
        Id_certamen: Number(idCertamen),
        Id_usuario: Number(idUsuario),
        Id_sala: esCertamenInnova && idSala ? Number(idSala) : null,
        Curriculum: curriculum.trim() || null,
        Institucion: institucion.trim(),
        Puesto: puesto.trim() || null,
        Sexo: sexo || null,
        Area_participacion: areaParticipacion.trim(),
        Area_especializada: areaEspecializada.trim() || null,
        Invitacion: invitacion,
      };
      if (idJurado) await actualizarJurado(idJurado, payload);
      else await crearJurado(payload);
      mostrarResultado(idJurado ? '¡Jurado actualizado!' : '¡Jurado registrado!', `El jurado ${nombreUsuarioDe(usuarioSeleccionado)} quedó guardado en ${certamenSeleccionado?.Nombre ?? certamenSeleccionado?.nombre}.`, true);
    } catch (error: any) {
      const extra = error?.errors ? Object.values(error.errors).flat().join('\n') : '';
      mostrarResultado('No se pudo guardar el jurado', error?.message || extra || 'Revisa los campos y la conexión con la API.', false);
    } finally {
      setGuardando(false);
    }
  };

  const cerrarResultado = () => {
    const exito = resultado.exito;
    setResultado(resultadoInicial);
    if (exito) router.back();
  };

  if (cargando) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#002b45" /><Text style={styles.loadingText}>Cargando certámenes y usuarios...</Text></View>;
  }

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.headerIcon}><Ionicons name="people-outline" size={28} color="#fff" /></View>
        <Text style={styles.title}>{idJurado ? 'Editar jurado evaluador' : 'Registro de jurado evaluador'}</Text>
        <Text style={styles.subtitle}>Cada registro queda asociado a un único certamen. Rally no utiliza salas; las salas solo corresponden a InnovaTecNM.</Text>

        <Text style={styles.sectionTitle}>1. Selecciona el certamen</Text>
        <View style={styles.certamenesRow}>
          {certamenes.map((cert) => {
            const id = idCertamenDe(cert);
            const activo = Number(idCertamen) === id;
            const innov = esInnova(cert);
            return <TouchableOpacity key={id} style={[styles.certamenCard, activo && styles.certamenActivo]} onPress={() => seleccionarCertamen(id)}>
              <Ionicons name={innov ? 'bulb-outline' : 'trophy-outline'} size={20} color={activo ? '#fff' : '#0369a1'} />
              <View style={{ flex: 1 }}><Text style={[styles.certamenNombre, activo && styles.textoActivo]}>{cert.Nombre ?? cert.nombre ?? `Certamen #${id}`}</Text><Text style={[styles.certamenTipo, activo && styles.textoActivo]}>{tipoVisible(cert.Tipo ?? cert.tipo)}</Text></View>
              {activo ? <Ionicons name="checkmark-circle" size={18} color="#fff" /> : null}
            </TouchableOpacity>;
          })}
        </View>

        <Text style={styles.sectionTitle}>2. Usuario del jurado</Text>
        <TouchableOpacity style={styles.selector} onPress={() => { setBusquedaUsuario(''); setSelectorUsuario(true); }}>
          <Ionicons name="person-circle-outline" size={22} color="#0369a1" />
          <Text style={[styles.selectorText, !usuarioSeleccionado && styles.placeholder]}>{usuarioSeleccionado ? `${nombreUsuarioDe(usuarioSeleccionado)}${usuarioSeleccionado.Correo ? ` · ${usuarioSeleccionado.Correo}` : ''}` : 'Selecciona un usuario existente'}</Text>
          <Ionicons name="chevron-down" size={19} color="#64748b" />
        </TouchableOpacity>
        <Text style={styles.helper}>El usuario debe existir en el módulo Usuarios. No se crea un Id_usuario aleatorio.</Text>

        <Text style={styles.sectionTitle}>3. Datos profesionales</Text>
        <Text style={styles.label}>Institución u organización *</Text>
        <TextInput style={styles.input} placeholder="Ej. ITSSMT / CIDE / UAP" value={institucion} onChangeText={setInstitucion} />
        <Text style={styles.label}>Puesto</Text>
        <TextInput style={styles.input} placeholder="Ej. Docente, investigador, gerente" value={puesto} onChangeText={setPuesto} />
        <Text style={styles.label}>Sexo</Text>
        <View style={styles.chipsRow}>{['Femenino', 'Masculino', 'Otro', 'Prefiero no decir'].map((op) => <TouchableOpacity key={op} style={[styles.chip, sexo === op && styles.chipActivo]} onPress={() => setSexo(sexo === op ? '' : op)}><Text style={[styles.chipText, sexo === op && styles.chipTextActivo]}>{op}</Text></TouchableOpacity>)}</View>
        <Text style={styles.label}>Área de participación *</Text>
        <TextInput style={styles.input} placeholder="Ej. Sistemas e Inteligencia Artificial" value={areaParticipacion} onChangeText={setAreaParticipacion} />
        <Text style={styles.label}>Área especializada</Text>
        <TextInput style={styles.input} placeholder="Ej. Ciberseguridad, Redes y Telecomunicaciones" value={areaEspecializada} onChangeText={setAreaEspecializada} />
        <Text style={styles.label}>Enlace a Curriculum Vitae (URL / Drive)</Text>
        <TextInput style={styles.input} placeholder="https://..." value={curriculum} onChangeText={setCurriculum} autoCapitalize="none" keyboardType="url" />

        <Text style={styles.sectionTitle}>4. Sala e invitación</Text>
        {esCertamenInnova ? <>
          <Text style={styles.label}>Sala asignada (opcional)</Text>
          <TouchableOpacity style={styles.selector} onPress={() => setSelectorSala(true)} disabled={cargandoSalas}>
            {cargandoSalas ? <ActivityIndicator color="#0369a1" /> : <Ionicons name="business-outline" size={20} color="#0369a1" />}
            <Text style={[styles.selectorText, !salaSeleccionada && styles.placeholder]}>{cargandoSalas ? 'Cargando salas...' : salaSeleccionada ? `${salaSeleccionada.Nombre ?? salaSeleccionada.nombre} · ${salaSeleccionada.Ubicacion ?? salaSeleccionada.Ubicacion ?? ''}` : 'Sin sala asignada'}</Text>
            <Ionicons name="chevron-down" size={19} color="#64748b" />
          </TouchableOpacity>
          {idSala ? <TouchableOpacity onPress={() => setIdSala(null)}><Text style={styles.clearText}>Quitar asignación de sala</Text></TouchableOpacity> : null}
        </> : <View style={styles.infoBox}><Ionicons name="information-circle-outline" size={20} color="#92400e" /><Text style={styles.infoText}>Rally no utiliza salas. El jurado se guardará sin sala asignada.</Text></View>}
        <Text style={styles.label}>Estado de la invitación</Text>
        <View style={styles.chipsRow}>{(['Pendiente', 'Aceptada', 'Rechazada'] as const).map((estado) => <TouchableOpacity key={estado} style={[styles.chip, invitacion === estado && styles.chipActivo]} onPress={() => setInvitacion(estado)}><Ionicons name={invitacion === estado ? 'checkmark-circle' : 'ellipse-outline'} size={15} color={invitacion === estado ? '#fff' : '#475569'} /><Text style={[styles.chipText, invitacion === estado && styles.chipTextActivo]}>{estado}</Text></TouchableOpacity>)}</View>

        <TouchableOpacity style={[styles.saveButton, guardando && styles.disabled]} onPress={guardar} disabled={guardando}>
          {guardando ? <ActivityIndicator color="#fff" /> : <><Ionicons name="save-outline" size={20} color="#fff" /><Text style={styles.saveText}>{idJurado ? 'Actualizar jurado' : 'Guardar jurado'}</Text></>}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={selectorUsuario} transparent animationType="fade" onRequestClose={() => setSelectorUsuario(false)}>
        <View style={styles.backdrop}><View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Seleccionar usuario</Text>
          <TextInput style={styles.input} placeholder="Buscar por nombre o correo..." value={busquedaUsuario} onChangeText={setBusquedaUsuario} />
          <ScrollView style={{ maxHeight: 360 }} keyboardShouldPersistTaps="handled">
            {usuariosFiltrados.length ? usuariosFiltrados.map((u) => <TouchableOpacity key={idUsuarioDe(u)} style={styles.option} onPress={() => { setIdUsuario(idUsuarioDe(u)); setSelectorUsuario(false); }}><Ionicons name="person-outline" size={18} color="#0369a1" /><View style={{ flex: 1 }}><Text style={styles.optionTitle}>{nombreUsuarioDe(u)}</Text><Text style={styles.optionSub}>{u.Correo ?? u.email ?? u.Usuario ?? `ID ${idUsuarioDe(u)}`}</Text></View>{Number(idUsuario) === idUsuarioDe(u) ? <Ionicons name="checkmark-circle" size={19} color="#15803d" /> : null}</TouchableOpacity>) : <Text style={styles.emptyText}>No hay usuarios que coincidan. Registra primero al usuario en el módulo Usuarios.</Text>}
          </ScrollView>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectorUsuario(false)}><Text style={styles.cancelText}>Cerrar</Text></TouchableOpacity>
        </View></View>
      </Modal>

      <Modal visible={selectorSala} transparent animationType="fade" onRequestClose={() => setSelectorSala(false)}>
        <View style={styles.backdrop}><View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Salas de {certamenSeleccionado?.Nombre ?? 'InnovaTecNM'}</Text>
          <ScrollView style={{ maxHeight: 360 }}>
            <TouchableOpacity style={styles.option} onPress={() => { setIdSala(null); setSelectorSala(false); }}><Ionicons name="close-circle-outline" size={19} color="#64748b" /><Text style={styles.optionTitle}>Sin sala asignada</Text></TouchableOpacity>
            {salas.map((s) => <TouchableOpacity key={idSalaDe(s)} style={styles.option} onPress={() => { setIdSala(idSalaDe(s)); setSelectorSala(false); }}><Ionicons name="business-outline" size={18} color="#0369a1" /><View style={{ flex: 1 }}><Text style={styles.optionTitle}>{s.Nombre ?? s.nombre}</Text><Text style={styles.optionSub}>{s.Ubicacion ?? s.ubicacion ?? 'Sin ubicación'}</Text></View>{Number(idSala) === idSalaDe(s) ? <Ionicons name="checkmark-circle" size={19} color="#15803d" /> : null}</TouchableOpacity>)}
            {!salas.length && !cargandoSalas ? <Text style={styles.emptyText}>Este certamen no tiene salas registradas.</Text> : null}
          </ScrollView>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectorSala(false)}><Text style={styles.cancelText}>Cerrar</Text></TouchableOpacity>
        </View></View>
      </Modal>

      <Modal visible={confirmarVisible} transparent animationType="fade" onRequestClose={() => setConfirmarVisible(false)}>
        <View style={styles.backdrop}><View style={styles.modalCard}>
          <View style={styles.modalIcon}><Ionicons name="help-circle-outline" size={30} color="#0369a1" /></View>
          <Text style={styles.modalTitle}>{idJurado ? '¿Guardar cambios del jurado?' : '¿Registrar este jurado?'}</Text>
          <Text style={styles.modalMessage}>Usuario: {usuarioSeleccionado ? nombreUsuarioDe(usuarioSeleccionado) : 'Sin seleccionar'}
            {'\n'}Certamen: {certamenSeleccionado?.Nombre ?? 'Sin seleccionar'}
            {'\n'}Sala: {esCertamenInnova ? (salaSeleccionada?.Nombre ?? 'Sin asignación') : 'No aplica para Rally'}</Text>
          <View style={styles.modalActions}><TouchableOpacity style={styles.cancelButton} onPress={() => setConfirmarVisible(false)} disabled={guardando}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity><TouchableOpacity style={styles.confirmButton} onPress={() => void confirmarGuardado()} disabled={guardando}><Text style={styles.confirmText}>Confirmar</Text></TouchableOpacity></View>
        </View></View>
      </Modal>

      <Modal visible={resultado.visible} transparent animationType="fade" onRequestClose={cerrarResultado}>
        <View style={styles.backdrop}><View style={styles.modalCard}>
          <View style={[styles.modalIcon, resultado.exito ? styles.successIcon : styles.errorIcon]}><Ionicons name={resultado.exito ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={30} color={resultado.exito ? '#15803d' : '#b91c1c'} /></View>
          <Text style={styles.modalTitle}>{resultado.titulo}</Text><Text style={styles.modalMessage}>{resultado.mensaje}</Text>
          <TouchableOpacity style={styles.confirmButton} onPress={cerrarResultado}><Text style={styles.confirmText}>Aceptar</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f1f5f9' }, container: { padding: 18, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }, loadingText: { marginTop: 10, color: '#334155' },
  headerIcon: { alignSelf: 'center', width: 58, height: 58, borderRadius: 18, backgroundColor: '#002b45', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, title: { textAlign: 'center', fontSize: 23, fontWeight: '800', color: '#002b45' }, subtitle: { textAlign: 'center', fontSize: 12, lineHeight: 18, color: '#64748b', marginTop: 7, marginBottom: 20 },
  sectionTitle: { fontSize: 15, color: '#002b45', fontWeight: '800', marginTop: 14, marginBottom: 10 }, certamenesRow: { gap: 10 }, certamenCard: { borderRadius: 12, backgroundColor: '#fff', borderColor: '#dbe3ee', borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 3 }, certamenActivo: { backgroundColor: '#002b45', borderColor: '#002b45' }, certamenNombre: { color: '#0f172a', fontSize: 14, fontWeight: '800' }, certamenTipo: { color: '#64748b', fontSize: 12, marginTop: 2 }, textoActivo: { color: '#fff' },
  selector: { minHeight: 48, borderRadius: 9, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 }, selectorText: { flex: 1, color: '#0f172a', fontSize: 13 }, placeholder: { color: '#94a3b8' }, helper: { fontSize: 11, color: '#64748b', marginTop: 6 }, label: { fontSize: 13, color: '#334155', fontWeight: '700', marginTop: 12, marginBottom: 6 }, input: { minHeight: 44, borderRadius: 9, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 9, color: '#0f172a' }, chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 18, borderWidth: 1, borderColor: '#dbe3ee', backgroundColor: '#fff' }, chipActivo: { backgroundColor: '#002b45', borderColor: '#002b45' }, chipText: { color: '#334155', fontSize: 12, fontWeight: '600' }, chipTextActivo: { color: '#fff' },
  infoBox: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#fffbeb', borderColor: '#fde68a', borderWidth: 1, padding: 11, borderRadius: 9 }, infoText: { flex: 1, color: '#92400e', fontSize: 12, lineHeight: 17 }, clearText: { color: '#0369a1', marginTop: 7, fontWeight: '700', fontSize: 12 },
  saveButton: { marginTop: 24, marginBottom: 20, minHeight: 49, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderRadius: 10, backgroundColor: '#002b45' }, saveText: { color: '#fff', fontSize: 15, fontWeight: '800' }, disabled: { opacity: 0.6 },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.48)', justifyContent: 'center', padding: 18 }, modalCard: { backgroundColor: '#fff', padding: 18, borderRadius: 16, maxHeight: '88%' }, modalIcon: { alignSelf: 'center', marginBottom: 8, width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#e0f2fe' }, successIcon: { backgroundColor: '#dcfce7' }, errorIcon: { backgroundColor: '#fee2e2' }, modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 8 }, modalMessage: { fontSize: 13, lineHeight: 19, color: '#475569', textAlign: 'center', marginBottom: 16 }, option: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 8, borderBottomColor: '#e2e8f0', borderBottomWidth: 1 }, optionTitle: { color: '#0f172a', fontSize: 13, fontWeight: '700' }, optionSub: { color: '#64748b', fontSize: 11, marginTop: 2 }, emptyText: { color: '#64748b', textAlign: 'center', padding: 16, fontSize: 12 }, modalActions: { flexDirection: 'row', gap: 10 }, cancelButton: { padding: 12, borderRadius: 9, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', marginTop: 6, flex: 1 }, cancelText: { color: '#334155', fontWeight: '700' }, confirmButton: { padding: 12, borderRadius: 9, backgroundColor: '#002b45', alignItems: 'center', justifyContent: 'center', marginTop: 6, flex: 1 }, confirmText: { color: '#fff', fontWeight: '800' },
});
