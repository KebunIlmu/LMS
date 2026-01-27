import { auth, db } from "../assets/js/firebase.js";
import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const table = document.getElementById("hasilTable");
const emptyState = document.getElementById("emptyState");

onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("Silakan login dulu");
    location.href = "login.html";
    return;
  }

  loadHasil(user.uid);
});

function loadHasil(uid) {
  const q = query(
    collection(db, "jawaban_latihan"),
    where("userId", "==", uid)
  );

  onSnapshot(q, (snap) => {
    table.innerHTML = "";

    if (snap.empty) {
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

    snap.forEach(doc => {
      const h = doc.data();

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${h.judulLatihan || "-"}</td>
        <td>${h.mapel || "-"}</td>
        <td>
          <span class="badge bg-${h.nilai >= 75 ? "success" : "danger"}">
            ${h.nilai ?? 0}
          </span>
        </td>
        <td>
          ${h.createdAt
            ? h.createdAt.toDate().toLocaleDateString("id-ID")
            : "-"}
        </td>
      `;

      table.appendChild(tr);
    });
  });
}
