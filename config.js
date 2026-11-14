window.CONFIG = Object.freeze({
  // General institution & course information
  // Γενικές πληροφορίες ιδρύματος & μαθήματος
  institution: "Πληροφορική",
  semester: "Προγραμματισμός",
  department: "HTML, CSS, Javascript",
  courseTitle: "HTML, CSS, Javascript από την αρχή",
  
  // Instructor details
  // Στοιχεία Εκπαιδευτών
  instructors: [
    {
      name: "Δημήτριος Ιατρού",
      email: "iatroud@gmail.com",
      role: "Εκπαιδευτής"
    }
  ],

  // Schedule timeline (Lecture hours & breaks)
  // Ωρολόγιο πρόγραμμα (Διδακτικές ώρες & διαλείμματα)
  schedule: [
    {
        "type": "lecture",
        "label": "1η Διδακτική Ώρα",
        "start": "02:02",
        "end": "02:05"
    }
],

  // List of weekly modules
  // Λίστα εβδομαδιαίων ενοτήτων
  weeks: [
    {
        "id": 1,
        "type": "html",
        "title": "Σημασιολογική Διάταξη Ιστοσελίδας με HTML (Semantics)",
        "file": "assets/content/week01/index.html"
    },
    {
        "id": 2,
        "type": "js",
        "title": "Δοκιμαστική 2η εβδομάδα",
        "file": "assets/data/week02.js"
    },
    {
        "id": 3,
        "type": "html",
        "title": "Reveal.js",
        "file": "assets/content/week03/index.html"
    }
]
});