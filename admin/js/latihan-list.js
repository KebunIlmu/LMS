// admin-latihan.js
import { db } from "../../assets/js/firebase.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

let latihanData = []; // ⬅️ TAMBAH INI

// ================= ELEMENT =================
const latihanTable = document.getElementById("latihanTable");
const modalEl = document.getElementById("editLatihanModal");
const editModal = bootstrap.Modal.getOrCreateInstance(modalEl);

const latihanIdInput = document.getElementById("latihanId");
const editLatihanJudul = document.getElementById("editLatihanJudul");
const editLatihanMapel = document.getElementById("editLatihanMapel");
const editLatihanKelas = document.getElementById("editLatihanKelas");
const editLatihanBab = document.getElementById("editLatihanBab");
const editLatihanPublish = document.getElementById("editLatihanPublish");
const latihanSoalList = document.getElementById("latihanSoalList");
const addLatihanSoalBtn = document.getElementById("addLatihanSoalBtn");
const previewLatihan = document.getElementById("previewLatihan");
const btnSimpanLatihan = document.getElementById("btnSimpanLatihan");

const sortJudul = document.getElementById("sortJudul");
const filterStatus = document.getElementById("filterStatus");
const filterBab = document.getElementById("filterBab");
const filterMapel = document.getElementById("filterMapel");
const filterKelas = document.getElementById("filterKelas");
const sortSoal = document.getElementById("sortSoal");
const searchLatihan = document.getElementById("searchLatihan");

let currentEditLatihanId = null;

// ================= HELPER =================
function formatKelas(kelas) {
  if (Array.isArray(kelas)) return kelas.join(", ");
  if (typeof kelas === "string") return kelas;
  return "-";
}

function formatStatus(publish) {
  return `<span class="badge ${publish ? "badge-aktif" : "badge-nonaktif"}">
            ${publish ? "Aktif" : "Nonaktif"}
          </span>`;
}

// ================= LOAD LATIHAN =================
async function loadLatihan() {
  latihanData = [];

  latihanTable.innerHTML = `<tr>
    <td colspan="7" class="text-muted text-center">Memuat data...</td>
  </tr>`;

  const snap = await getDocs(collection(db, "latihan"));

  if (snap.empty) {
    latihanTable.innerHTML =
      `<tr><td colspan="7" class="text-center text-muted">Belum ada latihan</td></tr>`;
    return;
  }

  snap.forEach(d => {
    latihanData.push({
      id: d.id,
      ...d.data()
    });
  });

  applyFilterSort();
  populateFilterOptions();
}
function renderLatihanTable(data) {
  latihanTable.innerHTML = "";

  data.forEach(l => {
    latihanTable.innerHTML += `
      <tr>
        <td>${l.judul || "-"}</td>
        <td>${l.mapel || "-"}</td>
        <td>${l.bab || "-"}</td>
        <td>${formatKelas(l.kelas)}</td>
        <td>${formatStatus(l.publish)}</td>
        <td>${l.soal?.length || 0}</td>
        <td>
          <button class="btn btn-outline-info btn-sm action-btn"
            onclick="previewLatihanModal('${l.id}')">👁</button>
          <button class="btn btn-outline-primary btn-sm action-btn"
            onclick="editLatihanModal('${l.id}')">✏️</button>
          <button class="btn btn-outline-warning btn-sm action-btn"
            onclick="togglePublish('${l.id}', ${!!l.publish})">
            ${l.publish ? "❌" : "🚀"}
          </button>
          <button class="btn btn-outline-danger btn-sm action-btn"
            onclick="hapusLatihan('${l.id}', '${l.judul || "Latihan"}')">
            🗑
          </button>
        </td>
      </tr>`;
  });
}
function applyFilterSort() {
  let data = [...latihanData];

  // ===== FILTER STATUS =====
  if (filterStatus.value) {
    const isAktif = filterStatus.value === "aktif";
    data = data.filter(l => !!l.publish === isAktif);
  }

  // ===== FILTER BAB =====
  if (filterBab.value) {
    data = data.filter(l => l.bab === filterBab.value);
  }

  // ===== FILTER MAPEL =====
  if (filterMapel.value) {
    data = data.filter(l => l.mapel === filterMapel.value);
  }

  // ===== FILTER KELAS =====
  if (filterKelas.value) {
    data = data.filter(l =>
      Array.isArray(l.kelas) &&
      l.kelas.includes(filterKelas.value)
    );
  }

  // ===== SEARCH =====
  if (searchLatihan.value.trim() !== "") {
    const keyword = searchLatihan.value.toLowerCase();
    data = data.filter(l =>
      (l.judul || "").toLowerCase().includes(keyword) ||
      (l.mapel || "").toLowerCase().includes(keyword) ||
      (l.bab || "").toLowerCase().includes(keyword)
    );
  }

  // ===== SORT JUDUL =====
  if (sortJudul.value) {
    data.sort((a,b)=>{
      const aJudul = a.judul || "";
      const bJudul = b.judul || "";
      return sortJudul.value === "asc"
        ? aJudul.localeCompare(bJudul)
        : bJudul.localeCompare(aJudul);
    });
  }

  // ===== SORT JUMLAH SOAL =====
  if (sortSoal.value) {
    data.sort((a,b)=>{
      const aSoal = a.soal?.length || 0;
      const bSoal = b.soal?.length || 0;
      return sortSoal.value === "asc"
        ? aSoal - bSoal
        : bSoal - aSoal;
    });
  }

  renderLatihanTable(data);
}

