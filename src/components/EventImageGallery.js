import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { X, ChevronLeft, ChevronRight } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GALLERY_HEIGHT = 220;

export default function EventImageGallery({ images }) {
  const { colors, isDark } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);

  // Return null if no images - prevents rendering issues
  if (!images || !Array.isArray(images) || images.length === 0) {
    return null;
  }

  // Filter out any invalid image URLs
  const validImages = images.filter(
    (uri) => uri && typeof uri === "string" && uri.length > 0
  );

  if (validImages.length === 0) {
    return null;
  }

  const handleScroll = (event) => {
    const slideIndex = Math.round(
      event.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 48)
    );
    setActiveIndex(slideIndex);
  };

  const openFullscreen = (index) => {
    setFullscreenIndex(index);
    setFullscreenVisible(true);
  };

  const goToPrevious = () => {
    setFullscreenIndex((prev) =>
      prev > 0 ? prev - 1 : validImages.length - 1
    );
  };

  const goToNext = () => {
    setFullscreenIndex((prev) =>
      prev < validImages.length - 1 ? prev + 1 : 0
    );
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {/* Main Gallery */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={SCREEN_WIDTH - 48}
        decelerationRate="fast"
      >
        {validImages.map((uri, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.9}
            onPress={() => openFullscreen(index)}
          >
            <Image source={{ uri }} style={styles.image} resizeMode="cover" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      {validImages.length > 1 && (
        <View style={styles.pagination}>
          {validImages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === activeIndex ? colors.primary : `${colors.text}40`,
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* Image Counter */}
      <View style={[styles.counter, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
        <Text style={styles.counterText}>
          {activeIndex + 1}/{validImages.length}
        </Text>
      </View>

      {/* Fullscreen Modal */}
      <Modal
        visible={fullscreenVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenVisible(false)}
      >
        <View style={styles.fullscreenContainer}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setFullscreenVisible(false)}
          >
            <X size={28} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>

          {/* Fullscreen Image */}
          <Image
            source={{ uri: validImages[fullscreenIndex] }}
            style={styles.fullscreenImage}
            resizeMode="contain"
          />

          {/* Navigation Arrows */}
          {validImages.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.navButton, styles.navLeft]}
                onPress={goToPrevious}
              >
                <ChevronLeft size={32} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButton, styles.navRight]}
                onPress={goToNext}
              >
                <ChevronRight size={32} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            </>
          )}

          {/* Fullscreen Counter */}
          <View style={styles.fullscreenCounter}>
            <Text style={styles.fullscreenCounterText}>
              {fullscreenIndex + 1} / {validImages.length}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      marginBottom: 24,
      position: "relative",
    },
    scrollContent: {
      gap: 12,
    },
    image: {
      width: SCREEN_WIDTH - 48,
      height: GALLERY_HEIGHT,
      borderRadius: 16,
    },
    pagination: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 12,
      gap: 8,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    counter: {
      position: "absolute",
      top: 12,
      right: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    counterText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "600",
    },
    fullscreenContainer: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.95)",
      justifyContent: "center",
      alignItems: "center",
    },
    closeButton: {
      position: "absolute",
      top: 60,
      right: 20,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "rgba(255,255,255,0.2)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
    },
    fullscreenImage: {
      width: SCREEN_WIDTH,
      height: SCREEN_WIDTH * 0.6,
    },
    navButton: {
      position: "absolute",
      top: "50%",
      marginTop: -25,
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: "rgba(255,255,255,0.2)",
      justifyContent: "center",
      alignItems: "center",
    },
    navLeft: {
      left: 16,
    },
    navRight: {
      right: 16,
    },
    fullscreenCounter: {
      position: "absolute",
      bottom: 60,
      backgroundColor: "rgba(0,0,0,0.6)",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    fullscreenCounterText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "600",
    },
  });
}
