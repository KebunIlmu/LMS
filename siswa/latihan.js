import { auth, db } from "../assets/js/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  setDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// ================= ELEMENT =================
const latihanListEl = document.getElementById("latihanList");
const soalContainer = document.getElementById("soalContainer");
const soalBox = document.getElementById("soalBox");
const nextBtn = document.getElementById("nextBtn");
const judulEl = document.getElementById("judulLatihan");
const mapelEl = document.getElementById("mapelLatihan");

// ================= STATE =================
let soalList = [];
let index = 0;
let jawaban = {};
let currentUser = null;
let userProfile = null;
let kelasUser = [];

// 🔥 penting untuk flow baru
let currentLatihanId = null;
let currentLatihanData = null;

// ================= LOGIN CHECK =================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Silakan login dulu!");
    location.href = "login.html";
    return;
  }

  currentUser = user;

  const snapUser = await getDocs(
    query(collection(db, "users"), where("__name__", "==", currentUser.uid))
  );

  userProfile = snapUser.docs[0]?.data();

  if (!userProfile || !userProfile.kelas) {
    alert("Data user / kelas tidak ditemukan!");
    return;
  }

  kelasUser = Array.isArray(userProfile.kelas)
    ? userProfile.kelas
    : [userProfile.kelas];

  await loadLatihanAktif();
});

