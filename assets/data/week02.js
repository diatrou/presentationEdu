// Data configuration for Week 2
// Ρυθμίσεις δεδομένων για την Εβδομάδα 2

window.CURRENT_WEEK_DATA = Object.freeze({
  week: 2,
  title: 'Εισαγωγή στη JavaScript & DOM Controls',
  slides: [
    
    // Διαφάνεια 1 (Οριζόντια)
    {
      type: 'theory',
      title: 'Επισκόπηση 2ης Εβδομάδας',
      bullets: [
        'Μεταβλητές και Τύποι Δεδομένων',
        'Συναρτήσεις και Events'
      ],
      links: [
        { text: 'Ύλη Μαθήματος', url: 'https://example.com/syllabus' }
      ],
      notes: 'Κάντε μια σύντομη ανακεφαλαίωση της 1ης εβδομάδας πριν ξεκινήσετε.'
    },

    // Διαφάνεια 2 (Ενότητα με Κατακόρυφες Υποδιαφάνειες)
    {
      subslides: [
        {
          type: 'theory',
          title: 'Βασικές Αρχές JavaScript',
          bullets: ['Syntax rules', 'Variables declaration'],
          notes: 'Εξηγήστε τη διαφορά μεταξύ let και const.'
        },
        {
          type: 'code',
          title: 'Παράδειγμα Variables',
          language: 'javascript',
          codeSnippet: `let name = "John";\nconst age = 25;`,
          explanation: 'Χρήση let για μεταβλητές τιμές και const για σταθερές.',
          links: [
            { text: 'JS Variables Guide', url: 'https://developer.mozilla.org' }
          ],
          notes: 'Αναφέρετε γιατί αποφεύγουμε πλέον το var.'
        }
      ]
    }

  ]
});