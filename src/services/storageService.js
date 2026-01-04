import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "./firebase";
import * as ImageManipulator from "expo-image-manipulator";

/**
 * Compress and resize image before upload
 * @param {string} uri - Local image URI
 * @returns {Promise<string>} - Compressed image URI
 */
export const compressImage = async (uri) => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }], // Max width 1200px
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch (error) {
    console.error("Error compressing image:", error);
    return uri; // Return original if compression fails
  }
};

/**
 * Upload a single image to Firebase Storage
 * @param {string} eventId - Event ID for folder structure
 * @param {string} imageUri - Local image URI
 * @param {number} index - Image index (0, 1, 2)
 * @returns {Promise<string>} - Download URL of uploaded image
 */
export const uploadEventImage = async (eventId, imageUri, index) => {
  try {
    console.log(`📤 Uploading image ${index} for event ${eventId}...`);

    // Compress image first
    const compressedUri = await compressImage(imageUri);

    // Convert URI to blob
    const response = await fetch(compressedUri);
    const blob = await response.blob();

    // Create storage reference
    const imageRef = ref(storage, `events/${eventId}/image_${index}.jpg`);

    // Upload blob
    await uploadBytes(imageRef, blob);

    // Get download URL
    const downloadURL = await getDownloadURL(imageRef);
    console.log(`✅ Image ${index} uploaded successfully`);

    return downloadURL;
  } catch (error) {
    console.error(`❌ Error uploading image ${index}:`, error);
    throw error;
  }
};

/**
 * Upload multiple images for an event
 * @param {string} eventId - Event ID
 * @param {string[]} imageUris - Array of local image URIs
 * @returns {Promise<string[]>} - Array of download URLs
 */
export const uploadEventImages = async (eventId, imageUris) => {
  try {
    console.log(
      `📤 Uploading ${imageUris.length} images for event ${eventId}...`
    );

    const uploadPromises = imageUris.map((uri, index) =>
      uploadEventImage(eventId, uri, index)
    );

    const downloadURLs = await Promise.all(uploadPromises);
    console.log(`✅ All ${downloadURLs.length} images uploaded successfully`);

    return downloadURLs;
  } catch (error) {
    console.error("❌ Error uploading images:", error);
    throw error;
  }
};

/**
 * Extract storage path from Firebase Storage URL
 * @param {string} url - Firebase Storage download URL
 * @returns {string|null} - Storage path or null if invalid
 */
const extractPathFromUrl = (url) => {
  try {
    // Firebase Storage URLs look like:
    // https://firebasestorage.googleapis.com/v0/b/BUCKET/o/PATH?alt=media&token=TOKEN
    // The path is URL-encoded after /o/

    const match = url.match(/\/o\/([^?]+)/);
    if (match && match[1]) {
      // Decode the URL-encoded path
      return decodeURIComponent(match[1]);
    }
    return null;
  } catch (error) {
    console.error("Error extracting path from URL:", error);
    return null;
  }
};

/**
 * Delete a single image from Firebase Storage
 * Can accept either (eventId, index) or just (url)
 * @param {string} eventIdOrUrl - Event ID or full Firebase Storage URL
 * @param {number} [index] - Image index (only if first param is eventId)
 */
export const deleteEventImage = async (eventIdOrUrl, index) => {
  try {
    let imageRef;

    // Check if first argument is a URL
    if (eventIdOrUrl.startsWith("http")) {
      // Extract path from URL
      const path = extractPathFromUrl(eventIdOrUrl);
      if (!path) {
        console.warn("⚠️ Could not extract path from URL:", eventIdOrUrl);
        return;
      }
      imageRef = ref(storage, path);
      console.log(`🗑️ Deleting image at path: ${path}`);
    } else {
      // Legacy mode: eventId + index
      imageRef = ref(storage, `events/${eventIdOrUrl}/image_${index}.jpg`);
      console.log(`🗑️ Deleting image ${index} for event ${eventIdOrUrl}`);
    }

    await deleteObject(imageRef);
    console.log(`✅ Image deleted successfully`);
  } catch (error) {
    // Ignore if file doesn't exist
    if (error.code === "storage/object-not-found") {
      console.log("📭 Image already deleted or doesn't exist");
    } else {
      console.error(`❌ Error deleting image:`, error.message);
    }
  }
};

/**
 * Delete all images for an event
 * @param {string} eventId - Event ID
 * @param {number} imageCount - Number of images to delete
 */
export const deleteAllEventImages = async (eventId, imageCount = 3) => {
  try {
    const deletePromises = [];
    for (let i = 0; i < imageCount; i++) {
      deletePromises.push(deleteEventImage(eventId, i));
    }
    await Promise.all(deletePromises);
    console.log(`🗑️ All images deleted for event ${eventId}`);
  } catch (error) {
    console.error("Error deleting all images:", error);
  }
};
