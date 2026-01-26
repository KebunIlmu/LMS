const judulEl = document.getElementById("judulMateri");
const pdfEl = document.getElementById("pdfMateri");
const pdfDriveEl = document.getElementById("pdfDrive");
const jsonEl = document.getElementById("jsonLatihan");
const youtubeEl = document.getElementById("youtubeId");

const btnPreview = document.getElementById("btnPreview");

const previewPdf = document.getElementById("previewPdf");
const previewVideo = document.getElementById("previewVideo");
const previewLatihan = document.getElementById("previewLatihan");

const pdfFrame = document.getElementById("pdfFrame");
const videoFrame = document.getElementById("videoFrame");
const latihanList = document.getElementById("latihanList");

btnPreview.onclick = async () => {
  console.log("PREVIEW CLICKED"); // DEBUG

  // reset
  previewPdf.style.display = "none";
  previewVideo.style.display = "none";
  previewLatihan.style.display = "none";
  latihanList.innerHTML = "";

  // ==== PDF PREVIEW ====
  if (pdfEl.files[0]) {
    const url = URL.createObjectURL(pdfEl.files[0]);
    pdfFrame.src = url;
    previewPdf.style.display = "block";
  } else if (pdfDriveEl.value.trim()) {
    pdfFrame.src = pdfDriveEl.value.trim();
    previewPdf.style.display = "block";
  }

  // ==== VIDEO PREVIEW ====
  if (youtubeEl.value.trim()) {
    videoFrame.src = `https://www.youtube.com/embed/${youtubeEl.value.trim()}`;
    previewVideo.style.display = "block";
  }

  // ==== LATIHAN PREVIEW ====
if (jsonEl.files[0]) {
  const text = await jsonEl.files[0].text();
  try {
    const latihanData = JSON.parse(text);

    if (!Array.isArray(latihanData.soal)) {
      throw new Error("Struktur JSON salah");
    }

    latihanData.soal.forEach((q, i) => {
      const li = document.createElement("li");
      li.className = "list-group-item";

      let opsiHtml = "";

      // ===== PILIHAN GANDA =====
      if (q.tipe === "pg") {
        opsiHtml = q.opsi.map((o, idx) => `
          <div class="form-check">
            <input type="radio" disabled class="form-check-input">
            <label class="form-check-label">${o}</label>
          </div>
        `).join("");
      }

      // ===== CHECKBOX =====
      if (q.tipe === "cb") {
        opsiHtml = q.opsi.map(o => `
          <div class="form-check">
            <input type="checkbox" disabled class="form-check-input">
            <label class="form-check-label">${o}</label>
          </div>
        `).join("");
      }

      // ===== TRUE FALSE =====
      if (q.tipe === "tf") {
        opsiHtml = `
          <div class="form-check">
            <input type="radio" disabled class="form-check-input">
            <label class="form-check-label">Benar</label>
          </div>
          <div class="form-check">
            <input type="radio" disabled class="form-check-input">
            <label class="form-check-label">Salah</label>
          </div>
        `;
      }

      li.innerHTML = `
        <strong>${i + 1}. ${q.pertanyaan}</strong>
        <div class="mt-2">${opsiHtml}</div>
      `;

      latihanList.appendChild(li);
    });

    previewLatihan.style.display = "block";
  } catch (e) {
    console.error(e);
    alert("JSON latihan salah!");
  }
}

};
