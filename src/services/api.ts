import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetch as expoFetch } from 'expo/fetch';

// ======================================================
// CONFIGURACIÓN
// ======================================================

// Usa la IP de la computadora donde está corriendo Laravel.
// El celular y la computadora deben estar en la misma red Wi-Fi.
const API = 'http://192.168.1.152:8000/api';

type Datos = Record<string, any> | FormData;

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type Modalidad = 'RALLY' | 'INNOVATEC';

// ======================================================
// HEADERS
// ======================================================

const getAuthHeaders = async (
  esFormData: boolean = false
): Promise<Record<string, string>> => {

  const token = await AsyncStorage.getItem('userToken');

  if (!token) {
    throw new Error(
      'No se encontró el token de sesión. Cierra sesión e inicia nuevamente.'
    );
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };

  if (!esFormData) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

// ======================================================
// LECTURA DE RESPUESTAS
// ======================================================

const leerRespuesta = async (res: Response): Promise<any> => {

  const texto = await res.text();

  let datos: any = null;

  if (texto.trim()) {
    try {
      datos = JSON.parse(texto);
    } catch {
      datos = {
        message: texto,
      };
    }
  }

  if (!res.ok) {

    const errores = datos?.errors
      ? Object.values(datos.errors).flat().join('\n')
      : '';

    const mensaje =
      errores ||
      datos?.message ||
      datos?.error ||
      `Error HTTP ${res.status}`;

    throw new Error(String(mensaje));
  }

  return datos;
};

// ======================================================
// PETICIÓN CENTRAL
// ======================================================

const peticion = async (
  ruta: string,
  metodo: Metodo = 'GET',
  datos?: Datos
): Promise<any> => {

  const esFormData =
    typeof FormData !== 'undefined' &&
    datos instanceof FormData;

  const headers = await getAuthHeaders(esFormData);

  let body: any = undefined;

  if (datos !== undefined) {
    body = esFormData
      ? datos
      : JSON.stringify(datos);
  }

  const clienteFetch = esFormData
    ? expoFetch
    : fetch;

  const res = await clienteFetch(`${API}${ruta}`, {
    method: metodo,
    headers,
    ...(body !== undefined ? { body } : {}),
  });

  return leerRespuesta(res);
};

// ======================================================
// MODALIDAD
// ======================================================

export const getModalidadSeleccionada =
  async (): Promise<Modalidad | null> => {

    const modalidad =
      await AsyncStorage.getItem('modalidadSeleccionada');

    if (
      modalidad === 'RALLY' ||
      modalidad === 'INNOVATEC'
    ) {
      return modalidad;
    }

    return null;
  };

export const guardarModalidadSeleccionada =
  async (modalidad: Modalidad): Promise<void> => {

    await AsyncStorage.setItem(
      'modalidadSeleccionada',
      modalidad
    );
  };

export const limpiarModalidadSeleccionada =
  async (): Promise<void> => {

    await AsyncStorage.multiRemove([
      'modalidadSeleccionada',
      'idCertamenSeleccionado',
      'nombreCertamenSeleccionado',
    ]);
  };

// ======================================================
// AGREGAR MODALIDAD A UNA RUTA
// ======================================================

const rutaConModalidad = async (
  ruta: string
): Promise<string> => {

  const modalidad =
    await getModalidadSeleccionada();

  if (!modalidad) {
    return ruta;
  }

  const separador =
    ruta.includes('?') ? '&' : '?';

  return `${ruta}${separador}tipo=${encodeURIComponent(
    modalidad
  )}`;
};

// ======================================================
// AGREGAR ID DE CERTAMEN
// ======================================================

const rutaConCertamen = (
  ruta: string,
  idCertamen?: number | null
): string => {

  if (
    idCertamen == null ||
    !Number.isFinite(Number(idCertamen))
  ) {
    return ruta;
  }

  const separador =
    ruta.includes('?') ? '&' : '?';

  return `${ruta}${separador}id_certamen=${encodeURIComponent(
    String(idCertamen)
  )}`;
};

// ======================================================
// AGREGAR MODALIDAD + ID CERTAMEN
// ======================================================

const rutaAdmin = async (
  ruta: string,
  idCertamen?: number | null
): Promise<string> => {

  let url = ruta;

  url = rutaConCertamen(
    url,
    idCertamen
  );

  url = await rutaConModalidad(url);

  return url;
};

// ======================================================
// AUTENTICACIÓN
// ======================================================

export const loginUsuario = async (
  correo: string,
  contrasena: string
) => {

  const res = await fetch(`${API}/login`, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },

    body: JSON.stringify({
      Correo: correo,
      Contrasena: contrasena,
    }),
  });

  const data = await leerRespuesta(res);

  if (!data?.access_token) {

    console.log(
      'Respuesta del login:',
      data
    );

    throw new Error(
      'Laravel no devolvió un token válido.'
    );
  }

  await AsyncStorage.setItem(
    'userToken',
    data.access_token
  );

  if (data.user) {

    await AsyncStorage.setItem(
      'userData',
      JSON.stringify(data.user)
    );
  }

  return data;
};

