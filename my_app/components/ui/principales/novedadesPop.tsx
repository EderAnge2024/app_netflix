import React, { useEffect, useState, useCallback, JSX } from "react"; // 🔹 CAMBIO: Añadido useCallback
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Pressable,
  Alert,
  Linking, // 🔹 CAMBIO: Añadido Linking
} from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import { API_KEY, BASE_URL, IMAGE_BASE_URL } from "@/service/apiThemoviedb";
import { useMyList, MediaItem } from "@/components/ui/logeadoDatos/MyListContext";

const { width, height } = Dimensions.get("window");

// ... (Interfaces - sin cambios) ...
interface Video {
  id: string;
  key: string;
  name: string;
  type: string;
  site: string;
}
interface ApiResponse<T> {
  results: T[];
}
interface MovieOrSeries extends MediaItem {
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  backdrop_path?: string;
  poster_path?: string;
  vote_average?: number;
  overview?: string;
}
interface RenderItemProps {
  item: MovieOrSeries;
}

// 🔹 CAMBIO: Props de Section actualizadas (se quita lo relativo al tráiler)
interface SectionProps {
  title: string;
  data: MovieOrSeries[];
  onItemPress: (item: MovieOrSeries) => void;
}
interface FeaturedSectionProps {
  item: MovieOrSeries;
  onItemPress: (item: MovieOrSeries) => void;
}

// 🔹 CAMBIO: Props de DetailModal actualizadas
interface DetailModalProps {
  visible: boolean;
  item: MovieOrSeries | null;
  trailerKey: string | null;
  isInMyList: (id: number) => boolean;
  onClose: () => void;
  onMyListPress: (item: MovieOrSeries) => void;
  // Nuevos props para el reproductor
  isTrailerLoading: boolean;
  webviewError: boolean;
  playing: boolean;
  onStateChange: (state: string) => void;
}

// 🔹 CAMBIO: Interfaz TrailerModalProps eliminada

// Componente principal
export default function NovedadesPopulares(): JSX.Element {
  const { addToMyList, removeFromMyList, isInMyList, loading: listLoading } = useMyList();

  const [trending, setTrending] = useState<MovieOrSeries[]>([]);
  const [popularMovies, setPopularMovies] = useState<MovieOrSeries[]>([]);
  const [popularSeries, setPopularSeries] = useState<MovieOrSeries[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal detalle
  const [selectedItem, setSelectedItem] = useState<MovieOrSeries | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  // 🔹 CAMBIO: Estados del reproductor (reemplazan a trailerVisible)
  const [isTrailerLoading, setIsTrailerLoading] = useState(false);
  const [webviewError, setWebviewError] = useState(false);
  const [playing, setPlaying] = useState(false);

  // 🔹 CAMBIO: Eliminado estado trailerVisible
  // const [trailerVisible, setTrailerVisible] = useState<boolean>(false);

  // ... (useEffect fetchData - sin cambios) ...
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const [trendingRes, moviesRes, seriesRes] = await Promise.all([
          fetch(`${BASE_URL}/trending/all/day?api_key=${API_KEY}&language=es-ES`),
          fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=es-ES&page=1`),
          fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=es-ES&page=1`),
        ]);

        const trendingData: ApiResponse<MovieOrSeries> = await trendingRes.json();
        const moviesData: ApiResponse<MovieOrSeries> = await moviesRes.json();
        const seriesData: ApiResponse<MovieOrSeries> = await seriesRes.json();

        setTrending(trendingData.results || []);
        setPopularMovies(moviesData.results || []);
        setPopularSeries(seriesData.results || []);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 🔹 CAMBIO: Añadido onStateChange
  const onStateChange = useCallback((state: string) => {
    if (state === "ended" || state === "paused") setPlaying(false);
    if (state === "playing") setPlaying(true);
    if (state === "error") setWebviewError(true);
  }, []);
  
  // ... (handleMyList - sin cambios) ...
  const handleMyList = async (item: MovieOrSeries): Promise<void> => {
    try {
      if (isInMyList(item.id)) {
        await removeFromMyList(item);
        Alert.alert("✅ Removido", `${item.title || item.name} se eliminó de tu lista.`);
      } else {
        await addToMyList(item);
        Alert.alert("✅ Agregado", `${item.title || item.name} se agregó a tu lista.`);
      }
    } catch (error) {
      console.error("Error al actualizar mi lista:", error);
      Alert.alert("❌ Error", "No se pudo actualizar tu lista.");
    }
  };

  // 🔹 CAMBIO: openModal actualizado (como en HomeScreen)
  const openModal = async (item: MovieOrSeries): Promise<void> => {
    setWebviewError(false);
    setPlaying(false);
    setSelectedItem(item);
    setModalVisible(true);
    setIsTrailerLoading(true); // Iniciar carga

    try {
      const type = item.title ? "movie" : "tv";
      const res = await fetch(`${BASE_URL}/${type}/${item.id}/videos?api_key=${API_KEY}&language=es-ES`);
      const data: ApiResponse<Video> = await res.json();
      const trailer = data.results.find(
        (vid: Video) => vid.type === "Trailer" && vid.site === "YouTube"
      );
      setTrailerKey(trailer ? trailer.key : null);
    } catch (err) {
      console.log("Error cargando trailer:", err);
      setTrailerKey(null);
    } finally {
      setIsTrailerLoading(false); // Finalizar carga
    }
  };

  // 🔹 CAMBIO: closeModal actualizado
  const closeModal = (): void => {
    setModalVisible(false);
    setSelectedItem(null);
    setTrailerKey(null);
    setPlaying(false); // Añadido
  };

  // 🔹 CAMBIO: Eliminadas openTrailerModal y closeTrailerModal
  // const openTrailerModal = (): void => { ... };
  // const closeTrailerModal = (): void => setTrailerVisible(false);

  // 🔹 CAMBIO: Eliminado renderItem (ya que Section define el suyo)

  if (loading || listLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Cargando novedades...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#141414" }}>
      <ScrollView style={{ flex: 1 }}>
        {/* Portada destacada */}
        {trending[0] && (
          <FeaturedSection item={trending[0]} onItemPress={openModal} />
        )}

        {/* 🔹 CAMBIO: Secciones actualizadas (sin props de tráiler) */}
        <Section 
          title="Tendencias del Día" 
          data={trending} 
          onItemPress={openModal}
        />

        <Section 
          title="Películas Populares" 
          data={popularMovies} 
          onItemPress={openModal}
        />

        <Section 
          title="Series Populares" 
          data={popularSeries} 
          onItemPress={openModal}
        />
      </ScrollView>

      {/* 🔹 CAMBIO: Modal Detalle actualizado (con nuevos props) */}
      <DetailModal
        visible={modalVisible}
        item={selectedItem}
        trailerKey={trailerKey}
        isInMyList={isInMyList}
        onClose={closeModal}
        onMyListPress={handleMyList}
        // Nuevos props
        isTrailerLoading={isTrailerLoading}
        webviewError={webviewError}
        playing={playing}
        onStateChange={onStateChange}
      />

      {/* 🔹 CAMBIO: TrailerModal eliminado */}
    </View>
  );
}

