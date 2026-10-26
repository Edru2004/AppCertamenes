// @ts-nocheck

import { Ionicons } from '@expo/vector-icons';

import { useFocusEffect, useRouter } from 'expo-router';

import { useCallback, useMemo, useRef, useState } from 'react';

import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { eliminarJurado, getCertamenes, getJurados } from '../../../services/api';



const extraerLista = (r: any): any[] => Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : Array.isArray(r?.data?.data) ? r.data.data : [];

const idCertamenDe = (x: any) => Number(x?.Id_certamen ?? x?.Id_Certamen ?? x?.id_certamen ?? x?.idCertamen ?? x?.id);

const idJuradoDe = (x: any) => Number(x?.Id_jurado ?? x?.id_jurado ?? x?.id);

const tipoDe = (x: any) => String(x?.Tipo_certamen ?? x?.Tipo ?? x?.tipo ?? '').toUpperCase();

const nombreJurado = (j: any) => String(j?.Nombre_usuario ?? j?.usuario?.Nombre ?? j?.usuario?.name ?? `Usuario #${j?.Id_usuario ?? '?'}`);

const nombreCertamen = (j: any) => String(j?.Nombre_certamen ?? j?.certamen?.Nombre ?? j?.certamen?.nombre ?? `Certamen #${j?.Id_certamen ?? '?'}`);

const estadoInicial = { visible: false, titulo: '', mensaje: '', exito: false };



