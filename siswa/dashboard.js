import { onAuthStateChanged, signOut } 
from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

import { 
  doc, getDoc, collection, getDocs,
  query, where
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

import { auth, db } from "../assets/js/firebase.js";


// ================= LOGIN =================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "../index.html";
    return;
  }

  try {
    const uid = user.uid;
    const snap = await getDoc(doc(db, "users", uid));

    // ✅ VALIDASI USER
    if (!snap.exists()) {
      alert("Data user tidak ditemukan");
      return;
    }

    const data = snap.data();

    document.getElementById("namaSiswa").textContent = data.nama || "-";
    document.getElementById("kelasSiswa").textContent = data.kelas || "-";

    loadStatistik(uid);
    loadJadwal();
    loadNotif();
    loadPengumuman();
    loadRanking(data.kelas);

  } catch (err) {
    console.error("Error load user:", err);
  }
});


// ================= STATISTIK =================
async function loadStatistik(uid) {
  try {
    let total = 0, count = 0;

    // LATIHAN (yang dikerjakan)
    const latihanSnap = await getDocs(
      query(collection(db, "jawaban_latihan"), where("userId", "==", uid))
    );

    // TRYOUT
    const tryoutSnap = await getDocs(
      collection(db, "hasil_tryout", uid, "tryout")
    );
    // TOTAL TRYOUT (yang aktif)
const totalTryoutSnap = await getDocs(
  query(collection(db, "tryout"), where("aktif", "==", true))
);
const totalTryoutAll = totalTryoutSnap.size;

    // TOTAL LATIHAN (yang aktif saja)
    const totalLatihanSnap = await getDocs(
      query(collection(db, "latihan"), where("aktif", "==", true))
    );
    const totalLatihanAll = totalLatihanSnap.size;

    // JUMLAH DIKERJAKAN
    const jumlah = latihanSnap.size;
    // TRYOUT DIKERJAKAN
const tryoutDone = tryoutSnap.size;

// PERSEN TRYOUT
const tryoutPercent = totalTryoutAll
  ? Math.round((tryoutDone / totalTryoutAll) * 100)
  : 0;

    // HITUNG PERSEN
    const latihanPercent = totalLatihanAll
      ? Math.round((jumlah / totalLatihanAll) * 100)
      : 0;

    // TAMPILAN LATIHAN
    document.getElementById("totalLatihan").textContent =
      `${jumlah} / ${totalLatihanAll} (${latihanPercent}%)`;

    // FULL
    if (jumlah === totalLatihanAll && totalLatihanAll > 0) {
      document.getElementById("totalLatihan").textContent += " (FULL)";
    }

    // TRYOUT
    document.getElementById("totalTryout").textContent =
  `${tryoutDone} / ${totalTryoutAll} (${tryoutPercent}%)`;

if (tryoutDone === totalTryoutAll && totalTryoutAll > 0) {
  document.getElementById("totalTryout").textContent += " (FULL)";
}
    // HITUNG NILAI
    latihanSnap.forEach(d => {
      total += d.data().nilai || 0;
      count++;
    });

    tryoutSnap.forEach(d => {
      total += d.data().score || 0;
      count++;
    });

    // RATA-RATA
    const avg = count ? Math.round(total / count) : 0;
    document.getElementById("avgNilai").textContent = avg || "-";

    // PROGRESS GLOBAL (REAL)
const totalSemua = totalLatihanAll + totalTryoutAll;
const dikerjakanSemua = jumlah + tryoutDone;

const progress = totalSemua
  ? Math.round((dikerjakanSemua / totalSemua) * 100)
  : 0;

    document.getElementById("progressBelajar").textContent = progress + "%";

    // ================= PROGRESS BAR =================
    const barLatihan = document.getElementById("barLatihan");
    if (barLatihan) barLatihan.style.width = latihanPercent + "%";

    const barTryout = document.getElementById("barTryout");
if (barTryout) {
  barTryout.style.width = tryoutPercent + "%";
  barTryout.textContent = tryoutPercent + "%";
}
    const barNilai = document.getElementById("barNilai");
    if (barNilai) barNilai.style.width = avg + "%";

    const barProgress = document.getElementById("barProgress");
if (barProgress) {
  barProgress.style.width = progress + "%";
  barProgress.textContent = progress + "%";
}
  } catch (err) {
    console.error("Error statistik:", err);
  }
}

// ================= JADWAL =================
function loadJadwal() {
  const data = ["08:00 Matematika", "10:00 IPA", "13:00 B. Indo"];

  const el = document.getElementById("jadwalList");
  if (el) {
    el.innerHTML = data.map(d => `<li>${d}</li>`).join("");
  }
}


// ================= NOTIF =================
function loadNotif() {
  const data = [
    "Tugas belum dikerjakan",
    "Tryout tersedia",
    "Nilai keluar"
  ];

  const el = document.getElementById("notifList");
  if (el) {
    el.innerHTML = data.map(d => `<li>${d}</li>`).join("");
  }
}


// ================= PENGUMUMAN =================
function loadPengumuman() {
  const el = document.getElementById("pengumumanList");

  if (el) {
    el.innerHTML = `
      <p>UTS minggu depan</p>
      <p>Libur nasional</p>
    `;
  }
}


// ================= RANKING (OPTIMIZED) =================
async function loadRanking(kelas) {
  try {
    const users = await getDocs(collection(db, "users"));

    const promises = users.docs.map(async (u) => {
      const data = u.data();

      if (data.kelas !== kelas) return null;

      const res = await getDocs(
  collection(db, "hasil_tryout", u.id, "tryout")
);

      let total = 0, count = 0;

      res.forEach(r => {
        total += r.data().score || 0;
        count++;
      });

      return {
        nama: data.nama,
        nilai: count ? total / count : 0
      };
    });

    const list = (await Promise.all(promises))
      .filter(Boolean)
      .sort((a,b)=>b.nilai-a.nilai);

    const el = document.getElementById("rankingList");

    if (el) {
      el.innerHTML = list.slice(0,5)
        .map((d,i)=>`<li>${i+1}. ${d.nama} - ${Math.round(d.nilai)}</li>`)
        .join("");
    }

  } catch (err) {
    console.error("Error ranking:", err);
  }
}


// ================= LOGOUT =================
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await signOut(auth);
  location.href = "../index.html";
});