// ================= LOAD LATIHAN AKTIF =================
async function loadLatihanAktif() {
  const snap = await getDocs(
    query(collection(db, "latihan"), where("aktif", "==", true))
  );

  latihanListEl.innerHTML = "";

  if (snap.empty) {
    latihanListEl.innerHTML =
      `<div class="alert alert-warning">Belum ada latihan aktif 😅</div>`;
    return;
  }

  for (const docSnap of snap.docs) {
    const l = docSnap.data();
    const latihanId = docSnap.id;

    const kelasLatihan = Array.isArray(l.kelas) ? l.kelas : [l.kelas];
    if (!kelasLatihan.some(k => kelasUser.includes(k))) continue;

    // cek sudah submit
    let sudahSubmit = false;
    try {
      const jawabanSnap = await getDoc(
        doc(db, "jawaban_latihan", `${currentUser.uid}_${latihanId}`)
      );
      sudahSubmit = jawabanSnap.exists();
    } catch (e) {
      sudahSubmit = false;
    }

    const card = document.createElement("div");
    card.className = "card p-3 mb-2";
    card.style.cursor = "pointer";

    card.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <b>${l.judul}</b><br>
          <small>${l.mapel}</small>
        </div>
        ${sudahSubmit ? `<button class="btn btn-outline-primary btn-sm">🔍 Pembahasan</button>` : ``}
      </div>
    `;

    card.onclick = () => mulaiLatihan(latihanId, l);

    if (sudahSubmit) {
      const btn = card.querySelector("button");
      btn.onclick = (e) => {
        e.stopPropagation();
        bukaReview(latihanId, l);
      };
    }

    latihanListEl.appendChild(card);
  }
}

// ================= MULAI LATIHAN =================
function mulaiLatihan(latihanId, latihanData) {
  currentLatihanId = latihanId;
  currentLatihanData = latihanData;

  latihanListEl.style.display = "none";
  soalContainer.style.display = "block";
  nextBtn.style.display = "block";

  soalList = [];
  index = 0;
  jawaban = {};

  latihanData.soal.forEach((s, i) => {
    soalList.push({
      ...s,
      id: s.id || `${latihanId}_${i}`,
      latId: latihanId
    });
  });

  judulEl.innerText = latihanData.judul;
  mapelEl.innerText = latihanData.mapel;

  renderSoal();
}

// ================= RENDER SOAL =================
function renderSoal() {
  const s = soalList[index];

  soalBox.innerHTML = `
    ${s.bacaan ? `<p>${s.bacaan}</p>` : ""}
    <h6>${index + 1}. ${s.tanya}</h6>
    <div class="opsi-container">
      ${s.opsi.map((o, i) => `
        <div class="option" data-index="${i}">
          ${o}
        </div>
      `).join("")}
    </div>
  `;

  document.querySelectorAll(".option").forEach(opt => {
    opt.onclick = () => {
      jawaban[s.id] = Number(opt.dataset.index);
      document.querySelectorAll(".option").forEach(o => o.classList.remove("active"));
      opt.classList.add("active");
    };
  });

  nextBtn.innerText =
    index === soalList.length - 1 ? "Submit Jawaban" : "Soal Selanjutnya";
}

// ================= NEXT / SUBMIT =================
nextBtn.onclick = async () => {
  const s = soalList[index];

  if (jawaban[s.id] === undefined) {
    alert("Pilih jawaban dulu ya 😊");
    return;
  }

  index++;
  if (index < soalList.length) {
    renderSoal();
  } else {
    await submitJawaban();
    await bukaReview(currentLatihanId, currentLatihanData);
  }
};

// ================= SUBMIT JAWABAN =================
async function submitJawaban() {
  let benar = 0;

  soalList.forEach(s => {
    const kunci = Array.isArray(s.kunci) ? s.kunci[0] : s.kunci;
    if (jawaban[s.id] === kunci) benar++;
  });

  const nilai = Math.round((benar / soalList.length) * 100);

  await setDoc(
    doc(db, "jawaban_latihan", `${currentUser.uid}_${currentLatihanId}`),
    {
      userId: currentUser.uid,
      namaSiswa: userProfile.nama,
      kelas: userProfile.kelasNama || userProfile.kelas,
      latihanId: currentLatihanId,
      judulLatihan: currentLatihanData.judul,
      mapel: currentLatihanData.mapel,
      nilai,
      jawaban,
      createdAt: serverTimestamp()
    }
  );
}

// ================= BUKA REVIEW =================
async function bukaReview(latihanId, latihanData) {
  const snap = await getDoc(
    doc(db, "jawaban_latihan", `${currentUser.uid}_${latihanId}`)
  );

  if (!snap.exists()) {
    alert("Data review tidak ditemukan");
    return;
  }

  const dataJawaban = snap.data();

  latihanListEl.style.display = "none";
  soalContainer.style.display = "block";
  nextBtn.style.display = "none";

  judulEl.innerText = latihanData.judul;
  mapelEl.innerText = latihanData.mapel;

  let html = `
    <div class="alert alert-success">
      🎉 Nilai kamu: <b>${dataJawaban.nilai}</b>
    </div>

    <button id="backToList" class="btn btn-secondary mb-3">
      ⬅ Kembali ke Daftar Latihan
    </button>
  `;

  latihanData.soal.forEach((s, i) => {
    const soalId = s.id || `${latihanId}_${i}`;
    const jawabanSiswa = dataJawaban.jawaban[soalId];
    const kunci = Array.isArray(s.kunci) ? s.kunci[0] : s.kunci;

    html += `
      <div class="card p-3 mb-4">
        <h6>${i + 1}. ${s.tanya}</h6>
        ${s.bacaan ? `<p>${s.bacaan}</p>` : ""}

        ${s.opsi.map((opsi, idx) => {
          let cls = "option";
          let label = "";

          if (idx === kunci) {
            cls += " border-success bg-success-subtle";
            label = " ✅ Jawaban Benar";
          } else if (idx === jawabanSiswa) {
            cls += " border-danger bg-danger-subtle";
            label = " ❌ Jawaban Kamu";
          }

          return `
            <div class="${cls}" style="cursor:default">
              ${opsi}
              <small class="ms-2">${label}</small>
            </div>
          `;
        }).join("")}

        <div class="alert alert-info mt-3">
          ${s.bahas || "<i>Pembahasan belum tersedia.</i>"}
        </div>
      </div>
    `;
  });

  soalBox.innerHTML = html;

  document.getElementById("backToList").onclick = async () => {
    soalContainer.style.display = "none";
    latihanListEl.style.display = "block";
    await loadLatihanAktif();
  };
}
