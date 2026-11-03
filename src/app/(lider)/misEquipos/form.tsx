// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  actualizarEquipo,
  crearEquipo,
  getCategCertamenes,
  getCertamenes,
  getDesafios,
  getSalas,
} from '../../../services/api';

const extraerLista = (r: any): any[] =>
  Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : Array.isArray(r?.data?.data) ? r.data.data : [];

const primerValor = (valor: any) => (Array.isArray(valor) ? valor[0] : valor);
const idCertamenDe = (x: any) => Number(x?.Id_certamen ?? x?.Id_Certamen ?? x?.id_certamen ?? x?.idCertamen ?? x?.id);
const idDesafioDe = (x: any) => Number(x?.Id_desafio ?? x?.id_desafio ?? x?.id);
const idCategoriaDe = (x: any) => Number(x?.Id_categCertamen ?? x?.id_categCertamen ?? x?.id);
const idSalaDe = (x: any) => Number(x?.Id_sala ?? x?.id_sala ?? x?.id);

const estadoInicial = { visible: false, titulo: '', mensaje: '', exito: false };

interface IntegranteState {
  no_control: string;
  Nombre: string;
  Carrera: string;
  Rol: string;
  Sexo: string; // Guardará 'F' o 'M'
  Correo: string;
  Semestre: string;
}

