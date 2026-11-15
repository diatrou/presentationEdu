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
    instructorContainer.replaceChildren();
    instructors.forEach(inst => {
      const paragraph = document.createElement('p');
      const name = document.createElement('strong');
      name.textContent = inst.name || '';
      paragraph.appendChild(name);
      paragraph.appendChild(document.createElement('br'));

      const role = document.createElement('small');
      role.textContent = inst.role || '';
      paragraph.appendChild(role);
      paragraph.appendChild(document.createElement('br'));

      const email = document.createElement('a');
      email.href = `mailto:${inst.email || ''}`;
      email.textContent = inst.email || '';
      paragraph.appendChild(email);
      instructorContainer.appendChild(paragraph);
    });
  }

  // Render Schedule / Εμφάνιση Ωρολογίου Προγράμματος
  const scheduleContainer = document.getElementById('scheduleList');
  if (scheduleContainer) {
    const slots = Array.isArray(schedule) ? schedule : (schedule ? schedule.slots : []);
    if (Array.isArray(slots) && slots.length > 0) {
      scheduleContainer.replaceChildren();
      slots.forEach(item => {
        const listItem = document.createElement('li');
        if (item.type === 'lecture' || item.type === 'break') {
          listItem.classList.add(item.type);
        }

        const label = document.createElement('span');
        label.textContent = item.label || '';
        listItem.appendChild(label);

        const time = document.createElement('span');
        const timeText = document.createElement('strong');
        timeText.textContent = `${item.start || ''} - ${item.end || ''}`;
        time.appendChild(timeText);
        listItem.appendChild(time);
        scheduleContainer.appendChild(listItem);
      });
    }
  }

  // Render Weeks Grid / Εμφάνιση Πλέγματος Εβδομάδων
  const weeksContainer = document.getElementById('weeksGrid');
  if (weeksContainer && Array.isArray(weeks)) {
    weeksContainer.replaceChildren();
    weeks.forEach(week => {
      const weekId = String(week.id ?? '');
      const padId = weekId.padStart(2, '0');
      const weekTitle = week.title || '';
      const card = document.createElement('a');
      card.href = `presentation.html?week=${encodeURIComponent(weekId)}`;
      card.className = 'week-card';
      card.setAttribute('aria-label', `Εβδομάδα ${padId}: ${weekTitle}`);

      const heading = document.createElement('h3');
      heading.textContent = `Εβδομάδα ${padId}`;
      card.appendChild(heading);

      const title = document.createElement('p');
      title.textContent = weekTitle;
      card.appendChild(title);
      weeksContainer.appendChild(card);
    });
  }
}