function populateFilterOptions() {
  const babSet = new Set();
  const mapelSet = new Set();
  const kelasSet = new Set();

  latihanData.forEach(l => {
    if (l.bab) babSet.add(l.bab);
    if (l.mapel) mapelSet.add(l.mapel);
    if (Array.isArray(l.kelas)) {
      l.kelas.forEach(k => kelasSet.add(k));
    }
  });

  filterBab.innerHTML = `<option value="">BAB</option>`;
  babSet.forEach(b => {
    filterBab.innerHTML += `<option value="${b}">${b}</option>`;
  });

  filterMapel.innerHTML = `<option value="">Mapel</option>`;
  mapelSet.forEach(m => {
    filterMapel.innerHTML += `<option value="${m}">${m}</option>`;
  });

  filterKelas.innerHTML = `<option value="">Kelas</option>`;
  kelasSet.forEach(k => {
    filterKelas.innerHTML += `<option value="${k}">${k}</option>`;
  });
}


// ================= MODAL EDIT =================
window.editLatihanModal = async (id) => {
  currentEditLatihanId = id;
  latihanSoalList.innerHTML = "";
  previewLatihan.innerHTML = "";

  // Load kelas
  editLatihanKelas.innerHTML = "";
  const kelasSnap = await getDocs(collection(db, "classes"));
  kelasSnap.forEach(d => {
    const k = d.data();
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = `${k.nama} (${k.tingkat})`;
    editLatihanKelas.appendChild(opt);
  });

  // Load latihan
  const docSnap = await getDocs(collection(db, "latihan"));
  docSnap.forEach(d => {
    if (d.id === id) {
      const data = d.data();
      latihanIdInput.value = id;
      editLatihanJudul.value = data.judul || "";
      editLatihanMapel.value = data.mapel || "";
      editLatihanBab.value = data.bab || "";
      editLatihanPublish.checked = !!data.publish;

      Array.from(editLatihanKelas.options).forEach(opt => {
        // Ambil nama kelas tanpa tingkat, misal "Kelas 12" dari "Kelas 12 (SMA)"
        const kelasNama = opt.textContent.split(" (")[0];
        opt.selected = Array.isArray(data.kelas) ? data.kelas.includes(kelasNama) : false;
      });

      renderLatihanSoal(data.soal || []);
      editModal.show();
    }
  });
};

// ================= RENDER SOAL =================
function renderLatihanSoal(soalArray) {
  latihanSoalList.innerHTML = "";
  soalArray.forEach((s,i)=>{
    const div = document.createElement("div");
    div.classList.add("mb-2","border","p-2");

    const opsiStr = Array.isArray(s.opsi) ? s.opsi.join(", ") : "";
    const kunciStr = Array.isArray(s.kunci) ? s.kunci.join(",") : "";

    div.innerHTML = `
      <label>Soal ${i+1}</label>
      <input type="text" class="form-control mb-1 soalBacaan" placeholder="Bacaan (opsional)" value="${s.bacaan || ''}">
      <input type="text" class="form-control mb-1 soalTanya" placeholder="Pertanyaan" value="${s.tanya || ''}">
      <input type="text" class="form-control mb-1 soalOpsi" placeholder="Opsi, pisahkan koma" value="${opsiStr}">
      <input type="text" class="form-control mb-1 soalKunci" placeholder="Index jawaban benar, pisahkan koma" value="${kunciStr}">
      <input type="text" class="form-control mb-1 soalBahas" placeholder="Pembahasan" value="${s.bahas || ''}">
      <button type="button" class="btn btn-sm btn-danger removeSoalBtn">Hapus</button>
    `;
    latihanSoalList.appendChild(div);

    div.querySelector(".removeSoalBtn").addEventListener("click", ()=> div.remove());
  });
  updatePreviewSoal();
}

// ================= TAMBAH SOAL BARU =================
addLatihanSoalBtn.addEventListener("click", () => {
  const div = document.createElement("div");
  div.classList.add("mb-2","border","p-2");
  div.innerHTML = `
    <label>Soal baru</label>
    <input type="text" class="form-control mb-1 soalBacaan" placeholder="Bacaan (opsional)">
    <input type="text" class="form-control mb-1 soalTanya" placeholder="Pertanyaan">
    <input type="text" class="form-control mb-1 soalOpsi" placeholder="Opsi, pisahkan koma">
    <input type="text" class="form-control mb-1 soalKunci" placeholder="Index jawaban benar, pisahkan koma">
    <input type="text" class="form-control mb-1 soalBahas" placeholder="Pembahasan">
    <button type="button" class="btn btn-sm btn-danger removeSoalBtn">Hapus</button>
  `;
  latihanSoalList.appendChild(div);
  div.querySelector(".removeSoalBtn").addEventListener("click", ()=> div.remove());
  updatePreviewSoal();
});

