

import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANTE:

// Usa la IP de la computadora donde está corriendo Laravel.

// El celular y la computadora deben estar en la misma red Wi-Fi.

const API = 'http://10.2.40.106:8000/api';

type Datos = Record<string, any>;

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**

 * Construye los encabezados de cada petición.

 * El token se obtiene del almacenamiento local.

 */

const getAuthHeaders = async (): Promise<Record<string, string>> => {

  const token = await AsyncStorage.getItem('userToken');

  return {

    'Content-Type': 'application/json',

    Accept: 'application/json',

    ...(token ? { Authorization: `Bearer ${token}` } : {}),

  };

};

/**

 * Lee respuestas JSON, respuestas vacías y errores de Laravel.

 */

const leerRespuesta = async (res: Response): Promise<any> => {

  const texto = await res.text();

  let datos: any = null;

  if (texto.trim()) {

    try {

      datos = JSON.parse(texto);

    } catch {

      datos = { message: texto };

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

/**

 * Función central para todas las peticiones a Laravel.

 */

const peticion = async (

  ruta: string,

  metodo: Metodo = 'GET',

  datos?: Datos,

): Promise<any> => {

  const headers = await getAuthHeaders();

  const res = await fetch(`${API}${ruta}`, {

    method: metodo,

    headers,

    ...(datos !== undefined ? { body: JSON.stringify(datos) } : {}),

  });

  return leerRespuesta(res);

};

/** Agrega el filtro de certamen a las consultas que lo admiten. */
const rutaConCertamen = (ruta: string, idCertamen?: number | null): string => {
  if (idCertamen == null || !Number.isFinite(Number(idCertamen))) return ruta;
  const separador = ruta.includes('?') ? '&' : '?';
  return `${ruta}${separador}id_certamen=${encodeURIComponent(String(idCertamen))}`;
};

// ==========================================

// AUTENTICACIÓN

// ==========================================

export const loginUsuario = async (

  correo: string,

  contrasena: string,

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

    throw new Error('El servidor no devolvió un token de acceso.');

  }

  await AsyncStorage.setItem('userToken', data.access_token);

  if (data.user) {

    await AsyncStorage.setItem('userData', JSON.stringify(data.user));

  }

  return data;

};

export const logoutUsuario = async () => {

  try {

    await peticion('/logout', 'POST');

  } finally {

    await AsyncStorage.multiRemove([

      'userToken',

      'userData',

      'userRole',

      'modalidadSeleccionada',

    ]);

  }

};

// ==========================================

// MODALIDAD SELECCIONADA

// ==========================================

export const getModalidadSeleccionada = async () => {

  return AsyncStorage.getItem('modalidadSeleccionada');

};

// ==========================================

// CERTÁMENES

// ==========================================

export const getCertamenes = async () => {

  return peticion('/certamenes');

};

export const crearCertamen = async (data: Datos) => {

  return peticion('/certamenes', 'POST', data);

};

export const actualizarCertamen = async (id: number, data: Datos) => {

  return peticion(`/certamenes/${id}`, 'PUT', data);

};

export const eliminarCertamen = async (id: number) => {

  return peticion(`/certamenes/${id}`, 'DELETE');

};

// ==========================================

// SALAS

// ==========================================

export const getSalas = async (idCertamen?: number | null) => {
  // El backend solo devuelve salas de certámenes INNOVATEC; se puede filtrar
  // por el certamen concreto para mantener los datos separados entre eventos.
  return peticion(rutaConCertamen('/salas', idCertamen));
};

export const crearSala = async (data: Datos) => {

  return peticion('/salas', 'POST', data);

};

export const actualizarSala = async (id: number, data: Datos) => {

  return peticion(`/salas/${id}`, 'PUT', data);

};

export const eliminarSala = async (id: number) => {

  return peticion(`/salas/${id}`, 'DELETE');

};

// ==========================================

// EQUIPOS

// ==========================================

export const getEquipos = async (idCertamen?: number) => {
  // EquipoController@index aplica este filtro en el servidor.
  return peticion(rutaConCertamen('/equipos', idCertamen));
};

export const crearEquipo = async (data: Datos) => {

  return peticion('/equipos', 'POST', data);

};

export const actualizarEquipo = async (id: number, data: Datos) => {

  return peticion(`/equipos/${id}`, 'PUT', data);

};

export const eliminarEquipo = async (id: number) => {

  return peticion(`/equipos/${id}`, 'DELETE');

};

// ==========================================

// USUARIOS

// ==========================================

export const getUsuarios = async () => {

  return peticion('/usuarios');

};

export const crearUsuario = async (data: Datos) => {

  return peticion('/usuarios', 'POST', data);

};

export const actualizarUsuario = async (id: number, data: Datos) => {

  return peticion(`/usuarios/${id}`, 'PUT', data);

};

export const eliminarUsuario = async (id: number) => {

  return peticion(`/usuarios/${id}`, 'DELETE');

};

// ==========================================

// DESAFÍOS

// ==========================================

export const getDesafios = async (idCertamen?: number) => {
  // DesafioController@index aplica el filtro por certamen cuando se proporciona el ID.
  return peticion(rutaConCertamen('/desafios', idCertamen));
};

export const crearDesafio = async (data: Datos) => {

  return peticion('/desafios', 'POST', data);

};

export const actualizarDesafio = async (id: number, data: Datos) => {

  return peticion(`/desafios/${id}`, 'PUT', data);

};

export const eliminarDesafio = async (id: number) => {

  return peticion(`/desafios/${id}`, 'DELETE');

};

// ==========================================

// CATEGORÍAS DEL CERTAMEN

// ==========================================

export const getCategCertamenes = async () => {
  return peticion('/categorias-certamen');
};

export const crearCategCertamenes = async (data: Datos) => {

  return peticion('/categorias-certamen', 'POST', data);

};

export const actualizarCategCertamen = async (

  id: number,

  data: Datos,

) => {

  return peticion(`/categorias-certamen/${id}`, 'PUT', data);

};

export const eliminarCategCertamen = async (id: number) => {

  return peticion(`/categorias-certamen/${id}`, 'DELETE');

};

// ==========================================

// CATEGORÍAS DE RÚBRICA

// ==========================================

export const getCategoriasRubrica = async () => {

  return peticion('/categorias-rubrica');

};

export const crearCategoriaRubrica = async (data: Datos) => {

  return peticion('/categorias-rubrica', 'POST', data);

};

export const actualizarCategoriaRubrica = async (

  id: number,

  data: Datos,

) => {

  return peticion(`/categorias-rubrica/${id}`, 'PUT', data);

};

export const eliminarCategoriaRubrica = async (id: number) => {

  return peticion(`/categorias-rubrica/${id}`, 'DELETE');

};

// ==========================================

// RÚBRICAS

// ==========================================

export const getRubricas = async (idCategoria: number) => {

  return peticion(`/rubricas?id_categoria=${encodeURIComponent(idCategoria)}`);

};

export const crearRubrica = async (data: Datos) => {

  return peticion('/rubricas', 'POST', data);

};

export const actualizarRubrica = async (id: number, data: Datos) => {

  return peticion(`/rubricas/${id}`, 'PUT', data);

};

export const eliminarRubrica = async (id: number) => {

  return peticion(`/rubricas/${id}`, 'DELETE');

};

// ==========================================

// JURADOS

// ==========================================

export const getJurados = async (idCertamen?: number | null) => {
  // Filtra los jurados por el certamen seleccionado cuando se proporciona su ID.
  return peticion(rutaConCertamen('/jurados', idCertamen));
};

export const getUsuariosParaJurado = async () => {
  // Devuelve únicamente los campos visibles del selector; no solicita contraseñas.
  return peticion('/jurados/usuarios-catalogo');
};

export const crearJurado = async (data: Datos) => {

  return peticion('/jurados', 'POST', data);

};

export const actualizarJurado = async (id: number, data: Datos) => {

  return peticion(`/jurados/${id}`, 'PUT', data);

};

export const eliminarJurado = async (id: number) => {

  return peticion(`/jurados/${id}`, 'DELETE');

};

// ==========================================

// INTEGRANTES

// ==========================================

export const getIntegrantes = async () => {

  return peticion('/integrantes');

};

export const crearIntegrante = async (data: Datos) => {

  return peticion('/integrantes', 'POST', data);

};

export const actualizarIntegrante = async (id: number, data: Datos) => {

  return peticion(`/integrantes/${id}`, 'PUT', data);

};

export const eliminarIntegrante = async (id: number) => {

  return peticion(`/integrantes/${id}`, 'DELETE');

};

// ==========================================

// ADMINISTRADORES

// ==========================================

export const getAdmins = async () => {

  return peticion('/admins');

};

export const crearAdmin = async (data: Datos) => {

  return peticion('/admins', 'POST', data);

};

export const actualizarAdmin = async (id: number, data: Datos) => {

  return peticion(`/admins/${id}`, 'PUT', data);

};

export const eliminarAdmin = async (id: number) => {

  return peticion(`/admins/${id}`, 'DELETE');

};

// ==========================================

// LÍDERES

// ==========================================

export const getLideres = async () => {

  return peticion('/lideres');

};

export const crearLider = async (data: Datos) => {

  return peticion('/lideres', 'POST', data);

};

export const actualizarLider = async (id: number, data: Datos) => {

  return peticion(`/lideres/${id}`, 'PUT', data);

};

export const eliminarLider = async (id: number) => {

  return peticion(`/lideres/${id}`, 'DELETE');

};

// ==========================================

// PERSONAL DE APOYO

// ==========================================

export const getPersonalApoyo = async () => {

  return peticion('/personal-apoyo');

};

export const crearPersonalApoyo = async (data: Datos) => {

  return peticion('/personal-apoyo', 'POST', data);

};

export const actualizarPersonalApoyo = async (

  id: number,

  data: Datos,

) => {

  return peticion(`/personal-apoyo/${id}`, 'PUT', data);

};

export const eliminarPersonalApoyo = async (id: number) => {

  return peticion(`/personal-apoyo/${id}`, 'DELETE');

};

// ==========================================

// ASIGNACIONES

// ==========================================

export const getAsignaciones = async () => {

  return peticion('/asignaciones');

};

export const crearAsignacion = async (data: Datos) => {

  return peticion('/asignaciones', 'POST', data);

};

export const actualizarAsignacion = async (id: number, data: Datos) => {

  return peticion(`/asignaciones/${id}`, 'PUT', data);

};

export const eliminarAsignacion = async (id: number) => {

  return peticion(`/asignaciones/${id}`, 'DELETE');

};

// ==========================================

// EVALUACIONES

// ==========================================

export const getEvaluaciones = async () => {

  return peticion('/evaluaciones');

};

export const crearEvaluacion = async (data: Datos) => {

  return peticion('/evaluaciones', 'POST', data);

};

export const actualizarEvaluacion = async (id: number, data: Datos) => {

  return peticion(`/evaluaciones/${id}`, 'PUT', data);

};

export const eliminarEvaluacion = async (id: number) => {

  return peticion(`/evaluaciones/${id}`, 'DELETE');

};

// ==========================================

// PREGUNTAS

// ==========================================

export const getPreguntas = async () => {

  return peticion('/preguntas');

};

export const crearPregunta = async (data: Datos) => {

  return peticion('/preguntas', 'POST', data);

};

export const actualizarPregunta = async (id: number, data: Datos) => {

  return peticion(`/preguntas/${id}`, 'PUT', data);

};

export const eliminarPregunta = async (id: number) => {

  return peticion(`/preguntas/${id}`, 'DELETE');

};