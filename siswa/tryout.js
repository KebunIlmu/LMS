import { auth, db } from "../assets/js/firebase.js";

import {
collection,
getDocs,
getDoc,
doc,
setDoc,
serverTimestamp,
query,
where
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";


/* ================= ELEMENT ================= */

const tryoutList = document.getElementById("tryoutList");
const tryoutContainer = document.getElementById("tryoutContainer");
const hasilContainer = document.getElementById("hasilContainer");
const nilaiAkhir = document.getElementById("nilaiAkhir");
const reviewSoal = document.getElementById("reviewSoal");

const soalBox = document.getElementById("soalBox");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");

const navSoal = document.getElementById("navSoal");
const timerEl = document.getElementById("timer");

const judulTryout = document.getElementById("judulTryout");
const mapelTryout = document.getElementById("mapelTryout");


/* ================= STATE ================= */

let soalList = [];
let jawaban = {};

let index = 0;

let timer;
let sisaDetik = 0;

let currentUser = null;
let currentTryoutId = null;
let currentTryoutData = null;

let namaUser = ""; 
/* ================= LOGIN ================= */

onAuthStateChanged(auth, async(user)=>{

if(!user){
location.href="login.html";
return;
}

currentUser=user;

/* ambil data user dari Firestore */

const userRef = doc(db,"users",user.uid);
const userSnap = await getDoc(userRef);

if(userSnap.exists()){
namaUser = userSnap.data().nama || "";
}

loadTryout();

});


/* ================= LOAD TRYOUT ================= */

async function loadTryout(){

const q=query(collection(db,"tryout"),where("publish","==",true));
const snap=await getDocs(q);

tryoutList.innerHTML="";

if(snap.empty){

tryoutList.innerHTML=
`<div class="alert alert-warning">Belum ada tryout tersedia</div>`;

return;

}

for(const docSnap of snap.docs){

const t=docSnap.data();
const id=docSnap.id;

/* cek apakah sudah pernah mengerjakan */

const hasilRef = doc(db,"hasil_tryout",`${currentUser.uid}_${id}`);
const hasilSnap = await getDoc(hasilRef);

const div=document.createElement("div");
div.className="tryout-card";

let tombol="";

if(hasilSnap.exists()){

tombol=`<button class="btn btn-success mt-2">Lihat Pembahasan</button>`;

}else{

tombol=`<button class="btn btn-primary mt-2">Mulai Tryout</button>`;

}

div.innerHTML=`
<h5>${t.judul}</h5>
<small>${t.mapel||""}</small>
<br>
${tombol}
`;

div.onclick=()=>{

if(hasilSnap.exists()){

lihatPembahasan(id,t);

}else{

mulaiTryout(id,t);

}

};

tryoutList.appendChild(div);

}

}


/* ================= MULAI TRYOUT ================= */

function mulaiTryout(id,data){
masukFullscreen();

if(!data.soal||data.soal.length===0){

alert("Tryout belum memiliki soal");
return;

}

currentTryoutId=id;
currentTryoutData=data;

tryoutList.style.display="none";
tryoutContainer.style.display="block";

judulTryout.innerText=data.judul;
mapelTryout.innerText=data.mapel||"";

soalList=data.soal||[];

jawaban={};

index=0;

sisaDetik=(data.waktu||60)*60;

startTimer();

renderNav();
renderSoal();

}


/* ================= TIMER ================= */

function startTimer(){

timer=setInterval(()=>{

sisaDetik--;

let menit=String(Math.floor(sisaDetik/60)).padStart(2,"0");
let detik=String(sisaDetik%60).padStart(2,"0");

timerEl.innerText=`${menit}:${detik}`;

if(sisaDetik<=0){

clearInterval(timer);
submitTryout();

}

},1000);

}


/* ================= NAVIGASI NOMOR ================= */

function renderNav(){

navSoal.innerHTML="";

soalList.forEach((s,i)=>{

const btn=document.createElement("button");

/* tampilkan nomor */
btn.textContent = i + 1;

/* tombol aktif */
if(i === index){
btn.classList.add("active");
}

/* tombol sudah dijawab */
if(jawaban[i] !== undefined){
btn.classList.add("answered");
}

btn.onclick=()=>{
index=i;
renderSoal();
renderNav();
};

navSoal.appendChild(btn);

});

}

/* ================= UPDATE NAV ================= */

function updateNav(){

const btns=navSoal.querySelectorAll("button");

btns.forEach((btn,i)=>{

btn.classList.remove("answered");

if(jawaban[i]!==undefined){

btn.classList.add("answered");

}

});

}


/* ================= RENDER SOAL ================= */

function renderSoal(){

const s=soalList[index];

let html = `

${s.bacaan ? `<div class="soal-bacaan mb-3">${fixImgur(s.bacaan)}</div>` : ""}

<h6>${index+1}. ${fixImgur(s.tanya)}</h6>

`;

html+=`<div class="opsi-container">`;


/* ===== PILIHAN GANDA ===== */

if(s.tipe==="pg"){

html+=s.opsi.map((o,i)=>`

<div class="option ${jawaban[index]===i?"active":""}" data-index="${i}">
${fixImgur(o)}
</div>

`).join("");

}


/* ===== CHECKBOX ===== */

if(s.tipe==="cb"){

const jawab=jawaban[index]||[];

html+=s.opsi.map((o,i)=>`

<div>
<label>

<input type="checkbox" data-index="${i}"
${jawab.includes(i)?"checked":""}>

${fixImgur(o)}

</label>
</div>

`).join("");

}


/* ===== BENAR SALAH ===== */

if(s.tipe==="bs"){

const jawab=jawaban[index]||[];

html+=`
<table class="table table-bordered">

<thead>
<tr>
<th>Pernyataan</th>
<th>Benar</th>
<th>Salah</th>
</tr>
</thead>

<tbody>
`;

s.opsi.forEach((o,i)=>{

html+=`

<tr>

<td>${fixImgur(o)}</td>

<td>
<input type="radio"
name="bs_${i}"
data-index="${i}"
value="true"
${jawab[i]===true?"checked":""}>
</td>

<td>
<input type="radio"
name="bs_${i}"
data-index="${i}"
value="false"
${jawab[i]===false?"checked":""}>
</td>

</tr>

`;

});

html+=`</tbody></table>`;

}
/* ===== PERNYATAAN ===== */

if(s.tipe==="ps"){

const jawab=jawaban[index]||[];

html+=`
<table class="table table-bordered">

<thead>
<tr>
<th>Pernyataan</th>
<th>Sesuai</th>
<th>Tidak Sesuai</th>
</tr>
</thead>

<tbody>
`;

s.opsi.forEach((o,i)=>{

html+=`

<tr>

<td>${fixImgur(o)}</td>

<td>
<input type="radio"
name="ps_${i}"
data-index="${i}"
value="true"
${jawab[i]===true?"checked":""}>
</td>

<td>
<input type="radio"
name="ps_${i}"
data-index="${i}"
value="false"
${jawab[i]===false?"checked":""}>
</td>

</tr>

`;

});

html+=`</tbody></table>`;

}


/* ===== MENDUKUNG / TIDAK MENDUKUNG ===== */

if(s.tipe==="md"){

const jawab=jawaban[index]||[];

html+=`
<table class="table table-bordered">

<thead>
<tr>
<th>Alasan</th>
<th>Mendukung</th>
<th>Tidak Mendukung</th>
</tr>
</thead>

<tbody>
`;

s.opsi.forEach((o,i)=>{

html+=`

<tr>

<td>${fixImgur(o)}</td>

<td>
<input type="radio"
name="md_${i}"
data-index="${i}"
value="true"
${jawab[i]===true?"checked":""}>
</td>

<td>
<input type="radio"
name="md_${i}"
data-index="${i}"
value="false"
${jawab[i]===false?"checked":""}>
</td>

</tr>

`;

});

html+=`</tbody></table>`;

}
html+=`</div>`;

soalBox.innerHTML=html;


/* ===== EVENT PILIHAN GANDA ===== */

document.querySelectorAll(".option").forEach(el=>{

el.onclick=()=>{

jawaban[index]=Number(el.dataset.index);

renderSoal();
updateNav();

};

});


/* ===== EVENT CHECKBOX ===== */

document.querySelectorAll("input[type=checkbox]").forEach(el=>{

el.onchange=()=>{

const arr=jawaban[index]||[];

const val=Number(el.dataset.index);

if(el.checked){

if(!arr.includes(val)){
arr.push(val);
}

}else{

const pos=arr.indexOf(val);
if(pos>-1)arr.splice(pos,1);

}

jawaban[index]=arr;

updateNav();

};

});


/* ===== EVENT BENAR SALAH ===== */

document.querySelectorAll("input[type=radio]").forEach(el=>{

el.onchange=()=>{

const arr=jawaban[index]||[];

const idx=Number(el.dataset.index);

arr[idx]=el.value==="true";

jawaban[index]=arr;

updateNav();

};

});
if (window.MathJax) {
  MathJax.typesetPromise();
}

}


/* ================= BUTTON NAV ================= */

nextBtn.onclick=()=>{

if(index<soalList.length-1){

index++;
renderSoal();

}

};

prevBtn.onclick=()=>{

if(index>0){

index--;
renderSoal();

}

};


/* ================= SUBMIT ================= */

submitBtn.onclick=()=>{

if(confirm("Yakin ingin mengumpulkan tryout?")){

submitTryout();

}

};


/* ================= HITUNG NILAI ================= */

function hitungNilai(){

let benar=0;

soalList.forEach((s,i)=>{

const j=jawaban[i];

if(s.tipe==="pg"){
if(j===s.kunci[0])benar++;
}

if(s.tipe==="cb"){
if(JSON.stringify(j?.sort())===JSON.stringify(s.kunci?.sort()))benar++;
}

if(s.tipe==="bs"){
if(j && JSON.stringify(j)===JSON.stringify(s.kunci))benar++;
}

if(s.tipe==="ps"){
if(j && JSON.stringify(j)===JSON.stringify(s.kunci))benar++;
}

if(s.tipe==="md"){
if(j && JSON.stringify(j)===JSON.stringify(s.kunci))benar++;
}
});

return Math.round((benar/soalList.length)*100);

}


/* ================= SUBMIT TRYOUT ================= */

async function submitTryout(){

clearInterval(timer);

submitBtn.disabled=true;

const nilai=hitungNilai();

/* bersihkan jawaban supaya tidak ada undefined */

const jawabanClean = {};

Object.keys(jawaban).forEach(k=>{
jawabanClean[k] = jawaban[k] ?? null;
});


await setDoc(doc(db,"hasil_tryout",`${currentUser.uid}_${currentTryoutId}`),{

uid: currentUser.uid || "",

nama: namaUser || "",   // TAMBAHKAN INI

tryoutId: currentTryoutId || "",

judul: currentTryoutData?.judul || "",

mapel: currentTryoutData?.mapel || "",

nilai: nilai || 0,

jawaban: jawabanClean,

createdAt: serverTimestamp()

});

tampilkanHasil(nilai);

}

// TAMPILKAN HASIL
function tampilkanHasil(nilai){

tryoutContainer.style.display="none";
hasilContainer.style.display="block";

nilaiAkhir.innerText=nilai;

reviewSoal.innerHTML = soalList.map((s,i)=>{

let benar=false;

if(s.tipe==="pg"){
benar = jawaban[i]===s.kunci[0];
}

if(s.tipe==="cb"){
benar = JSON.stringify(jawaban[i]?.sort()) === JSON.stringify(s.kunci?.sort());
}

if(s.tipe==="bs"){
benar = JSON.stringify(jawaban[i]) === JSON.stringify(s.kunci);
}

if(s.tipe==="ps"){
benar = JSON.stringify(jawaban[i]) === JSON.stringify(s.kunci);
}

if(s.tipe==="md"){
benar = JSON.stringify(jawaban[i]) === JSON.stringify(s.kunci);
}

return `

<div class="soal-card mb-3">

${s.bacaan ? `<div class="soal-bacaan mb-2">${fixImgur(s.bacaan)}</div>` : ""}

<h6>${i+1}. ${fixImgur(s.tanya)}</h6>

<div>

${s.opsi.map((o,j)=>{

let label="";

if(s.tipe==="pg" && s.kunci[0]===j){
label=" ✅";
}

if(s.tipe==="cb" && s.kunci.includes(j)){
label=" ✅";
}

if((s.tipe==="bs" || s.tipe==="ps" || s.tipe==="md") && s.kunci[j]===true){
label=" ✅";
}
return `<div>${fixImgur(o)} ${label}</div>`;

}).join("")}

</div>

<div class="alert ${benar?"alert-success":"alert-danger"} mt-2">

${benar?"Jawaban kamu benar":"Jawaban kamu salah"}

</div>

<div class="alert alert-info">

<b>Pembahasan:</b><br>
${s.bahas || "Pembahasan belum tersedia"}

</div>

</div>

`;

}).join("");
// Setelah reviewSoal.innerHTML = ...
if (window.MathJax) {
  MathJax.typesetPromise();
}
}
async function lihatPembahasan(id,data){

const hasilRef = doc(db,"hasil_tryout",`${currentUser.uid}_${id}`);
const hasilSnap = await getDoc(hasilRef);

if(!hasilSnap.exists()){
alert("Belum ada hasil tryout");
return;
}

const hasil=hasilSnap.data();

currentTryoutId=id;
currentTryoutData=data;

soalList=data.soal||[];
jawaban=hasil.jawaban||{};

tampilkanHasil(hasil.nilai);

}

function masukFullscreen(){

const el = document.documentElement;

if(el.requestFullscreen){
el.requestFullscreen();
}
else if(el.webkitRequestFullscreen){
el.webkitRequestFullscreen();
}
else if(el.msRequestFullscreen){
el.msRequestFullscreen();
}

}
function fixImgur(html){
  if(!html) return "";
  return html.replace(
    /<img([^>]+)src=["']https?:\/\/i\.imgur\.com\/([^"']+)["']([^>]*)>/gi,
    '<img$1src="https://i.imgur.com/$2"$3 referrerpolicy="no-referrer">'
  );
}
