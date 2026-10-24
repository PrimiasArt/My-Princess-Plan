import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';
import { CoupleRoomData, FirebaseConfigInput } from '../types/plan';
import { createInitialCoupleRoom } from '../data/stickers';

const STORAGE_PREFIX = 'princess_plan_room_';
const FIREBASE_CONFIG_STORAGE_KEY = 'princess_plan_firebase_config';
const ACTIVE_PIN_STORAGE_KEY = 'princess_plan_active_pin';

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let activeUnsubscribe: Unsubscribe | null = null;
let broadcastChannel: BroadcastChannel | null = null;

export function getSavedRoomPin(): string {
  if (typeof window === 'undefined') return 'CONGCHUA';
  const params = new URLSearchParams(window.location.search);
  const urlPin = params.get('pin');
  if (urlPin && urlPin.trim()) {
    const cleanPin = urlPin.trim().toUpperCase();
    localStorage.setItem(ACTIVE_PIN_STORAGE_KEY, cleanPin);
    return cleanPin;
  }
  return localStorage.getItem(ACTIVE_PIN_STORAGE_KEY) || 'CONGCHUA';
}

export function setSavedRoomPin(pin: string): void {
  const cleanPin = pin.trim().toUpperCase() || 'CONGCHUA';
  localStorage.setItem(ACTIVE_PIN_STORAGE_KEY, cleanPin);
}

