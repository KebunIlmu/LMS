const toggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

if(toggle){
  toggle.onclick = () => {
    sidebar.classList.add('show');
    overlay.classList.add('show');
  };
}

if(overlay){
  overlay.onclick = () => {
    sidebar.classList.remove('show');
    overlay.classList.remove('show');
  };
}
