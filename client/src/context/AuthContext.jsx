import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { api, getToken, setToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  const connectSocket = useCallback(() => {
    if (socketRef.current) return socketRef.current;
    const socket = io({ auth: { token: getToken() } });
    socket.on('connect_error', (e) => console.warn('Socket error:', e.message));
    socketRef.current = socket;
    return socket;
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getToken()) { setUser(null); setLoading(false); return null; }
    try {
      const me = await api('GET', '/users/me');
      setUser(me);
      connectSocket();
      return me;
    } catch (err) {
      if (err.status === 401) { setToken(null); setUser(null); }
      return null;
    } finally {
      setLoading(false);
    }
  }, [connectSocket]);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const login = useCallback(async (payload) => {
    const result = await api('POST', '/auth/login', payload);
    setToken(result.token);
    setUser(result.user);
    connectSocket();
    return result.user;
  }, [connectSocket]);

  const register = useCallback(async (payload) => {
    const result = await api('POST', '/auth/register', payload);
    setToken(result.token);
    setUser(result.user);
    connectSocket();
    return result.user;
  }, [connectSocket]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
  }, []);

  const getSocket = useCallback(() => connectSocket(), [connectSocket]);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refreshUser, getSocket }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
