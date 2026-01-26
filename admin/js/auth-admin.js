import { onAuthStateChanged, signOut } from
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { doc, getDoc } from
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { auth, db } from "../../assets/js/firebase.js";

onAuthStateChanged(auth, async (user) => {

  // BELUM LOGIN
  if (!user) {
    window.location.href = "../index.html";
    return;
  }

  const snap = await getDoc(doc(db, "users", user.uid));

  // DATA USER TIDAK ADA
  if (!snap.exists()) {
    await signOut(auth);
    window.location.href = "../index.html";
    return;
  }

  const data = snap.data();

  // AKUN BELUM AKTIF
  if (!data.active) {
    alert("Akun belum diaktifkan admin");
    await signOut(auth);
    window.location.href = "../index.html";
    return;
  }

  // BUKAN ADMIN
  if (data.role !== "admin") {
    alert("Akses ditolak!");
    window.location.href = "../index.html";
    return;
  }

  // ✅ LOLOS → ADMIN BOLEH MASUK
});