export function getEffectiveFirebaseConfig(): FirebaseConfigInput | null {
  // 1. Check Vite env variables
  const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const envAppId = import.meta.env.VITE_FIREBASE_APP_ID;

  if (envApiKey && envProjectId && envAppId) {
    return {
      apiKey: envApiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${envProjectId}.firebaseapp.com`,
      projectId: envProjectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${envProjectId}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: envAppId,
    };
  }

  // 2. Check custom config saved via UI modal
  try {
    const raw = localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FirebaseConfigInput;
    if (parsed.apiKey && parsed.projectId && parsed.appId) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

export function saveCustomFirebaseConfig(config: FirebaseConfigInput | null): void {
  if (!config) {
    localStorage.removeItem(FIREBASE_CONFIG_STORAGE_KEY);
    firestoreDb = null;
    firebaseApp = null;
    return;
  }
  localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(config));
  firestoreDb = null;
  firebaseApp = null;
}

function getFirestoreInstance(): Firestore | null {
  if (firestoreDb) return firestoreDb;
  const config = getEffectiveFirebaseConfig();
  if (!config) return null;

  try {
    const existingApps = getApps();
    firebaseApp = existingApps.length > 0 ? existingApps[0] : initializeApp(config);
    firestoreDb = getFirestore(firebaseApp);
    return firestoreDb;
  } catch (err) {
    console.warn('Could not initialize Firebase Firestore:', err);
    return null;
  }
}

export function loadLocalRoomData(roomPin: string): CoupleRoomData {
  const cleanPin = roomPin.trim().toUpperCase();

  // Check if URL has shared snapshot data (?share=...)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const sharedEncoded = params.get('share');
    if (sharedEncoded) {
      try {
        const jsonStr = decodeURIComponent(escape(atob(sharedEncoded)));
        const decoded = JSON.parse(jsonStr) as CoupleRoomData;
        if (decoded && Array.isArray(decoded.plans)) {
          localStorage.setItem(STORAGE_PREFIX + cleanPin, JSON.stringify(decoded));
          // Clean up URL share param without reloading
          const nextUrl = new URL(window.location.href);
          nextUrl.searchParams.delete('share');
          window.history.replaceState({}, '', nextUrl.toString());
          return decoded;
        }
      } catch (e) {
        console.warn('Failed to parse shared URL plan:', e);
      }
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + cleanPin);
    if (raw) {
      const parsed = JSON.parse(raw) as CoupleRoomData;
      if (parsed && Array.isArray(parsed.plans) && parsed.plans.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  const initial = createInitialCoupleRoom(cleanPin);
  localStorage.setItem(STORAGE_PREFIX + cleanPin, JSON.stringify(initial));
  return initial;
}

export async function saveRoomData(
  roomData: CoupleRoomData,
  onSyncStatus?: (status: 'synced' | 'local' | 'error') => void
): Promise<void> {
  const cleanPin = roomData.roomPin.trim().toUpperCase();
  const stamped: CoupleRoomData = {
    ...roomData,
    roomPin: cleanPin,
    updatedAt: Date.now(),
  };

  // 1. Always save locally immediately
  try {
    localStorage.setItem(STORAGE_PREFIX + cleanPin, JSON.stringify(stamped));
  } catch {
    // ignore quota errors
  }

  // 2. Broadcast to other tabs on the same device
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'ROOM_UPDATE', payload: stamped });
    } catch {
      // ignore
    }
  }

  // 3. Push to Firebase Firestore if configured
  const db = getFirestoreInstance();
  if (!db) {
    onSyncStatus?.('local');
    return;
  }

  try {
    const roomRef = doc(db, 'princess_rooms', cleanPin);
    await setDoc(roomRef, stamped, { merge: true });
    onSyncStatus?.('synced');
  } catch (err) {
    console.warn('Firestore sync failed, saved locally:', err);
    onSyncStatus?.('error');
  }
}

export function subscribeToRoom(
  roomPin: string,
  onReceiveUpdate: (data: CoupleRoomData) => void,
  onSyncStatus?: (status: 'synced' | 'local' | 'error') => void
): () => void {
  const cleanPin = roomPin.trim().toUpperCase();

  // Clean up previous listeners
  if (activeUnsubscribe) {
    activeUnsubscribe();
    activeUnsubscribe = null;
  }
  if (broadcastChannel) {
    broadcastChannel.close();
    broadcastChannel = null;
  }

  // 1. Setup BroadcastChannel for instant multi-tab sync
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(`princess_channel_${cleanPin}`);
    broadcastChannel.onmessage = (event) => {
      if (event.data?.type === 'ROOM_UPDATE' && event.data?.payload) {
        onReceiveUpdate(event.data.payload as CoupleRoomData);
      }
    };
  }

  // 2. Setup storage event listener
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_PREFIX + cleanPin && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue) as CoupleRoomData;
        onReceiveUpdate(parsed);
      } catch {
        // ignore
      }
    }
  };
  window.addEventListener('storage', handleStorageEvent);

  // 3. Setup Firebase Firestore realtime listener if configured
  const db = getFirestoreInstance();
  if (db) {
    try {
      const roomRef = doc(db, 'princess_rooms', cleanPin);
      activeUnsubscribe = onSnapshot(
        roomRef,
        (snapshot) => {
          onSyncStatus?.('synced');
          if (snapshot.exists()) {
            const remoteData = snapshot.data() as CoupleRoomData;
            if (remoteData && Array.isArray(remoteData.plans)) {
              localStorage.setItem(STORAGE_PREFIX + cleanPin, JSON.stringify(remoteData));
              onReceiveUpdate(remoteData);
            }
          } else {
            // Initialize remote room with current local data
            const localData = loadLocalRoomData(cleanPin);
            setDoc(roomRef, localData).catch(() => {});
          }
        },
        (err) => {
          console.warn('Firestore snapshot error:', err);
          onSyncStatus?.('error');
        }
      );
    } catch {
      onSyncStatus?.('error');
    }
  } else {
    onSyncStatus?.('local');
  }

  return () => {
    window.removeEventListener('storage', handleStorageEvent);
    if (activeUnsubscribe) {
      activeUnsubscribe();
      activeUnsubscribe = null;
    }
    if (broadcastChannel) {
      broadcastChannel.close();
      broadcastChannel = null;
    }
  };
}

export function createShareableUrl(roomData: CoupleRoomData): string {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('pin', roomData.roomPin);

  // If Firebase is not configured, also embed encoded plan state so opening the link syncs the snapshot!
  if (!getEffectiveFirebaseConfig()) {
    try {
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(roomData))));
      if (encoded.length < 12000) {
        url.searchParams.set('share', encoded);
      }
    } catch {
      // ignore
    }
  }
  return url.toString();
}
