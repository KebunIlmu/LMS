import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// ELEMENT
const form = document.getElementById("registerForm");
const roleSelect = document.getElementById("role");
const siswaFields = document.getElementById("siswaFields");

const namaInput = document.getElementById("nama");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const nisnInput = document.getElementById("nisn");
const kelasInput = document.getElementById("kelas");
const sekolahInput = document.getElementById("sekolah");

// toggle field siswa
roleSelect.addEventListener("change", () => {
  siswaFields.style.display = roleSelect.value === "siswa" ? "block" : "none";
});

// SUBMIT REGISTER
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const role = roleSelect.value;
  const nama = namaInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!role || !nama || !email || !password) {
    alert("Lengkapi semua data");
    return;
  }

  try {
    // 1. BUAT AUTH
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    // 2. SIMPAN KE FIRESTORE
    const userData = {
      nama,
      email,
      role,           // siswa / guru
      active: false,  // ❗ menunggu admin
      createdAt: serverTimestamp()
    };

    if (role === "siswa") {
      userData.nisn = nisnInput.value;
      userData.kelas = kelasInput.value;
      userData.sekolah = sekolahInput.value;
      userData.idSiswa = "SIS-" + Date.now();
    }

    await setDoc(doc(db, "users", uid), userData);

    alert("Registrasi berhasil! Tunggu persetujuan admin.");
    window.location.href = "index.html";

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});
