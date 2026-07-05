/**
 * recapService — post-event moments (Smart Wall §10 recaps).
 * A checked-in attendee shares a photo (uploading = explicit consent; the
 * copy on the button says it's shared with everyone who attended). The
 * onRecapPhotoCreated Cloud Function then creates/extends the AI-captioned
 * recap post on the Wall.
 */
import { collection, addDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getStorage } from "firebase/storage";
import { db, auth } from "./firebase";
import { compressImage } from "./storageService";

/** Whether I checked in to this event (recaps are attendee-verified). */
export async function hasMyCheckin(eventId) {
  const me = auth.currentUser?.uid;
  if (!me) return false;
  try {
    const snap = await getDoc(doc(db, "events", eventId, "checkins", me));
    return snap.exists();
  } catch {
    return false;
  }
}

/** Upload one moment and register it for the recap. */
export async function shareRecapPhoto(eventId, localUri) {
  const me = auth.currentUser?.uid;
  if (!me) throw new Error("Sign in required");
  const uri = await compressImage(localUri);
  const blob = await (await fetch(uri)).blob();
  const path = `recaps/${eventId}/${me}/${Date.now()}.jpg`;
  const storageRef = ref(getStorage(), path);
  await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
  const url = await getDownloadURL(storageRef);
  await addDoc(collection(db, "events", eventId, "recapPhotos"), {
    uid: me,
    url,
    createdAt: serverTimestamp(),
  });
  return url;
}
