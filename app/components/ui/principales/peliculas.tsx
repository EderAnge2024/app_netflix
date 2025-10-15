import React, { JSX, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  Dimensions,
  Alert,
  Pressable,
  Linking,
} from "react-native";
import { API_KEY, BASE_URL, IMAGE_BASE_URL } from "@/service/apiThemoviedb";
import { useMyList, MediaItem } from "@/components/ui/logeadoDatos/MyListContext";
import { WebView } from "react-native-webview";

const { width } = Dimensions.get("window");

interface Genre {
  id: number;
  name: string;
}

interface Movie extends MediaItem {
  title?: string;
  backdrop_path?: string;
  poster_path?: string;
  overview?: string;
  vote_average?: number;
  release_date?: string;
}

type MoviesByGenre = Record<string, Movie[]>;

export default function PeliculasScreen(): JSX.Element {
  // Contexto Mi Lista
  const { addToMyList, removeFromMyList, isInMyList, loading: listLoading } = useMyList() as any;

  const [genres, setGenres] = useState<Genre[]>([]);
  const [moviesByGenre, setMoviesByGenre] = useState<MoviesByGenre>({});
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // Modal / selección
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [fetchingTrailer, setFetchingTrailer] = useState(false);

  // Obtener géneros
  const fetchGenres = async (): Promise<void> => {
    try {
      const res = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=es-ES`);
      const data = await res.json();
      const g: Genre[] = data?.genres || [];
      setGenres(g);
      if (g.length > 0) setSelectedGenre((prev) => prev ?? g[0]);
    } catch (error) {
      console.error("Error al obtener géneros:", error);
    }
  };

  // Obtener películas por género
  const fetchMoviesByGenre = async (genreId: number): Promise<Movie[]> => {
    try {
      const res = await fetch(
        `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-ES&with_genres=${genreId}`
      );
      const data = await res.json();
      return data?.results || [];
    } catch (error) {
      console.error("Error al obtener películas por género:", error);
      return [];
    }
  };

  // Cargar géneros inicialmente
  useEffect(() => {
    setLoading(true);
    fetchGenres().finally(() => {
      // no terminar loading aquí porque cargaremos películas después
    });
  }, []);

  // Cargar películas cuando tengamos géneros
  useEffect(() => {
    const loadMovies = async (): Promise<void> => {
      if (!genres || genres.length === 0) {
        setLoading(false);
        return;
      }

      const map: MoviesByGenre = {};
      for (const genre of genres) {
        const movies = await fetchMoviesByGenre(genre.id);
        map[genre.name] = movies;
      }
      setMoviesByGenre(map);

      // seleccionar película destacada del primer género si no hay selección
      const firstGenre = genres[0];
      if (firstGenre && map[firstGenre.name]?.length > 0) {
        setFeaturedMovie(map[firstGenre.name][0]);
      } else {
        setFeaturedMovie(null);
      }

      setLoading(false);
    };

    loadMovies();
  }, [genres]);

  // Si cambia selección de género, actualizar featuredMovie
  useEffect(() => {
    if (selectedGenre && moviesByGenre[selectedGenre.name]?.length > 0) {
      setFeaturedMovie(moviesByGenre[selectedGenre.name][0]);
    }
  }, [selectedGenre, moviesByGenre]);

  // Manejar Mi Lista (agregar / remover)
  const handleMyList = async (movie: Movie): Promise<void> => {
    try {
      if (isInMyList?.(movie.id)) {
        await removeFromMyList?.(movie);
        Alert.alert("✅ Removido", `${movie.title || movie.name} se eliminó de tu lista.`);
      } else {
        await addToMyList?.(movie);
        Alert.alert("✅ Agregado", `${movie.title || movie.name} se agregó a tu lista.`);
      }
    } catch (err) {
      console.error("Error al actualizar Mi Lista:", err);
      Alert.alert("❌ Error", "No se pudo actualizar tu lista.");
    }
  };

  // Buscar trailer (Youtube) y abrir modal
  const openModal = async (movie: Movie): Promise<void> => {
    setSelectedMovie(movie);
    setModalVisible(true);
    // buscar trailer
    setTrailerKey(null);
    setFetchingTrailer(true);
    try {
      const res = await fetch(`${BASE_URL}/movie/${movie.id}/videos?api_key=${API_KEY}&language=es-ES`);
      const data = await res.json();
      const trailer = data?.results?.find((v: any) => v?.type === "Trailer" && v?.site === "YouTube");
      setTrailerKey(trailer ? trailer.key : null);
    } catch (err) {
      console.error("Error buscando trailer:", err);
      setTrailerKey(null);
    } finally {
      setFetchingTrailer(false);
    }
  };

  // Abrir trailer en YouTube (fallback)
  const openTrailer = async (movieId: number): Promise<void> => {
    try {
      // Intentar usar el trailerKey ya buscado
      if (trailerKey) {
        Linking.openURL(`https://www.youtube.com/watch?v=${trailerKey}`);
        return;
      }
      // Si no hay trailerKey, buscarlo rápido
      const res = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}&language=es-ES`);
      const data = await res.json();
      const trailer = data?.results?.find((v: any) => v?.type === "Trailer" && v?.site === "YouTube");
      if (trailer?.key) {
        Linking.openURL(`https://www.youtube.com/watch?v=${trailer.key}`);
      } else {
        Alert.alert("Tráiler no disponible", "No se encontró un tráiler para esta película.");
      }
    } catch (err) {
      console.error("Error al abrir tráiler:", err);
      Alert.alert("Error", "No se pudo abrir el tráiler.");
    }
  };

  const renderMovieCard = ({ item }: { item: Movie }) => (
    <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
      <Image
        source={{
          uri: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : "https://via.placeholder.com/120x180.png?text=Sin+Imagen",
        }}
        style={styles.poster}
      />
      <Text style={styles.movieTitle} numberOfLines={1}>
        {item.title || item.name}
      </Text>
    </TouchableOpacity>
  );

  if (loading || listLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={{ color: "#fff", marginTop: 10 }}>Cargando películas...</Text>
      </View>
    );
  }

  // Ordenar géneros con el seleccionado primero (si hay)
  const orderedGenres = selectedGenre
    ? [selectedGenre.name, ...Object.keys(moviesByGenre).filter((g) => g !== selectedGenre.name)]
    : Object.keys(moviesByGenre);

  return (
    <View style={styles.container}>
      {/* Menú de géneros */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setDropdownVisible(!dropdownVisible)}>
          <View style={styles.menuButton}>
            <Text style={styles.headerTitle}>
              {selectedGenre ? selectedGenre.name : "Seleccione un género"} ▼
            </Text>
          </View>
        </TouchableOpacity>

        {dropdownVisible && (
          <View style={styles.dropdownMenu}>
            {genres.map((genre) => (
              <TouchableOpacity
                key={genre.id}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedGenre(genre);
                  setDropdownVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    selectedGenre?.id === genre.id && styles.dropdownTextActive,
                  ]}
                >
                  {genre.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Película destacada */}
        {featuredMovie && (
          <TouchableOpacity onPress={() => openModal(featuredMovie)}>
            <Image
              source={{
                uri: `${IMAGE_BASE_URL}${featuredMovie.backdrop_path || featuredMovie.poster_path}`,
              }}
              style={styles.featuredImage}
            />
            <View style={styles.overlay}>
              <Text style={styles.featuredTitle}>{featuredMovie.title}</Text>
              <Text style={styles.featuredOverview} numberOfLines={3}>
                {featuredMovie.overview}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <Text style={styles.mainTitle}>Películas por género</Text>

        {/* Películas agrupadas */}
        {orderedGenres.map((genreName) => (
          <View key={genreName} style={styles.section}>
            <Text style={styles.sectionTitle}>{genreName}</Text>
            <FlatList
              data={moviesByGenre[genreName] || []}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderMovieCard}
            />
          </View>
        ))}
      </ScrollView>

      {/* Modal de detalles */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          {selectedMovie && (
            <View style={styles.modalContent}>
              <Image
                source={{
                  uri: `${IMAGE_BASE_URL}${selectedMovie.backdrop_path || selectedMovie.poster_path}`,
                }}
                style={styles.modalImage}
              />

              <Text style={styles.modalTitle}>{selectedMovie.title}</Text>

              <Text style={styles.modalInfo}>
                ⭐ {selectedMovie.vote_average?.toFixed(1) || "N/A"} | 🗓{" "}
                {selectedMovie.release_date || "Fecha no disponible"}
              </Text>

              <Text style={styles.modalOverview}>
                {selectedMovie.overview || "Sin descripción disponible."}
              </Text>

              {/* Botones */}
              <View style={styles.modalButtonsContainer}>
                <Pressable
                  style={[
                    styles.myListButton,
                    isInMyList?.(selectedMovie.id) && styles.myListButtonActive,
                  ]}
                  onPress={() => handleMyList(selectedMovie)}
                >
                  <Text style={styles.myListButtonText}>
                    {isInMyList?.(selectedMovie.id) ? "Eliminar de Mi Lista" : "Agregar a Mi Lista"}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.trailerButton}
                  onPress={() => openTrailer(selectedMovie.id)}
                >
                  <Text style={styles.trailerButtonText}> Ver Tráiler</Text>
                </Pressable>
              </View>

              <Pressable
                style={styles.closeButton}
                onPress={() => {
                  setModalVisible(false);
                  setSelectedMovie(null);
                  setTrailerKey(null);
                }}
              >
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#141414" },
  scrollContainer: { flex: 1, paddingTop: 10 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#141414" },

  // Menú
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141414",
    paddingHorizontal: 15,
    paddingVertical: 12,
    zIndex: 10,
  },
  menuButton: { flexDirection: "row", alignItems: "center" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  dropdownMenu: {
    position: "absolute",
    top: 45,
    left: 15,
    backgroundColor: "#1c1c1c",
    borderRadius: 6,
    paddingVertical: 5,
    width: 160,
    elevation: 8,
    zIndex: 20,
  },
  dropdownItem: { paddingVertical: 8, paddingHorizontal: 12 },
  dropdownText: { color: "#ccc", fontSize: 15 },
  dropdownTextActive: { color: "#fff", fontWeight: "bold" },

  // Banner principal
  featuredImage: { width: "100%", height: 220, borderRadius: 10, marginBottom: 15 },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 15,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  featuredTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 5 },
  featuredOverview: { color: "#fff", fontSize: 12 },

  mainTitle: { color: "#fff", fontSize: 24, fontWeight: "bold", margin: 15 },
  section: { marginBottom: 25 },
  sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "bold", marginLeft: 15, marginBottom: 10 },
  card: { marginRight: 10, alignItems: "center" },
  poster: { width: 120, height: 180, borderRadius: 8 },
  movieTitle: { color: "#fff", fontSize: 12, marginTop: 5, width: 120, textAlign: "center" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { width: width - 40, backgroundColor: "#222", borderRadius: 10, padding: 20, alignItems: "center" },
  modalTitle: { color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  modalImage: { width: "100%", height: 180, borderRadius: 10, marginBottom: 10 },
  modalInfo: { color: "#ccc", fontSize: 14, marginBottom: 10 },
  modalOverview: { color: "#ddd", fontSize: 14, marginBottom: 15, textAlign: "center", lineHeight: 20 },
  closeButton: { backgroundColor: "#E50914", paddingVertical: 8, borderRadius: 5, alignItems: "center", width: "50%" },
  closeButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  // botones modal
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 15,
    marginBottom: 10,
  },
  myListButton: {
    flex: 1,
    backgroundColor: "#E50914",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 10,
  },
  myListButtonActive: {
    backgroundColor: "#2d2d2dff",
  },
  myListButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
  trailerButton: {
    flex: 1,
    backgroundColor: "#E50914",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  trailerButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});
