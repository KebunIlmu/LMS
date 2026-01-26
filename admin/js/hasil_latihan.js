import { db } from "../../assets/js/firebase.js";
import { getDocs, collection, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const hasilTable = document.getElementById("hasilTable");
const kelasFilter = document.getElementById("kelasFilter");
const materiFilter = document.getElementById("materiFilter");

// load filter options
async function loadFilterOptions() {
  // kelas
  const kelasSnap = await getDocs(collection(db, "classes"));
  kelasSnap.forEach(d => {
    const option = document.createElement("option");
    option.value = d.id;
    option.textContent = d.data().nama;
    kelasFilter.appendChild(option);
  });
  // materi
  const materiSnap = await getDocs(collection(db, "materi"));
  materiSnap.forEach(d => {
    const option = document.createElement("option");
    option.value = d.id;
    option.textContent = d.data().judul;
    materiFilter.appendChild(option);
  });
}

async function loadHasil() {
  hasilTable.innerHTML = "";
  const snap = await getDocs(collection(db, "hasil_latihan"));

  snap.forEach(async docSnap => {
    const h = docSnap.data();
    const userSnap = await getDoc(doc(db, "users", h.userId));
    const materiSnap = await getDoc(doc(db, "materi", h.materiId));

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${userSnap.exists() ? userSnap.data().nama : "-"}</td>
      <td>${materiSnap.exists() ? materiSnap.data().judul : "-"}</td>
      <td>${h.jawaban.join(", ")}</td>
      <td>${h.score}</td>
      <td>${h.createdAt?.toDate ? h.createdAt.toDate() : "-"}</td>
    `;
    hasilTable.appendChild(tr);
  });
}

kelasFilter.onchange = loadHasil;
materiFilter.onchange = loadHasil;

loadFilterOptions();
loadHasil();
