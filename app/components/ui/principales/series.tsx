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
  TextInput,
  Modal,
  Pressable,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_KEY, BASE_URL, IMAGE_BASE_URL } from "@/service/apiThemoviedb";

const { width } = Dimensions.get("window");

export default function SeriesSection() {
  const [genres, setGenres] = useState([]);
  const [seriesByGenre, setSeriesByGenre] = useState({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [featuredSerie, setFeaturedSerie] = useState(null);

  // Modal
  const [selectedSerie, setSelectedSerie] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 🔹 Obtener géneros
  const fetchGenres = async () => {
    try {
      const res = await fetch(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}&language=es-ES`);
      const data = await res.json();
      setGenres(data.genres || []);
    } catch (error) {
      console.error("Error al obtener géneros:", error);
    }
  };

  // 🔹 Obtener series por género
  const fetchSeriesByGenre = async (genreId) => {
    try {
      const res = await fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&language=es-ES&with_genres=${genreId}`);
      const data = await res.json();
      return data.results || [];
    } catch (error) {
      console.error(`Error al obtener series del género ${genreId}:`, error);
      return [];
    }
  };

  // 🔹 Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchGenres();

      // Esperar a que genres se carguen
      setTimeout(async () => {
        const map = {};
        for (const genre of genres) {
          const series = await fetchSeriesByGenre(genre.id);
          map[genre.name] = series;
        }
        setSeriesByGenre(map);

        // Serie destacada: primera del primer género
        const firstGenreSeries = Object.values(map)[0];
        if (firstGenreSeries && firstGenreSeries.length > 0) {
          setFeaturedSerie(firstGenreSeries[0]);
        }

        setLoading(false);
      }, 500);
    };
    loadData();
  }, [genres.length]);

  // 🔍 Buscar series
  const handleSearch = async (text) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/search/tv?api_key=${API_KEY}&language=es-ES&query=${text}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error("Error al buscar series:", error);
    }
  };

  // 🔹 Abrir modal de información
  const openModal = (serie) => {
    setSelectedSerie(serie);
    setModalVisible(true);
  };

  const renderSerie = ({ item }) => (
    <TouchableOpacity style={styles.serieCard} onPress={() => openModal(item)}>
      <Image
        source={{
          uri: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : "https://via.placeholder.com/120x180.png?text=Sin+Imagen",
        }}
        style={styles.serieImage}
      />
      <Text style={styles.serieTitle} numberOfLines={1}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Cargando series...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#141414" }}>
      <ScrollView style={styles.container}>
        {/* 🎬 Serie destacada */}
        {featuredSerie && (
          <View style={styles.featuredContainer}>
            <Image
              source={{ uri: `${IMAGE_BASE_URL}${featuredSerie.backdrop_path || featuredSerie.poster_path}` }}
              style={styles.featuredImage}
              resizeMode="cover"
            />
            <View style={styles.overlay}>
              <Text style={styles.featuredTitle}>{featuredSerie.name}</Text>
              <Text style={styles.featuredOverview} numberOfLines={3}>{featuredSerie.overview}</Text>
              <TouchableOpacity style={styles.featuredButton} onPress={() => openModal(featuredSerie)}>
                <Text style={styles.featuredButtonText}>Ver Más</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 🔎 Buscador */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={22} color="#ccc" style={styles.searchIcon} />
          <TextInput
            placeholder="Buscar series..."
            placeholderTextColor="#888"
            value={query}
            onChangeText={handleSearch}
            style={styles.searchInput}
          />
        </View>

        {/* 🔸 Resultados de búsqueda */}
        {searchResults.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resultados de búsqueda</Text>
            <FlatList
              data={searchResults}
              renderItem={renderSerie}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>
        ) : (
          <>
            {/* 🔹 Series por género */}
            {Object.entries(seriesByGenre).map(([genre, series]) => (
              <View key={genre} style={styles.section}>
                <Text style={styles.sectionTitle}>{genre}</Text>
                <FlatList
                  data={series}
                  renderItem={renderSerie}
                  keyExtractor={(item) => item.id.toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                />
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* 🔹 Modal de información */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          {selectedSerie && (
            <View style={styles.modalContainer}>
              <Image
                source={{ uri: `${IMAGE_BASE_URL}${selectedSerie.backdrop_path || selectedSerie.poster_path}` }}
                style={styles.modalImage}
              />
              <Text style={styles.modalTitle}>{selectedSerie.name}</Text>
              <Text style={styles.modalInfo}>
                ⭐ {selectedSerie.vote_average?.toFixed(1) || "N/A"} | 🗓 {selectedSerie.first_air_date || "Fecha no disponible"}
              </Text>
              <Text style={styles.modalOverview}>{selectedSerie.overview || "Sin descripción disponible."}</Text>

              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>Cerrar</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

// 🎨 Estilos
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#141414", paddingTop: 10 },
  loadingContainer: { flex: 1, height: 300, justifyContent: "center", alignItems: "center", backgroundColor: "#141414" },
  loadingText: { color: "#fff", marginTop: 10 },

  // Buscador
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#2b2b2b", borderRadius: 10, paddingHorizontal: 10, margin: 15 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: "#fff", fontSize: 16, paddingVertical: 8 },

  // Secciones
  section: { marginBottom: 25 },
  sectionTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 10, marginLeft: 15 },

  // Tarjeta de serie
  serieCard: { marginRight: 10, width: 120 },
  serieImage: { width: 120, height: 180, borderRadius: 10 },
  serieTitle: { color: "#fff", marginTop: 5, textAlign: "center", fontSize: 12 },

  // Serie destacada
  featuredContainer: { width: "100%", height: 220, marginBottom: 20, position: "relative", borderRadius: 10 },
  featuredImage: { width: "100%", height: "100%", borderRadius: 10 },
  overlay: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", padding: 15, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  featuredTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 5 },
  featuredOverview: { color: "#fff", fontSize: 12, marginBottom: 10 },
  featuredButton: { backgroundColor: "#E50914", paddingVertical: 8, paddingHorizontal: 15, borderRadius: 5, alignSelf: "flex-start" },
  featuredButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },

  // Modal
  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", padding: 20 },
  modalContainer: { backgroundColor: "#222", borderRadius: 10, padding: 20, alignItems: "center" },
  modalImage: { width: width - 80, height: 200, borderRadius: 10, marginBottom: 15 },
  modalTitle: { color: "#fff", fontSize: 24, fontWeight: "bold", marginBottom: 8, textAlign: "center" },
  modalInfo: { color: "#ccc", fontSize: 14, marginBottom: 10 },
  modalOverview: { color: "#ddd", fontSize: 14, lineHeight: 20, textAlign: "center" },
  modalCloseButton: { marginTop: 15, backgroundColor: "#E50914", paddingVertical: 10, paddingHorizontal: 25, borderRadius: 8 },
  modalCloseText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
