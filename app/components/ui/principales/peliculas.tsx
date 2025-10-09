import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  Dimensions,
} from "react-native";
import { API_KEY, BASE_URL, IMAGE_BASE_URL } from "@/service/apiThemoviedb";

const { width } = Dimensions.get("window");

export default function PeliculasScreen() {
  const [genres, setGenres] = useState([]);
  const [moviesByGenre, setMoviesByGenre] = useState({});
  const [loading, setLoading] = useState(true);
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null); // Para modal

  // Cargar géneros
  const fetchGenres = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=es-ES`
      );
      const data = await res.json();
      setGenres(data.genres || []);
    } catch (error) {
      console.error("Error al obtener géneros:", error);
    }
  };

  // Cargar películas por género
  const fetchMoviesByGenre = async (genreId) => {
    try {
      const res = await fetch(
        `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-ES&with_genres=${genreId}`
      );
      const data = await res.json();
      return data.results || [];
    } catch (error) {
      console.error(`Error al obtener películas del género ${genreId}:`, error);
      return [];
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchGenres();

      const movieMap = {};
      for (const genre of genres) {
        const movies = await fetchMoviesByGenre(genre.id);
        movieMap[genre.name] = movies;
      }
      setMoviesByGenre(movieMap);

      // Película destacada: primera película del primer género
      const firstGenreMovies = Object.values(movieMap)[0];
      if (firstGenreMovies && firstGenreMovies.length > 0) {
        setFeaturedMovie(firstGenreMovies[0]);
      }

      setLoading(false);
    };

    loadData();
  }, [genres.length]);

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

  return (
    <ScrollView style={styles.container}>
      {/* Portada destacada */}
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

      {/* Películas por categoría */}
      {Object.entries(moviesByGenre).map(([genre, movies]) => (
        <View key={genre} style={styles.section}>
          <Text style={styles.sectionTitle}>{genre}</Text>
          <FlatList
            data={movies}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMovieCard}
          />
        </View>
      ))}

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#141414", paddingTop: 50, paddingHorizontal: 10 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#141414" },
  mainTitle: { color: "#fff", fontSize: 28, fontWeight: "bold", marginBottom: 15 },
  section: { marginBottom: 25 },
  sectionTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 10, marginLeft: 5 },
  card: { marginRight: 10, alignItems: "center" },
  poster: { width: 120, height: 180, borderRadius: 8 },
  movieTitle: { color: "#fff", fontSize: 12, marginTop: 5, width: 120, textAlign: "center" },
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
  featuredOverview: { color: "#fff", fontSize: 12, marginBottom: 10 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { width: width - 40, backgroundColor: "#222", borderRadius: 10, padding: 20, alignItems: "center" },
  modalTitle: { color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  modalImage: { width: "100%", height: 180, borderRadius: 10, marginBottom: 10 },
  modalInfo: { color: "#ccc", fontSize: 14, marginBottom: 10 },
  modalOverview: { color: "#ddd", fontSize: 14, marginBottom: 15, textAlign: "center", lineHeight: 20 },
  closeButton: { backgroundColor: "#E50914", paddingVertical: 8, borderRadius: 5, alignItems: "center", width: "50%" },
  closeButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
