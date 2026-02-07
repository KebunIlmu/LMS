// latihan.js
import { auth, db } from "../assets/js/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  collection, getDocs, getDoc, query, where,
  setDoc, doc, serverTimestamp, onSnapshot
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

  kelasUser = Array.isArray(userProfile.kelas) ? userProfile.kelas : [userProfile.kelas];

  // Load awal
  await loadLatihanAktif();

  // Pasang listener otomatis update
  listenLatihanAktif();
});

// ================= LISTENER OTOMATIS =================
function listenLatihanAktif() {
  const q = query(collection(db, "latihan"), where("aktif", "==", true));
  onSnapshot(q, async () => {
    await loadLatihanAktif(); // otomatis reload saat ada latihan baru atau update
  });
}

// ================= LOAD LATIHAN =================
// ================= LOAD LATIHAN =================
async function loadLatihanAktif() {
  const snap = await getDocs(
    query(collection(db, "latihan"), where("aktif", "==", true))
  );

  latihanListEl.innerHTML = "";

  if (snap.empty) {
    latihanListEl.innerHTML = `<div class="alert alert-warning">Belum ada latihan aktif 😅</div>`;
    return;
  }

  const latihanData = [];
  for (const docSnap of snap.docs) {
    const l = docSnap.data();
    const latihanId = docSnap.id;

    const kelasLatihan = Array.isArray(l.kelas) ? l.kelas : [l.kelas];
    if (!kelasLatihan.some(k => kelasUser.includes(k))) continue;

    let sudahSubmit = false;
    try {
      const jawabanSnap = await getDoc(
        doc(db, "jawaban_latihan", `${currentUser.uid}_${latihanId}`)
      );
      sudahSubmit = jawabanSnap.exists();
    } catch {}

    latihanData.push({ id: latihanId, data: l, sudahSubmit });
  }

  // =================== SORT LATIHAN BERDASARKAN JUDUL ===================
  latihanData.sort((a, b) => {
    const judulA = a.data.judul.toUpperCase();
    const judulB = b.data.judul.toUpperCase();
    if (judulA < judulB) return -1;
    if (judulA > judulB) return 1;
    return 0;
  });

  // =================== GROUP PER KELAS → MAPEL → BAB ===================
  let grouped = {};
  latihanData.forEach(item => {
    const l = item.data;
    const kelasList = Array.isArray(l.kelas) ? l.kelas : [l.kelas];
    kelasList.forEach(kelas => {
      if (!kelasUser.includes(kelas)) return;
      if (!grouped[kelas]) grouped[kelas] = {};
      
      const mapel = l.mapel || "Umum";
      if (!grouped[kelas][mapel]) grouped[kelas][mapel] = {};

      const bab = l.bab || "Umum";
      if (!grouped[kelas][mapel][bab]) grouped[kelas][mapel][bab] = [];

      grouped[kelas][mapel][bab].push(item);
    });
  });


    // =================== RENDER ===================
  for (const kelas of Object.keys(grouped).sort()) {
    const kelasCard = document.createElement("div");
    kelasCard.className = "kelas-card";

    const kelasTitle = document.createElement("div");
    kelasTitle.className = "kelas-title";
    kelasTitle.innerText = kelas;
    kelasCard.appendChild(kelasTitle);

    for (const mapel of Object.keys(grouped[kelas]).sort()) {
      const mapelDiv = document.createElement("div");
      mapelDiv.className = "mapel-item";
      mapelDiv.innerText = mapel;
      kelasCard.appendChild(mapelDiv);

      const babContainer = document.createElement("div");
      babContainer.style.display = "none";
      kelasCard.appendChild(babContainer);

      mapelDiv.onclick = () => {
        babContainer.style.display = babContainer.style.display === "none" ? "block" : "none";
      };

      for (const bab of Object.keys(grouped[kelas][mapel]).sort()) {
        const babDiv = document.createElement("div");
        babDiv.className = "mapel-item"; // bisa bikin class baru 'bab-item'
        babDiv.innerText = "📖 " + bab;
        babDiv.style.marginLeft = "10px";
        babContainer.appendChild(babDiv);

        const latihanContainer = document.createElement("div");
        latihanContainer.style.display = "none";
        babContainer.appendChild(latihanContainer);

        babDiv.onclick = () => {
          latihanContainer.style.display = latihanContainer.style.display === "none" ? "block" : "none";
        };

        grouped[kelas][mapel][bab].forEach(item => {
          const l = item.data;
          const latihanDiv = document.createElement("div");
          latihanDiv.className = "latihan-item";
          latihanDiv.innerHTML = `<span>${l.judul}</span>` +
            (item.sudahSubmit ? `<button class="btn btn-outline-primary btn-sm">🔍 Pembahasan</button>` : "");

          latihanDiv.onclick = () => mulaiLatihan(item.id, l);

          if (item.sudahSubmit) {
            const btn = latihanDiv.querySelector("button");
            btn.onclick = e => { e.stopPropagation(); bukaReview(item.id, l); };
          }

          latihanContainer.appendChild(latihanDiv);
        });
      }
    }

    latihanListEl.appendChild(kelasCard);
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
    soalList.push({ ...s, id: s.id || `${latihanId}_${i}`, latId: latihanId });
  });

  judulEl.innerText = latihanData.judul;
  mapelEl.innerText = latihanData.mapel;

  renderSoal();
}

