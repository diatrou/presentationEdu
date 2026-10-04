// Dynamic Dashboard Initialization
// Δυναμική Αρχικοποίηση Πίνακα Ελέγχου
document.addEventListener('DOMContentLoaded', () => {
  if (!window.CONFIG) {
    console.error('Config file is missing or not loaded correctly.');
    return;
  }

  const { institution, semester, department, courseTitle, instructors, schedule, weeks } = window.CONFIG;

  // Render Header Info
  // Εμφάνιση Πληροφοριών Κεφαλίδας
  document.getElementById('courseTitle').textContent = courseTitle;
  document.getElementById('courseMeta').textContent = `${institution} | ${department} | ${semester}`;

  // Render Instructors
  // Εμφάνιση Εκπαιδευτών
  const instructorContainer = document.getElementById('instructorInfo');
  instructorContainer.innerHTML = instructors.map(inst => `
    <p><strong>${inst.name}</strong><br>
    <small>${inst.role}</small><br>
    <a href="mailto:${inst.email}">${inst.email}</a></p>
  `).join('');

  // Render Schedule
  // Εμφάνιση Ωρολογίου Προγράμματος
  const scheduleContainer = document.getElementById('scheduleList');
  scheduleContainer.innerHTML = schedule.map(item => `
    <li class="${item.type}">
      <span>${item.label}</span>
      <span><strong>${item.start} - ${item.end}</strong></span>
    </li>
  `).join('');

  // Render Weeks Grid
  // Εμφάνιση Πλέγματος Εβδομάδων
  const weeksContainer = document.getElementById('weeksGrid');
  weeksContainer.innerHTML = weeks.map(week => `
    <a href="presentation.html?week=${week.id}" class="week-card">
      <h3>Εβδομάδα ${week.id}</h3>
      <p>${week.title}</p>
    </a>
  `).join('');
});