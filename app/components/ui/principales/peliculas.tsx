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
} from "react-native";
import { API_KEY, BASE_URL, IMAGE_BASE_URL } from "@/service/apiThemoviedb";

const { width } = Dimensions.get("window");

export default function PeliculasScreen() {
  const [genres, setGenres] = useState([]);
  const [moviesByGenre, setMoviesByGenre] = useState({});
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);

  // 🔹 Obtener géneros
  const fetchGenres = async () => {
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
  const fetchMoviesByGenre = async (genreId) => {
    try {
      const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-ES&with_genres=${genreId}`);
      const data = await res.json();
      return data.results || [];
    } catch (error) {
      console.error("Error al obtener películas:", error);
      return [];
    }
  };

  // 🔹 Cargar datos
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchGenres();
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadMovies = async () => {
      if (genres.length > 0) {
        const map = {};
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

  const renderMovieCard = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedMovie(item)}>
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

  if (loading) {
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
          <TouchableOpacity onPress={() => setSelectedMovie(featuredMovie)}>
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
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderMovieCard}
            />
          </View>
        ))}
      </ScrollView>

      {/* Modal de detalles */}
      <Modal
        visible={!!selectedMovie}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedMovie(null)}
      >
        <View style={styles.modalOverlay}>
          {selectedMovie && (
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedMovie.title}</Text>
              <Image
                source={{
                  uri: `${IMAGE_BASE_URL}${selectedMovie.backdrop_path || selectedMovie.poster_path}`,
                }}
                style={styles.modalImage}
              />
              <Text style={styles.modalInfo}>
                ⭐ {selectedMovie.vote_average?.toFixed(1) || "N/A"} | 🗓{" "}
                {selectedMovie.release_date || "Fecha no disponible"}
              </Text>
              <Text style={styles.modalOverview}>
                {selectedMovie.overview || "Sin descripción disponible."}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedMovie(null)}
              >
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </TouchableOpacity>
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

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { width: width - 40, backgroundColor: "#222", borderRadius: 10, padding: 20, alignItems: "center" },
  modalTitle: { color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  modalImage: { width: "100%", height: 180, borderRadius: 10, marginBottom: 10 },
  modalInfo: { color: "#ccc", fontSize: 14, marginBottom: 10 },
  modalOverview: { color: "#ddd", fontSize: 14, marginBottom: 15, textAlign: "center", lineHeight: 20 },
  closeButton: { backgroundColor: "#E50914", paddingVertical: 8, borderRadius: 5, alignItems: "center", width: "50%" },
  closeButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