// ... (Componente FeaturedSection - sin cambios) ...
const FeaturedSection: React.FC<FeaturedSectionProps> = ({ item, onItemPress }) => (
  <View style={styles.featuredContainer}>
    {item.backdrop_path && (
      <Image
        source={{ uri: `${IMAGE_BASE_URL}${item.backdrop_path}` }}
        style={styles.featuredImage}
        resizeMode="cover"
      />
    )}
    <View style={styles.overlay}>
      <Text style={styles.featuredTitle}>{item.title || item.name}</Text>
      <Text style={styles.featuredOverview} numberOfLines={3}>
        {item.overview}
      </Text>
      <Text style={{ color: "#ffcc00", marginBottom: 5 }}>
        ⭐ {item.vote_average?.toFixed(1) || "N/A"} | 🗓 {item.release_date || item.first_air_date || "N/A"}
      </Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable style={styles.featuredButton} onPress={() => onItemPress(item)}>
          <Text style={styles.featuredButtonText}>Ver Más</Text>
        </Pressable>
        <Pressable style={styles.featuredButtonPlay} onPress={() => onItemPress(item)}>
          <Text style={styles.featuredButtonPlayText}>▶ Reproducir</Text>
        </Pressable>
      </View>
    </View>
  </View>
);


// 🔹 CAMBIO: Componente Section actualizado
const Section: React.FC<SectionProps> = ({ title, data, onItemPress }) => {
  // 🔹 CAMBIO: renderSectionItem modificado (botón de play eliminado)
  const renderSectionItem = ({ item }: RenderItemProps): JSX.Element => (
    <TouchableOpacity style={styles.card} onPress={() => onItemPress(item)}>
      {item.poster_path && (
        <Image 
          source={{ uri: `${IMAGE_BASE_URL}${item.poster_path}` }} 
          style={styles.poster} 
        />
      )}
      <Text style={styles.cardTitle} numberOfLines={1}>
        {item.title || item.name}
      </Text>
      <Text style={styles.cardSubtitle}>
        ⭐ {item.vote_average?.toFixed(1) || "N/A"} | 🗓 {item.release_date || item.first_air_date || "N/A"}
      </Text>
      {/* Botón de Play eliminado de la tarjeta */}
    </TouchableOpacity>
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        data={data}
        renderItem={renderSectionItem}
        keyExtractor={(item: MovieOrSeries) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

// 🔹 CAMBIO: Componente DetailModal actualizado (lógica de player integrada)
const DetailModal: React.FC<DetailModalProps> = ({
  visible,
  item,
  trailerKey,
  isInMyList,
  onClose,
  onMyListPress,
  // Nuevos props
  isTrailerLoading,
  webviewError,
  playing,
  onStateChange,
}) => (
  <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <View style={styles.modalBackground}>
      {item && (
        <View style={styles.modalContainer}>
          
          {/* --- INICIO LÓGICA DEL REPRODUCTOR --- */}
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
                  uri: `${IMAGE_BASE_URL}${item.backdrop_path || item.poster_path}`
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
          {/* --- FIN LÓGICA DEL REPRODUCTOR --- */}

          <Text style={styles.modalTitle}>{item.title || item.name}</Text>
          <Text style={styles.modalInfo}>
            ⭐ {item.vote_average?.toFixed(1) || "N/A"} | 🗓 {item.release_date || item.first_air_date || "N/A"}
          </Text>
          <Text style={styles.modalOverview}>
            {item.overview || "Sin descripción disponible."}
          </Text>

          <View style={styles.modalButtonsContainer}>
            <Pressable
              style={[styles.myListButton, isInMyList(item.id) && styles.myListButtonActive]}
              onPress={() => onMyListPress(item)}
            >
              <Text style={styles.myListButtonText}>
                {isInMyList(item.id) ? "Eliminar de Mi Lista" : "Agregar a Mi Lista"}
              </Text>
            </Pressable>
            {/* Botón de Tráiler eliminado */}
          </View>

          <Pressable style={styles.modalCloseButton} onPress={onClose}>
            <Text style={styles.modalCloseText}>Cerrar</Text>
          </Pressable>
        </View>
      )}
    </View>
  </Modal>
);

// 🔹 CAMBIO: Componente TrailerModal eliminado

const styles = StyleSheet.create({
  section: { marginBottom: 25 },
  sectionTitle: { color: "#fff", fontSize: 20, fontWeight: "700", marginLeft: 15, marginBottom: 10 },

  card: { width: 120, marginRight: 10 },
  poster: { width: 120, height: 180, borderRadius: 10 },
  cardTitle: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  cardSubtitle: { color: "#ffcc00", fontSize: 10 },
  // 🔹 CAMBIO: Eliminados estilos playButtonCard
  // playButtonCard: { ... },
  // playButtonCardText: { ... },

  // ... (Estilos featured - sin cambios) ...
  featuredContainer: { width: "100%", height: 250, marginBottom: 20 },
  featuredImage: { width: "100%", height: "100%" },
  overlay: { position: "absolute", bottom: 10, left: 15, right: 15 },
  featuredTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 5 },
  featuredOverview: { color: "#fff", fontSize: 12, marginBottom: 10 },
  featuredButton: { backgroundColor: "#E50914", padding: 8, borderRadius: 5 },
  featuredButtonText: { color: "#fff", fontWeight: "bold" },
  featuredButtonPlay: { backgroundColor: "#fff", padding: 8, borderRadius: 5 },
  featuredButtonPlayText: { color: "#000", fontWeight: "bold" },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#141414" },
  loadingText: { color: "#fff", marginTop: 10 },

  // --- 🔹 CAMBIOS EN ESTILOS DEL MODAL ---
  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", padding: 20 },
  modalContainer: { backgroundColor: "#222", borderRadius: 10, padding: 20, alignItems: "center" },
  
  // 🔹 CAMBIO: Eliminado modalImage
  // modalImage: { width: width - 80, height: 200, borderRadius: 10, marginBottom: 15 },
  
  modalTitle: { color: "#fff", fontSize: 24, fontWeight: "bold", marginBottom: 8, textAlign: "center" },
  modalInfo: { color: "#ccc", fontSize: 14, marginBottom: 10 },
  modalOverview: { color: "#ddd", fontSize: 14, lineHeight: 20, textAlign: "center" },
  
  // 🔹 CAMBIO: Contenedor de botones ajustado
  modalButtonsContainer: { 
    flexDirection: "row", 
    width: "100%", 
    marginTop: 15, 
    // gap y justifyContent eliminados
  },
  myListButton: { 
    flex: 1, // Botón ocupa todo el ancho
    backgroundColor: "#E50914", 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: "center" 
  },
  myListButtonActive: { backgroundColor: "#2d2d2dff" },
  myListButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  
  // 🔹 CAMBIO: Eliminados estilos trailerButton
  // trailerButton: { ... },
  // trailerButtonText: { ... },

  modalCloseButton: { marginTop: 10, backgroundColor: "#E50914", paddingVertical: 10, paddingHorizontal: 25, borderRadius: 8, width: '100%', alignItems: 'center' }, // 🔹 CAMBIO: Ancho 100%
  modalCloseText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  // 🔹 CAMBIO: Eliminados estilos del modal de tráiler
  // trailerModalBackground: { ... },
  // trailerContainer: (old) { ... },
  // trailerCloseButton: { ... },
  // trailerCloseText: { ... },

  // 🔹 CAMBIO: Añadidos estilos del reproductor (copiados de HomeScreen)
  trailerContainer: {
    width: width - 80, // Ancho consistente
    height: 220, // Alto consistente
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 15,
    backgroundColor: '#000', // Fondo mientras carga
    position: 'relative', // Para el botón de fallback
  },
  fallbackImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
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