export default function JuradosIndexScreen() {

  const router = useRouter();

  const [certamenes, setCertamenes] = useState<any[]>([]);

  const [idCertamenSel, setIdCertamenSel] = useState<number | null>(null);

  const idCertamenRef = useRef<number | null>(null);

  const [jurados, setJurados] = useState<any[]>([]);

  const [busqueda, setBusqueda] = useState('');

  const [invitacionFiltro, setInvitacionFiltro] = useState('TODOS');

  const [cargando, setCargando] = useState(true);

  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  const [juradoPendiente, setJuradoPendiente] = useState<any>(null);

  const [eliminando, setEliminando] = useState(false);

  const [resultado, setResultado] = useState(estadoInicial);



  const mostrarResultado = (titulo: string, mensaje: string, exito = false) => setResultado({ visible: true, titulo, mensaje, exito });



  const cargarTodo = useCallback(async () => {

    setCargando(true);

    try {

      const [rCertamenes, rJurados] = await Promise.all([getCertamenes(), getJurados()]);

      const listaCertamenes = extraerLista(rCertamenes).filter((x) => Number.isFinite(idCertamenDe(x)) && idCertamenDe(x) > 0);

      setCertamenes(listaCertamenes);

      const elegido = listaCertamenes.find((x) => idCertamenDe(x) === Number(idCertamenRef.current))

        ?? listaCertamenes.find((x) => String(x.Tipo ?? x.tipo).toUpperCase() === 'RALLY')

        ?? listaCertamenes[0] ?? null;

      const idElegido = elegido ? idCertamenDe(elegido) : null;

      idCertamenRef.current = idElegido;

      setIdCertamenSel(idElegido);

      setJurados(extraerLista(rJurados));

    } catch (error: any) {

      mostrarResultado('No se pudieron cargar los jurados', error?.message || 'Verifica la conexión con Laravel y tu sesión.', false);

    } finally { setCargando(false); }

    // Se mantiene el certamen escogido al volver del formulario.

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, []);



  useFocusEffect(useCallback(() => { void cargarTodo(); }, [cargarTodo]));



  const certamenActual = certamenes.find((x) => idCertamenDe(x) === Number(idCertamenSel)) ?? null;

  const seleccionarCertamen = (id: number) => { idCertamenRef.current = id; setIdCertamenSel(id); };

  const juradosDelCertamen = useMemo(() => jurados.filter((j) => Number(j.Id_certamen ?? j.id_certamen ?? j.certamen?.Id_certamen) === Number(idCertamenSel)), [jurados, idCertamenSel]);

  const juradosFiltrados = useMemo(() => {

    const q = busqueda.trim().toLocaleLowerCase();

    return juradosDelCertamen.filter((j) => {

      const texto = [nombreJurado(j), j.Institucion, j.Puesto, j.Area_participacion, j.Area_especializada, j.Sexo].map((v) => String(v ?? '').toLocaleLowerCase()).join(' ');

      return (!q || texto.includes(q)) && (invitacionFiltro === 'TODOS' || j.Invitacion === invitacionFiltro);

    });

  }, [juradosDelCertamen, busqueda, invitacionFiltro]);



  const abrirEliminar = (jurado: any) => { setJuradoPendiente(jurado); setConfirmarEliminar(true); };

  const confirmarEliminacion = async () => {

    if (!juradoPendiente || eliminando) return;

    setConfirmarEliminar(false); setEliminando(true);

    try {

      await eliminarJurado(idJuradoDe(juradoPendiente));

      setJurados((prev) => prev.filter((j) => idJuradoDe(j) !== idJuradoDe(juradoPendiente)));

      mostrarResultado('Jurado eliminado', `Se eliminó a ${nombreJurado(juradoPendiente)}.`, true);

    } catch (error: any) { mostrarResultado('No se pudo eliminar', error?.message || 'El jurado podría tener evaluaciones asociadas.', false); }

    finally { setEliminando(false); setJuradoPendiente(null); }

  };

  const cerrarResultado = () => setResultado(estadoInicial);



  return (

    <View style={styles.page}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}><View style={styles.headerIcon}><Ionicons name="people-outline" size={27} color="#fff" /></View><Text style={styles.title}>Gestión de jurados</Text><Text style={styles.subtitle}>Selecciona un certamen para administrar solo sus jurados.</Text></View>

        <Text style={styles.sectionTitle}>1. Selecciona el certamen</Text>

        <View style={styles.certamenesRow}>{certamenes.map((c) => { const id = idCertamenDe(c); const activo = id === Number(idCertamenSel); const innov = ['INNOVATEC', 'INNOVATECNM'].includes(String(c.Tipo ?? c.tipo).toUpperCase()); return <TouchableOpacity key={id} style={[styles.certamenCard, activo && styles.certamenActivo]} onPress={() => seleccionarCertamen(id)}><Ionicons name={innov ? 'bulb-outline' : 'trophy-outline'} size={19} color={activo ? '#fff' : '#0369a1'} /><View style={{ flex: 1 }}><Text style={[styles.certamenNombre, activo && styles.textoActivo]}>{c.Nombre ?? c.nombre}</Text><Text style={[styles.certamenTipo, activo && styles.textoActivo]}>{innov ? 'InnovaTecNM' : (c.Tipo ?? c.tipo ?? 'Rally')}</Text></View>{activo ? <Ionicons name="checkmark-circle" size={17} color="#fff" /> : null}</TouchableOpacity>; })}</View>

        <TouchableOpacity style={styles.newButton} onPress={() => router.push({ pathname: '/gesJurados/form' as any, params: { idCertamen: String(idCertamenSel ?? '') } })} disabled={!idCertamenSel || eliminando}><Ionicons name="add-circle-outline" size={20} color="#fff" /><Text style={styles.newButtonText}>Nuevo jurado</Text></TouchableOpacity>

        <View style={styles.searchBox}><Ionicons name="search-outline" size={19} color="#64748b" /><TextInput style={styles.searchInput} placeholder="Buscar por nombre, institución, puesto o área..." value={busqueda} onChangeText={setBusqueda} /></View>

        <View style={styles.chipsRow}><Text style={styles.filterLabel}>Invitación:</Text>{['TODOS', 'Aceptada', 'Pendiente', 'Rechazada'].map((e) => <TouchableOpacity key={e} style={[styles.chip, invitacionFiltro === e && styles.chipActive]} onPress={() => setInvitacionFiltro(e)}><Text style={[styles.chipText, invitacionFiltro === e && styles.chipTextActive]}>{e}</Text></TouchableOpacity>)}</View>

        <Text style={styles.listTitle}>Jurados de {certamenActual?.Nombre ?? 'el certamen seleccionado'} <Text style={styles.count}>{juradosFiltrados.length}</Text></Text>

        {cargando ? <View style={styles.center}><ActivityIndicator size="large" color="#002b45" /><Text style={styles.loadingText}>Cargando jurados...</Text></View> : juradosFiltrados.length === 0 ? <View style={styles.emptyCard}><Ionicons name="people-outline" size={32} color="#94a3b8" /><Text style={styles.emptyTitle}>No hay jurados para mostrar</Text><Text style={styles.emptyText}>No hay registros de jurados para este certamen con los filtros seleccionados.</Text></View> : juradosFiltrados.map((j, idx) => {

          const innov = tipoDe(j) === 'INNOVATEC' || ['INNOVATEC', 'INNOVATECNM'].includes(String(certamenActual?.Tipo ?? certamenActual?.tipo ?? '').toUpperCase());

          const badge = j.Invitacion === 'Aceptada' ? styles.statusAceptada : j.Invitacion === 'Rechazada' ? styles.statusRechazada : styles.statusPendiente;

          return <View key={idJuradoDe(j) || `jurado-${idx}`} style={styles.card}>

            <View style={styles.cardHeader}><View style={styles.avatar}><Ionicons name="person-outline" size={21} color="#0369a1" /></View><View style={{ flex: 1 }}><Text style={styles.cardName}>{nombreJurado(j)}</Text><Text style={styles.cardId}>JURADO-{idJuradoDe(j)}</Text></View><View style={[styles.statusBadge, badge]}><Text style={styles.statusText}>{j.Invitacion ?? 'Pendiente'}</Text></View></View>

            <View style={styles.infoBox}><Text style={styles.infoText}><Ionicons name="business-outline" size={14} color="#002b45" />  {j.Institucion || 'Sin institución'}</Text><Text style={styles.infoText}><Ionicons name="briefcase-outline" size={14} color="#002b45" />  {j.Puesto || 'Puesto no especificado'}{j.Sexo ? ` · ${j.Sexo}` : ''}</Text><Text style={styles.infoText}><Ionicons name="ribbon-outline" size={14} color="#002b45" />  Área: {j.Area_participacion || 'N/A'}</Text><Text style={styles.infoText}><Ionicons name="extension-puzzle-outline" size={14} color="#002b45" />  Especialidad: {j.Area_especializada || 'N/A'}</Text><Text style={styles.infoText}><Ionicons name="trophy-outline" size={14} color="#002b45" />  Certamen: {nombreCertamen(j)}</Text>{innov ? <Text style={styles.infoText}><Ionicons name="business-outline" size={14} color="#002b45" />  Sala: {j.Nombre_sala ?? j.sala?.Nombre ?? (j.Id_sala ? `Sala #${j.Id_sala}` : 'Sin asignación')}</Text> : <Text style={styles.infoText}>Rally: sin sala (no aplica).</Text>}</View>

            {j.Curriculum ? <Text style={styles.cvText}>CV: {j.Curriculum}</Text> : null}

            <View style={styles.actions}><TouchableOpacity style={styles.editButton} onPress={() => router.push({ pathname: '/gesJurados/form' as any, params: { juradoEditar: JSON.stringify(j), idCertamen: String(idCertamenSel) } })} disabled={eliminando}><Ionicons name="create-outline" size={16} color="#fff" /><Text style={styles.actionText}>Editar</Text></TouchableOpacity><TouchableOpacity style={styles.deleteButton} onPress={() => abrirEliminar(j)} disabled={eliminando}><Ionicons name="trash-outline" size={16} color="#fff" /><Text style={styles.actionText}>Eliminar</Text></TouchableOpacity></View>

          </View>;

        })}

      </ScrollView>

      <Modal visible={confirmarEliminar} transparent animationType="fade" onRequestClose={() => setConfirmarEliminar(false)}><View style={styles.backdrop}><View style={styles.modalCard}><View style={[styles.modalIcon, styles.errorIcon]}><Ionicons name="trash-outline" size={28} color="#b91c1c" /></View><Text style={styles.modalTitle}>¿Eliminar jurado?</Text><Text style={styles.modalMessage}>Se eliminará el registro de {nombreJurado(juradoPendiente ?? {})}. Si tiene evaluaciones relacionadas, el servidor rechazará la operación.</Text><View style={styles.modalActions}><TouchableOpacity style={styles.cancelButton} onPress={() => setConfirmarEliminar(false)}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity><TouchableOpacity style={styles.deleteConfirmButton} onPress={() => void confirmarEliminacion()}><Text style={styles.confirmText}>Eliminar</Text></TouchableOpacity></View></View></View></Modal>

      <Modal visible={resultado.visible} transparent animationType="fade" onRequestClose={cerrarResultado}><View style={styles.backdrop}><View style={styles.modalCard}><View style={[styles.modalIcon, resultado.exito ? styles.successIcon : styles.errorIcon]}><Ionicons name={resultado.exito ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={29} color={resultado.exito ? '#15803d' : '#b91c1c'} /></View><Text style={styles.modalTitle}>{resultado.titulo}</Text><Text style={styles.modalMessage}>{resultado.mensaje}</Text><TouchableOpacity style={styles.confirmButton} onPress={cerrarResultado}><Text style={styles.confirmText}>Aceptar</Text></TouchableOpacity></View></View></Modal>

    </View>

  );

}



const styles = StyleSheet.create({

 page:{flex:1,backgroundColor:'#f1f5f9'},scrollView:{flex:1},header:{paddingTop:18,paddingHorizontal:18,alignItems:'center'},headerIcon:{width:56,height:56,borderRadius:17,backgroundColor:'#002b45',alignItems:'center',justifyContent:'center'},title:{fontSize:23,fontWeight:'800',color:'#002b45',marginTop:9},subtitle:{fontSize:12,color:'#64748b',textAlign:'center',marginTop:5,marginBottom:14},container:{padding:16,paddingBottom:40,flexGrow:1},sectionTitle:{fontSize:14,fontWeight:'800',color:'#002b45',marginTop:10,marginBottom:9},certamenesRow:{gap:8},certamenCard:{flexDirection:'row',alignItems:'center',gap:9,borderRadius:12,padding:11,backgroundColor:'#fff',borderWidth:1,borderColor:'#dbe3ee',marginBottom:3},certamenActivo:{backgroundColor:'#002b45',borderColor:'#002b45'},certamenNombre:{fontSize:13,fontWeight:'800',color:'#0f172a'},certamenTipo:{fontSize:11,color:'#64748b',marginTop:2},textoActivo:{color:'#fff'},newButton:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7,backgroundColor:'#86a327',padding:13,borderRadius:10,marginTop:16,marginBottom:12},newButtonText:{color:'#fff',fontSize:14,fontWeight:'800'},searchBox:{flexDirection:'row',alignItems:'center',backgroundColor:'#fff',borderWidth:1,borderColor:'#dbe3ee',borderRadius:9,paddingHorizontal:11},searchInput:{flex:1,height:43,marginLeft:8,color:'#0f172a'},chipsRow:{flexDirection:'row',alignItems:'center',gap:6,flexWrap:'wrap',marginTop:10},filterLabel:{fontSize:12,fontWeight:'700',color:'#475569'},chip:{paddingVertical:6,paddingHorizontal:9,borderRadius:16,backgroundColor:'#e2e8f0'},chipActive:{backgroundColor:'#002b45'},chipText:{fontSize:10,fontWeight:'700',color:'#334155'},chipTextActive:{color:'#fff'},listTitle:{fontSize:16,fontWeight:'800',color:'#002b45',marginTop:20,marginBottom:10},count:{fontSize:12,color:'#0369a1'},center:{alignItems:'center',padding:30},loadingText:{marginTop:8,color:'#64748b'},emptyCard:{alignItems:'center',backgroundColor:'#fff',borderRadius:12,padding:24,marginTop:6},emptyTitle:{fontSize:15,fontWeight:'800',color:'#334155',marginTop:9},emptyText:{fontSize:12,color:'#64748b',textAlign:'center',marginTop:5,lineHeight:18},card:{backgroundColor:'#fff',borderRadius:13,borderWidth:1,borderColor:'#e2e8f0',padding:14,marginBottom:12},cardHeader:{flexDirection:'row',alignItems:'center',gap:10},avatar:{width:42,height:42,borderRadius:12,backgroundColor:'#e0f2fe',alignItems:'center',justifyContent:'center'},cardName:{fontSize:16,fontWeight:'800',color:'#002b45'},cardId:{fontSize:10,color:'#94a3b8',fontWeight:'700',marginTop:2},statusBadge:{paddingHorizontal:9,paddingVertical:5,borderRadius:7},statusAceptada:{backgroundColor:'#dcfce7'},statusPendiente:{backgroundColor:'#fef3c7'},statusRechazada:{backgroundColor:'#fee2e2'},statusText:{fontSize:10,fontWeight:'800',color:'#334155'},infoBox:{backgroundColor:'#f8fafc',borderRadius:9,padding:10,marginTop:11,gap:5},infoText:{fontSize:12,color:'#475569'},cvText:{fontSize:11,color:'#64748b',marginTop:8},actions:{flexDirection:'row',justifyContent:'flex-end',gap:8,marginTop:12},editButton:{flexDirection:'row',alignItems:'center',gap:5,backgroundColor:'#0284c7',paddingHorizontal:12,paddingVertical:8,borderRadius:7},deleteButton:{flexDirection:'row',alignItems:'center',gap:5,backgroundColor:'#dc2626',paddingHorizontal:12,paddingVertical:8,borderRadius:7},actionText:{color:'#fff',fontWeight:'800',fontSize:12},backdrop:{flex:1,backgroundColor:'rgba(15,23,42,0.48)',justifyContent:'center',padding:18},modalCard:{backgroundColor:'#fff',padding:18,borderRadius:15},modalIcon:{alignSelf:'center',width:50,height:50,borderRadius:15,alignItems:'center',justifyContent:'center',marginBottom:9,backgroundColor:'#e0f2fe'},successIcon:{backgroundColor:'#dcfce7'},errorIcon:{backgroundColor:'#fee2e2'},modalTitle:{fontSize:17,fontWeight:'800',color:'#0f172a',textAlign:'center',marginBottom:7},modalMessage:{fontSize:13,lineHeight:19,color:'#475569',textAlign:'center',marginBottom:14},modalActions:{flexDirection:'row',gap:9},cancelButton:{flex:1,padding:12,borderRadius:9,borderWidth:1,borderColor:'#cbd5e1',alignItems:'center'},cancelText:{color:'#334155',fontWeight:'800'},confirmButton:{padding:12,borderRadius:9,backgroundColor:'#002b45',alignItems:'center'},deleteConfirmButton:{flex:1,padding:12,borderRadius:9,backgroundColor:'#dc2626',alignItems:'center'},confirmText:{color:'#fff',fontWeight:'800'}

});
