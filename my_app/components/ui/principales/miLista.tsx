// components/ui/principales/MiLista.tsx
import React, { JSX, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import { WebView } from "react-native-webview";
import { useMyList } from "@/components/ui/logeadoDatos/MyListContext";
import { API_KEY, BASE_URL, IMAGE_BASE_URL } from "@/service/apiThemoviedb"; // usar constantes centralizadas

interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  media_type?: "movie" | "tv";
}

interface MyListContextType {
  myList: MediaItem[];
  removeFromMyList: (item: MediaItem) => void;
  loading: boolean;
}

export default function MiLista(): JSX.Element {
  const { myList, removeFromMyList, loading } = useMyList() as MyListContextType;

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  // 🔹 Obtener tráiler real desde TMDB
  const obtenerTrailerReal = async (item: MediaItem) => {
    if (!item?.id) return null;
    setLoadingVideo(true);
    try {
      const tipo = item.media_type ? item.media_type : item.title ? "movie" : "tv";
      const res = await fetch(
        `${BASE_URL}/${tipo}/${item.id}/videos?api_key=${API_KEY}&language=es-ES`
      );
      const data = await res.json();
      const trailer = data?.results?.find(
        (v: any) => v?.type === "Trailer" && v?.site === "YouTube"
      );
      return trailer ? trailer.key : null;
    } catch (error) {
      console.error("Error buscando tráiler:", error);
      return null;
    } finally {
      setLoadingVideo(false);
    }
  };

  const openModal = async (item: MediaItem) => {
    setSelectedItem(item);
    setShowVideo(false);
    setVideoId(null);
    const id = await obtenerTrailerReal(item);
    setVideoId(id);
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: MediaItem }) => (
    <View style={styles.item}>
      {item.poster_path ? (
        <Image
          source={{ uri: `${IMAGE_BASE_URL}${item.poster_path}` }}
          style={styles.poster}
        />
      ) : (
        <View style={[styles.poster, styles.posterPlaceholder]}>
          <Text style={styles.posterPlaceholderText}>No imagen</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.title}>{item.title || item.name}</Text>
        <View style={styles.itemButtonsRow}>
          <TouchableOpacity onPress={() => openModal(item)} style={styles.btnSmall}>
            <Text style={styles.trailerText}>Ver Info / Tráiler</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => removeFromMyList(item)} style={styles.btnSmall}>
            <Text style={styles.remove}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Mi Lista</Text>
        <Text style={styles.message}>Cargando tu lista...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mi Lista</Text>
      {myList.length === 0 ? (
        <Text style={styles.message}>No tienes videos en tu lista.</Text>
      ) : (
        <FlatList
          data={myList}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setModalVisible(false);
          setShowVideo(false);
        }}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setModalVisible(false);
                setShowVideo(false);
              }}
            >
              <Text style={{ color: "#fff", fontSize: 24 }}>✕</Text>
            </TouchableOpacity>

            {selectedItem && (
              <>
                {selectedItem.poster_path ? (
                  <Image
                    source={{ uri: `${IMAGE_BASE_URL}${selectedItem.poster_path}` }}
                    style={styles.modalPoster}
                  />
                ) : null}

                <Text style={styles.modalTitle}>
                  {selectedItem.title || selectedItem.name}
                </Text>
                <Text style={styles.modalInfo}>
                  ⭐ {selectedItem.vote_average != null ? selectedItem.vote_average.toFixed(1) : "N/A"}
                </Text>
                <Text style={styles.modalDescription}>
                  {selectedItem.overview || "Sin descripción disponible."}
                </Text>

                {!showVideo ? (
                  <TouchableOpacity
                    style={styles.trailerButton}
                    onPress={() => setShowVideo(true)}
                  >
                    <Text style={styles.trailerText}>Ver Tráiler</Text>
                  </TouchableOpacity>
                ) : loadingVideo ? (
                  <ActivityIndicator size="large" color="#E50914" />
                ) : videoId ? (
                  Platform.OS !== "web" ? (
                    <YoutubePlayer height={250} play={true} videoId={videoId} />
                  ) : (
                    <WebView
                      style={{ width: "100%", height: 250 }}
                      source={{ uri: `https://www.youtube.com/embed/${videoId}` }}
                    />
                  )
                ) : (
                  <Text style={styles.noTrailer}>
                    {`No se encontró un tráiler para "${selectedItem?.title || selectedItem?.name}" 😕`}
                  </Text>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// 🎨 Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#141414",
    paddingHorizontal: 15,
    paddingTop: 50,
  },
  header: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  message: {
    color: "#ccc",
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  item: {
    flexDirection: "row",
    marginBottom: 15,
    alignItems: "center",
    backgroundColor: "#1c1c1c",
    borderRadius: 10,
    padding: 10,
  },
  poster: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 15,
    resizeMode: "cover",
  },
  posterPlaceholder: {
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  posterPlaceholderText: {
    color: "#999",
    fontSize: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  remove: {
    color: "#E50914",
    fontSize: 14,
    fontWeight: "bold",
  },
  trailerText: {
    color: "#69b6a7",
    fontSize: 14,
    fontWeight: "bold",
  },
  itemButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  btnSmall: {
    marginRight: 12,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    borderRadius: 12,
    backgroundColor: "#000",
    padding: 20,
    alignItems: "center",
  },
  modalPoster: {
    width: 200,
    height: 300,
    borderRadius: 10,
    marginBottom: 10,
  },
  closeButton: {
    alignSelf: "flex-end",
    marginBottom: 10,
  },
  modalTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 5 },
  modalInfo: { color: "#ffd700", fontSize: 16, marginBottom: 10 },
  modalDescription: { color: "#ccc", fontSize: 14, textAlign: "center", marginBottom: 15 },
  trailerButton: {
    backgroundColor: "#E50914",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
  },
  noTrailer: { color: "#ccc", fontSize: 16, marginTop: 20, textAlign: "center" },
});
