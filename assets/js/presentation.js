// Dynamic Presentation Loader
// Δυναμική Φόρτωση Παρουσίασης
document.addEventListener('DOMContentLoaded', () => {
  // 1. Get 'week' parameter from URL query string
  // 1. Λήψη της παραμέτρου 'week' από το URL
  const urlParams = new URLSearchParams(window.location.search);
  const weekId = parseInt(urlParams.get('week'), 10) || 1;

  // 2. Validate configuration and target week
  // 2. Έλεγχος ρυθμίσεων και εβδομάδας στόχου
  if (!window.CONFIG || !window.CONFIG.weeks) {
    console.error('Configuration missing or invalid.');
    return;
  }

  const weekConfig = window.CONFIG.weeks.find(w => w.id === weekId);
  if (!weekConfig) {
    document.getElementById('slidesContainer').innerHTML = `
      <section>
        <h2>Η εβδομάδα ${weekId} δεν βρέθηκε!</h2>
        <p><a href="index.html">Επιστροφή στον Πίνακα Ελέγχου</a></p>
      </section>
    `;
    return;
  }

  // 3. Update Page Title
  // 3. Ενημέρωση Τίτλου Σελίδας
  document.title = `Εβδομάδα ${weekConfig.id}: ${weekConfig.title}`;

  // 4. Dynamic Script Injection for Week Data
  // 4. Δυναμική Φόρτωση Αρχείου Δεδομένων Εβδομάδας
  const script = document.createElement('script');
  script.src = weekConfig.file;

  script.onload = () => {
    if (window.CURRENT_WEEK_DATA && window.CURRENT_WEEK_DATA.slides) {
      renderSlides(window.CURRENT_WEEK_DATA.slides);
      
      // Initialize Reveal.js Framework
      // Αρχικοποίηση του Reveal.js
      Reveal.initialize({
        controls: true,
        progress: true,
        center: true,
        hash: true,
        slideNumber: 'c/t'
      });
    } else {
      showError('Τα δεδομένα της παρουσίασης δεν είναι στη σωστή μορφή.');
    }
  };

  script.onerror = () => {
    showError(`Αποτυχία φόρτωσης του αρχείου: ${weekConfig.file}`);
  };

  document.head.appendChild(script);
});

// Render Slides HTML Structure
// Δημιουργία HTML Δομής Διαφανειών
function renderSlides(slides) {
  const container = document.getElementById('slidesContainer');
  container.innerHTML = slides.map(slide => `
    <section>
      <h2>${slide.title}</h2>
      ${slide.content}
    </section>
  `).join('');
}

// Render Error Message
// Εμφάνιση Μηνύματος Σφάλματος
function showError(message) {
  document.getElementById('slidesContainer').innerHTML = `
    <section>
      <h2>Σφάλμα</h2>
      <p>${message}</p>
      <p><a href="index.html">Επιστροφή στον Πίνακα Ελέγχου</a></p>
    </section>
  `;
}