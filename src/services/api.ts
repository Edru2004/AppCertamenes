import AsyncStorage from '@react-native-async-storage/async-storage';

// 192.168.1.91 
const API = 'http://192.168.1.83:8000/api';

// Función auxiliar para construir headers con Token de Sanctum
const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
};

// ==========================================
// AUTENTICACIÓN (LOGIN Y LOGOUT)
// ==========================================

export const loginUsuario = async (correo: string, contrasena: string) => {
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      Correo: correo,
      Contrasena: contrasena
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Credenciales incorrectas");
  }

  // Guardar token y usuario en el almacenamiento local del celular
  await AsyncStorage.setItem('userToken', data.access_token);
  await AsyncStorage.setItem('userData', JSON.stringify(data.user));

  return data; // Retorna { access_token, token_type, user }
};

export const logoutUsuario = async () => {
  const headers = await getAuthHeaders();
  await fetch(`${API}/logout`, {
    method: "POST",
    headers
  });
  await AsyncStorage.removeItem('userToken');
  await AsyncStorage.removeItem('userData');
};

// ==========================================
// CERTÁMENES
// ==========================================

export const getCertamenes = async () => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/certamenes`, { headers });
  return await res.json();
};

export const crearCertamen = async (data: any) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/certamenes`, {
    method: "POST",
    headers,
    body: JSON.stringify(data)
  });
  return await res.json();
};

export const eliminarCertamen = async (id: number) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/certamenes/${id}`, {
    method: "DELETE",
    headers
  });
  return res;
};

export const actualizarCertamen = async (id: number, data: any) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/certamenes/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(data)
  });
  return await res.json();
};

// ==========================================
// SALAS
// ==========================================

export const getSalas = async () => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/salas`, { headers });
  return await res.json();
};

export const crearSala = async (data: any) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/salas`, {
    method: "POST",
    headers,
    body: JSON.stringify(data)
  });
  return await res.json();
};

export const eliminarSala = async (id: number) => {
  const headers = await getAuthHeaders();
  return await fetch(`${API}/salas/${id}`, {
    method: "DELETE",
    headers
  });
};

export const actualizarSala = async (id: number, data: any) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/salas/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(data)
  });
  return await res.json();
};

// ==========================================
// EQUIPOS
// ==========================================

export const getEquipos = async () => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/equipos`, { headers });
  return await res.json();
};

export const crearEquipo = async (data: any) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/equipos`, {
    method: "POST",
    headers,
    body: JSON.stringify(data)
  });
  return await res.json();
};

export const eliminarEquipo = async (id: number) => {
  const headers = await getAuthHeaders();
  return await fetch(`${API}/equipos/${id}`, {
    method: "DELETE",
    headers
  });
};

export const actualizarEquipo = async (id: number, data: any) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/equipos/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(data)
  });
  return await res.json();
};

// ==========================================
// USUARIOS
// ==========================================

export const getUsuarios = async () => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/usuarios`, { headers });
  return await res.json();
};

export const crearUsuario = async (data: any) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/usuarios`, {
    method: "POST",
    headers,
    body: JSON.stringify(data)
  });
  return await res.json();
};

export const eliminarUsuario = async (id: number) => {
  const headers = await getAuthHeaders();
  return await fetch(`${API}/usuarios/${id}`, {
    method: "DELETE",
    headers
  });
};

export const actualizarUsuario = async (id: number, data: any) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/usuarios/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(data)
  });
  return await res.json();
};
// ==========================================
// DESAFÍOS
// ==========================================
export const getDesafios = async () => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/desafios`, { headers });
  return await res.json();
};

export const crearDesafio = async (data: any) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/desafios`, {
    method: "POST",
    headers,
    body: JSON.stringify(data)
  });
  return await res.json();
};

export const eliminarDesafio = async (id: number) => {
  const headers = await getAuthHeaders();
  return await fetch(`${API}/desafios/${id}`, {
    method: "DELETE",
    headers
  });
}

export const actualizarDesafio = async (id: number, data: any) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/desafios/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(data)
  });
  return await res.json();
}

// ==========================================
// CATEGORÍAS CERTAMEN
// ==========================================
export const getCategCertamenes = async () => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/categorias-certamen`, { headers });
  return await res.json();
};

export const crearCategCertamenes = async (data: any) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/categorias-certamen`, {
    method: "POST",
    headers,
    body: JSON.stringify(data)
  });
  return await res.json();
};

export const eliminarCategCertamen = async (id: number) => {
  const headers = await getAuthHeaders();
  return await fetch(`${API}/categorias-certamen/${id}`, {
    method: "DELETE",
    headers
  });
}

export const actualizarCategCertamen = async (id: number, data: any) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/categorias-certamen/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(data)
  });
  return await res.json();
}

export const getRubricas = async (idCategoria: number) => {
  const headers = await getAuthHeaders();

  const res = await fetch(
    `${API}/rubricas?id_categoria=${idCategoria}`,
    { headers }
  );

  if (!res.ok) {
    throw new Error('Error al obtener las rúbricas');
  }

  return await res.json();
};

export const crearRubrica = async (data: any) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/rubricas`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  const resultado = await res.json();

  if (!res.ok) {
    throw new Error(resultado.message || 'Error al crear la rúbrica');
  }

  return resultado;
};

export const actualizarRubrica = async (
  id: number,
  data: any
) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/rubricas/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });

  const resultado = await res.json();

  if (!res.ok) {
    throw new Error(resultado.message || 'Error al actualizar la rúbrica');
  }

  return resultado;
};

export const eliminarRubrica = async (id: number) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API}/rubricas/${id}`, {
    method: 'DELETE',
    headers,
  });

  if (!res.ok) {
    throw new Error('Error al eliminar la rúbrica');
  }

  return res;
};
