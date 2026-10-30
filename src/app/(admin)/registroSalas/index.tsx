// @ts-nocheck

import { Ionicons } from '@expo/vector-icons';

import { useFocusEffect, useRouter } from 'expo-router';

import { useCallback, useState } from 'react';

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

import { eliminarSala, getCertamenes, getSalas } from '../../../services/api';



const list = (value: any): any[] =>

  Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : Array.isArray(value?.salas) ? value.salas : [];

const idCert = (item: any) => Number(item?.Id_certamen ?? item?.Id_Certamen ?? item?.id_certamen ?? item?.id);

const typeOf = (item: any) => String(item?.Tipo ?? item?.tipo ?? '').trim().toUpperCase();

const isInnova = (item: any) => ['INNOVATEC', 'INNOVATECNM'].includes(typeOf(item));

const idSala = (item: any) => Number(item?.Id_sala ?? item?.id_sala ?? item?.id);

const nombreSala = (item: any) => String(item?.Nombre ?? item?.nombre ?? 'Sin nombre');

const ubicacionSala = (item: any) => String(item?.Ubicacion ?? item?.ubicacion ?? 'Sin ubicación');



type Resultado = { visible: boolean; titulo: string; mensaje: string; exito: boolean };



export default function SalasIndexScreen() {

  const router = useRouter();

  const [certamenes, setCertamenes] = useState<any[]>([]);

  const [idCertamenSel, setIdCertamenSel] = useState<number | null>(null);

  const [salas, setSalas] = useState<any[]>([]);

  const [busqueda, setBusqueda] = useState('');

  const [cargando, setCargando] = useState(true);

  const [eliminando, setEliminando] = useState(false);

  const [modalConfirmacion, setModalConfirmacion] = useState(false);

  const [salaPendiente, setSalaPendiente] = useState<any>(null);

  const [resultado, setResultado] = useState<Resultado>({ visible: false, titulo: '', mensaje: '', exito: false });
  const [modalCertamenesVisible, setModalCertamenesVisible] = useState(false);



  const mostrarResultado = (titulo: string, mensaje: string, exito = false) =>

    setResultado({ visible: true, titulo, mensaje, exito });

  const certamenSeleccionado = certamenes.find((item) => idCert(item) === Number(idCertamenSel));



  const cargar = useCallback(async (requestedId?: number | null, texto = '', mostrarCarga = true) => {

    if (mostrarCarga) setCargando(true);

    try {

      const [certResp, salasResp] = await Promise.all([

        getCertamenes(),

        getSalas(requestedId ?? undefined),

      ]);

      const innova = list(certResp).filter(isInnova);

      setCertamenes(innova);

      const actual = innova.find((item: any) => idCert(item) === Number(requestedId)) ?? innova[0] ?? null;

      const chosenId = actual ? idCert(actual) : null;

      setIdCertamenSel(chosenId);

      const term = texto.trim().toLocaleLowerCase();

      const filtradas = list(salasResp).filter((sala: any) => {

        const idPadre = Number(sala?.Id_certamen ?? sala?.Id_Certamen ?? sala?.id_certamen);

        const sameCertamen = chosenId != null && idPadre === chosenId;

        const matchText = !term || nombreSala(sala).toLocaleLowerCase().includes(term) || ubicacionSala(sala).toLocaleLowerCase().includes(term);

        return sameCertamen && matchText;

      });

      setSalas(innova.length === 0 ? [] : filtradas);

    } catch (error: any) {

      mostrarResultado('No se pudieron cargar las salas', error?.message || 'Verifica la conexión con Laravel.', false);

    } finally {

      if (mostrarCarga) setCargando(false);

    }

  }, []);



  useFocusEffect(

    useCallback(() => {

      void cargar(idCertamenSel, '', true);

    }, [cargar, idCertamenSel]),

  );



  const seleccionarCertamen = (id: number) => {

    setIdCertamenSel(id);

    setBusqueda('');

    void cargar(id, '', true);

  };



  const abrirEditar = (sala: any) =>

    router.push({

      pathname: '/registroSalas/form' as any,

      params: {

        id: String(idSala(sala)),

        idCertamen: String(sala.Id_certamen ?? sala.id_certamen ?? idCertamenSel),

        nombre: nombreSala(sala),

        ubicacion: ubicacionSala(sala),

      },

    });



  const confirmarEliminacion = async () => {

    if (!salaPendiente || eliminando) return;

    const pending = salaPendiente;

    setModalConfirmacion(false);

    setEliminando(true);

    try {

      await eliminarSala(idSala(pending));

      await cargar(idCertamenSel, busqueda, false);

      mostrarResultado('¡Sala eliminada!', `La sala “${nombreSala(pending)}” se eliminó correctamente.`, true);

    } catch (error: any) {

      mostrarResultado('No se pudo eliminar', error?.message || 'La sala podría estar vinculada a equipos, jurados o asignaciones.', false);

    } finally {

      setEliminando(false);

      setSalaPendiente(null);

    }

  };



  const cerrarResultado = () => setResultado((prev) => ({ ...prev, visible: false }));



  return (

    <View style={styles.page}>

      {/* Un único ScrollView vertical para toda la pantalla. */}

      <ScrollView

        style={styles.container}

        contentContainerStyle={styles.contentContainer}

        showsVerticalScrollIndicator

        keyboardShouldPersistTaps="handled"

      >

        <View style={styles.header}>

          <View style={styles.headerIcon}>

            <Ionicons name="business-outline" size={26} color="#fff" />
            

          </View>

          <Text style={styles.title}>Gestión de salas</Text>
        </View>



        <View style={styles.selectorCard}>
          <Text style={styles.selectorTitle}>Certamen seleccionado</Text>
          <Text style={styles.selectorDescription}>
            Las salas mostradas corresponden únicamente al certamen seleccionado.
          </Text>

          {certamenes.length > 0 && certamenSeleccionado ? (
            <TouchableOpacity
              style={styles.selectedCertamen}
              onPress={() => setModalCertamenesVisible(true)}
              disabled={eliminando || cargando}
              activeOpacity={0.85}
            >
              <View style={styles.selectedCertamenIcon}>
                <Ionicons name="bulb-outline" size={29} color="#047857" />
              </View>
              <View style={styles.selectedCertamenInfo}>
                <Text style={styles.selectedCertamenName}>
                  {certamenSeleccionado.Nombre ?? certamenSeleccionado.nombre ?? 'InnovaTecNM'}
                </Text>
                <Text style={styles.selectedCertamenType}>InnovaTecNM</Text>
                <Text style={styles.changeCertamenText}>Toca para cambiar de certamen</Text>
              </View>
              <Ionicons name="chevron-down-circle" size={29} color="#64748b" />
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No hay certámenes InnovaTecNM</Text>
              <Text style={styles.emptyText}>Registra un certamen con Tipo INNOVATEC antes de crear salas.</Text>
            </View>
          )}
        </View>

        <TouchableOpacity

          style={[styles.newButton, (!certamenSeleccionado || eliminando) && styles.disabledButton]}

          onPress={() => certamenSeleccionado && router.push({ pathname: '/registroSalas/form' as any, params: { idCertamen: String(idCertamenSel) } })}

          disabled={!certamenSeleccionado || eliminando}

        >

          <Ionicons name="add-circle-outline" size={20} color="#fff" />

          <Text style={styles.newButtonText}>Nueva sala para InnovaTecNM</Text>

        </TouchableOpacity>



        <View style={styles.filterCard}>

          <View style={styles.searchBox}>

            <Ionicons name="search-outline" size={18} color="#64748b" />

            <TextInput

              style={styles.searchInput}

              placeholder="Buscar por nombre o ubicación..."

              placeholderTextColor="#94a3b8"

              value={busqueda}

              onChangeText={setBusqueda}

              onSubmitEditing={() => void cargar(idCertamenSel, busqueda)}

              returnKeyType="search"

              editable={!eliminando}

            />

          </View>

          <TouchableOpacity

            style={styles.searchButton}

            onPress={() => void cargar(idCertamenSel, busqueda)}

            disabled={cargando || eliminando}

          >

            <Ionicons name="search" size={16} color="#fff" />

            <Text style={styles.searchButtonText}>Buscar</Text>

          </TouchableOpacity>

        </View>



        {cargando ? (

          <View style={styles.center}>

            <ActivityIndicator size="large" color="#002b45" />

            <Text style={styles.loadingText}>Cargando salas de InnovaTecNM...</Text>

          </View>

        ) : !certamenSeleccionado ? null : salas.length === 0 ? (

          <View style={styles.emptyBox}>

            <Ionicons name="business-outline" size={32} color="#94a3b8" />

            <Text style={styles.emptyTitle}>No hay salas para este certamen</Text>

            <Text style={styles.emptyText}>

              {busqueda.trim() ? 'Prueba con otro término de búsqueda.' : `Registra la primera sala de ${certamenSeleccionado.Nombre ?? 'InnovaTecNM'}.`}

            </Text>

          </View>

        ) : (

          // Los registros se muestran dentro del mismo desplazamiento vertical principal.

          <View style={styles.salasList}>

            {salas.map((sala: any, index: number) => (

              <View key={idSala(sala) || index} style={styles.card}>

                <View style={styles.cardHeader}>

                  <View style={styles.cardIcon}>

                    <Ionicons name="business-outline" size={22} color="#0369a1" />

                  </View>

                  <View style={styles.cardInfo}>

                    <Text style={styles.cardTitle}>{nombreSala(sala)}</Text>

                    <Text style={styles.cardBadge}>SALA-{String(idSala(sala)).padStart(3, '0')}</Text>

                  </View>

                  <View style={styles.innovaBadge}>

                    <Text style={styles.innovaBadgeText}>INNOVATEC</Text>

                  </View>

                </View>

                <View style={styles.locationRow}>

                  <Ionicons name="location-outline" size={17} color="#64748b" />

                  <Text style={styles.locationLabel}>Ubicación:</Text>

                  <Text style={styles.locationValue}>{ubicacionSala(sala)}</Text>

                </View>

                <Text style={styles.parentText}>Certamen: {certamenSeleccionado.Nombre ?? 'InnovaTecNM'}</Text>

                <View style={styles.actions}>

                  <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => abrirEditar(sala)} disabled={eliminando}>

                    <Ionicons name="create-outline" size={16} color="#fff" />

                    <Text style={styles.actionText}>Editar</Text>

                  </TouchableOpacity>

                  <TouchableOpacity

                    style={[styles.actionButton, styles.deleteButton]}

                    onPress={() => { setSalaPendiente(sala); setModalConfirmacion(true); }}

                    disabled={eliminando}

                  >

                    <Ionicons name="trash-outline" size={16} color="#fff" />

                    <Text style={styles.actionText}>Eliminar</Text>

                  </TouchableOpacity>

                </View>

              </View>

            ))}

          </View>

        )}

      </ScrollView>



      {/* Los modales quedan fuera del ScrollView. */}

      <Modal
        visible={modalCertamenesVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalCertamenesVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.certamenModalCard}>
            <View style={styles.certamenModalHeader}>
              <Text style={styles.certamenModalTitle}>Seleccionar certamen</Text>
              <TouchableOpacity onPress={() => setModalCertamenesVisible(false)}>
                <Ionicons name="close" size={27} color="#475569" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.certamenModalList}
              showsVerticalScrollIndicator
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {certamenes.map((item: any) => {
                const id = idCert(item);
                const active = id === Number(idCertamenSel);
                return (
                  <TouchableOpacity
                    key={id}
                    style={[styles.certamenOption, active && styles.certamenOptionActive]}
                    onPress={() => {
                      setModalCertamenesVisible(false);
                      if (!active) seleccionarCertamen(id);
                    }}
                    disabled={eliminando || cargando}
                    activeOpacity={0.8}
                  >
                    <View style={styles.certamenOptionIcon}>
                      <Ionicons name="bulb-outline" size={25} color={active ? '#166534' : '#047857'} />
                    </View>
                    <View style={styles.certamenOptionInfo}>
                      <Text style={[styles.certamenOptionName, active && styles.certamenOptionNameActive]}>
                        {item.Nombre ?? item.nombre ?? `Certamen #${id}`}
                      </Text>
                      <Text style={[styles.certamenOptionType, active && styles.certamenOptionTypeActive]}>InnovaTecNM</Text>
                    </View>
                    {active && <Ionicons name="checkmark-circle" size={24} color="#15803d" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={modalConfirmacion} transparent animationType="fade" onRequestClose={() => { setModalConfirmacion(false); setSalaPendiente(null); }}>

        <View style={styles.modalBackdrop}>

          <View style={styles.modalCard}>

            <View style={styles.modalIcon}><Ionicons name="warning-outline" size={30} color="#b45309" /></View>

            <Text style={styles.modalTitle}>{salaPendiente ? '¿Eliminar esta sala?' : 'Confirma la operación'}</Text>

            <Text style={styles.modalMessage}>

              {salaPendiente ? `Se intentará eliminar “${nombreSala(salaPendiente)}”. Si está asociada a equipos, jurados o asignaciones, Laravel rechazará la operación.` : 'Confirma para continuar.'}

            </Text>

            <View style={styles.modalActions}>

              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => { setModalConfirmacion(false); setSalaPendiente(null); }}>

                <Text style={styles.cancelText}>Cancelar</Text>

              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalButton, styles.deleteButton]} onPress={() => void confirmarEliminacion()} disabled={!salaPendiente}>

                <Text style={styles.actionText}>Sí, eliminar</Text>

              </TouchableOpacity>

            </View>

          </View>

        </View>

      </Modal>



      <Modal visible={eliminando} transparent animationType="fade" onRequestClose={() => {}}>

        <View style={styles.modalBackdrop}>

          <View style={styles.loadingCard}>

            <ActivityIndicator size="large" color="#002b45" />

            <Text style={styles.modalTitle}>Eliminando sala...</Text>

            <Text style={styles.modalMessage}>Procesando la solicitud.</Text>

          </View>

        </View>

      </Modal>



      <Modal visible={resultado.visible} transparent animationType="fade" onRequestClose={cerrarResultado}>

        <View style={styles.modalBackdrop}>

          <View style={styles.modalCard}>

            <View style={[styles.modalIcon, resultado.exito ? styles.successIcon : styles.errorIcon]}>

              <Ionicons name={resultado.exito ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={30} color={resultado.exito ? '#15803d' : '#b91c1c'} />

            </View>

            <Text style={styles.modalTitle}>{resultado.titulo}</Text>

            <Text style={styles.modalMessage}>{resultado.mensaje}</Text>

            <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={cerrarResultado}>

              <Text style={styles.actionText}>Aceptar</Text>

            </TouchableOpacity>

          </View>

        </View>

      </Modal>

    </View>

  );

}



const styles = StyleSheet.create({

  page: { flex: 1, backgroundColor: '#f5f7fa' },

  container: { flex: 1 },

  contentContainer: { padding: 16, paddingBottom: 40, flexGrow: 1 },

  header: { marginBottom: 15 },

  headerIcon: { width: 52, height: 52, borderRadius: 15, backgroundColor: '#002b45', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },

  title: { fontSize: 23, fontWeight: '800', color: '#002b45' },

  subtitle: { color: '#64748b', fontSize: 13, lineHeight: 19, marginTop: 5 },

  sectionTitle: { color: '#334155', fontSize: 13, fontWeight: '800', marginBottom: 8 },

  selectorCard: { backgroundColor: '#fff', borderRadius: 17, borderWidth: 1, borderColor: '#e2e8f0', padding: 15, marginBottom: 13 },
  selectorTitle: { color: '#0f172a', fontSize: 19, fontWeight: '800', marginBottom: 7 },
  selectorDescription: { color: '#64748b', fontSize: 13, lineHeight: 20, marginBottom: 13 },
  selectedCertamen: { minHeight: 95, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 16, padding: 12, gap: 11 },
  selectedCertamenIcon: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center' },
  selectedCertamenInfo: { flex: 1, minWidth: 0 },
  selectedCertamenName: { color: '#0f172a', fontSize: 17, fontWeight: '800' },
  selectedCertamenType: { color: '#64748b', fontSize: 14, marginTop: 4, fontWeight: '700' },
  changeCertamenText: { color: '#0369a1', fontSize: 12, marginTop: 7, fontWeight: '800' },
  certamenModalCard: { width: '100%', maxWidth: 500, maxHeight: '78%', backgroundColor: '#fff', borderRadius: 21, paddingHorizontal: 17, paddingTop: 17, paddingBottom: 9, elevation: 10 },
  certamenModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  certamenModalTitle: { color: '#0f172a', fontSize: 20, fontWeight: '800' },
  certamenModalList: { marginTop: 8, flexGrow: 0 },
  certamenOption: { minHeight: 78, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', borderRadius: 12, gap: 10 },
  certamenOptionActive: { backgroundColor: '#ecfdf5', borderBottomColor: '#bbf7d0', marginVertical: 3 },
  certamenOptionIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center' },
  certamenOptionInfo: { flex: 1 },
  certamenOptionName: { color: '#0f172a', fontSize: 16, fontWeight: '800' },
  certamenOptionNameActive: { color: '#166534' },
  certamenOptionType: { color: '#64748b', fontSize: 13, marginTop: 4 },
  certamenOptionTypeActive: { color: '#15803d', fontWeight: '700' },
  newButton: { backgroundColor: '#7c9f27', borderRadius: 9, minHeight: 45, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, paddingHorizontal: 12, marginTop: 7, marginBottom: 12 },

  newButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  disabledButton: { opacity: 0.5 },

  filterCard: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', padding: 10, flexDirection: 'row', gap: 8, marginBottom: 12 },

  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 9, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8 },

  searchInput: { flex: 1, minHeight: 38, color: '#0f172a' },

  searchButton: { backgroundColor: '#002b45', borderRadius: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },

  searchButtonText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  center: { minHeight: 130, alignItems: 'center', justifyContent: 'center', gap: 9, padding: 24 },

  loadingText: { color: '#002b45', fontWeight: '700', fontSize: 13 },

  salasList: { paddingBottom: 8, gap: 11 },

  emptyBox: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 13, padding: 22, alignItems: 'center', gap: 7, marginBottom: 12 },

  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#334155', textAlign: 'center' },

  emptyText: { color: '#64748b', fontSize: 12, textAlign: 'center', lineHeight: 18 },

  card: { backgroundColor: '#fff', borderRadius: 13, borderWidth: 1, borderColor: '#e2e8f0', padding: 14 },

  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  cardIcon: { width: 42, height: 42, borderRadius: 11, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center' },

  cardInfo: { flex: 1 },

  cardTitle: { color: '#0f172a', fontSize: 16, fontWeight: '800' },

  cardBadge: { color: '#64748b', fontSize: 10, marginTop: 3, fontWeight: '700' },

  innovaBadge: { borderRadius: 20, backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 5 },

  innovaBadgeText: { color: '#166534', fontSize: 9, fontWeight: '800' },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 13 },

  locationLabel: { color: '#64748b', fontSize: 12 },

  locationValue: { flex: 1, color: '#334155', fontSize: 12, fontWeight: '700' },

  parentText: { color: '#64748b', fontSize: 11, marginTop: 9 },

  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 14 },

  actionButton: { borderRadius: 7, paddingVertical: 8, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 5 },

  editButton: { backgroundColor: '#0284c7' },

  deleteButton: { backgroundColor: '#dc2626' },

  actionText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.48)', padding: 20 },

  modalCard: { width: '100%', maxWidth: 430, padding: 20, borderRadius: 15, backgroundColor: '#fff' },

  modalIcon: { alignSelf: 'center', width: 54, height: 54, borderRadius: 17, backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },

  modalTitle: { fontSize: 18, color: '#002b45', fontWeight: '800', textAlign: 'center', marginBottom: 8 },

  modalMessage: { color: '#475569', fontSize: 13, lineHeight: 19, textAlign: 'center', marginBottom: 14 },

  modalActions: { flexDirection: 'row', gap: 9 },

  modalButton: { minHeight: 42, flex: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },

  cancelButton: { backgroundColor: '#e2e8f0' },

  cancelText: { color: '#334155', fontWeight: '800' },

  confirmButton: { backgroundColor: '#002b45' },

  loadingCard: { width: '100%', maxWidth: 330, backgroundColor: '#fff', borderRadius: 15, padding: 24, alignItems: 'center', gap: 12 },

  successIcon: { backgroundColor: '#dcfce7' },

  errorIcon: { backgroundColor: '#fee2e2' },

});
