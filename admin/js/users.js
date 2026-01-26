import { db, auth } from "../../assets/js/firebase.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

import { sendPasswordResetEmail } from
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

const table = document.getElementById("userTable");

async function loadUsers() {
  table.innerHTML = "";

  const snap = await getDocs(collection(db, "users"));

  snap.forEach(docSnap => {
    const u = docSnap.data();

    // ❌ Skip admin & user terhapus
    if (u.role === "admin") return;
    if (u.deleted === true) return;

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${u.nama}</td>
      <td>${u.email}</td>
      <td>${u.role}</td>
      <td>
        <span class="badge ${u.active ? 'bg-success' : 'bg-warning'}">
          ${u.active ? 'Aktif' : 'Nonaktif'}
        </span>
      </td>
      <td class="d-flex gap-2 flex-wrap">
        <button class="btn btn-sm ${u.active ? 'btn-danger' : 'btn-success'} btn-toggle">
          ${u.active ? 'Nonaktifkan' : 'Aktifkan'}
        </button>

        <button class="btn btn-sm btn-outline-secondary btn-reset">
          🔑 Reset
        </button>

        <button class="btn btn-sm btn-outline-danger btn-delete">
          🗑️ Hapus
        </button>
      </td>
    `;

    // ✅ Toggle aktif / nonaktif
    tr.querySelector(".btn-toggle").onclick = async () => {
      await updateDoc(doc(db, "users", docSnap.id), {
        active: !u.active
      });
      loadUsers();
    };

    // 🔑 Reset password
    tr.querySelector(".btn-reset").onclick = async () => {

      if (!u.active) {
        alert("Akun tidak aktif");
        return;
      }

      if (!confirm(`Kirim reset password ke ${u.email}?`)) return;

      try {
        await sendPasswordResetEmail(auth, u.email);
        alert("Email reset password berhasil dikirim");
      } catch (err) {
        alert(err.message);
      }
    };

    // ❌ Soft delete
    tr.querySelector(".btn-delete").onclick = async () => {
      if (!confirm(`Hapus akun ${u.nama}?`)) return;

      await updateDoc(doc(db, "users", docSnap.id), {
        active: false,
        deleted: true
      });

      loadUsers();
    };

    table.appendChild(tr);
  });
}

loadUsers();
