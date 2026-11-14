import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
export const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('safalpath_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [levelInfo, setLevelInfo] = useState({ level: 1, title: 'Fresher', progressPercent: 80, xpToNext: 10 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('safalpath_token');
    if (!token) return setLoading(false);
    API.get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        setLevelInfo(res.data.levelInfo);
      })
      .catch(() => localStorage.removeItem('safalpath_token'))
      .finally(() => setLoading(false));
  }, []);

  const syncUser = (updatedUser, updatedLevel) => {
    if (updatedUser) setUser(updatedUser);
    if (updatedLevel) setLevelInfo(updatedLevel);
  };

  const logout = () => {
    localStorage.removeItem('safalpath_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, levelInfo, loading, syncUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);