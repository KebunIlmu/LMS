import { db } from "../../assets/js/firebase.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Ambil ID dari query string
const urlParams = new URLSearchParams(window.location.search);
const latihanId = urlParams.get("id");

// Ambil elemen form
const form = document.getElementById("latihanForm");
const judulInput = document.getElementById("judul");
const mapelInput = document.getElementById("mapel");
const babInput = document.getElementById("bab");
const kelasInput = document.getElementById("kelas");
const publishInput = document.getElementById("publish");

// Load data latihan
async function loadLatihan() {
  const docRef = doc(db, "latihan", latihanId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    alert("Latihan tidak ditemukan!");
    return;
  }

  const data = docSnap.data();
  judulInput.value = data.judul || "";
  mapelInput.value = data.mapel || "";
  babInput.value = data.bab || "";
  kelasInput.value = Array.isArray(data.kelas) ? data.kelas.join(", ") : data.kelas || "";
  publishInput.checked = !!data.publish;
}

// Simpan perubahan
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  if (!judulInput.value || !mapelInput.value || !babInput.value || !kelasInput.value) {
    alert("Judul, mapel, bab, dan kelas wajib diisi");
    return;
  }

  const updated = {
    judul: judulInput.value,
    mapel: mapelInput.value,
    bab: babInput.value,
    kelas: kelasInput.value.split(",").map(k => k.trim()).filter(k => k),
    publish: publishInput.checked
  };

  await updateDoc(doc(db, "latihan", latihanId), updated);
  alert("Latihan berhasil diperbarui!");
  window.location.href = "latihan.html"; // kembali ke daftar
});

loadLatihan();
