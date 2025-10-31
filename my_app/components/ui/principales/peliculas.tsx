import React, { JSX, useEffect, useState, useCallback } from "react"; // 🔹 CAMBIO: Añadido useCallback
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
// import { WebView } from "react-native-webview"; // 🔹 CAMBIO: Eliminado WebView
import YoutubePlayer from "react-native-youtube-iframe"; // 🔹 CAMBIO: Importado YoutubePlayer

const { width } = Dimensions.get("window");

// ... (Interfaces Genre, Movie, MoviesByGenre - sin cambios) ...
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

  // ... (Estados de géneros, películas, etc. - sin cambios) ...
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
  
  // 🔹 CAMBIO: Estados del reproductor (reemplazan a fetchingTrailer)
  const [isTrailerLoading, setIsTrailerLoading] = useState(false);
  const [webviewError, setWebviewError] = useState(false);
  const [playing, setPlaying] = useState(false);

  // ... (fetchGenres, fetchMoviesByGenre - sin cambios) ...
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
  // ... (useEffect de carga de géneros y películas - sin cambios) ...
  useEffect(() => {
    setLoading(true);
    fetchGenres().finally(() => {
      // no terminar loading aquí porque cargaremos películas después
    });
  }, []);

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

  useEffect(() => {
    if (selectedGenre && moviesByGenre[selectedGenre.name]?.length > 0) {
      setFeaturedMovie(moviesByGenre[selectedGenre.name][0]);
    }
  }, [selectedGenre, moviesByGenre]);

  // ... (handleMyList - sin cambios) ...
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

  // 🔹 CAMBIO: Añadido onStateChange
  const onStateChange = useCallback((state: string) => {
    if (state === "ended" || state === "paused") setPlaying(false);
    if (state === "playing") setPlaying(true);
    if (state === "error") setWebviewError(true);
  }, []);

  // 🔹 CAMBIO: Lógica de openModal actualizada
  const openModal = async (movie: Movie): Promise<void> => {
    setWebviewError(false);
    setPlaying(false);
    setSelectedMovie(movie);
    setModalVisible(true);
    setIsTrailerLoading(true); // Iniciar carga

    try {
      const res = await fetch(`${BASE_URL}/movie/${movie.id}/videos?api_key=${API_KEY}&language=es-ES`);
      const data = await res.json();
      const trailer = data?.results?.find((v: any) => v?.type === "Trailer" && v?.site === "YouTube");
      setTrailerKey(trailer ? trailer.key : null);
    } catch (err) {
      console.error("Error buscando trailer:", err);
      setTrailerKey(null);
    } finally {
      setIsTrailerLoading(false); // Finalizar carga
    }
  };

  // 🔹 CAMBIO: Añadida función closeModal
  const closeModal = () => {
    setModalVisible(false);
    setTrailerKey(null);
    setPlaying(false);
  };

  // 🔹 CAMBIO: Eliminada la función openTrailer (ya no es necesaria, se maneja con el fallback)

  // ... (renderMovieCard, chequeo de loading, orderedGenres - sin cambios) ...
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
  
  const orderedGenres = selectedGenre
    ? [selectedGenre.name, ...Object.keys(moviesByGenre).filter((g) => g !== selectedGenre.name)]
    : Object.keys(moviesByGenre);


  // ... (JSX de la pantalla principal: Header, Dropdown, ScrollView - sin cambios) ...
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
        {/* 🔹 Película destacada con estilo de series */}
        {featuredMovie && (
          <View style={styles.featuredContainer}>
            <Image
              source={{
                uri: `${IMAGE_BASE_URL}${featuredMovie.backdrop_path || featuredMovie.poster_path}`,
              }}
              style={styles.featuredImage}
              resizeMode="cover"
            />
            <View style={styles.overlaySeries}>
              <Text style={styles.featuredTitle}>{featuredMovie.title}</Text>
              <Text style={styles.featuredInfo}>
                ⭐ {featuredMovie.vote_average?.toFixed(1) || "N/A"} | 🗓{" "}
                {featuredMovie.release_date || "Fecha no disponible"}
              </Text>
              <Text style={styles.featuredOverview} numberOfLines={3}>
                {featuredMovie.overview}
              </Text>
              <View style={styles.featuredButtonsContainerSeries}>
                {/* Abrir modal y reproducir dentro del modal si hay tráiler */}
                <TouchableOpacity
                  style={styles.playButtonSeries}
                  onPress={() => openModal(featuredMovie)}
                >
                  <Text style={styles.playButtonTextSeries}>▶ Reproducir</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.moreInfoButtonSeries}
                  onPress={() => openModal(featuredMovie)}
                >
                  <Text style={styles.moreInfoButtonTextSeries}>ℹ Ver más</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

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

      {/* 🔹 CAMBIO: Modal completamente reemplazado con la lógica de YoutubePlayer */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal} // Usar la nueva función de cierre
      >
        <View style={styles.modalOverlay}>
          {selectedMovie && (
            <View style={styles.modalContent}>
              
              {/* Lógica del reproductor */}
              {isTrailerLoading ? (
                // 1. Estado de Carga
                <ActivityIndicator color="#E50914" style={{ height: 220, marginVertical: 15 }} />
              ) : trailerKey && !webviewError ? (
                // 2. Éxito: Mostrar reproductor
                <View style={styles.trailerContainer}>
                  <YoutubePlayer
                    height={220}
                    play={playing}
                    videoId={trailerKey}
                    onChangeState={onStateChange}
                    webViewStyle={{ opacity: 1 }}
                    forceAndroidAutoplay={false}
                  />
                </View>
              ) : (
                // 3. Fallo: Mostrar imagen de fallback y botón de Linking
                <View style={styles.trailerContainer}>
                  <Image
                    source={{
                      uri: `${IMAGE_BASE_URL}${selectedMovie.backdrop_path || selectedMovie.poster_path}`
                    }}
                    style={styles.fallbackImage}
                    resizeMode="cover"
                  />
                  {/* Botón de fallback si la key existe pero el player falló */}
                  {webviewError && trailerKey && (
                    <Pressable
                      onPress={() => {
                        const url = `https://www.youtube.com/watch?v=${trailerKey}`;
                        Linking.openURL(url).catch((e) => console.error("Linking error", e));
                      }}
                      style={styles.youtubeButton}
                    >
                      <Text style={styles.youtubeButtonText}>Abrir en YouTube</Text>
                    </Pressable>
                  )}
                </View>
              )}
              {/* Fin lógica del reproductor */}

              <Text style={styles.modalTitle}>{selectedMovie.title}</Text>

              <Text style={styles.modalInfo}>
                ⭐ {selectedMovie.vote_average?.toFixed(1) || "N/A"} | 🗓{" "}
                {selectedMovie.release_date || "Fecha no disponible"}
              </Text>

              <Text style={styles.modalOverview}>
                {selectedMovie.overview || "Sin descripción disponible."}
              </Text>

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
              </View>

              <Pressable
                style={styles.closeButton}
                onPress={closeModal} // Usar la nueva función de cierre
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
  // ... (Estilos container, loader, header, dropdown, featured, section, card - sin cambios) ...
  container: { flex: 1, backgroundColor: "#141414" },
  scrollContainer: { flex: 1, paddingTop: 10 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#141414" },
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
  featuredContainer: { width: "100%", height: 480, marginBottom: 20, position: "relative" },
  featuredImage: { width: "100%", height: "100%" },
  overlaySeries: {
    position: "absolute",
    bottom: 28,
    left: 18,
    right: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 14,
    borderRadius: 8,
  },
  featuredTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 5,
  },
  featuredInfo: {
    color: "#ffcc00",
    fontSize: 14,
    marginBottom: 8,
  },
  featuredOverview: {
    color: "#fff",
    fontSize: 13,
    marginBottom: 15,
  },
  featuredButtonsContainerSeries: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 10,
  },
  playButtonSeries: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
  },
  playButtonTextSeries: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
  moreInfoButtonSeries: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
  },
  moreInfoButtonTextSeries: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  mainTitle: { color: "#fff", fontSize: 24, fontWeight: "bold", margin: 15 },
  section: { marginBottom: 25 },
  sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "bold", marginLeft: 15, marginBottom: 10 },
  card: { marginRight: 10, alignItems: "center" },
  poster: { width: 120, height: 180, borderRadius: 8 },
  movieTitle: { color: "#fff", fontSize: 12, marginTop: 5, width: 120, textAlign: "center" },

  // --- 🔹 CAMBIOS EN ESTILOS DEL MODAL ---
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { width: width - 40, backgroundColor: "#222", borderRadius: 10, padding: 20, alignItems: "center" },
  
  // 🔹 CAMBIO: Añadido trailerContainer (altura 220px)
  trailerContainer: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 15,
    backgroundColor: '#000',
    position: 'relative',
  },
  
  // 🔹 CAMBIO: Añadido fallbackImage
  fallbackImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },

  // 🔹 CAMBIO: Eliminado modalImage
  // modalImage: { width: "100%", height: 180, borderRadius: 10, marginBottom: 10 },
  
  modalTitle: { color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  modalInfo: { color: "#ccc", fontSize: 14, marginBottom: 10 },
  modalOverview: { color: "#ddd", fontSize: 14, marginBottom: 15, textAlign: "center", lineHeight: 20 },
  
  // 🔹 CAMBIO: Ajustado el botón de cerrar para que sea consistente
  closeButton: { 
    backgroundColor: "#E50914", 
    paddingVertical: 10, 
    borderRadius: 8, // Borde 8
    alignItems: "center", 
    width: "100%", // Ancho 100%
    marginTop: 10, // Margen superior
  },
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
    flex: 1, // Ocupa todo el espacio
    backgroundColor: "#E50914",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    // 🔹 CAMBIO: Eliminado marginRight
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
  
  // 🔹 CAMBIO: Eliminados estilos de trailerButton (ya no existe)
  // trailerButton: { ... },
  // trailerButtonText: { ... },

  // 🔹 CAMBIO: Añadidos estilos del botón de fallback
  youtubeButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "#E50914",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  youtubeButtonText: { 
    color: "#fff", 
    fontWeight: "bold" 
  },
}); 