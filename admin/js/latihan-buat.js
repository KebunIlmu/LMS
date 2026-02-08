import { db } from "../../assets/js/firebase.js";
import {
  collection, addDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const soalContainer = document.getElementById("soalContainer");
const addSoalBtn = document.getElementById("addSoal");
const simpanBtn = document.getElementById("simpanLatihan");

let soalIndex = 0;

addSoalBtn.onclick = () => tambahSoal();

function tambahSoal() {
  soalIndex++;

  const div = document.createElement("div");
  div.className = "card p-3 mb-3";

  div.innerHTML = `
    <h6>Soal ${soalIndex}</h6>

    <textarea class="form-control mb-2 pertanyaan"
      placeholder="Pertanyaan"></textarea>

    ${["A","B","C","D"].map((o,i)=>`
      <div class="input-group option">
        <span class="input-group-text">${o}</span>
        <input class="form-control opsi" placeholder="Opsi ${o}">
        <input type="radio" name="jawaban${soalIndex}" value="${i}" class="ms-2">
      </div>
    `).join("")}

    <textarea class="form-control mt-2 pembahasan"
      placeholder="Pembahasan"></textarea>
  `;

  soalContainer.appendChild(div);
}

// SIMPAN LATIHAN + SOAL
simpanBtn.onclick = async () => {
  const judul = document.getElementById("judul").value;
  const mapel = document.getElementById("mapel").value;
  const bab = document.getElementById("bab").value;
  const kelas = document.getElementById("kelas").value;

  if (!judul || !mapel || !kelas || !bab) {
    alert("Judul, mapel, kelas, dan bab wajib diisi");
    return;
  }


  // 1️⃣ SIMPAN LATIHAN
  const latihanRef = await addDoc(collection(db, "latihan"), {
    judul,
    mapel,
    bab,
    kelas,
    aktif: false,
    createdAt: serverTimestamp()
  });

  const soalIds = [];

  // 2️⃣ SIMPAN SOAL KE BANK SOAL
  const soalCards = document.querySelectorAll(".card");

  for (const card of soalCards) {
    const pertanyaan = card.querySelector(".pertanyaan")?.value;
    if (!pertanyaan) continue;

    const opsi = [...card.querySelectorAll(".opsi")].map(o => o.value);
    const jawaban = card.querySelector("input[type=radio]:checked")?.value;
    const pembahasan = card.querySelector(".pembahasan")?.value;

    if (jawaban === undefined) continue;

    const soalRef = await addDoc(collection(db, "bank_soal"), {
      pertanyaan,
      opsi,
      jawaban: Number(jawaban),
      pembahasan,
      mapel,
      bab,
      kelas,
      latihanId: latihanRef.id,
      createdAt: serverTimestamp()
    });

    soalIds.push(soalRef.id);
  }

  // 3️⃣ UPDATE LATIHAN DENGAN SOAL IDS
  await updateDoc(latihanRef, { soalIds });

  alert("Latihan & soal berhasil disimpan");
  location.href = "latihan.html";
};