export default function EquipoFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ equipoEditar?: string; idCertamen?: string }>();
  const equipoParam = primerValor(params.equipoEditar);
  const idCertamenParam = primerValor(params.idCertamen);

  // Control del Flujo en 2 Pasos (1: Datos Equipo, 2: Integrantes)
  const [paso, setPaso] = useState<1 | 2>(1);

  const [idEquipo, setIdEquipo] = useState<number | null>(null);
  const [nombreEquipo, setNombreEquipo] = useState('');
  const [video, setVideo] = useState('');
  const [reporte, setReporte] = useState('');

  // Catálogos Máster
  const [certamenes, setCertamenes] = useState<any[]>([]);
  const [todosLosDesafios, setTodosLosDesafios] = useState<any[]>([]);
  const [todasLasCategorias, setTodasLasCategorias] = useState<any[]>([]);

  // Listas filtradas
  const [desafios, setDesafios] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [salas, setSalas] = useState<any[]>([]);

  const [idCertamen, setIdCertamen] = useState<number | null>(idCertamenParam ? Number(idCertamenParam) : null);
  const [idDesafio, setIdDesafio] = useState<number | null>(null);
  const [idCategCertamen, setIdCategCertamen] = useState<number | null>(null);
  const [idSala, setIdSala] = useState<number | null>(null);
  const [idLider, setIdLider] = useState<number | null>(null);

  const [integrantes, setIntegrantes] = useState<IntegranteState[]>([
    { no_control: '', Nombre: '', Carrera: '', Rol: 'Participante', Sexo: 'F', Correo: '', Semestre: '' },
  ]);

  const [selectorDesafio, setSelectorDesafio] = useState(false);
  const [selectorCategoria, setSelectorCategoria] = useState(false);
  const [selectorSala, setSelectorSala] = useState(false);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [confirmarVisible, setConfirmarVisible] = useState(false);
  const [resultado, setResultado] = useState(estadoInicial);

  const certamenSeleccionado = certamenes.find((c) => idCertamenDe(c) === Number(idCertamen)) ?? null;
  const esCertamenInnova = ['INNOVATEC', 'INNOVATECNM'].includes(
    String(certamenSeleccionado?.Tipo ?? certamenSeleccionado?.tipo ?? '').toUpperCase()
  );

  const desafioSeleccionado = desafios.find((d) => idDesafioDe(d) === Number(idDesafio)) ?? null;
  const categoriaSeleccionada = categorias.find((c) => idCategoriaDe(c) === Number(idCategCertamen)) ?? null;
  const salaSeleccionada = salas.find((s) => idSalaDe(s) === Number(idSala)) ?? null;

  const mostrarResultado = (titulo: string, mensaje: string, exito = false) =>
    setResultado({ visible: true, titulo, mensaje, exito });

  useEffect(() => {
    let activo = true;
    const cargarFormulario = async () => {
      setCargando(true);
      try {
        const userRaw = await AsyncStorage.getItem('userData');
        if (userRaw) {
          const u = JSON.parse(userRaw);
          setIdLider(Number(u.Id_usuario ?? u.id_usuario ?? u.id));
        }

        let original: any = null;
        if (equipoParam) {
          try {
            original = JSON.parse(String(equipoParam));
          } catch {
            original = null;
          }
        }

        const [rCert, rDesaf, rCateg] = await Promise.all([
          getCertamenes(),
          getDesafios(),
          getCategCertamenes(),
        ]);
        if (!activo) return;

        const listaCert = extraerLista(rCert);
        const listaDesaf = extraerLista(rDesaf);
        const listaCateg = extraerLista(rCateg);

        setCertamenes(listaCert);
        setTodosLosDesafios(listaDesaf);
        setTodasLasCategorias(listaCateg);

        if (original) {
          setIdEquipo(Number(original.Id_equipo) || null);
          setNombreEquipo(String(original.Nombre ?? ''));
          setVideo(String(original.Video ?? ''));
          setReporte(String(original.Reporte ?? ''));
          setIdDesafio(Number(original.Id_desafio) || null);
          setIdCategCertamen(Number(original.Id_categCertamen) || null);
          setIdSala(original.Id_sala ? Number(original.Id_sala) : null);
          setIdLider(Number(original.Id_lider) || null);

          const listaIntegrantes = original.integrantes ?? original.integrante ?? [];
          if (Array.isArray(listaIntegrantes) && listaIntegrantes.length > 0) {
            setIntegrantes(
              listaIntegrantes.map((i: any) => {
                const sexoRaw = String(i.Sexo ?? i.sexo ?? 'F').toUpperCase();
                return {
                  no_control: String(i.no_control ?? i.No_control ?? ''),
                  Nombre: String(i.Nombre ?? i.nombre ?? ''),
                  Carrera: String(i.Carrera ?? i.carrera ?? ''),
                  Rol: String(i.Rol ?? i.rol ?? 'Participante'),
                  Sexo: sexoRaw.startsWith('M') ? 'M' : 'F',
                  Correo: String(i.Correo ?? i.correo ?? ''),
                  Semestre: String(i.Semestre ?? i.semestre ?? ''),
                };
              })
            );
          }
        }

        const idCertDefecto = Number(
          original?.Id_certamen ??
          original?.desafio?.Id_certamen ??
          (idCertamenParam ? Number(idCertamenParam) : null) ??
          idCertamenDe(listaCert[0])
        );

        setIdCertamen(idCertDefecto);
        setDesafios(listaDesaf.filter((d) => idCertamenDe(d) === idCertDefecto));
        setCategorias(listaCateg.filter((c) => idCertamenDe(c) === idCertDefecto));
      } catch (error: any) {
        if (activo) mostrarResultado('Error', error?.message || 'No se pudieron cargar los datos.', false);
      } finally {
        if (activo) setCargando(false);
      }
    };

    void cargarFormulario();
    return () => {
      activo = false;
    };
  }, [equipoParam, idCertamenParam]);

  useEffect(() => {
    let activo = true;
    const cargarSalasCertamen = async () => {
      if (!idCertamen || !esCertamenInnova) {
        setSalas([]);
        setIdSala(null);
        return;
      }
      try {
        const resp = await getSalas(idCertamen);
        if (activo) {
          const lista = extraerLista(resp);
          setSalas(lista.filter((s) => idCertamenDe(s) === Number(idCertamen)));
        }
      } catch {
        if (activo) setSalas([]);
      }
    };
    void cargarSalasCertamen();
    return () => {
      activo = false;
    };
  }, [idCertamen, esCertamenInnova]);

  const seleccionarCertamen = (id: number) => {
    setIdCertamen(id);
    setIdDesafio(null);
    setIdCategCertamen(null);
    setIdSala(null);
    setDesafios(todosLosDesafios.filter((d) => idCertamenDe(d) === Number(id)));
    setCategorias(todasLasCategorias.filter((c) => idCertamenDe(c) === Number(id)));
  };

  const agregarIntegrante = () => {
    setIntegrantes([
      ...integrantes,
      { no_control: '', Nombre: '', Carrera: '', Rol: 'Integrante', Sexo: 'F', Correo: '', Semestre: '' },
    ]);
  };

  const eliminarIntegrante = (idx: number) => {
    if (integrantes.length === 1) {
      mostrarResultado('Atención', 'El equipo debe contar con al menos un integrante.', false);
      return;
    }
    setIntegrantes(integrantes.filter((_, i) => i !== idx));
  };

  const actualizarIntegrante = (idx: number, campo: keyof IntegranteState, valor: string) => {
    const copia = [...integrantes];
    copia[idx][campo] = valor;
    setIntegrantes(copia);
  };

  const validarPaso1 = () => {
    if (!nombreEquipo.trim()) {
      mostrarResultado('Falta el nombre', 'Ingresa el nombre del equipo.', false);
      return false;
    }
    if (!idDesafio || !idCategCertamen) {
      mostrarResultado('Falta certamen / desafío', 'Selecciona el desafío y la categoría correspondientes.', false);
      return false;
    }
    return true;
  };

  const validarPaso2 = () => {
    if (integrantes.length === 0) {
      mostrarResultado('Sin integrantes', 'Debes registrar al menos un integrante.', false);
      return false;
    }
    for (let i = 0; i < integrantes.length; i++) {
      if (!integrantes[i].no_control.trim() || !integrantes[i].Nombre.trim()) {
        mostrarResultado('Integrante incompleto', `El integrante #${i + 1} requiere No. de Control y Nombre.`, false);
        return false;
      }
    }
    return true;
  };

  const irAPaso2 = () => {
    if (validarPaso1()) {
      setPaso(2);
    }
  };

  const guardar = () => {
    if (guardando || !validarPaso2()) return;
    setConfirmarVisible(true);
  };

  const confirmarGuardado = async () => {
    if (guardando || !idCertamen) return;
    setConfirmarVisible(false);
    setGuardando(true);

    let idLiderCalculado = idLider;
    if (!idLiderCalculado) {
      try {
        const userRaw = await AsyncStorage.getItem('userData');
        if (userRaw) {
          const u = JSON.parse(userRaw);
          idLiderCalculado = Number(u.Id_usuario ?? u.id_usuario ?? u.id ?? u.Id_lider ?? u.id_lider);
        }
      } catch (e) {
        console.error('Error al leer userData:', e);
      }
    }

    try {
      const payload = {
        Nombre: nombreEquipo.trim(),
        Id_desafio: Number(idDesafio),
        Id_categCertamen: Number(idCategCertamen),
        Id_sala: esCertamenInnova && idSala ? Number(idSala) : null,
        Video: video.trim() || null,
        Reporte: reporte.trim() || null,
        Id_lider: Number(idLiderCalculado && !isNaN(idLiderCalculado) ? idLiderCalculado : 1),

        integrantes: integrantes.map((ing) => ({
          no_control: ing.no_control.trim(),
          Nombre: ing.Nombre.trim(),
          Carrera: ing.Carrera.trim() || null,
          Rol: ing.Rol.trim() || 'Participante',
          Sexo: ing.Sexo === 'M' ? 'M' : 'F', // 🟢 Garantiza enviar solo 1 carácter
          Correo: ing.Correo.trim() || null,
          Semestre: ing.Semestre ? Number(ing.Semestre) : null,
        })),
      };

      if (idEquipo) {
        await actualizarEquipo(idEquipo, payload);
      } else {
        await crearEquipo(payload);
      }

      mostrarResultado(
        idEquipo ? '¡Equipo actualizado!' : '¡Equipo registrado!',
        `El equipo "${nombreEquipo}" ha sido guardado exitosamente con ${integrantes.length} integrante(s).`,
        true
      );
    } catch (error: any) {
      mostrarResultado(
        'No se pudo guardar',
        error?.response?.data?.message || error?.message || 'Verifica la conexión con el servidor.',
        false
      );
    } finally {
      setGuardando(false);
    }
  };

  const cerrarResultado = () => {
    const exito = resultado.exito;
    setResultado(estadoInicial);
    if (exito) router.back();
  };

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#002b45" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.headerIcon}>
            <Ionicons name="people-outline" size={28} color="#fff" />
          </View>
          <Text style={styles.title}>{idEquipo ? 'Editar equipo' : 'Registro de nuevo equipo'}</Text>

          {/* Indicador de pasos */}
          <View style={styles.stepperContainer}>
            <View style={[styles.stepBadge, paso === 1 && styles.stepBadgeActive]}>
              <Text style={[styles.stepText, paso === 1 && styles.stepTextActive]}>1. Datos del Equipo</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            <View style={[styles.stepBadge, paso === 2 && styles.stepBadgeActive]}>
              <Text style={[styles.stepText, paso === 2 && styles.stepTextActive]}>2. Integrantes</Text>
            </View>
          </View>

          {/* ---------------- PASO 1: DATOS DEL EQUIPO ---------------- */}
          {paso === 1 && (
            <View>
              <Text style={styles.sectionTitle}>1. Selecciona el certamen</Text>
              <View style={styles.certamenesRow}>
                {certamenes.map((cert) => {
                  const id = idCertamenDe(cert);
                  const activo = Number(idCertamen) === id;
                  const innov = ['INNOVATEC', 'INNOVATECNM'].includes(String(cert.Tipo ?? cert.tipo ?? '').toUpperCase());
                  return (
                    <TouchableOpacity key={id} style={[styles.certamenCard, activo && styles.certamenActivo]} onPress={() => seleccionarCertamen(id)}>
                      <Ionicons name={innov ? 'bulb-outline' : 'trophy-outline'} size={20} color={activo ? '#fff' : '#0369a1'} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.certamenNombre, activo && styles.textoActivo]}>{cert.Nombre ?? cert.nombre ?? `Certamen #${id}`}</Text>
                        <Text style={[styles.certamenTipo, activo && styles.textoActivo]}>{innov ? 'InnovaTecNM' : (cert.Tipo ?? 'Rally')}</Text>
                      </View>
                      {activo ? <Ionicons name="checkmark-circle" size={18} color="#fff" /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.sectionTitle}>2. Información general</Text>
              <Text style={styles.label}>Nombre del equipo *</Text>
              <TextInput style={styles.input} placeholder="Ej. Innovadores ITSSMT" placeholderTextColor="#94a3b8" value={nombreEquipo} onChangeText={setNombreEquipo} />

              <Text style={styles.label}>Desafío del certamen *</Text>
              <TouchableOpacity style={styles.selector} onPress={() => setSelectorDesafio(true)}>
                <Ionicons name="flag-outline" size={20} color="#0369a1" />
                <Text style={[styles.selectorText, !desafioSeleccionado && styles.placeholder]}>
                  {desafioSeleccionado ? (desafioSeleccionado.Nombre ?? desafioSeleccionado.nombre) : 'Selecciona el desafío'}
                </Text>
                <Ionicons name="chevron-down" size={19} color="#64748b" />
              </TouchableOpacity>

              <Text style={styles.label}>Categoría *</Text>
              <TouchableOpacity style={styles.selector} onPress={() => setSelectorCategoria(true)}>
                <Ionicons name="ribbon-outline" size={20} color="#0369a1" />
                <Text style={[styles.selectorText, !categoriaSeleccionada && styles.placeholder]}>
                  {categoriaSeleccionada ? (categoriaSeleccionada.Nombre ?? categoriaSeleccionada.nombre) : 'Selecciona la categoría'}
                </Text>
                <Ionicons name="chevron-down" size={19} color="#64748b" />
              </TouchableOpacity>

              {esCertamenInnova ? (
                <>
                  <Text style={styles.label}>Sala asignada (opcional)</Text>
                  <TouchableOpacity style={styles.selector} onPress={() => setSelectorSala(true)}>
                    <Ionicons name="business-outline" size={20} color="#0369a1" />
                    <Text style={[styles.selectorText, !salaSeleccionada && styles.placeholder]}>
                      {salaSeleccionada ? (salaSeleccionada.Nombre ?? salaSeleccionada.nombre) : 'Sin sala asignada'}
                    </Text>
                    <Ionicons name="chevron-down" size={19} color="#64748b" />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={20} color="#92400e" />
                  <Text style={styles.infoText}>Rally no utiliza salas. El equipo se guardará sin sala asignada.</Text>
                </View>
              )}

              <Text style={styles.label}>Enlace al video (opcional)</Text>
              <TextInput style={styles.input} placeholder="https://youtube.com/..." placeholderTextColor="#94a3b8" value={video} onChangeText={setVideo} />

              <Text style={styles.label}>Enlace al reporte (opcional)</Text>
              <TextInput style={styles.input} placeholder="https://drive.google.com/..." placeholderTextColor="#94a3b8" value={reporte} onChangeText={setReporte} />

              <TouchableOpacity style={styles.saveButton} onPress={irAPaso2}>
                <Text style={styles.saveText}>Continuar a Integrantes</Text>
                <Ionicons name="arrow-forward-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* ---------------- PASO 2: INTEGRANTES DEL EQUIPO ---------------- */}
          {paso === 2 && (
            <View>
              <View style={styles.rowHeader}>
                <Text style={styles.sectionTitle}>Integrantes del equipo</Text>
                <TouchableOpacity style={styles.btnAdd} onPress={agregarIntegrante}>
                  <Ionicons name="add-circle-outline" size={18} color="#86a327" />
                  <Text style={styles.btnAddText}>Agregar integrante</Text>
                </TouchableOpacity>
              </View>

              {integrantes.map((ing, idx) => (
                <View key={`integrante-${idx}`} style={styles.cardIntegrante}>
                  <View style={styles.cardHeaderIntegrante}>
                    <Text style={styles.cardTitleIntegrante}>Integrante #{idx + 1}</Text>
                    {integrantes.length > 1 && (
                      <TouchableOpacity onPress={() => eliminarIntegrante(idx)}>
                        <Ionicons name="trash-outline" size={19} color="#dc2626" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text style={styles.labelSub}>Número de control *</Text>
                  <TextInput style={styles.inputSub} placeholder="Ej. 21600123" placeholderTextColor="#94a3b8" value={ing.no_control} onChangeText={(t) => actualizarIntegrante(idx, 'no_control', t)} />

                  <Text style={styles.labelSub}>Nombre completo *</Text>
                  <TextInput style={styles.inputSub} placeholder="Ej. Juan Pérez González" placeholderTextColor="#94a3b8" value={ing.Nombre} onChangeText={(t) => actualizarIntegrante(idx, 'Nombre', t)} />

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.labelSub}>Rol</Text>
                      <TextInput style={styles.inputSub} placeholder="Ej. Programador" placeholderTextColor="#94a3b8" value={ing.Rol} onChangeText={(t) => actualizarIntegrante(idx, 'Rol', t)} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.labelSub}>Semestre</Text>
                      <TextInput style={styles.inputSub} placeholder="Ej. 8" keyboardType="numeric" placeholderTextColor="#94a3b8" value={ing.Semestre} onChangeText={(t) => actualizarIntegrante(idx, 'Semestre', t)} />
                    </View>
                  </View>

                  <Text style={styles.labelSub}>Carrera</Text>
                  <TextInput style={styles.inputSub} placeholder="Ej. Sistemas Computacionales" placeholderTextColor="#94a3b8" value={ing.Carrera} onChangeText={(t) => actualizarIntegrante(idx, 'Carrera', t)} />

                  <Text style={styles.labelSub}>Correo electrónico</Text>
                  <TextInput style={styles.inputSub} placeholder="ejemplo@itssmt.edu.mx" keyboardType="email-address" placeholderTextColor="#94a3b8" value={ing.Correo} onChangeText={(t) => actualizarIntegrante(idx, 'Correo', t)} />

                  {/* 🟢 RADIO BUTTONS PARA SEXO (F/M) */}
                  <Text style={styles.labelSub}>Sexo *</Text>
                  <View style={styles.radioContainer}>
                    <TouchableOpacity
                      style={[styles.radioButton, ing.Sexo === 'F' && styles.radioButtonSelected]}
                      onPress={() => actualizarIntegrante(idx, 'Sexo', 'F')}
                    >
                      <View style={styles.radioOuterCircle}>
                        {ing.Sexo === 'F' && <View style={styles.radioInnerCircle} />}
                      </View>
                      <Text style={[styles.radioText, ing.Sexo === 'F' && styles.radioTextSelected]}>Femenino</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.radioButton, ing.Sexo === 'M' && styles.radioButtonSelected]}
                      onPress={() => actualizarIntegrante(idx, 'Sexo', 'M')}
                    >
                      <View style={styles.radioOuterCircle}>
                        {ing.Sexo === 'M' && <View style={styles.radioInnerCircle} />}
                      </View>
                      <Text style={[styles.radioText, ing.Sexo === 'M' && styles.radioTextSelected]}>Masculino</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <TouchableOpacity style={styles.btnVolver} onPress={() => setPaso(1)}>
                  <Ionicons name="arrow-back-outline" size={18} color="#334155" />
                  <Text style={styles.btnVolverText}>Volver</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.saveButton, { flex: 2, marginTop: 0 }, guardando && styles.disabled]} onPress={guardar} disabled={guardando}>
                  {guardando ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={20} color="#fff" />
                      <Text style={styles.saveText}>{idEquipo ? 'Actualizar equipo' : 'Guardar equipo'}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* MODALES SELECTORES */}
        <Modal visible={selectorDesafio} transparent animationType="fade" onRequestClose={() => setSelectorDesafio(false)}>
          <View style={styles.backdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Seleccionar desafío</Text>
              <ScrollView style={{ maxHeight: 320 }}>
                {desafios.map((d) => (
                  <TouchableOpacity key={idDesafioDe(d)} style={styles.option} onPress={() => { setIdDesafio(idDesafioDe(d)); setSelectorDesafio(false); }}>
                    <Ionicons name="flag-outline" size={18} color="#0369a1" />
                    <Text style={styles.optionTitle}>{d.Nombre ?? d.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectorDesafio(false)}>
                <Text style={styles.cancelText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={selectorCategoria} transparent animationType="fade" onRequestClose={() => setSelectorCategoria(false)}>
          <View style={styles.backdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Seleccionar categoría</Text>
              <ScrollView style={{ maxHeight: 320 }}>
                {categorias.map((c) => (
                  <TouchableOpacity key={idCategoriaDe(c)} style={styles.option} onPress={() => { setIdCategCertamen(idCategoriaDe(c)); setSelectorCategoria(false); }}>
                    <Ionicons name="ribbon-outline" size={18} color="#0369a1" />
                    <Text style={styles.optionTitle}>{c.Nombre ?? c.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectorCategoria(false)}>
                <Text style={styles.cancelText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={selectorSala} transparent animationType="fade" onRequestClose={() => setSelectorSala(false)}>
          <View style={styles.backdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Seleccionar sala</Text>
              <ScrollView style={{ maxHeight: 320 }}>
                <TouchableOpacity style={styles.option} onPress={() => { setIdSala(null); setSelectorSala(false); }}>
                  <Ionicons name="close-circle-outline" size={18} color="#64748b" />
                  <Text style={styles.optionTitle}>Sin sala asignada</Text>
                </TouchableOpacity>
                {salas.map((s) => (
                  <TouchableOpacity key={idSalaDe(s)} style={styles.option} onPress={() => { setIdSala(idSalaDe(s)); setSelectorSala(false); }}>
                    <Ionicons name="business-outline" size={18} color="#0369a1" />
                    <Text style={styles.optionTitle}>{s.Nombre ?? s.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectorSala(false)}>
                <Text style={styles.cancelText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={confirmarVisible} transparent animationType="fade" onRequestClose={() => setConfirmarVisible(false)}>
          <View style={styles.backdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalIcon}><Ionicons name="help-circle-outline" size={30} color="#0369a1" /></View>
              <Text style={styles.modalTitle}>{idEquipo ? '¿Guardar cambios del equipo?' : '¿Registrar este equipo?'}</Text>
              <Text style={styles.modalMessage}>{`Equipo: ${nombreEquipo}\nIntegrantes: ${integrantes.length}`}</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setConfirmarVisible(false)}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={() => void confirmarGuardado()}>
                  <Text style={styles.confirmText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={resultado.visible} transparent animationType="fade" onRequestClose={cerrarResultado}>
          <View style={styles.backdrop}>
            <View style={styles.modalCard}>
              <View style={[styles.modalIcon, resultado.exito ? styles.successIcon : styles.errorIcon]}>
                <Ionicons name={resultado.exito ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={30} color={resultado.exito ? '#15803d' : '#b91c1c'} />
              </View>
              <Text style={styles.modalTitle}>{resultado.titulo}</Text>
              <Text style={styles.modalMessage}>{resultado.mensaje}</Text>
              <TouchableOpacity style={styles.confirmButton} onPress={cerrarResultado}>
                <Text style={styles.confirmText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  radioContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    marginBottom: 4,
  },
  radioButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  radioButtonSelected: {
    borderColor: '#0369a1',
    backgroundColor: '#f0f9ff',
  },
  radioOuterCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInnerCircle: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#0369a1',
  },
  radioText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  radioTextSelected: {
    color: '#0369a1',
    fontWeight: '700',
  },
  page: { flex: 1, backgroundColor: '#f1f5f9' },
  container: { padding: 18, paddingBottom: 130 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
  loadingText: { marginTop: 10, color: '#334155' },
  headerIcon: { alignSelf: 'center', width: 58, height: 58, borderRadius: 18, backgroundColor: '#002b45', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  title: { textAlign: 'center', fontSize: 23, fontWeight: '800', color: '#002b45' },
  stepperContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginVertical: 16 },
  stepBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#e2e8f0' },
  stepBadgeActive: { backgroundColor: '#002b45' },
  stepText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  stepTextActive: { color: '#fff' },
  sectionTitle: { fontSize: 15, color: '#002b45', fontWeight: '800', marginTop: 14, marginBottom: 10 },
  certamenesRow: { gap: 10 },
  certamenCard: { borderRadius: 12, backgroundColor: '#fff', borderColor: '#dbe3ee', borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 3 },
  certamenActivo: { backgroundColor: '#002b45', borderColor: '#002b45' },
  certamenNombre: { color: '#0f172a', fontSize: 14, fontWeight: '800' },
  certamenTipo: { color: '#64748b', fontSize: 12, marginTop: 2 },
  textoActivo: { color: '#fff' },
  selector: { minHeight: 48, borderRadius: 9, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  selectorText: { flex: 1, color: '#0f172a', fontSize: 13 },
  placeholder: { color: '#94a3b8' },
  label: { fontSize: 13, color: '#334155', fontWeight: '700', marginTop: 12, marginBottom: 6 },
  input: { minHeight: 44, borderRadius: 9, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 9, color: '#0f172a' },
  infoBox: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#fffbeb', borderColor: '#fde68a', borderWidth: 1, padding: 11, borderRadius: 9, marginTop: 12 },
  infoText: { flex: 1, color: '#92400e', fontSize: 12, lineHeight: 17 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 8 },
  btnAdd: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  btnAddText: { color: '#86a327', fontWeight: '800', fontSize: 13 },
  cardIntegrante: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 14, marginBottom: 12 },
  cardHeaderIntegrante: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8, marginBottom: 8 },
  cardTitleIntegrante: { fontSize: 14, fontWeight: '800', color: '#0369a1' },
  labelSub: { fontSize: 11, color: '#475569', fontWeight: '700', marginTop: 6, marginBottom: 2 },
  inputSub: { minHeight: 38, borderRadius: 7, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#f8fafc', paddingHorizontal: 10, fontSize: 13, color: '#0f172a' },
  saveButton: { marginTop: 24, minHeight: 49, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderRadius: 10, backgroundColor: '#002b45' },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  btnVolver: { minHeight: 49, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff' },
  btnVolverText: { color: '#334155', fontWeight: '700' },
  disabled: { opacity: 0.6 },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.48)', justifyContent: 'center', padding: 18 },
  modalCard: { backgroundColor: '#fff', padding: 18, borderRadius: 16, maxHeight: '88%' },
  modalIcon: { alignSelf: 'center', marginBottom: 8, width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#e0f2fe' },
  successIcon: { backgroundColor: '#dcfce7' },
  errorIcon: { backgroundColor: '#fee2e2' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 8 },
  modalMessage: { fontSize: 13, lineHeight: 19, color: '#475569', textAlign: 'center', marginBottom: 16 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomColor: '#e2e8f0', borderBottomWidth: 1 },
  optionTitle: { color: '#0f172a', fontSize: 13, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelButton: { padding: 12, borderRadius: 9, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', marginTop: 6, flex: 1 },
  cancelText: { color: '#334155', fontWeight: '700' },
  confirmButton: { padding: 12, borderRadius: 9, backgroundColor: '#002b45', alignItems: 'center', justifyContent: 'center', marginTop: 6, flex: 1 },
  confirmText: { color: '#fff', fontWeight: '800' },
});