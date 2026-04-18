const DEFAULT_API_URL = 'http://localhost:8000/api/v1';
const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/$/, '');

type RegisterPayload = {
	nombre: string;
	correo: string;
	contrasena: string;
	confirmacion_contrasena: string;
};

type AuthUser = {
	id_usuario: string;
	nombre: string;
	correo: string;
	rol?: string;
	estado?: boolean;
};

type RegisterResponse = {
	message: string;
	data?: AuthUser;
	access_token?: string;
};

export type RegisterResult = {
	message: string;
	user: AuthUser;
	accessToken: string;
};

export async function registerUser(payload: RegisterPayload): Promise<RegisterResult> {
	const response = await fetch(`${API_URL}/register`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	});

	const responseBody = (await response.json().catch(() => null)) as RegisterResponse | null;

	if (!response.ok) {
		const message = responseBody?.message ?? 'No se pudo registrar el usuario.';
		throw new Error(message);
	}

	if (!responseBody?.data || !responseBody.access_token) {
		throw new Error('La respuesta del servidor no incluyo token de acceso.');
	}

	return {
		message: responseBody.message,
		user: responseBody.data,
		accessToken: responseBody.access_token,
	};
}
