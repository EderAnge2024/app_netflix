// components/ui/principales/notificaciones.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator } from 'react-native';
import { API_KEY, BASE_URL, IMAGE_BASE_URL } from '@/service/apiThemoviedb';

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
}

export default function NotificacionesScreen() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=es-ES&page=1`)
      .then(res => res.json())
      .then(data => {
        setMovies(data.results || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.message}>Cargando notificaciones...</Text>
      </View>
    );
  }

  if (movies.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Notificaciones</Text>
        <Text style={styles.message}>No tienes notificaciones nuevas</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Notificaciones</Text>
      <FlatList
        data={movies}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.notification}>
            {item.poster_path && (
              <Image
                source={{ uri: `${IMAGE_BASE_URL}${item.poster_path}` }}
                style={styles.poster}
              />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.date}>Estreno: {item.release_date}</Text>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
      />
      <Text style={styles.footer}>Desliza para actualizar</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
    padding: 20,
  },
  header: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  message: {
    color: '#ccc',
    fontSize: 18,
    textAlign: 'center',
  },
  footer: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 10,
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 10,
  },
  poster: {
    width: 60,
    height: 90,
    borderRadius: 5,
    marginRight: 10,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  date: {
    color: '#ccc',
    fontSize: 14,
  },
});
