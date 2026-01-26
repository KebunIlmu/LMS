import { db } from "../../assets/js/firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// =================== ELEMENTS ===================
const table = document.getElementById("classTable");
const btnCreate = document.getElementById("btnCreate");
const namaKelasInput = document.getElementById("namaKelas");
const tingkatInput = document.getElementById("tingkat");
const jurusanInput = document.getElementById("jurusan");

// MODAL ELEMENTS
const addMemberModal = new bootstrap.Modal(document.getElementById("addMemberModal"));
const memberRole = document.getElementById("memberRole");
const memberSelect = document.getElementById("memberSelect");
const btnAddMemberModal = document.getElementById("btnAddMemberModal");

const siswaList = document.getElementById("siswaList");
const guruList = document.getElementById("guruList");
const viewMembersModal = new bootstrap.Modal(document.getElementById("viewMembersModal"));

// GLOBAL
let selectedClassId = null;

// =================== LOAD KELAS ===================
async function loadClasses() {
  table.innerHTML = "";
  const snap = await getDocs(collection(db, "classes"));

  snap.forEach(docSnap => {
    const c = docSnap.data();
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${c.nama}</td>
      <td>${c.tingkat}</td>
      <td>${c.jurusan}</td>
      <td class="d-flex gap-2">
        <button class="btn btn-sm btn-primary btn-add-member">Tambah Anggota</button>
        <button class="btn btn-sm btn-info btn-view-members">Lihat Anggota</button>
        <button class="btn btn-sm btn-danger btn-delete">Hapus</button>
      </td>
    `;

    // Hapus kelas
    tr.querySelector(".btn-delete").onclick = async () => {
      if (!confirm(`Hapus kelas ${c.nama}?`)) return;
      await deleteDoc(doc(db, "classes", docSnap.id));
      loadClasses();
    };

    // Tambah anggota
    tr.querySelector(".btn-add-member").onclick = () => {
      selectedClassId = docSnap.id;
      memberRole.value = "";
      memberSelect.innerHTML = "";
      addMemberModal.show();
    };

    // Lihat anggota
    tr.querySelector(".btn-view-members").onclick = () => {
      selectedClassId = docSnap.id;
      loadMembers(selectedClassId);
      viewMembersModal.show();
    };

    table.appendChild(tr);
  });
}

// =================== BUAT KELAS ===================
btnCreate.onclick = async () => {
  const nama = namaKelasInput.value.trim();
  const tingkat = tingkatInput.value.trim();
  const jurusan = jurusanInput.value.trim();

  if (!nama || !tingkat) {
    alert("Lengkapi data kelas!");
    return;
  }

  await addDoc(collection(db, "classes"), {
    nama,
    tingkat,
    jurusan,
    members: { siswa: [], guru: [] },
    createdAt: serverTimestamp()
  });

  namaKelasInput.value = "";
  tingkatInput.value = "";
  jurusanInput.value = "";

  loadClasses();
};

// =================== LOAD ANGGOTA UNTUK VIEW ===================
async function loadMembers(classId) {
  siswaList.innerHTML = "";
  guruList.innerHTML = "";

  const classRef = doc(db, "classes", classId);
  const classSnap = await getDoc(classRef);
  if (!classSnap.exists()) return;

  const classData = classSnap.data();
  const members = classData.members || { siswa: [], guru: [] };

  // ===== SISWA =====
  members.siswa.forEach(u => {
    const li = document.createElement("li");
    li.className =
      "list-group-item d-flex justify-content-between align-items-center";

    li.innerHTML = `
      <span>${u.nama} (${u.email})</span>
      <button class="btn btn-sm btn-danger">Keluarkan</button>
    `;

    li.querySelector("button").onclick = async () => {
      if (!confirm(`Keluarkan ${u.nama} dari kelas ini?`)) return;

      const updatedMembers = {
        ...members,
        siswa: members.siswa.filter(m => m.id !== u.id)
      };

      await updateDoc(classRef, { members: updatedMembers });
      loadMembers(classId);
    };

    siswaList.appendChild(li);
  });

  // ===== GURU =====
  members.guru.forEach(u => {
    const li = document.createElement("li");
    li.className =
      "list-group-item d-flex justify-content-between align-items-center";

    li.innerHTML = `
      <span>${u.nama} (${u.email})</span>
      <button class="btn btn-sm btn-danger">Keluarkan</button>
    `;

    li.querySelector("button").onclick = async () => {
      if (!confirm(`Keluarkan ${u.nama} dari kelas ini?`)) return;

      const updatedMembers = {
        ...members,
        guru: members.guru.filter(m => m.id !== u.id)
      };

      await updateDoc(classRef, { members: updatedMembers });
      loadMembers(classId);
    };

    guruList.appendChild(li);
  });
}

// =================== LOAD USER BERDASARKAN ROLE UNTUK MODAL ===================
memberRole.addEventListener("change", async () => {
  const role = memberRole.value;
  memberSelect.innerHTML = "";
  if (!role || !selectedClassId) return;

  // ambil data kelas
  const classSnap = await getDoc(doc(db, "classes", selectedClassId));
  if (!classSnap.exists()) return;

  const classData = classSnap.data();
  const members = classData.members?.[role] || [];
  const memberIds = members.map(m => m.id);

  // ambil semua user
  const snap = await getDocs(collection(db, "users"));
  snap.forEach(docSnap => {
    const u = docSnap.data();

    if (
      u.role !== role ||
      !u.active ||
      u.deleted ||
      memberIds.includes(docSnap.id) // 🔥 FILTER UTAMA
    ) return;

    const option = document.createElement("option");
    option.value = docSnap.id;
    option.textContent = `${u.nama} (${u.email})`;
    memberSelect.appendChild(option);
  });
});

btnAddMemberModal.onclick = async () => {
  if (!selectedClassId || !memberRole.value)
    return alert("Pilih role!");

  const selectedOptions = [...memberSelect.selectedOptions];
  if (!selectedOptions.length)
    return alert("Pilih anggota!");

  const classRef = doc(db, "classes", selectedClassId);
  const classSnap = await getDoc(classRef);
  if (!classSnap.exists()) return;

  const classData = classSnap.data();
  if (!classData.members)
    classData.members = { siswa: [], guru: [] };

  selectedOptions.forEach(option => {
    const userId = option.value;
    const [nama, email] = option.textContent.split(" (");
    const cleanEmail = email.replace(")", "");

    if (!classData.members[memberRole.value].some(u => u.id === userId)) {
      classData.members[memberRole.value].push({
        id: userId,
        nama,
        email: cleanEmail
      });
    }
  });

  await updateDoc(classRef, {
    members: classData.members
  });

  addMemberModal.hide();
  alert("Anggota berhasil ditambahkan");
};


// =================== INIT ===================
loadClasses();
