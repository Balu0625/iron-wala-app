
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAFVnRV4OsoXa1u4hd8ld6siswHLrdi3jQ",
  authDomain: "ironwala-db.firebaseapp.com",
  projectId: "ironwala-db",
  storageBucket: "ironwala-db.appspot.com",
  messagingSenderId: "665048526809",
  appId: "1:665048526809:web:2b405a2c86788c28d3f3c8"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

const db = getFirestore(app);

export { db, auth };
