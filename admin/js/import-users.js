import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

import { db } from "../../assets/js/firebase.js";
import firebaseConfig from "../../assets/js/firebase-config.js";

// SECONDARY AUTH
const secondaryApp = initializeApp(firebaseConfig, "secondary");
const secondaryAuth = getAuth(secondaryApp);

const fileInput = document.getElementById("fileInput");
const importBtn = document.getElementById("importBtn");
const log = document.getElementById("log");

importBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) {
    alert("Pilih file Excel");
    return;
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        row.email,
        String(row.password)
      );

      const uid = cred.user.uid;

      const data = {
        nama: row.nama,
        email: row.email,
        role: row.role, // siswa / guru
        active: true,
        createdAt: serverTimestamp()
      };

      if (row.role === "siswa") {
        data.nisn = row.nisn || "";
        data.kelas = row.kelas || "";
        data.sekolah = row.sekolah || "";
        data.idSiswa = "SIS-" + Date.now();
      }

      await setDoc(doc(db, "users", uid), data);
      success++;

    } catch (err) {

      // EMAIL DUPLIKAT → SKIP
      if (err.code === "auth/email-already-in-use") {
        log.innerHTML += `
          <div class="text-warning">
            ⚠️ ${row.email} sudah terdaftar (skip)
          </div>
        `;
        skipped++;
        continue;
      }

      // ERROR LAIN
      log.innerHTML += `
        <div class="text-danger">
          ❌ ${row.email} → ${err.message}
        </div>
      `;
      failed++;
    }
  }

  log.innerHTML += `
    <div class="alert alert-info mt-3">
      ✅ Berhasil: ${success}<br>
      ⚠️ Skip (email sudah ada): ${skipped}<br>
      ❌ Gagal: ${failed}
    </div>
  `;
});
