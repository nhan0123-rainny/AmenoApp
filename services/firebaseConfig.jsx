import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDVW9642aQ99pPHjAuBMb2bmqad4neDiZQ",
  authDomain: "fir-app-6fca1.firebaseapp.com",
  projectId: "fir-app-6fca1",
  storageBucket: "fir-app-6fca1.firebasestorage.app",
  messagingSenderId: "136088050720",
  appId: "1:136088050720:web:dc8a50dff01b08c6b17045",
  measurementId: "G-KJG9Q5M6QM"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { app };

