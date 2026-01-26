import { db } from "../../assets/js/firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// ELEMENTS
const totalSiswaEl = document.getElementById("totalSiswa");
const totalGuruEl = document.getElementById("totalGuru");
const aktifEl = document.getElementById("akunAktif");
const nonaktifEl = document.getElementById("akunNonaktif");
const kelasAktifEl = document.getElementById("kelasAktif");
const kelasNonaktifEl = document.getElementById("kelasNonaktif");

async function loadDashboard() {
  let totalSiswa = 0;
  let totalGuru = 0;
  let aktif = 0;
  let nonaktif = 0;
  let kelasAktif = 0;
  let kelasNonaktif = 0;

  // ================= USERS =================
  const userSnap = await getDocs(collection(db, "users"));
  userSnap.forEach(doc => {
    const u = doc.data();

    if (u.role === "admin") return;
    if (u.deleted === true) return;

    if (u.role === "siswa") totalSiswa++;
    if (u.role === "guru") totalGuru++;

    if (u.active === true) aktif++;
    else nonaktif++;
  });

  // ================= CLASSES =================
  const classSnap = await getDocs(collection(db, "classes"));
  classSnap.forEach(doc => {
    const c = doc.data();

    // kelas aktif = ada anggota siswa atau guru
    const anggotaCount = (c.members?.siswa?.length || 0) + (c.members?.guru?.length || 0);
    if (anggotaCount > 0) kelasAktif++;
    else kelasNonaktif++;
  });

  // UPDATE UI
  totalSiswaEl.textContent = totalSiswa;
  totalGuruEl.textContent = totalGuru;
  aktifEl.textContent = aktif;
  nonaktifEl.textContent = nonaktif;
  kelasAktifEl.textContent = kelasAktif;
  kelasNonaktifEl.textContent = kelasNonaktif;
}

// panggil load
loadDashboard();
