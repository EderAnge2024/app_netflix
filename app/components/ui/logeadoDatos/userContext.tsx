import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar usuario al iniciar la app
  useEffect(() => {
    async function loadUser() {
      try {
        const json = await AsyncStorage.getItem('user');
        if (json) setUser(JSON.parse(json));
      } catch (e) {
        console.error('Error al cargar usuario', e);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  // Guardar usuario cuando cambia
  useEffect(() => {
    async function saveUser() {
      if (user) {
        await AsyncStorage.setItem('user', JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem('user');
      }
    }
    saveUser();
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
