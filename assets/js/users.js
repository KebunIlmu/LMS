import { collection, getDocs, doc, updateDoc } 
from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { db } from "../../assets/js/firebase.js";

const table = document.getElementById("userTable");

const usersSnap = await getDocs(collection(db, "users"));

usersSnap.forEach((user) => {
  const data = user.data();

  if (data.role === "admin") return;

  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${data.nama}</td>
    <td>${data.email}</td>
    <td>${data.role}</td>
    <td>
      <span class="badge ${data.active ? 'bg-success' : 'bg-danger'}">
        ${data.active ? 'Aktif' : 'Nonaktif'}
      </span>
    </td>
    <td>
      <button class="btn btn-sm ${data.active ? 'btn-danger' : 'btn-success'}">
        ${data.active ? 'Nonaktifkan' : 'Aktifkan'}
      </button>
    </td>
  `;

  tr.querySelector("button").addEventListener("click", async () => {
    const konfirmasi = confirm("Yakin ingin mengubah status akun?");
    if (!konfirmasi) return;

    await updateDoc(doc(db, "users", user.id), {
      active: !data.active
    });

    location.reload();
  });

  table.appendChild(tr);
});
