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
 * Delete a single image from Firebase Storage
 * @param {string} eventId - Event ID
 * @param {number} index - Image index
 */
export const deleteEventImage = async (eventId, index) => {
  try {
    const imageRef = ref(storage, `events/${eventId}/image_${index}.jpg`);
    await deleteObject(imageRef);
    console.log(`🗑️ Image ${index} deleted for event ${eventId}`);
  } catch (error) {
    // Ignore if file doesn't exist
    if (error.code !== "storage/object-not-found") {
      console.error(`Error deleting image ${index}:`, error);
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
