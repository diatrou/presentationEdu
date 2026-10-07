// Dynamic Dashboard Initialization
// Δυναμική Αρχικοποίηση Πίνακα Ελέγχου
document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
});

function initDashboard() {
  const config = window.CONFIG;

  if (!config) {
    // Retry shortly if CONFIG hasn't loaded yet
    // Επαναδοκιμή αν το CONFIG δεν έχει φορτωθεί ακόμη
    setTimeout(initDashboard, 100);
    return;
  }

  const { institution, semester, department, courseTitle, instructors, schedule, weeks } = config;

  // Render Header Info / Εμφάνιση Στοιχείων Κεφαλίδας
  const titleEl = document.getElementById('courseTitle');
  const metaEl = document.getElementById('courseMeta');

  if (titleEl && courseTitle) {
    titleEl.textContent = courseTitle;
  }
  
  if (metaEl) {
    metaEl.textContent = [institution, department, semester].filter(Boolean).join(' | ');
  }

  // Render Instructors / Εμφάνιση Εκπαιδευτών
  const instructorContainer = document.getElementById('instructorInfo');
  if (instructorContainer && Array.isArray(instructors)) {
    instructorContainer.innerHTML = instructors.map(inst => `
      <p>
        <strong>${escapeHtml(inst.name || '')}</strong><br>
        <small>${escapeHtml(inst.role || '')}</small><br>
        <a href="mailto:${escapeHtml(inst.email || '')}">${escapeHtml(inst.email || '')}</a>
      </p>
    `).join('');
  }

  // Render Schedule / Εμφάνιση Ωρολογίου Προγράμματος
  const scheduleContainer = document.getElementById('scheduleList');
  if (scheduleContainer) {
    const slots = Array.isArray(schedule) ? schedule : (schedule ? schedule.slots : []);
    if (Array.isArray(slots) && slots.length > 0) {
      scheduleContainer.innerHTML = slots.map(item => `
        <li class="${escapeHtml(item.type || '')}">
          <span>${escapeHtml(item.label || '')}</span>
          <span><strong>${escapeHtml(item.start || '')} - ${escapeHtml(item.end || '')}</strong></span>
        </li>
      `).join('');
    }
  }

  // Render Weeks Grid / Εμφάνιση Πλέγματος Εβδομάδων
  const weeksContainer = document.getElementById('weeksGrid');
  if (weeksContainer && Array.isArray(weeks)) {
    weeksContainer.innerHTML = weeks.map(week => {
      const padId = String(week.id).padStart(2, '0');
      const weekTitle = escapeHtml(week.title || '');
      return `
        <a href="presentation.html?week=${week.id}" class="week-card" aria-label="Εβδομάδα ${padId}: ${weekTitle}">
          <h3>Εβδομάδα ${padId}</h3>
          <p>${weekTitle}</p>
        </a>
      `;
    }).join('');
  }
}

/**
 * Helper function to escape HTML string
 * Βοηθητική συνάρτηση μετατροπής ειδικών χαρακτήρων HTML
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}