export const logoutUsuario = async () => {

  try {

    await peticion(
      '/logout',
      'POST'
    );

  } finally {

    await AsyncStorage.multiRemove([
      'userToken',
      'userData',
      'userRole',
      'modalidadSeleccionada',
      'idCertamenSeleccionado',
      'nombreCertamenSeleccionado',
    ]);
  }
};

// ======================================================
// CERTÁMENES
// ======================================================

export const getCertamenes = async () => {

  const ruta =
    await rutaConModalidad(
      '/certamenes'
    );

  return peticion(ruta);
};

export const crearCertamen = async (
  data: Datos
) => {

  return peticion(
    '/certamenes',
    'POST',
    data
  );
};

export const actualizarCertamen = async (
  id: number,
  data: Datos
) => {

  return peticion(
    `/certamenes/${id}`,
    'PUT',
    data
  );
};

export const eliminarCertamen = async (
  id: number
) => {

  return peticion(
    `/certamenes/${id}`,
    'DELETE'
  );
};

// ======================================================
// SALAS
// SOLO ADMINISTRADOR / INNOVATEC
// ======================================================

export const getSalas = async (
  idCertamen?: number | null
) => {

  const ruta =
    await rutaAdmin(
      '/salas',
      idCertamen
    );

  return peticion(ruta);
};

export const crearSala = async (
  data: Datos
) => {

  return peticion(
    '/salas',
    'POST',
    data
  );
};

export const actualizarSala = async (
  id: number,
  data: Datos
) => {

  return peticion(
    `/salas/${id}`,
    'PUT',
    data
  );
};

export const eliminarSala = async (
  id: number
) => {

  return peticion(
    `/salas/${id}`,
    'DELETE'
  );
};

// ======================================================
// EQUIPOS
// ======================================================

export const getEquipos = async (
  idCertamen?: number,
  idLider?: number
) => {

  let url = '/equipos';

  const params: string[] = [];

  if (
    idCertamen != null &&
    Number.isFinite(Number(idCertamen))
  ) {
    params.push(
      `id_certamen=${encodeURIComponent(
        String(idCertamen)
      )}`
    );
  }

  if (
    idLider != null &&
    Number.isFinite(Number(idLider))
  ) {
    params.push(
      `id_lider=${encodeURIComponent(
        String(idLider)
      )}`
    );
  }

  if (params.length > 0) {

    url += `?${params.join('&')}`;
  }

  url = await rutaConModalidad(url);

  return peticion(url);
};

export const crearEquipo = async (
  data: Datos
) => {

  return peticion(
    '/equipos',
    'POST',
    data
  );
};

export const actualizarEquipo = async (
  id: number,
  data: Datos
) => {

  return peticion(
    `/equipos/${id}`,
    'PUT',
    data
  );
};

export const eliminarEquipo = async (
  id: number
) => {

  return peticion(
    `/equipos/${id}`,
    'DELETE'
  );
};

// ======================================================
// USUARIOS
// ======================================================

export const getUsuarios = async () => {

  return peticion('/usuarios');
};

export const crearUsuario = async (
  data: Datos
) => {

  return peticion(
    '/usuarios',
    'POST',
    data
  );
};

export const actualizarUsuario = async (
  id: number,
  data: Datos
) => {

  return peticion(
    `/usuarios/${id}`,
    'PUT',
    data
  );
};

export const eliminarUsuario = async (
  id: number
) => {

  return peticion(
    `/usuarios/${id}`,
    'DELETE'
  );
};

// ======================================================
// USUARIOS - CATÁLOGO ADMIN
// ======================================================

export const getUsuariosCatalogo = async () => {

  return peticion(
    '/usuarios/catalogo'
  );
};

export const crearUsuarioAdmin = async (
  data: Datos
) => {

  return peticion(
    '/usuarios/administracion',
    'POST',
    data
  );
};

export const actualizarUsuarioAdmin = async (
  id: number,
  data: Datos
) => {

  return peticion(
    `/usuarios/administracion/${id}`,
    'PUT',
    data
  );
};

export const eliminarUsuarioAdmin = async (
  id: number
) => {

  return peticion(
    `/usuarios/administracion/${id}`,
    'DELETE'
  );
};

// ======================================================
// DESAFÍOS
// ======================================================

