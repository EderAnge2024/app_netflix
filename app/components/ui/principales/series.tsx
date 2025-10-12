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
      console.error("Error al obtener tráiler:", error);
      return null;
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
      {/* 🔹 Header Netflix */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setDropdownVisible(!dropdownVisible)}>
          <View style={styles.seriesMenuButton}>
            <Text style={styles.headerTitle}>
              {selectedGenre ? selectedGenre.name : "Series"} ▼
            </Text>
          </View>
        </TouchableOpacity>
      </View>

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

      <ScrollView>
        {/* 🎬 Serie destacada */}
        {featuredSerie && (
          <TouchableOpacity style={styles.featuredContainer} onPress={() => openModal(featuredSerie)}>
            <Image
              source={{
                uri: `${IMAGE_BASE_URL}${featuredSerie.backdrop_path || featuredSerie.poster_path}`,
              }}
              style={styles.featuredImage}
              resizeMode="cover"
            />

            <View style={styles.featuredInfoContainer}>
              <Text style={styles.featuredTitle}>{featuredSerie.name}</Text>
              <Text style={styles.featuredDetails}>
                ⭐ {featuredSerie.vote_average?.toFixed(1) || "N/A"}   |   🗓 {featuredSerie.first_air_date || "Sin fecha"}
              </Text>
              <Text style={styles.featuredOverview} numberOfLines={4}>
                {featuredSerie.overview || "Sin descripción disponible."}
              </Text>

              <View style={styles.featuredButtonsRow}>
                <Pressable style={styles.featuredButton} onPress={() => openModal(featuredSerie)}>
                  <Text style={styles.featuredButtonText}>Ver más</Text>
                </Pressable>
                <Pressable style={styles.featuredButtonPlay} onPress={() => openTrailer(featuredSerie.id)}>
                  <Text style={styles.featuredButtonPlayText}>▶ Reproducir</Text>
                </Pressable>
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
              keyExtractor={(item: MediaItem) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>
        ))}
      </ScrollView>

      {/* 🔹 Modal de información de serie */}
      <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackground}>
          {selectedSerie && (
            <View style={styles.modalContainer}>
              <Image
                source={{
                  uri: `${IMAGE_BASE_URL}${selectedSerie.backdrop_path || selectedSerie.poster_path}`,
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

                <Pressable style={styles.trailerButton} onPress={() => openTrailer(selectedSerie.id)}>
                  <Text style={styles.trailerButtonText}>▶ Ver tráiler</Text>
                </Pressable>
              </View>

              <Pressable style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseText}>Cerrar</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>

      {/* 🎥 Modal del tráiler */}
      <Modal visible={trailerVisible} animationType="slide" transparent onRequestClose={() => setTrailerVisible(false)}>
        <View style={styles.trailerModalBackground}>
          <View style={styles.trailerContainer}>
            {trailerKey ? (
              <WebView
                source={{ uri: `https://www.youtube.com/embed/${trailerKey}?autoplay=1` }}
                style={{ flex: 1, borderRadius: 10 }}
                allowsFullscreenVideo
              />
            ) : (
              <Text style={{ color: "#fff" }}>Cargando tráiler...</Text>
            )}
            <Pressable style={styles.trailerCloseButton} onPress={() => setTrailerVisible(false)}>
              <Text style={styles.trailerCloseText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#141414" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#fff", marginTop: 10 },

  header: {
    backgroundColor: "#141414",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 15,
    paddingVertical: 12,
    zIndex: 20,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  seriesMenuButton: { flexDirection: "row", alignItems: "center" },

  dropdownMenu: {
    position: "absolute",
    top: 50,
    left: 15,
    backgroundColor: "#1c1c1c",
    borderRadius: 6,
    paddingVertical: 5,
    width: 160,
    elevation: 20,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  dropdownItem: { paddingVertical: 8, paddingHorizontal: 12 },
  dropdownText: { color: "#ccc", fontSize: 15 },
  dropdownTextActive: { color: "#fff", fontWeight: "bold" },

  // 🔹 Banner tipo inicio
  featuredContainer: {
    width: "100%",
    height: 500,
    marginBottom: 20,
    position: "relative",
  },
  featuredImage: {
    width: "100%",
    height: "100%",
    borderRadius: 0,
  },
  featuredInfoContainer: {
    position: "absolute",
    bottom: 40,
    left: 25,
    right: 25,
  },
  featuredTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  featuredDetails: {
    color: "#ffcc00",
    fontSize: 14,
    marginBottom: 10,
  },
  featuredOverview: {
    color: "#fff",
    fontSize: 15,
    marginBottom: 15,
    lineHeight: 20,
  },
  featuredButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featuredButton: {
    backgroundColor: "#E50914",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  featuredButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  featuredButtonPlay: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
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
    fontSize: 18,
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
    width: width - 40,
    height: 250,
    backgroundColor: "#000",
    borderRadius: 10,
    overflow: "hidden",
  },
  trailerCloseButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#E50914",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  trailerCloseText: { color: "#fff", fontWeight: "bold" },
});