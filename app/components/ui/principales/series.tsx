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
  Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import { API_KEY, BASE_URL, IMAGE_BASE_URL } from "@/service/apiThemoviedb";
import { WebView } from "react-native-webview";
import { useMyList, MediaItem } from "@/components/ui/logeadoDatos/MyListContext";

const { width } = Dimensions.get("window");



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

interface SeriesByGenre {
  [genreName: string]: MediaItem[];
}
  
interface SeriesSectionProps {}

export default function SeriesSection({}: SeriesSectionProps) {
  // 🔹 Usa el contexto global
  const { myList, addToMyList, removeFromMyList, isInMyList, loading: listLoading } = useMyList();

  // 🟡 Cambia Serie por MediaItem en todos los estados
  const [genres, setGenres] = useState<Genre[]>([]);
  const [seriesByGenre, setSeriesByGenre] = useState<SeriesByGenre>({});
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [featuredSerie, setFeaturedSerie] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dropdownVisible, setDropdownVisible] = useState<boolean>(false);

  const [selectedSerie, setSelectedSerie] = useState<MediaItem | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const [trailerVisible, setTrailerVisible] = useState<boolean>(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  // 🟡 Actualiza las funciones para usar MediaItem
  const fetchGenres = async (): Promise<void> => {
    try {
      const res = await fetch(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}&language=es-ES`);
      const data = await res.json();
      setGenres(data.genres || []);
      if (data.genres && data.genres.length > 0) setSelectedGenre(data.genres[0]);
    } catch (error) {
      console.error("Error al obtener géneros:", error);
    }
  };

  const fetchSeriesByGenre = async (genreId: number): Promise<MediaItem[]> => {
    try {
      const res = await fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&language=es-ES&with_genres=${genreId}`);
      const data = await res.json();
      return data.results || [];
    } catch (error) {
      console.error("Error al obtener series:", error);
      return [];
    }
  };

  const fetchTrailer = async (serieId: number): Promise<string | null> => {
    try {
      const res = await fetch(`${BASE_URL}/tv/${serieId}/videos?api_key=${API_KEY}&language=es-ES`);
      const data = await res.json();
      const trailer = data.results.find((v: Video) => v.type === "Trailer" && v.site === "YouTube");
      return trailer ? trailer.key : null;
    } catch (error) {
      console.error("Error al cargar tráiler:", error);
      setTrailerUrl(null);
    }
  };

  const openTrailer = async (serieId: number): Promise<void> => {
    const key = await fetchTrailer(serieId);
    if (key) {
      setTrailerKey(key);
      setTrailerVisible(true);
    } else {
      Alert.alert("Tráiler no disponible", "Esta serie no tiene tráiler disponible.");
    }
  };

  // 🟡 Actualiza la función para usar MediaItem
  // 🟡 Esta función ahora debería funcionar sin errores
    const handleMyList = async (serie: MediaItem): Promise<void> => {
      try {
        if (isInMyList(serie.id)) {
          await removeFromMyList(serie);
          Alert.alert("✅ Removido", `${serie.name} se eliminó de tu lista.`);
        } else {
          await addToMyList(serie);
          Alert.alert("✅ Agregado", `${serie.name} se agregó a tu lista.`);
        }
      } catch (error) {
        console.error("Error al actualizar mi lista:", error);
        Alert.alert("❌ Error", "No se pudo actualizar tu lista.");
      }
    };

  // Effects
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      setLoading(true);
      await fetchGenres();
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadSeries = async (): Promise<void> => {
      if (genres.length > 0) {
        const map: SeriesByGenre = {};
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

  // 🟡 Actualiza el handler para usar MediaItem
  const openModal = (serie: MediaItem): void => {
    setSelectedSerie(serie);
    setModalVisible(true);
  };

  // 🟡 Actualiza el render item para usar MediaItem
  const renderSerie = ({ item }: { item: MediaItem }) => (
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

  if (loading || listLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loaderText}>Cargando series...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 🔹 Banner principal */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.bannerContainer}
      >
        {popularSeries.slice(0, 5).map((serie) => (
          <TouchableOpacity key={serie.id} onPress={() => handleShowDetails(serie)}>
            <Image
              source={{ uri: `${IMAGE_BASE_URL}${serie.backdrop_path}` }}
              style={styles.bannerImage}
            />
            <View style={styles.bannerOverlay}>
              <Text style={styles.bannerTitle}>{serie.name}</Text>
            </View>
          </View>
        )}

        {/* 🔹 Series por género */}
        {orderedGenres.map((genreName) => (
          <View key={genreName} style={styles.section}>
            <Text style={styles.sectionTitle}>{genreName}</Text>
            <FlatList
              data={seriesByGenre[genreName]}
              renderItem={renderSerie}
              keyExtractor={(item: MediaItem) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>
        ))}
      </ScrollView>

      {/* 🔹 Lista de series populares */}
      <Text style={styles.sectionTitle}>Series Populares</Text>
      <FlatList
        horizontal
        data={popularSeries}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleShowDetails(item)}>
            <Image
              source={{ uri: `${IMAGE_BASE_URL}${item.poster_path}` }}
              style={styles.posterImage}
            />
          </TouchableOpacity>
        )}
        showsHorizontalScrollIndicator={false}
      />

      {/* 🔹 Lista de series mejor valoradas */}
      <Text style={styles.sectionTitle}>Mejor Valoradas</Text>
      <FlatList
        horizontal
        data={series}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleShowDetails(item)}>
            <Image
              source={{ uri: `${IMAGE_BASE_URL}${item.poster_path}` }}
              style={styles.posterImage}
            />
          </TouchableOpacity>
        )}
        showsHorizontalScrollIndicator={false}
      />

      {/* 🔹 Modal de detalles */}
      {selectedSerie && (
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Image
                source={{ uri: `${IMAGE_BASE_URL}${selectedSerie.backdrop_path}` }}
                style={styles.modalImage}
              />
              <Text style={styles.modalTitle}>{selectedSerie.name}</Text>
              <Text style={styles.modalInfo}>
                ⭐ {selectedSerie.vote_average?.toFixed(1) || "N/A"} | 🗓 {selectedSerie.first_air_date || "Fecha no disponible"}
              </Text>
              <Text style={styles.modalOverview}>
                {selectedSerie.overview || "Sin descripción disponible."}
              </Text>
              <Text style={styles.modalOverview}>
                {selectedSerie.overview || "Sin descripción disponible."}
              </Text>

              <View style={styles.modalButtonsContainer}>
                {/* 🔹 Botón actualizado para usar el contexto global */}
                <Pressable
                  style={[styles.addButton, isInMyList(selectedSerie.id) && styles.addButtonActive]}
                  onPress={() => handleMyList(selectedSerie)}
                >
                  <Text style={styles.addButtonText}>
                    {isInMyList(selectedSerie.id) ? "Eliminar de mi lista" : "Agregar a mi lista"}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Cerrar</Text>
                </Pressable>
              </View>

              {trailerUrl && (
                <View style={styles.trailerContainer}>
                  <WebView
                    source={{ uri: trailerUrl }}
                    style={styles.trailer}
                    allowsFullscreenVideo
                  />
                </View>
              )}
            </ScrollView>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

export default SeriesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  bannerContainer: {
    width,
    height: 220,
  },
  bannerImage: {
    width,
    height: 220,
    resizeMode: "cover",
  },
  bannerOverlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  bannerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 10,
    marginTop: 15,
    marginBottom: 5,
  },
  posterImage: {
    width: 130,
    height: 190,
    marginHorizontal: 6,
    borderRadius: 6,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loaderText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
  },
  modalContent: {
    padding: 15,
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 10,
    textAlign: "center",
  },
  modalOverview: {
    color: "#ddd",
    fontSize: 14,
    textAlign: "justify",
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 15,
  },
  myListButton: {
    backgroundColor: "#E50914",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  closeButton: {
    backgroundColor: "#555",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  featuredButtonPlayText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 14,
  },

  // 🔹 Listas
  section: { marginBottom: 30 },
  sectionTitle: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 15,
    marginBottom: 10,
  },
  serieCard: { marginHorizontal: 8, width: 120 },
  serieImage: { width: 120, height: 180, borderRadius: 8 },
  serieTitle: { color: "#fff", fontSize: 12, textAlign: "center", marginTop: 5 },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: { backgroundColor: "#222", borderRadius: 10, padding: 20, alignItems: "center" },
  modalImage: { width: width - 80, height: 200, borderRadius: 10, marginBottom: 15 },
  modalTitle: { color: "#fff", fontSize: 24, fontWeight: "bold", marginBottom: 8, textAlign: "center" },
  modalInfo: { color: "#ccc", fontSize: 14, marginBottom: 10 },
  modalOverview: { color: "#ddd", fontSize: 14, lineHeight: 20, textAlign: "center" },
  modalButtonsContainer: { flexDirection: "row", justifyContent: "center", marginTop: 15, gap: 10 },
  addButton: { backgroundColor: "#e40a0aff", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  addButtonActive: { backgroundColor: "#393939ff" },
  addButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  trailerButton: { backgroundColor: "#E50914", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  trailerButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  modalCloseButton: {
    marginTop: 15,
    backgroundColor: "#E50914",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  modalCloseText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  trailerModalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  trailerContainer: {
    width: "100%",
    height: 200,
    marginTop: 10,
  },
  trailer: {
    flex: 1,
  },
});