export const getDesafios = async (
  idCertamen?: number
) => {

  const ruta =
    await rutaAdmin(
      '/desafios',
      idCertamen
    );

  return peticion(ruta);
};

export const crearDesafio = async (
  data: Datos
) => {

  return peticion(
    '/desafios',
    'POST',
    data
  );
};

export const actualizarDesafio = async (
  id: number,
  data: Datos
) => {

  return peticion(
    `/desafios/${id}`,
    'PUT',
    data
  );
};

export const eliminarDesafio = async (
  id: number
) => {

  return peticion(
    `/desafios/${id}`,
    'DELETE'
  );
};

// ======================================================
// CATEGORÍAS DEL CERTAMEN
// ======================================================

export const getCategCertamenes = async () => {

  const ruta =
    await rutaConModalidad(
      '/categorias-certamen'
    );

  return peticion(ruta);
};

export const crearCategCertamenes = async (
  data: Datos
) => {

  return peticion(
    '/categorias-certamen',
    'POST',
    data
  );
};

export const actualizarCategCertamen = async (
  id: number,
  data: Datos
) => {

  return peticion(
    `/categorias-certamen/${id}`,
    'PUT',
    data
  );
};

export const eliminarCategCertamen = async (
  id: number
) => {

  return peticion(
    `/categorias-certamen/${id}`,
    'DELETE'
  );
};

// ======================================================
// CATEGORÍAS DE RÚBRICA
// ======================================================

export const getCategoriasRubrica = async () => {

  const ruta =
    await rutaConModalidad(
      '/categorias-rubrica'
    );

  return peticion(ruta);
};

export const crearCategoriaRubrica = async (
  data: Datos
) => {

  return peticion(
    '/categorias-rubrica',
    'POST',
    data
  );
};

export const actualizarCategoriaRubrica = async (
  id: number,
  data: Datos
) => {

  return peticion(
    `/categorias-rubrica/${id}`,
    'PUT',
    data
  );
};

export const eliminarCategoriaRubrica = async (
  id: number
) => {

  return peticion(
    `/categorias-rubrica/${id}`,
    'DELETE'
  );
};

// ======================================================
// RÚBRICAS
// ======================================================

export const getRubricas = async (
  idCategoria: number
) => {

  const ruta =
    `/rubricas?id_categoria=${encodeURIComponent(
      idCategoria
    )}`;

  return peticion(
    await rutaConModalidad(ruta)
  );
};

export const crearRubrica = async (
  data: Datos
) => {

  return peticion(
    '/rubricas',
    'POST',
    data
  );
};

export const actualizarRubrica = async (
  id: number,
  data: Datos
) => {

  return peticion(
    `/rubricas/${id}`,
    'PUT',
    data
  );
};

export const eliminarRubrica = async (
  id: number
) => {

  return peticion(
    `/rubricas/${id}`,
    'DELETE'
  );
};

// ======================================================
// JURADOS
// ADMINISTRADOR
// ======================================================

export const getJurados = async (
  idCertamen?: number | null
) => {

  const ruta =
    await rutaAdmin(
      '/jurados',
      idCertamen
    );

  return peticion(ruta);
};

export const getUsuariosParaJurado = async () => {

  return peticion(
    '/jurados/usuarios-catalogo'
  );
};

export const getPerfilJuradoPorUsuario = async (
  idUsuario: number
) => {

  return peticion(
    `/admin/perfil-jurado/${idUsuario}`
  );
};

export const crearJurado = async (
  data: Datos
) => {

  return peticion(
    '/jurados',
    'POST',
    data
  );
};

export const actualizarJurado = async (
  id: number,
  data: Datos
) => {

  return peticion(
    `/jurados/${id}`,
    'PUT',
    data
  );
};

export const eliminarJurado = async (
  id: number
) => {

  return peticion(
    `/jurados/${id}`,
    'DELETE'
  );
};

// ======================================================
// INTEGRANTES
// ======================================================

export const getIntegrantes = async () => {

  return peticion(
    '/integrantes'
  );
};

export const crearIntegrante = async (
  data: Datos
) => {

  return peticion(
    '/integrantes',
    'POST',
    data
  );
};

export const actualizarIntegrante = async (
  id: number,
  data: Datos
) => {

  return peticion(
    `/integrantes/${id}`,
    'PUT',
    data
  );
};

export const eliminarIntegrante = async (
  id: number
) => {

  return peticion(
    `/integrantes/${id}`,
    'DELETE'
  );
};

// ======================================================
// ADMINISTRADORES
// ======================================================

export const getAdmins = async () => {

  return peticion(
    '/admins'
  );
};

export const crearAdmin = async (
  data: Datos
) => {

  return peticion(
    '/admins',
    'POST',
    data
  );
};

