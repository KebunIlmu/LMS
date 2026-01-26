import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { auth, db } from "./firebase.js";

document.getElementById("loginBtn").addEventListener("click", async () => {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    const snap = await getDoc(doc(db, "users", uid));

    if (!snap.exists()) {
      alert("Data user tidak ditemukan");
      return;
    }

    if (!snap.data().active) {
      alert("Akun belum diaktifkan admin");
      return;
    }

    const role = snap.data().role;

    if (role === "admin") location.href = "admin/dashboard.html";
    if (role === "guru") location.href = "guru/dashboard.html";
    if (role === "siswa") location.href = "siswa/dashboard.html";

  } catch (error) {
    alert(error.message);
  }
});
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");
const eyeIcon = document.getElementById("eyeIcon");

togglePassword.addEventListener("click", () => {
  const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", type);

  eyeIcon.classList.toggle("bi-eye");
  eyeIcon.classList.toggle("bi-eye-slash");
});
