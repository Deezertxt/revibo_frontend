type AuthSession = {
  isRegistered: boolean;
  accessToken: string | null;
  idUsuario: string | null;
  name: string | null;
  email: string | null;
  rol: string | null;
};

let authSession: AuthSession = {
  isRegistered: false,
  accessToken: null,
  idUsuario: null,
  name: null,
  email: null,
  rol: null,
};

export const setRegistered = (
  session?: Partial<Omit<AuthSession, "isRegistered">>,
) => {
  authSession = {
    ...authSession,
    isRegistered: true,
    accessToken: session?.accessToken ?? authSession.accessToken,
    idUsuario: session?.idUsuario ?? authSession.idUsuario,
    name: session?.name ?? authSession.name,
    email: session?.email ?? authSession.email,
    rol: session?.rol ?? authSession.rol,
  };
};

export const getIsRegistered = () => authSession.isRegistered;

export const getAccessToken = () => authSession.accessToken;

export const getAuthSession = () => authSession;

export const logout = () => {
  authSession = {
    isRegistered: false,
    accessToken: null,
    idUsuario: null,
    name: null,
    email: null,
    rol: null,
  };
};