// ================= PREVIEW =================
function updatePreviewSoal(){
  const soalArray = Array.from(latihanSoalList.children).map(div=>{
    const bacaan = div.querySelector(".soalBacaan").value;
    const tanya = div.querySelector(".soalTanya").value;
    const opsi = div.querySelector(".soalOpsi").value.split(",").map(o=>o.trim()).filter(o=>o!=="");
    const kunci = div.querySelector(".soalKunci").value.split(",").map(x=>Number(x));
    const bahas = div.querySelector(".soalBahas").value;
    return { bacaan, tanya, opsi, kunci, bahas };
  });

  previewLatihan.innerHTML = soalArray.map((s,i)=>{
    return `<div class="soal-card">
      ${s.bacaan ? `<div class="soal-bacaan">${s.bacaan}</div>` : ""}
      <h6>${i+1}. ${s.tanya}</h6>
      <div class="opsi-container">
        ${s.opsi.map(o=>`<div class="option">${o}</div>`).join("")}
      </div>
      <div class="alert alert-info mt-2">${s.bahas || "<i>Pembahasan belum tersedia.</i>"}</div>
    </div>`;
  }).join("");

  if(window.MathJax) MathJax.typesetPromise();
}

latihanSoalList.addEventListener("input", updatePreviewSoal);

// ================= SIMPAN =================
btnSimpanLatihan.addEventListener("click", async ()=>{
  if(!currentEditLatihanId) return;

  const soalArray = Array.from(latihanSoalList.children).map(div=>{
    const bacaan = div.querySelector(".soalBacaan").value;
    const tanya = div.querySelector(".soalTanya").value;
    const opsi = div.querySelector(".soalOpsi").value.split(",").map(o=>o.trim()).filter(o=>o!=="");
    const kunci = div.querySelector(".soalKunci").value.split(",").map(x=>Number(x));
    const bahas = div.querySelector(".soalBahas").value;
    return { bacaan, tanya, opsi, kunci, bahas };
  });

  const kelasNama = Array.from(editLatihanKelas.selectedOptions).map(o=>{
    // Ambil nama kelas tanpa tingkat
    return o.textContent.split(" (")[0];
  });

  await updateDoc(doc(db,"latihan",currentEditLatihanId),{
    judul: editLatihanJudul.value,
    mapel: editLatihanMapel.value,
    bab: editLatihanBab.value,   // ⬅️ TAMBAH INI
    kelas: kelasNama,
    publish: editLatihanPublish.checked,
    soal: soalArray
  });


  editModal.hide();
  loadLatihan();
});

// ================= TOGGLE PUBLISH =================
window.togglePublish = async (id, status) => {
  await updateDoc(doc(db,"latihan",id),{
    publish: !status,
    aktif: !status
  });
  loadLatihan();
};
// ================= HAPUS LATIHAN =================
window.hapusLatihan = async (id, judul) => {
  const yakin = confirm(
    `Yakin mau menghapus latihan "${judul}"?\n\n` +
    `⚠️ Data akan dihapus PERMANEN dan tidak bisa dikembalikan.`
  );

  if (!yakin) return;

  try {
    await deleteDoc(doc(db, "latihan", id));
    loadLatihan();
    alert("✅ Latihan berhasil dihapus");
  } catch (err) {
    console.error(err);
    alert("❌ Gagal menghapus latihan");
  }
};

// ================= PREVIEW LATIHAN =================
window.previewLatihanModal = async (id)=>{
  const docSnap = await getDocs(collection(db,"latihan"));
  docSnap.forEach(d=>{
    if(d.id===id){
      const data = d.data();
      previewLatihan.innerHTML = data.soal.map((s,i)=>{
        return `<div class="soal-card">
          ${s.bacaan ? `<div class="soal-bacaan">${s.bacaan}</div>` : ""}
          <h6>${i+1}. ${s.tanya}</h6>
          <div class="opsi-container">
            ${s.opsi.map(o=>`<div class="option">${o}</div>`).join("")}
          </div>
          <div class="alert alert-info mt-2">${s.bahas || "<i>Pembahasan belum tersedia.</i>"}</div>
        </div>`;
      }).join("");
      editModal.show();
      if(window.MathJax) MathJax.typesetPromise();
    }
  });
};
// ================= EVENT FILTER =================
[
  sortJudul,
  filterStatus,
  filterBab,
  filterMapel,
  filterKelas,
  sortSoal
].forEach(el => {
  el.addEventListener("change", applyFilterSort);
});

searchLatihan.addEventListener("input", applyFilterSort);



// ================= INIT =================
loadLatihan();