// ================= RENDER SOAL =================
function renderSoal() {
  const s = soalList[index];

  soalBox.innerHTML = `
    <div class="soal-card">
      ${s.bacaan ? `<div class="soal-bacaan">${s.bacaan}</div>` : ""}
      <h6>${index + 1}. ${s.tanya}</h6>
      <div class="opsi-container">
        ${s.opsi.map((o, i) => `
          <div class="option ${jawaban[s.id] === i ? "active" : ""}" data-index="${i}">
            ${o}
          </div>
        `).join("")}
      </div>
    </div>
  `;

  document.querySelectorAll(".option").forEach(opt => {
    opt.onclick = () => {
      jawaban[s.id] = Number(opt.dataset.index);
      document.querySelectorAll(".option").forEach(o => o.classList.remove("active"));
      opt.classList.add("active");
    };
  });

  nextBtn.innerText = index === soalList.length - 1 ? "Submit Jawaban" : "Soal Selanjutnya";

  if (window.MathJax) {
  MathJax.typesetClear();
  MathJax.typesetPromise([soalBox]);
}

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

  await setDoc(doc(db, "jawaban_latihan", `${currentUser.uid}_${currentLatihanId}`), {
    userId: currentUser.uid,
    namaSiswa: userProfile.nama,
    kelas: userProfile.kelasNama || userProfile.kelas,
    latihanId: currentLatihanId,
    judulLatihan: currentLatihanData.judul,
    mapel: currentLatihanData.mapel,
    nilai,
    jawaban,
    createdAt: serverTimestamp()
  });
}

// ================= BUKA REVIEW =================
async function bukaReview(latihanId, latihanData) {
  const snap = await getDoc(doc(db, "jawaban_latihan", `${currentUser.uid}_${latihanId}`));
  if (!snap.exists()) { alert("Data review tidak ditemukan"); return; }

  const dataJawaban = snap.data();

  latihanListEl.style.display = "none";
  soalContainer.style.display = "block";
  nextBtn.style.display = "none";

  judulEl.innerText = latihanData.judul;
  mapelEl.innerText = latihanData.mapel;

  let html = `<div class="alert alert-success">🎉 Nilai kamu: <b>${dataJawaban.nilai}</b></div>
              <button id="backToList" class="btn btn-secondary mb-3">⬅ Kembali ke Daftar Latihan</button>`;

  latihanData.soal.forEach((s, i) => {
    const soalId = s.id || `${latihanId}_${i}`;
    const jawabanSiswa = dataJawaban.jawaban[soalId];
    const kunci = Array.isArray(s.kunci) ? s.kunci[0] : s.kunci;

    html += `<div class="soal-card">
              ${s.bacaan ? `<div class="soal-bacaan">${s.bacaan}</div>` : ""}
              <h6>${i + 1}. ${s.tanya}</h6>
              ${s.opsi.map((opsi, idx) => {
                let cls = "option";
                if(idx === kunci) cls += " correct";
                else if(idx === jawabanSiswa) cls += " wrong";
                return `<div class="${cls}" style="cursor:default">${opsi}</div>`;
              }).join("")}
              <div class="alert alert-info mt-3">${s.bahas || "<i>Pembahasan belum tersedia.</i>"}</div>
            </div>`;
  });

  soalBox.innerHTML = html;

  if (window.MathJax) {
  MathJax.typesetClear();
  MathJax.typesetPromise([soalBox]);
}

  document.getElementById("backToList").onclick = async () => {
    soalContainer.style.display = "none";
    latihanListEl.style.display = "block";
    await loadLatihanAktif(); // reload otomatis
  };
}
