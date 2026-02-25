
// ----- Dropdown -----

document.querySelectorAll(".dropdown-btn").forEach(btn => {
    btn.addEventListener("click", e => {
    e.stopPropagation();
    const dropdown = btn.parentElement;
    dropdown.classList.toggle("active");

    // Close other dropdowns
    document.querySelectorAll(".dropdown").forEach(d => {
        if (d !== dropdown) d.classList.remove("active");
     });
    });
});

// Close dropdown when clicking outside
window.addEventListener("click", e => {
    if (!e.target.closest(".dropdown")) {
    document.querySelectorAll(".dropdown").forEach(d => d.classList.remove("active"));
    }
});

// ----- Theme Button -----

const themeToggleButton = document.getElementById('theme-toggle');
const root = document.documentElement;

// Load saved theme or default to light
const currentTheme = localStorage.getItem('theme') || 'light';
root.setAttribute('data-theme', currentTheme);

// Toggle theme on button click
themeToggleButton.addEventListener('click', () => {
  const newTheme = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  root.setAttribute('data-theme', newTheme);

  // Save preference
  localStorage.setItem('theme', newTheme);
});