export const actualizarAdmin = async (
  id: number,
  data: Datos
) => {

  return peticion(
    `/admins/${id}`,
    'PUT',
    data
  );
};

export const eliminarAdmin = async (
  id: number
) => {

  return peticion(
    `/admins/${id}`,
    'DELETE'
  );
};

// ======================================================
// LÍDERES
// ======================================================

export const getLideres = async () => {

  return peticion(
    '/lideres'
  );
};

export const crearLider = async (
  data: Datos
) => {

  return peticion(
    '/lideres',
    'POST',
    data
  );
};

export const actualizarLider = async (
  id: number,
  data: Datos
) => {

  return peticion(
    `/lideres/${id}`,
    'PUT',
    data
  );
};

export const eliminarLider = async (
  id: number
) => {

  return peticion(
    `/lideres/${id}`,
    'DELETE'
  );
};

// ======================================================
// PERSONAL DE APOYO
// ======================================================

export const getPersonalApoyo = async () => {

  return peticion(
    '/personal-apoyo'
  );
};

export const crearPersonalApoyo = async (
  data: Datos
) => {

  return peticion(
    '/personal-apoyo',
    'POST',
    data
  );
};

export const actualizarPersonalApoyo = async (
  id: number,
  data: Datos
) => {

  return peticion(
    `/personal-apoyo/${id}`,
    'PUT',
    data
  );
};

export const eliminarPersonalApoyo = async (
  id: number
) => {

  return peticion(
    `/personal-apoyo/${id}`,
    'DELETE'
  );
};

// ======================================================
// ASIGNACIONES
// ======================================================

// Estas funciones se mantienen sin filtro automático
// para no alterar el flujo actual de Jurado.

export const getAsignaciones = async () => {
  const ruta = await rutaAdmin('/asignaciones');
  return peticion(ruta);
};

export const crearAsignacion = async (
  data: Datos
) => {

  return peticion(
    '/asignaciones',
    'POST',
    data
  );
};

export const actualizarAsignacion = async (
  id: number,
  data: Datos
) => {

  return peticion(
    `/asignaciones/${id}`,
    'PUT',
    data
  );
};

export const eliminarAsignacion = async (
  id: number
) => {

  return peticion(
    `/asignaciones/${id}`,
    'DELETE'
  );
};

// ======================================================
// EVALUACIONES
// ======================================================

export const getEvaluaciones = async () => {
  const ruta = await rutaAdmin('/evaluaciones');
  return peticion(ruta);
};

export const crearEvaluacion = async (
  data: Datos
) => {

  return peticion(
    '/evaluaciones',
    'POST',
    data
  );
};

export const actualizarEvaluacion = async (
  id: number,
  data: Datos
) => {

  return peticion(
    `/evaluaciones/${id}`,
    'PUT',
    data
  );
};

export const eliminarEvaluacion = async (
  id: number
) => {

  return peticion(
    `/evaluaciones/${id}`,
    'DELETE'
  );
};

// ======================================================
// PREGUNTAS
// ======================================================

export const getPreguntas = async () => {

  return peticion(
    '/preguntas'
  );
};

export const crearPregunta = async (
  data: Datos
) => {

  return peticion(
    '/preguntas',
    'POST',
    data
  );
};

export const actualizarPregunta = async (
  id: number,
  data: Datos
) => {

  return peticion(
    `/preguntas/${id}`,
    'PUT',
    data
  );
};

export const eliminarPregunta = async (
  id: number
) => {

  return peticion(
    `/preguntas/${id}`,
    'DELETE'
  );
};

// ======================================================
// PERFIL PROFESIONAL DEL JURADO
// ======================================================

export const getMiPerfilJurado = async () => {

  return peticion(
    '/jurado/perfil'
  );
};

export const guardarMiPerfilJurado = async (
  datos: FormData
) => {

  return peticion(
    '/jurado/perfil',
    'POST',
    datos
  );
};

// ======================================================
// JURADO - ASIGNACIONES
// ======================================================

export const getMisAsignacionesJurado = async () => {

  return peticion(
    '/jurado/asignaciones'
  );
};

export const getMisEquiposJurado = async () => {

  return peticion(
    '/asignaciones/mis-equipos'
  );
};

// ======================================================
// JURADO - EVALUACIÓN
// ======================================================

export const getFormularioEvaluacion = async (
  idEquipo: number
) => {

  return peticion(
    `/jurado/evaluacion/${idEquipo}`
  );
};

export const guardarEvaluacionJurado = async (
  data: {
    Id_equipo: number;
    Comentarios?: string;
    respuestas: {
      Id_rubrica: number;
      Valor: number;
    }[];
  }
) => {

  return peticion(
    '/jurado/evaluacion',
    'POST',
    data
  );
};