// components/ui/principales/notificaciones.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Modal,
  Pressable,
  Dimensions,
  Alert,
} from 'react-native';
import { API_KEY, BASE_URL, IMAGE_BASE_URL } from '@/service/apiThemoviedb';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  overview: string;
  vote_average: number;
}

interface Video {
  id: string;
  key: string;
  type: string;
  site: string;
}

export default function NotificacionesScreen() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para los modales
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [trailerVisible, setTrailerVisible] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=es-ES&page=1`)
      .then(res => res.json())
      .then(data => {
        setMovies(data.results || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Función para obtener el tráiler
  const fetchTrailer = async (movieId: number): Promise<string | null> => {
    try {
      const res = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}&language=es-ES`);
      const data = await res.json();
      const trailer = data.results.find((v: Video) => v.type === 'Trailer' && v.site === 'YouTube');
      return trailer ? trailer.key : null;
    } catch (error) {
      console.error('Error al obtener tráiler:', error);
      return null;
    }
  };

  // Abrir modal de información
  const openModal = async (movie: Movie) => {
    setSelectedMovie(movie);
    setModalVisible(true);
    
    // Cargar tráiler automáticamente
    const key = await fetchTrailer(movie.id);
    setTrailerKey(key);
  };

  // Abrir modal de tráiler
  const openTrailer = async () => {
    if (trailerKey) {
      setTrailerVisible(true);
    } else {
      Alert.alert('Tráiler no disponible', 'Esta película no tiene tráiler disponible.');
    }
  };

  // Cerrar modales
  const closeModal = () => {
    setModalVisible(false);
    setSelectedMovie(null);
    setTrailerKey(null);
  };

  const closeTrailerModal = () => {
    setTrailerVisible(false);
  };

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
          <Pressable style={styles.notification} onPress={() => openModal(item)}>
            {item.poster_path && (
              <Image
                source={{ uri: `${IMAGE_BASE_URL}${item.poster_path}` }}
                style={styles.poster}
              />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.date}>Estreno: {item.release_date}</Text>
              <Text style={styles.rating}>⭐ {item.vote_average?.toFixed(1) || 'N/A'}</Text>
            </View>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
      />
      <Text style={styles.footer}>Desliza para actualizar</Text>

      {/* Modal de información de la película */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          {selectedMovie && (
            <View style={styles.modalContent}>
              {selectedMovie.backdrop_path && (
                <Image
                  source={{ uri: `${IMAGE_BASE_URL}${selectedMovie.backdrop_path}` }}
                  style={styles.modalImage}
                />
              )}
              
              <Text style={styles.modalTitle}>{selectedMovie.title}</Text>
              
              <Text style={styles.modalInfo}>
                ⭐ {selectedMovie.vote_average?.toFixed(1) || 'N/A'} | 🗓 {selectedMovie.release_date}
              </Text>
              
              <Text style={styles.modalOverview}>
                {selectedMovie.overview || 'Sin descripción disponible.'}
              </Text>

              {/* Botones de acción */}
              <View style={styles.modalButtonsContainer}>
                <Pressable
                  style={styles.trailerButton}
                  onPress={openTrailer}
                >
                  <Text style={styles.trailerButtonText}>▶ Ver Tráiler</Text>
                </Pressable>
              </View>

              <Pressable
                style={styles.closeButton}
                onPress={closeModal}
              >
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>

      {/* Modal del tráiler */}
      <Modal
        visible={trailerVisible}
        animationType="slide"
        transparent
        onRequestClose={closeTrailerModal}
      >
        <View style={styles.trailerModalOverlay}>
          <View style={styles.trailerContainer}>
            {trailerKey ? (
              <WebView
                source={{ uri: `https://www.youtube.com/embed/${trailerKey}?autoplay=1` }}
                style={styles.webview}
                allowsFullscreenVideo
              />
            ) : (
              <Text style={styles.noTrailerText}>Cargando tráiler...</Text>
            )}
            
            <Pressable
              style={styles.trailerCloseButton}
              onPress={closeTrailerModal}
            >
              <Text style={styles.trailerCloseText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  rating: {
    color: '#ffcc00',
    fontSize: 12,
    marginTop: 5,
  },

  // Estilos para el modal de información
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: width - 40,
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 15,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalInfo: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 10,
  },
  modalOverview: {
    color: '#ddd',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 15,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 15,
  },
  trailerButton: {
    backgroundColor: '#E50914',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: 'center',
  },
  trailerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: '#E50914',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Estilos para el modal del tráiler
  trailerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  trailerContainer: {
    width: width - 20,
    height: 250,
    backgroundColor: '#000',
    borderRadius: 10,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    borderRadius: 10,
  },
  noTrailerText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
  },
  trailerCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#E50914',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  trailerCloseText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});