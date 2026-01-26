document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar");
  const toggleBtn = document.getElementById("toggleSidebar");
  const overlay = document.getElementById("overlay");

  if (!sidebar || !toggleBtn || !overlay) return;

  toggleBtn.onclick = () => {
    sidebar.classList.toggle("active");
    overlay.classList.toggle("active");
  };

  overlay.onclick = () => {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
  };

  document.querySelectorAll(".menu a").forEach(link => {
    link.onclick = () => {
      sidebar.classList.remove("active");
      overlay.classList.remove("active");
    };
  });
});
