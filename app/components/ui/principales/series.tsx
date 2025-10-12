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
  Pressable,
  Dimensions,
} from "react-native";
import { API_KEY, BASE_URL, IMAGE_BASE_URL } from "@/service/apiThemoviedb";

const { width } = Dimensions.get("window");

export default function SeriesSection() {
  const [genres, setGenres] = useState([]);
  const [seriesByGenre, setSeriesByGenre] = useState({});
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [featuredSerie, setFeaturedSerie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // 🔹 Modal
  const [selectedSerie, setSelectedSerie] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchGenres = async () => {
    try {
      const res = await fetch(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}&language=es-ES`);
      const data = await res.json();
      setGenres(data.genres || []);
      if (data.genres && data.genres.length > 0) setSelectedGenre(data.genres[0]);
    } catch (error) {
      console.error("Error al obtener géneros:", error);
    }
  };

  const fetchSeriesByGenre = async (genreId) => {
    try {
      const res = await fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&language=es-ES&with_genres=${genreId}`);
      const data = await res.json();
      return data.results || [];
    } catch (error) {
      console.error("Error al obtener series:", error);
      return [];
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchGenres();
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadSeries = async () => {
      if (genres.length > 0) {
        const map = {};
        for (const genre of genres) {
          const series = await fetchSeriesByGenre(genre.id);
          map[genre.name] = series;
        }
        setSeriesByGenre(map);

        const firstGenre = genres[0];
        if (map[firstGenre.name]?.length > 0) {
          setFeaturedSerie(map[firstGenre.name][0]);
        }
        setLoading(false);
      }
    };
    loadSeries();
  }, [genres]);

  useEffect(() => {
    if (selectedGenre && seriesByGenre[selectedGenre.name]?.length > 0) {
      setFeaturedSerie(seriesByGenre[selectedGenre.name][0]);
    }
  }, [selectedGenre, seriesByGenre]);

  // 🔹 Abrir modal al tocar una serie
  const openModal = (serie) => {
    setSelectedSerie(serie);
    setModalVisible(true);
  };

  const renderSerie = ({ item }) => (
    <TouchableOpacity style={styles.serieCard} onPress={() => openModal(item)}>
      <Image
        source={{
          uri: item.poster_path
            ? `${IMAGE_BASE_URL}${item.poster_path}`
            : "https://via.placeholder.com/120x180.png?text=Sin+Imagen",
        }}
        style={styles.serieImage}
      />
      <Text style={styles.serieTitle} numberOfLines={1}>
        {item.name}
      </Text>
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

  const orderedGenres = selectedGenre
    ? [selectedGenre.name, ...Object.keys(seriesByGenre).filter((g) => g !== selectedGenre.name)]
    : Object.keys(seriesByGenre);

  return (
    <View style={styles.container}>
      {/* 🔹 Encabezado tipo Netflix */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inicio</Text>

        <TouchableOpacity onPress={() => setDropdownVisible(!dropdownVisible)}>
          <View style={styles.seriesMenuButton}>
            <Text style={styles.headerTitle}>
              {selectedGenre ? selectedGenre.name : "Series"} ▼
            </Text>
          </View>
        </TouchableOpacity>

        {/* 🔽 Menú desplegable */}
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

      <ScrollView>
        {/* 🎬 Serie destacada */}
        {featuredSerie && (
          <TouchableOpacity style={styles.featuredContainer} onPress={() => openModal(featuredSerie)}>
            <Image
              source={{
                uri: `${IMAGE_BASE_URL}${
                  featuredSerie.backdrop_path || featuredSerie.poster_path
                }`,
              }}
              style={styles.featuredImage}
              resizeMode="cover"
            />
            <View style={styles.overlay}>
              <Text style={styles.featuredTitle}>{featuredSerie.name}</Text>
              <Text style={styles.featuredOverview} numberOfLines={3}>
                {featuredSerie.overview || "Sin descripción disponible."}
              </Text>
              <View style={styles.featuredButton}>
                <Text style={styles.featuredButtonText}>Ver más</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* 🔹 Series por género */}
        {orderedGenres.map((genreName) => (
          <View key={genreName} style={styles.section}>
            <Text style={styles.sectionTitle}>{genreName}</Text>
            <FlatList
              data={seriesByGenre[genreName]}
              renderItem={renderSerie}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>
        ))}
      </ScrollView>

      {/* 🔹 Modal de detalle de serie */}
      <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackground}>
          {selectedSerie && (
            <View style={styles.modalContainer}>
              <Image
                source={{
                  uri: `${IMAGE_BASE_URL}${
                    selectedSerie.backdrop_path || selectedSerie.poster_path
                  }`,
                }}
                style={styles.modalImage}
              />
              <Text style={styles.modalTitle}>{selectedSerie.name}</Text>
              <Text style={styles.modalInfo}>
                ⭐ {selectedSerie.vote_average?.toFixed(1) || "N/A"} | 🗓{" "}
                {selectedSerie.first_air_date || "Fecha no disponible"}
              </Text>
              <Text style={styles.modalOverview}>
                {selectedSerie.overview || "Sin descripción disponible."}
              </Text>

              <Pressable style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseText}>Cerrar</Text>
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
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#fff", marginTop: 10 },

  // 🔹 Header Netflix
  header: {
    backgroundColor: "#141414",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 12,
    position: "relative",
    zIndex: 20,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  seriesMenuButton: { flexDirection: "row", alignItems: "center" },

  // 🔽 Menú desplegable
  dropdownMenu: {
    position: "absolute",
    top: 50,
    right: 15,
    backgroundColor: "#1c1c1c",
    borderRadius: 6,
    paddingVertical: 5,
    width: 160,
    elevation: 10,
    zIndex: 30,
  },
  dropdownItem: { paddingVertical: 8, paddingHorizontal: 12 },
  dropdownText: { color: "#ccc", fontSize: 15 },
  dropdownTextActive: { color: "#fff", fontWeight: "bold" },

  featuredContainer: { width: "100%", height: 250, marginBottom: 20 },
  featuredImage: { width: "100%", height: "100%" },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 15,
  },
  featuredTitle: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  featuredOverview: { color: "#fff", fontSize: 13 },
  featuredButton: {
    backgroundColor: "#E50914",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignSelf: "flex-start",
    marginTop: 10,
  },
  featuredButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },

  section: { marginBottom: 30 },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 15,
    marginBottom: 10,
  },
  serieCard: { marginHorizontal: 8, width: 120 },
  serieImage: { width: 120, height: 180, borderRadius: 8 },
  serieTitle: { color: "#fff", fontSize: 12, textAlign: "center", marginTop: 5 },

  // 🔹 Modal
  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", padding: 20 },
  modalContainer: { backgroundColor: "#222", borderRadius: 10, padding: 20, alignItems: "center" },
  modalImage: { width: width - 80, height: 200, borderRadius: 10, marginBottom: 15 },
  modalTitle: { color: "#fff", fontSize: 24, fontWeight: "bold", marginBottom: 8, textAlign: "center" },
  modalInfo: { color: "#ccc", fontSize: 14, marginBottom: 10 },
  modalOverview: { color: "#ddd", fontSize: 14, lineHeight: 20, textAlign: "center" },
  modalCloseButton: {
    marginTop: 15,
    backgroundColor: "#E50914",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  modalCloseText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
