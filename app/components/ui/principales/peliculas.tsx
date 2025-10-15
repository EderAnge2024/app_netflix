import React, { useEffect, useState } from "react";
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
} from "react-native";
import { API_KEY, BASE_URL, IMAGE_BASE_URL } from "@/service/apiThemoviedb";
import { useMyList, MediaItem } from "@/components/ui/logeadoDatos/MyListContext";
import { WebView } from "react-native-webview";

const { width } = Dimensions.get("window");

// Interfaces TypeScript
interface Genre {
  id: number;
  name: string;
}

interface Video {
  id: string;
  key: string;
  type: string;
  site: string;
}

interface Movie extends MediaItem {
  title: string;
  release_date?: string;
  genre_ids?: number[];
}

interface MoviesByGenre {
  [genreName: string]: Movie[];
}

// Props del componente
interface PeliculasScreenProps {
  // Puedes agregar props aquí si es necesario
}

export default function PeliculasScreen({}: PeliculasScreenProps) {
  // 🔹 Contexto de Mi Lista
  const { addToMyList, removeFromMyList, isInMyList, loading: listLoading } = useMyList();

  // Estados tipados
  const [genres, setGenres] = useState<Genre[]>([]);
  const [moviesByGenre, setMoviesByGenre] = useState<MoviesByGenre>({});
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dropdownVisible, setDropdownVisible] = useState<boolean>(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // 🎥 Estados para el tráiler
  const [trailerVisible, setTrailerVisible] = useState<boolean>(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  // 🔹 Obtener géneros
  const fetchGenres = async (): Promise<void> => {
    try {
      const res = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=es-ES`);
      const data = await res.json();
      setGenres(data.genres || []);
      if (data.genres.length > 0) setSelectedGenre(data.genres[0]);
    } catch (error) {
      console.error("Error al obtener géneros:", error);
    }
  };

  // 🔹 Obtener películas por género
  const fetchMoviesByGenre = async (genreId: number): Promise<Movie[]> => {
    try {
      const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-ES&with_genres=${genreId}`);
      const data = await res.json();
      return data.results || [];
    } catch (error) {
      console.error("Error al obtener películas:", error);
      return [];
    }
  };

  // 🎥 Obtener tráiler de la película
  const fetchTrailer = async (movieId: number): Promise<string | null> => {
    try {
      const res = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}&language=es-ES`);
      const data = await res.json();
      const trailer = data.results.find((v: Video) => v.type === "Trailer" && v.site === "YouTube");
      return trailer ? trailer.key : null;
    } catch (error) {
      console.error("Error al obtener tráiler:", error);
      return null;
    }
  };

  // 🎥 Abrir tráiler
  const openTrailer = async (movieId: number): Promise<void> => {
    const key = await fetchTrailer(movieId);
    if (key) {
      setTrailerKey(key);
      setTrailerVisible(true);
    } else {
      Alert.alert("Tráiler no disponible", "Esta película no tiene tráiler disponible.");
    }
  };

  // ✅ Función para manejar Mi Lista
  const handleMyList = async (movie: Movie): Promise<void> => {
    try {
      if (isInMyList(movie.id)) {
        await removeFromMyList(movie);
        Alert.alert("✅ Removido", `${movie.title} se eliminó de tu lista.`);
      } else {
        await addToMyList(movie);
        Alert.alert("✅ Agregado", `${movie.title} se agregó a tu lista.`);
      }
    } catch (error) {
      console.error("Error al actualizar mi lista:", error);
      Alert.alert("❌ Error", "No se pudo actualizar tu lista.");
    }
  };

  // 🔹 Abrir modal con la película seleccionada
  const openModal = async (movie: Movie): Promise<void> => {
    setSelectedMovie(movie);
    setModalVisible(true);
    
    // Cargar tráiler automáticamente al abrir el modal
    const key = await fetchTrailer(movie.id);
    setTrailerKey(key);
  };

  // 🔹 Cargar datos
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      setLoading(true);
      await fetchGenres();
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadMovies = async (): Promise<void> => {
      if (genres.length > 0) {
        const map: MoviesByGenre = {};
        for (const genre of genres) {
          const movies = await fetchMoviesByGenre(genre.id);
          map[genre.name] = movies;
        }
        setMoviesByGenre(map);

        const firstGenre = genres[0];
        if (map[firstGenre.name]?.length > 0) {
          setFeaturedMovie(map[firstGenre.name][0]);
        }
        setLoading(false);
      }
    };
    loadMovies();
  }, [genres]);

  useEffect(() => {
    if (selectedGenre && moviesByGenre[selectedGenre.name]?.length > 0) {
      setFeaturedMovie(moviesByGenre[selectedGenre.name][0]);
    }
  }, [selectedGenre, moviesByGenre]);

  const renderMovieCard = ({ item }: { item: Movie }) => (
    <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
      <Image
        source={{
          uri: item.poster_path
            ? `${IMAGE_BASE_URL}${item.poster_path}`
            : "https://via.placeholder.com/120x180.png?text=Sin+Imagen",
        }}
        style={styles.poster}
      />
      <Text style={styles.movieTitle} numberOfLines={1}>
        {item.title}
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

  // 🔹 Ordenar géneros: el seleccionado primero
  const orderedGenres = selectedGenre
    ? [selectedGenre.name, ...Object.keys(moviesByGenre).filter((g) => g !== selectedGenre.name)]
    : Object.keys(moviesByGenre);

  return (
    <View style={styles.container}>
      {/* 🔹 Menú de géneros (compacto a la izquierda) */}
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

      {/* 🔹 Contenido principal */}
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
              data={moviesByGenre[genreName]}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item: Movie) => item.id.toString()}
              renderItem={renderMovieCard}
            />
          </View>
        ))}
      </ScrollView>

      {/* 🔹 Modal de detalles de la película */}
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

              {/* 🔹 Botones de acción */}
              <View style={styles.modalButtonsContainer}>
                {/* Botón Mi Lista */}
                <Pressable
                  style={[
                    styles.myListButton,
                    isInMyList(selectedMovie.id) && styles.myListButtonActive
                  ]}
                  onPress={() => handleMyList(selectedMovie)}
                >
                  <Text style={styles.myListButtonText}>
                    {isInMyList(selectedMovie.id) ? "Eliminar de Mi Lista" : "Agregar a Mi Lista"}
                  </Text>
                </Pressable>

                {/* Botón Ver Tráiler */}
                <Pressable
                  style={styles.trailerButton}
                  onPress={() => openTrailer(selectedMovie.id)}
                >
                  <Text style={styles.trailerButtonText}> Ver Tráiler</Text>
                </Pressable>
              </View>

              <Pressable
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>

      {/* 🎥 Modal del tráiler */}
      <Modal
        visible={trailerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTrailerVisible(false)}
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
              onPress={() => setTrailerVisible(false)}
            >
              <Text style={styles.trailerCloseText}>Cerrar Tráiler</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#141414" },
  scrollContainer: { flex: 1, paddingTop: 10 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#141414" },

  // 🔹 Menú
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

  // 🔹 Banner principal
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

  // 🔹 Modal de detalles
  modalOverlay: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.85)", 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 20 
  },
  modalContent: { 
    width: width - 40, 
    backgroundColor: "#222", 
    borderRadius: 10, 
    padding: 20, 
    alignItems: "center" 
  },
  modalImage: { 
    width: "100%", 
    height: 180, 
    borderRadius: 10, 
    marginBottom: 15 
  },
  modalTitle: { 
    color: "#fff", 
    fontSize: 22, 
    fontWeight: "bold", 
    marginBottom: 8, 
    textAlign: "center" 
  },
  modalInfo: { 
    color: "#ccc", 
    fontSize: 14, 
    marginBottom: 10 
  },
  modalOverview: { 
    color: "#ddd", 
    fontSize: 14, 
    marginBottom: 15, 
    textAlign: "center", 
    lineHeight: 20 
  },

  // 🔹 Botones del modal
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 15,
    gap: 10,
  },
  myListButton: {
    flex: 1,
    backgroundColor: "#E50914",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  myListButtonActive: {
    backgroundColor: "#444",
  },
  myListButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
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
    fontSize: 16,
  },
  closeButton: { 
    backgroundColor: "#E50914", 
    paddingVertical: 12, 
    paddingHorizontal: 30,
    borderRadius: 8, 
    alignItems: "center" 
  },
  closeButtonText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 16 
  },

  // 🎥 Modal del tráiler
  trailerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  trailerContainer: {
    width: width - 20,
    height: 250,
    backgroundColor: "#000",
    borderRadius: 10,
    overflow: "hidden",
  },
  webview: {
    flex: 1,
    borderRadius: 10,
  },
  noTrailerText: {
    color: "#fff",
    textAlign: "center",
    marginTop: 100,
    fontSize: 16,
  },
  trailerCloseButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#E50914",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  trailerCloseText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});