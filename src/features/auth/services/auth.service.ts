const DEFAULT_API_URL = "http://192.168.1.7:8000/api/v1";
const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(
  /\/$/,
  "",
);

type AuthUser = {
  id_usuario: string;
  nombre: string;
  correo: string;
  rol?: string;
  estado?: boolean;
};

type LoginPayload = {
  correo: string;
  contrasena: string;
};

type RegisterPayload = {
  nombre: string;
  correo: string;
  contrasena: string;
  confirmacion_contrasena: string;
};

type AuthResponse = {
  message: string;
  user?: AuthUser;
  data?: AuthUser;
  access_token?: string;
};

export type AuthResult = {
  message: string;
  user: AuthUser;
  accessToken: string;
};

// login

export async function loginUser(payload: LoginPayload): Promise<AuthResult> {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseBody = (await response
    .json()
    .catch(() => null)) as AuthResponse | null;

  if (!response.ok) {
    const message = responseBody?.message ?? "Credenciales incorrectas.";
    throw new Error(message);
  }

  const userData = responseBody?.user || responseBody?.data;

  if (!userData || !responseBody?.access_token) {
    throw new Error("El servidor no devolvió los datos de usuario o el token.");
  }

  return {
    message: responseBody.message,
    user: userData,
    accessToken: responseBody.access_token,
  };
}

export async function registerUser(
  payload: RegisterPayload,
): Promise<AuthResult> {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseBody = (await response
    .json()
    .catch(() => null)) as AuthResponse | null;

  if (!response.ok) {
    const message = responseBody?.message ?? "Error en el registro.";
    throw new Error(message);
  }

  const userData = responseBody?.data || responseBody?.user;

  if (!userData || !responseBody?.access_token) {
    throw new Error("Registro exitoso, pero faltan datos en la respuesta.");
  }

  return {
    message: responseBody.message,
    user: userData,
    accessToken: responseBody.access_token,
  };
}

export async function logoutUser(token: string): Promise<string> {
  const response = await fetch(`${API_URL}/logout`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(responseBody?.message ?? "Error al cerrar sesión.");
  }

  return responseBody?.message ?? "Sesión cerrada";
}
