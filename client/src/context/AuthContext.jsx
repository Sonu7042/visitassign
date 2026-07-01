import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  login as loginApi,
  register as registerApi,
  logout as logoutApi,
  getMe,
} from '../api/auth';
import { getAccessToken, setAccessToken, registerAuthFailureHandler } from '../api/axiosClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    registerAuthFailureHandler(clearSession);
  }, [clearSession]);

  useEffect(() => {
    const bootstrap = async () => {
      if (!getAccessToken()) {
        setLoading(false);
        return;
      }
      try {
        const res = await getMe();
        setUser(res.data.data.user);
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [clearSession]);

  const login = async (payload) => {
    const res = await loginApi(payload);
    const { user: loggedInUser, accessToken } = res.data.data;
    setAccessToken(accessToken);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const register = async (payload) => {
    const res = await registerApi(payload);
    const { user: newUser, accessToken } = res.data.data;
    setAccessToken(accessToken);
    setUser(newUser);
    return newUser;
  };

  const logout = async () => {
    try {
      await logoutApi();
    } finally {
      clearSession();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
