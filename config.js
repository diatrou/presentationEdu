window.CONFIG = Object.freeze({
  // General institution & course information / Γενικές πληροφορίες
  institution: 'Σ.Α.Ε.Κ.',
  semester: 'Χειμερινό 2026Β',
  department: 'Τεχνικός Εφαρμογών Πληροφορικής (Πολυμέσα / Web Designer-Developer / Video Games)',
  courseTitle: 'Εργαλεία Ανάπτυξης Εφαρμογών Διαδικτύου',
  
  // Instructor details / Στοιχεία Εκπαιδευτών
  instructors: [
    {
      name: 'Δημήτριος Ιατρού',
      email: 'iatroud@gmail.com',
      role: 'Εκπαιδευτής'
    }
  ],

  // Schedule timeline (Lecture hours & breaks) / Ωρολόγιο Πρόγραμμα
  schedule: [
    {
      type: 'lecture',
      label: '1η Διδακτική Ώρα',
      start: '15:00',
      end: '15:45'
    }
  ],

  // List of weekly modules / Εβδομαδιαίες Ενότητες
  weeks: [
    {
      id: 1,
      title: 'Εισαγωγή στην Ανάπτυξη Εφαρμογών στο Διαδίκτυο',
      file: 'assets/data/week01.js'
    },
    {
      id: 2,
      title: 'Εισαγωγή στη JavaScript & DOM Controls',
      file: 'assets/data/week02.js'
    }
  ]
});