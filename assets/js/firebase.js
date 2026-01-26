import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDm1zMNDjd06vsZOddTgho6AXFpxHYOSpM",
  authDomain: "kebun-ilmu.firebaseapp.com",
  projectId: "kebun-ilmu",
  storageBucket: "kebun-ilmu.appspot.com", // ✅ FIX PENTING
  messagingSenderId: "1096325100528",
  appId: "1:1096325100528:web:c7575d081ff17a015c2335",
  measurementId: "G-QBCL39G8G8"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
