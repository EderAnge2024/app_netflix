import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tipo del item
export interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  backdrop_path?: string;
  overview?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;  // Añadimos esta propiedad para las series
  media_type?: 'movie' | 'tv';  // También es útil añadir el tipo de medio
}

interface MyListContextProps {
  myList: MediaItem[];
  addToMyList: (item: MediaItem) => Promise<void>;
  removeFromMyList: (item: MediaItem) => Promise<void>;
  isInMyList: (id: number) => boolean;
  loading: boolean;
}

const MyListContext = createContext<MyListContextProps>({
  myList: [],
  addToMyList: async () => {},
  removeFromMyList: async () => {},
  isInMyList: () => false,
  loading: true,
});

export const MyListProvider = ({ children }: { children: React.ReactNode }) => {
  const [myList, setMyList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Cargar lista de AsyncStorage al inicio
  useEffect(() => {
    const loadList = async () => {
      try {
        const saved = await AsyncStorage.getItem('@my_list');
        if (saved) setMyList(JSON.parse(saved));
      } catch (error) {
        console.error('Error cargando My List:', error);
      } finally {
        setLoading(false);
      }
    };
    loadList();
  }, []);

  // 🔹 Función para agregar item
  const addToMyList = async (item: MediaItem) => {
    const exists = myList.some(i => i.id === item.id);
    if (!exists) {
      const newList = [...myList, item];
      setMyList(newList);
      await AsyncStorage.setItem('@my_list', JSON.stringify(newList));
    }
  };

  // 🔹 Función para eliminar item
  const removeFromMyList = async (item: MediaItem) => {
    const newList = myList.filter(i => i.id !== item.id);
    setMyList(newList);
    await AsyncStorage.setItem('@my_list', JSON.stringify(newList));
  };

  // 🔹 Verifica si un item está en la lista
  const isInMyList = (id: number) => myList.some(i => i.id === id);

  return (
    <MyListContext.Provider value={{ myList, addToMyList, removeFromMyList, isInMyList, loading }}>
      {children}
    </MyListContext.Provider>
  );
};

// 🔹 Hook para usar el contexto
export const useMyList = () => useContext(MyListContext);
