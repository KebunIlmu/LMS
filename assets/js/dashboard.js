import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { db } from "../../assets/js/firebase.js";

const users = await getDocs(collection(db, "users"));

let siswa = 0;
let guru = 0;

users.forEach(doc => {
  if (doc.data().role === "siswa") siswa++;
  if (doc.data().role === "guru") guru++;
});

document.getElementById("totalSiswa").innerText = siswa;
document.getElementById("totalGuru").innerText = guru;
