import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { auth, db } from "../assets/js/firebase.js";

// cek login
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "../index.html";
    return;
  }

  const uid = user.uid;

  // ambil data user
  const userSnap = await getDoc(doc(db, "users", uid));
  if (!userSnap.exists()) return;

  const data = userSnap.data();

  if (data.role !== "siswa") {
    alert("Akses ditolak");
    location.href = "../index.html";
    return;
  }

  document.getElementById("namaSiswa").textContent = data.nama;
  document.getElementById("kelasSiswa").textContent = data.kelas;

  loadStatistik(uid);
});

// statistik
async function loadStatistik(uid) {
  let totalNilai = 0;
  let jumlah = 0;

  const latihanSnap = await getDocs(collection(db, "results", uid, "latihan"));
  document.getElementById("totalLatihan").textContent = latihanSnap.size;

  latihanSnap.forEach(d => {
    totalNilai += d.data().score || 0;
    jumlah++;
  });

  const tryoutSnap = await getDocs(collection(db, "results", uid, "tryout"));
  document.getElementById("totalTryout").textContent = tryoutSnap.size;

  tryoutSnap.forEach(d => {
    totalNilai += d.data().score || 0;
    jumlah++;
  });

  document.getElementById("avgNilai").textContent =
    jumlah ? Math.round(totalNilai / jumlah) : "-";
}

// logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  location.href = "../index.html";
});
