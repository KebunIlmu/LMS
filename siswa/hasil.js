import { auth, db } from "../assets/js/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Tables
const latihanTable = document.getElementById("latihanTable");
const tryoutTable = document.getElementById("tryoutTable");
const emptyLatihan = document.getElementById("emptyLatihan");
const emptyTryout = document.getElementById("emptyTryout");

// Statistik
const statLatihan = document.getElementById("statLatihan");
const statTryout = document.getElementById("statTryout");
const statAvg = document.getElementById("statAvg");

// Auth
onAuthStateChanged(auth, user => {
  if(!user){
    alert("Silakan login dulu");
    location.href = "login.html";
    return;
  }
  loadHasil(user.uid);
});

function loadHasil(uid){
  const latihanQ = query(collection(db,"jawaban_latihan"), where("userId","==",uid));
  const tryoutQ = query(collection(db,"hasil_tryout"), where("uid","==",uid));
  let totalNilai = 0;
  let totalCount = 0;

  // Load Latihan
  onSnapshot(latihanQ, snap => {
    latihanTable.innerHTML = "";
    if(snap.empty){
      emptyLatihan.style.display = "block";
      statLatihan.textContent = 0;
      return;
    }
    emptyLatihan.style.display = "none";
    statLatihan.textContent = snap.size;

    snap.forEach(doc => {
      const h = doc.data();
      totalCount++;
      totalNilai += h.nilai ?? 0;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${h.judulLatihan || "-"}</td>
        <td>${h.mapel || "-"}</td>
        <td><span class="badge bg-${h.nilai >=75?"success":"danger"}">${h.nilai ?? 0}</span></td>
        <td>${h.createdAt ? h.createdAt.toDate().toLocaleDateString("id-ID") : "-"}</td>
      `;
      latihanTable.appendChild(tr);
    });

    updateAvg(totalCount, totalNilai);
  });

  // Load Try Out
  onSnapshot(tryoutQ, snap => {
    tryoutTable.innerHTML = "";
    if(snap.empty){
      emptyTryout.style.display = "block";
      statTryout.textContent = 0;
      return;
    }
    emptyTryout.style.display = "none";
    statTryout.textContent = snap.size;

    snap.forEach(doc => {
      const h = doc.data();
      totalCount++;
      totalNilai += h.nilai ?? 0;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${h.judul || "-"}</td>
        <td>${h.mapel || "-"}</td>
        <td><span class="badge bg-${h.nilai >=75?"success":"danger"}">${h.nilai ?? 0}</span></td>
        <td>${h.createdAt ? h.createdAt.toDate().toLocaleDateString("id-ID") : "-"}</td>
      `;
      tryoutTable.appendChild(tr);
    });

    updateAvg(totalCount, totalNilai);
  });
}

function updateAvg(count, total){
  statAvg.textContent = count ? (total/count).toFixed(1) : 0;
}
