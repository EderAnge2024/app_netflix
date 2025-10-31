import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  Linking, // 🔹 CAMBIO: Añadido Linking
} from "react-native";
// import { WebView } from "react-native-webview"; // 🔹 CAMBIO: Eliminado WebView
import YoutubePlayer from "react-native-youtube-iframe"; // 🔹 CAMBIO: Importado YoutubePlayer
import { API_KEY, BASE_URL, IMAGE_BASE_URL } from "@/service/apiThemoviedb";
import { useMyList, MediaItem } from "@/components/ui/logeadoDatos/MyListContext";

const { width } = Dimensions.get("window");

// ... (Interfaces Genre, Video, SeriesByGenre - sin cambios) ...
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

const SeriesSection = () => {
  const { myList, addToMyList, removeFromMyList, isInMyList, loading: listLoading } = useMyList();

  // ... (Estados de genres, seriesByGenre, etc. - sin cambios) ...
  const [genres, setGenres] = useState<Genre[]>([]);
  const [seriesByGenre, setSeriesByGenre] = useState<SeriesByGenre>({});
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [featuredSerie, setFeaturedSerie] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedSerie, setSelectedSerie] = useState<MediaItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  // 🔹 CAMBIO: Estados del reproductor (copiados de HomeScreen)
  const [isTrailerLoading, setIsTrailerLoading] = useState(false);
  const [webviewError, setWebviewError] = useState(false);
  const [playing, setPlaying] = useState(false);

  // 🔹 CAMBIO: Eliminado trailerUrl (ya no se necesita)
  // const trailerUrl = useMemo(...)

  // --- API helpers ---
  // ... (fetchGenres, fetchSeriesByGenre, fetchTrailer - sin cambios) ...
  const fetchGenres = useCallback(async (): Promise<Genre[]> => {
    try {
      const res = await fetch(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}&language=es-ES`);
      const data = await res.json();
      return data.genres || [];
    } catch (error) {
      console.error("Error al obtener géneros:", error);
      return [];
    }
  }, []);

  const fetchSeriesByGenre = useCallback(async (genreId: number): Promise<MediaItem[]> => {
    try {
      const res = await fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&language=es-ES&with_genres=${genreId}`);
      const data = await res.json();
      return data.results || [];
    } catch (error) {
      console.error("Error al obtener series:", error);
      return [];
    }
  }, []);

  const fetchTrailer = useCallback(async (serieId: number): Promise<string | null> => {
    try {
      const res = await fetch(`${BASE_URL}/tv/${serieId}/videos?api_key=${API_KEY}&language=es-ES`);
      const data = await res.json();
      const trailer = (data.results || []).find((v: Video) => v.type === "Trailer" && v.site === "YouTube");
      return trailer ? trailer.key : null;
    } catch (error) {
      console.error("Error al obtener tráiler:", error);
      return null;
    }
  }, []);

  // --- Handlers ---

  // 🔹 CAMBIO: Añadido onStateChange (copiado de HomeScreen)
  const onStateChange = useCallback((state: string) => {
    if (state === "ended" || state === "paused") setPlaying(false);
    if (state === "playing") setPlaying(true);
    if (state === "error") setWebviewError(true);
  }, []);
  
  // ... (handleMyList - sin cambios) ...
  const handleMyList = useCallback(
    async (serie: MediaItem) => {
      const normalizedSerie: MediaItem = {
        id: serie.id,
        title: serie.name || serie.title || "Sin título",
        name: serie.name,
        poster_path: serie.poster_path || "",
        backdrop_path: serie.backdrop_path || "",
        overview: serie.overview || "Sin descripción disponible",
        vote_average: serie.vote_average || 0,
        release_date: serie.first_air_date || "",
      };

      try {
        if (isInMyList(serie.id)) {
          await removeFromMyList(normalizedSerie);
          Alert.alert("✅ Removido", `${normalizedSerie.name} se eliminó de tu lista.`);
        } else {
          await addToMyList(normalizedSerie);
          Alert.alert("✅ Agregado", `${normalizedSerie.name} se agregó a tu lista.`);
        }
      } catch (error) {
        console.error("Error al actualizar mi lista:", error);
        Alert.alert("❌ Error", "No se pudo actualizar tu lista.");
      }
    },
    [isInMyList, addToMyList, removeFromMyList]
  );

  // 🔹 CAMBIO: openModal actualizado (como en HomeScreen)
  const openModal = useCallback(
    async (serie: MediaItem) => {
      setWebviewError(false);
      setPlaying(false);
      setSelectedSerie(serie);
      setModalVisible(true);
      setIsTrailerLoading(true); // Iniciar carga
      const key = await fetchTrailer(serie.id);
      setTrailerKey(key);
      setIsTrailerLoading(false); // Finalizar carga
    },
    [fetchTrailer]
  );

  // 🔹 CAMBIO: Añadido closeModal (como en HomeScreen)
  const closeModal = () => {
    setModalVisible(false);
    setTrailerKey(null);
    setPlaying(false);
  };

  // ... (useEffect de carga de datos y featuredSerie - sin cambios) ...
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const loadedGenres = await fetchGenres();
        setGenres(loadedGenres);
        if (loadedGenres.length === 0) return;

        const results = await Promise.all(
          loadedGenres.map(async (g) => {
            const s = await fetchSeriesByGenre(g.id);
            return { name: g.name, series: s };
          })
        );

        const map: SeriesByGenre = {};
        results.forEach((r) => {
          map[r.name] = r.series;
        });
        setSeriesByGenre(map);

        setSelectedGenre(loadedGenres[0]);
        setFeaturedSerie(map[loadedGenres[0].name]?.[0] || null);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchGenres, fetchSeriesByGenre]);

  useEffect(() => {
    if (selectedGenre && seriesByGenre[selectedGenre.name]?.length > 0) {
      setFeaturedSerie(seriesByGenre[selectedGenre.name][0]);
    }
  }, [selectedGenre, seriesByGenre]);

  // ... (renderSerie, loading, orderedGenres - sin cambios) ...
  const renderSerie = ({ item }: { item: MediaItem }) => (
    <TouchableOpacity style={styles.serieCard} onPress={() => openModal(item)}>
      <Image
        source={{
          uri: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : "https://via.placeholder.com/120x180.png?text=Sin+Imagen",
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

  const orderedGenres = selectedGenre
    ? [selectedGenre.name, ...Object.keys(seriesByGenre).filter((g) => g !== selectedGenre.name)]
    : Object.keys(seriesByGenre);

  // ... (JSX de la pantalla principal: Header, Dropdown, ScrollView - sin cambios) ...
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setDropdownVisible((v) => !v)}>
          <Text style={styles.headerTitle}>{selectedGenre?.name || "Series"} ▼</Text>
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
                setFeaturedSerie(seriesByGenre[genre.name]?.[0] || null);
              }}
            >
              <Text style={[styles.dropdownText, selectedGenre?.id === genre.id && styles.dropdownTextActive]}>
                {genre.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView>
        {featuredSerie && (
          <View style={styles.featuredContainer}>
            <Image
              source={{ uri: `${IMAGE_BASE_URL}${featuredSerie.backdrop_path || featuredSerie.poster_path}` }}
              style={styles.featuredImage}
              resizeMode="cover"
            />
            <View style={styles.featuredInfoContainer}>
              <Text style={styles.featuredTitle}>{featuredSerie.name}</Text>
              <Text style={styles.featuredDetails}>
                ⭐ {featuredSerie.vote_average?.toFixed(1) || "N/A"}   |   🗓️ {featuredSerie.first_air_date || "Sin fecha"}
              </Text>
              <Text style={styles.featuredOverview} numberOfLines={4}>
                {featuredSerie.overview || "Sin descripción disponible."}
              </Text>

              <View style={styles.featuredButtonsRow}>
                <Pressable style={styles.featuredButton} onPress={() => openModal(featuredSerie)}>
                  <Text style={styles.featuredButtonText}>Ver más</Text>
                </Pressable>
                <Pressable style={styles.featuredButtonPlay} onPress={() => openModal(featuredSerie)}>
                  <Text style={styles.featuredButtonPlayText}>▶ Reproducir</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

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

      {/* 🔹 CAMBIO: Modal completamente reemplazado con la lógica de HomeScreen */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={closeModal} // Usar la nueva función de cierre
      >
        <View style={styles.modalBackground}>
          {selectedSerie && (
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>{selectedSerie.name}</Text>

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
                      uri: `${IMAGE_BASE_URL}${selectedSerie.backdrop_path || selectedSerie.poster_path}`
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
                      style={styles.youtubeButton} // Estilo nuevo
                    >
                      <Text style={styles.youtubeButtonText}>Abrir en YouTube</Text>
                    </Pressable>
                  )}
                </View>
              )}

              <Text style={styles.modalInfo}>
                ⭐ {selectedSerie.vote_average?.toFixed(1) || "N/A"}   |   🗓️ {selectedSerie.first_air_date || "Fecha no disponible"}
              </Text>
              <Text style={styles.modalOverview}>{selectedSerie.overview || "Sin descripción disponible."}</Text>

              <View style={styles.modalButtonsContainer}>
                <Pressable
                  style={[styles.addButton, isInMyList(selectedSerie.id) && styles.addButtonActive]}
                  onPress={() => handleMyList(selectedSerie)}
                >
                  <Text style={styles.addButtonText}>
                    {isInMyList(selectedSerie.id) ? "Eliminar de mi lista" : "Agregar a mi lista"}
                  </Text>
                </Pressable>
              </View>

              <Pressable
                style={styles.modalCloseButton}
                onPress={closeModal} // Usar la nueva función de cierre
              >
                <Text style={styles.modalCloseText}>Cerrar</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // ... (Estilos container, loader, header, dropdown, featured, section, serieCard - sin cambios) ...
  container: { flex: 1, backgroundColor: "#141414" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { color: "#fff", marginTop: 10 },
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
  dropdownMenu: {
    position: "absolute",
    top: 50,
    left: 15,
    backgroundColor: "#1c1c1c",
    borderRadius: 6,
    width: 160,
    zIndex: 30,
  },
  dropdownItem: { paddingVertical: 8, paddingHorizontal: 12 },
  dropdownText: { color: "#ccc", fontSize: 15 },
  dropdownTextActive: { color: "#fff", fontWeight: "bold" },
  featuredContainer: { width: "100%", height: 500, marginBottom: 20, position: "relative" },
  featuredImage: { width: "100%", height: "100%", borderRadius: 0 },
  featuredInfoContainer: { position: "absolute", bottom: 40, left: 25, right: 25 },
  featuredTitle: { color: "#fff", fontSize: 28, fontWeight: "bold", marginBottom: 8 },
  featuredDetails: { color: "#ffcc00", fontSize: 14, marginBottom: 10 },
  featuredOverview: { color: "#fff", fontSize: 15, marginBottom: 15, lineHeight: 20 },
  featuredButtonsRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featuredButton: { backgroundColor: "#E50914", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5 },
  featuredButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  featuredButtonPlay: { backgroundColor: "#fff", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5 },
  featuredButtonPlayText: { color: "#000", fontWeight: "bold", fontSize: 14 },
  section: { marginBottom: 30 },
  sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "bold", marginLeft: 15, marginBottom: 10 },
  serieCard: { marginHorizontal: 8, width: 120 },
  serieImage: { width: 120, height: 180, borderRadius: 8 },
  serieTitle: { color: "#fff", fontSize: 12, textAlign: "center", marginTop: 5 },

  // --- 🔹 CAMBIOS EN ESTILOS DEL MODAL ---
  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", padding: 20 },
  modalContainer: { backgroundColor: "#222", borderRadius: 10, padding: 20, alignItems: "center" },
  
  // 🔹 CAMBIO: Añadido trailerContainer (copiado de HomeScreen)
  trailerContainer: {
    width: width - 80, // Ancho consistente
    height: 220, // Alto consistente
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 15,
    backgroundColor: '#000', // Fondo mientras carga
    position: 'relative', // Para el botón de fallback
  },

  // 🔹 CAMBIO: Añadido fallbackImage (copiado de HomeScreen)
  fallbackImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },

  // 🔹 CAMBIO: Eliminado modalImage (reemplazado por trailerContainer/fallbackImage)
  // modalImage: { width: width - 80, height: 200, borderRadius: 10, marginBottom: 15 }, 

  modalTitle: { color: "#fff", fontSize: 24, fontWeight: "bold", marginBottom: 8, textAlign: "center" },
  modalInfo: { color: "#ccc", fontSize: 14, marginBottom: 10 },
  modalOverview: { color: "#ddd", fontSize: 14, textAlign: "center" },
  modalButtonsContainer: { flexDirection: "row", justifyContent: "center", marginTop: 15, gap: 10 },
  addButton: { backgroundColor: "#e40a0aff", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  addButtonActive: { backgroundColor: "#393939ff" },
  addButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  
  modalCloseButton: { marginTop: 15, backgroundColor: "#E50914", paddingVertical: 10, paddingHorizontal: 25, borderRadius: 8 },
  modalCloseText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  // 🔹 CAMBIO: Estilos añadidos para el botón de fallback (como en HomeScreen)
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

export default SeriesSection;