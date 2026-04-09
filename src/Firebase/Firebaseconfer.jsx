import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const FirebaseConfer = {
  apiKey: "AIzaSyDlkZe-OI7ozU-h9ggX485DXMVQ5wYxVs4",
  authDomain: "auth-f77ef.firebaseapp.com",
  projectId: "auth-f77ef",
  storageBucket: "auth-f77ef.firebasestorage.app",
  messagingSenderId: "843368083966",
  appId: "1:843368083966:web:14868ed623857a8f37d0af"
};

const app = initializeApp(FirebaseConfer);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);


