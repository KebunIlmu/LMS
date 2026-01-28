import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { auth, db } from "../assets/js/firebase.js";

const params = new URLSearchParams(location.search);
const latihanId = params.get("id");

onAuthStateChanged(auth, async (user)=>{
  if(!user) return location.href="../index.html";
  const uid = user.uid;

  const resultSnap = await getDoc(doc(db,"results",uid,"latihan",latihanId));
  const latihanSnap = await getDoc(doc(db,"latihan",latihanId));

  if(!resultSnap.exists()) return;

  const result = resultSnap.data();
  const latihan = latihanSnap.data();

  document.getElementById("score").textContent = result.score;
  document.getElementById("benar").textContent = result.benar;
  document.getElementById("total").textContent = result.total;

  const box = document.getElementById("reviewBox");

  latihan.soal.forEach((s,i)=>{
    const benar = s.jawaban === result.jawabanSiswa[i];

    box.innerHTML += `
      <div class="card p-3 mb-3 ${benar?'correct':'wrong'}">
        <strong>Soal ${i+1}</strong>
        <p>${s.pertanyaan}</p>

        ${s.opsi.map((o,idx)=>`
          <div class="answer ${
            idx===s.jawaban ? 'fw-bold text-success' :
            idx===result.jawabanSiswa[i] ? 'text-danger' : ''
          }">
            ${o}
          </div>
        `).join("")}
      </div>
    `;
  });
});
