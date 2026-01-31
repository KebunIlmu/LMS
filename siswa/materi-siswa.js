import { auth, db } from "../assets/js/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// ================= ELEMENT =================
const materiListEl = document.getElementById("materiList");
const previewIframe = document.getElementById("previewIframe");

let currentUser = null;
let kelasUser = [];
let materiData = [];

// ================= LOGIN CHECK =================
onAuthStateChanged(auth, async (user) => {
  if (!user) { 
    alert("Silakan login dulu!"); 
    location.href="login.html"; 
    return; 
  }
  currentUser = user;

  console.log("User login:", user);

  // Ambil data user
  const snapUser = await getDocs(query(collection(db, "users"), where("__name__","==",currentUser.uid)));
  const userProfile = snapUser.docs[0]?.data();
  if(!userProfile || !userProfile.kelas){ 
    alert("Data user/kelas tidak ditemukan!"); 
    return; 
  }

  kelasUser = Array.isArray(userProfile.kelas) ? userProfile.kelas : [userProfile.kelas];
  console.log("Kelas user:", kelasUser);

  // Load materi
  await loadMateri();
});

// ================= LOAD MATERI =================
async function loadMateri(){
  const snap = await getDocs(query(collection(db,"materi"), where("publish","==",true)));
  materiData = [];

  snap.forEach(d=>{
    const m = d.data();
    const kelasList = Array.isArray(m.kelas) ? m.kelas : [m.kelas];

    // Filter sesuai nama kelas user (flexible match)
    const match = kelasList.some(kelasMateri =>
      kelasUser.some(userKelas => 
        kelasMateri.toLowerCase().includes(userKelas.toLowerCase()) || 
        userKelas.toLowerCase().includes(kelasMateri.toLowerCase())
      )
    );

    if(match){
      materiData.push({ id:d.id, ...m });
    }
  });

  console.log("Materi ditemukan:", materiData.map(m => m.judul));

  renderMateri();
}

// ================= RENDER =================
function renderMateri(){
  materiListEl.innerHTML = "";

  if(materiData.length===0){
    materiListEl.innerHTML="<div class='alert alert-warning'>Belum ada materi 😅</div>";
    return;
  }

  // Group per kelas → mapel
  let grouped = {};
  materiData.forEach(m=>{
    const kelasList = Array.isArray(m.kelas) ? m.kelas : [m.kelas];
    kelasList.forEach(k=>{
      // hanya ambil kelas user yang match
      const matchKelas = kelasUser.find(userKelas => 
        k.toLowerCase().includes(userKelas.toLowerCase()) || 
        userKelas.toLowerCase().includes(k.toLowerCase())
      );
      if(!matchKelas) return;

      if(!grouped[matchKelas]) grouped[matchKelas]={};
      const mapel = m.mapel || "Umum";
      if(!grouped[matchKelas][mapel]) grouped[matchKelas][mapel]=[];
      grouped[matchKelas][mapel].push(m);
    });
  });

  for(const kelas of Object.keys(grouped).sort()){
    const kelasCard = document.createElement("div"); 
    kelasCard.className="kelas-card";

    const kelasTitle = document.createElement("div"); 
    kelasTitle.className="kelas-title"; 
    kelasTitle.innerText=kelas;
    kelasCard.appendChild(kelasTitle);

    for(const mapel of Object.keys(grouped[kelas]).sort()){
      const mapelDiv = document.createElement("div"); 
      mapelDiv.className="mapel-item"; 
      mapelDiv.innerText=mapel;
      kelasCard.appendChild(mapelDiv);

      const materiContainer = document.createElement("div"); 
      materiContainer.style.display="none";
      kelasCard.appendChild(materiContainer);

      mapelDiv.onclick = ()=>{ 
        materiContainer.style.display = materiContainer.style.display==="none"?"block":"none"; 
      }

      grouped[kelas][mapel].forEach(m=>{
        const matDiv = document.createElement("div"); 
        matDiv.className="materi-item"; 
        matDiv.innerText=m.judul;
         matDiv.onclick = ()=> {
    window.location.href = `materi-detail.html?id=${m.id}`;
  }
        materiContainer.appendChild(matDiv);
      });
    }

    materiListEl.appendChild(kelasCard);
  }
}

// ================= PREVIEW =================
function previewMateri(m){
  const docFrame = previewIframe.contentDocument || previewIframe.contentWindow.document;

  docFrame.open();
  docFrame.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">

      <script>
      window.MathJax = {
        tex: {
          inlineMath: [["\\\\(","\\\\)"]],
          displayMath: [["\\\\[","\\\\]"]]
        }
      };
      </script>
      <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"></script>
    </head>
    <body>
      ${m.konten || "<p>Materi kosong</p>"}
    </body>
    </html>
  `);
  docFrame.close();
}
