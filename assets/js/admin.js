/* ==========================================================================
   Admin Dashboard Script (`admin.html`)
   Σενάριο Λειτουργιών Πίνακα Διαχείρισης (`admin.html`)
   ========================================================================== */

/* Load configuration values from window.CONFIG into form fields */
/* Φόρτωση τιμών ρυθμίσεων από το υφιστάμενο window.CONFIG στα πεδία της φόρμας */
function loadExistingConfig() {
  if (typeof window.CONFIG === 'undefined') return;

  const cfg = window.CONFIG;

  /* 1. General Information / Γενικές Πληροφορίες */
  if (cfg.institution) document.getElementById('institution').value = cfg.institution;
  if (cfg.semester) document.getElementById('semester').value = cfg.semester;
  if (cfg.department) document.getElementById('department').value = cfg.department;
  if (cfg.courseTitle) document.getElementById('courseTitle').value = cfg.courseTitle;

  /* 2. Instructor Details (Primary Instructor) / Στοιχεία Εκπαιδευτή (1ος Εκπαιδευτής) */
  if (cfg.instructors && cfg.instructors.length > 0) {
    const inst = cfg.instructors[0];
    if (inst.name) document.getElementById('instructorName').value = inst.name;
    if (inst.email) document.getElementById('instructorEmail').value = inst.email;
    if (inst.role) document.getElementById('instructorRole').value = inst.role;
  }

  /* 3. Schedule Timeline / Ωρολόγιο Πρόγραμμα */
  if (cfg.schedule && cfg.schedule.length > 0) {
    const schedContainer = document.getElementById('scheduleContainer');
    schedContainer.innerHTML = '';

    cfg.schedule.forEach(item => {
      const div = document.createElement('div');
      div.className = 'row schedule-item';
      div.innerHTML = `
        <select class="sched-type">
          <option value="lecture" ${item.type === 'lecture' ? 'selected' : ''}>Διδακτική Ώρα</option>
          <option value="break" ${item.type === 'break' ? 'selected' : ''}>Διάλειμμα</option>
        </select>
        <input type="text" class="sched-label" placeholder="Ετικέτα" value="${item.label || ''}">
        <input type="text" class="sched-start" placeholder="Έναρξη" value="${item.start || ''}">
        <input type="text" class="sched-end" placeholder="Λήξη" value="${item.end || ''}">
        <button type="button" class="btn-danger" onclick="removeRow(this)">X</button>
      `;
      schedContainer.appendChild(div);
    });
  }

  /* 4. Weekly Course Modules / Εβδομαδιαίες Ενότητες Μαθήματος */
  if (cfg.weeks && cfg.weeks.length > 0) {
    const weeksContainer = document.getElementById('weeksContainer');
    weeksContainer.innerHTML = '';

    cfg.weeks.forEach(item => {
      const div = document.createElement('div');
      div.className = 'row week-item';
      div.innerHTML = `
        <input type="number" class="week-id" placeholder="ΑΡ" value="${item.id}">
        <input type="text" class="week-title" placeholder="Τίτλος Εβδομάδας" value="${item.title || ''}">
        <input type="text" class="week-file" placeholder="Διαδρομή Αρχείου" value="${item.file || ''}">
        <button type="button" class="btn-danger" onclick="removeRow(this)">X</button>
      `;
      weeksContainer.appendChild(div);
    });
  }
}

/* Execute configuration loading on DOM content ready */
/* Εκτέλεση φόρτωσης ρυθμίσεων κατά την ολοκλήρωση φόρτωσης του DOM */
document.addEventListener('DOMContentLoaded', loadExistingConfig);

/* ==========================================================================
   Row Management & Reindexing
   Διαχείριση & Επαναρίθμηση Γραμμών
   ========================================================================== */

/* Add a new schedule row entry */
/* Προσθήκη νέας εγγραφής γραμμής ωρολογίου προγράμματος */
function addScheduleRow() {
  const container = document.getElementById('scheduleContainer');
  const div = document.createElement('div');
  div.className = 'row schedule-item';
  div.innerHTML = `
    <select class="sched-type">
      <option value="lecture">Διδακτική Ώρα</option>
      <option value="break">Διάλειμμα</option>
    </select>
    <input type="text" class="sched-label" placeholder="Ετικέτα">
    <input type="text" class="sched-start" placeholder="Έναρξη">
    <input type="text" class="sched-end" placeholder="Λήξη">
    <button type="button" class="btn-danger" onclick="removeRow(this)">X</button>
  `;
  container.appendChild(div);
}

/* Add a new weekly module row entry */
/* Προσθήκη νέας εγγραφής γραμμής εβδομαδιαίας ενότητας */
function addWeekRow() {
  const container = document.getElementById('weeksContainer');
  const nextId = container.querySelectorAll('.week-item').length + 1;
  const padId = String(nextId).padStart(2, '0');
  
  const div = document.createElement('div');
  div.className = 'row week-item';
  div.innerHTML = `
    <input type="number" class="week-id" placeholder="ΑΡ" value="${nextId}">
    <input type="text" class="week-title" placeholder="Τίτλος Εβδομάδας">
    <input type="text" class="week-file" placeholder="Διαδρομή Αρχείου" value="assets/data/week${padId}.js">
    <button type="button" class="btn-danger" onclick="removeRow(this)">X</button>
  `;
  container.appendChild(div);
}

/* Remove a target row element and trigger reindex if needed */
/* Αφαίρεση στοιχείου γραμμής και έναρξη επαναρίθμησης αν απαιτείται */
function removeRow(btn) {
  if (!btn) return;

  const row = btn.closest('.row') || btn.parentElement;
  if (!row) return;

  const container = row.parentElement;
  row.remove();

  if (container && container.id === 'weeksContainer') {
    reindexWeeks();
  }
}

/* Reindex weekly module identifiers and asset file paths */
/* Επαναρίθμηση αναγνωριστικών εβδομάδων και διαδρομών αρχείων */
function reindexWeeks() {
  const rows = document.querySelectorAll('#weeksContainer .week-item');
  rows.forEach((row, index) => {
    const newNum = index + 1;
    const padId = String(newNum).padStart(2, '0');
    
    const idInput = row.querySelector('.week-id');
    if (idInput) idInput.value = newNum;
    
    const fileInput = row.querySelector('.week-file');
    if (fileInput && fileInput.value.includes('assets/data/week')) {
      fileInput.value = `assets/data/week${padId}.js`;
    }
  });
}

/* ==========================================================================
   Config Generation & Clipboard Operations
   Παραγωγή Ρυθμίσεων & Λειτουργίες Προχείρου
   ========================================================================== */

/* Generate JavaScript configuration string with bilingual comments */
/* Παραγωγή συμβολοσειράς ρυθμίσεων JavaScript με δίγλωσση τεκμηρίωση */
function generateConfig() {
  const scheduleItems = [];
  const weekItems = [];

  document.querySelectorAll('.week-item').forEach(row => {
    weekItems.push({
      id: parseInt(row.querySelector('.week-id').value, 10),
      title: row.querySelector('.week-title').value,
      file: row.querySelector('.week-file').value
    });
  });

  document.querySelectorAll('.schedule-item').forEach(row => {
    scheduleItems.push({
      type: row.querySelector('.sched-type').value,
      label: row.querySelector('.sched-label').value,
      start: row.querySelector('.sched-start').value,
      end: row.querySelector('.sched-end').value
    });
  });

  const configText = `window.CONFIG = Object.freeze({
  // General institution & course information
  // Γενικές πληροφορίες ιδρύματος & μαθήματος
  institution: "${document.getElementById('institution').value}",
  semester: "${document.getElementById('semester').value}",
  department: "${document.getElementById('department').value}",
  courseTitle: "${document.getElementById('courseTitle').value}",
  
  // Instructor details
  // Στοιχεία Εκπαιδευτών
  instructors: [
    {
      name: "${document.getElementById('instructorName').value}",
      email: "${document.getElementById('instructorEmail').value}",
      role: "${document.getElementById('instructorRole').value}"
    }
  ],

  // Schedule timeline (Lecture hours & breaks)
  // Ωρολόγιο πρόγραμμα (Διδακτικές ώρες & διαλείμματα)
  schedule: ${JSON.stringify(scheduleItems, null, 4)},

  // List of weekly modules
  // Λίστα εβδομαδιαίων ενοτήτων
  weeks: ${JSON.stringify(weekItems, null, 4)}
});`;

  document.getElementById('outputCode').textContent = configText;
  showNotification('Ο κώδικας παράχθηκε με επιτυχία!');
}

/* Display floating toast notification message */
/* Προβολή αναδυόμενου ενημερωτικού μηνύματος (Toast) */
function showNotification(msg) {
  let toast = document.getElementById('toastNotification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastNotification';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  setTimeout(() => {
    toast.style.opacity = '0';
  }, 3000);
}

/* Copy generated configuration code to system clipboard */
/* Αντιγραφή του παραγόμενου κώδικα ρυθμίσεων στο πρόχειρο */
function copyCode() {
  const code = document.getElementById('outputCode').textContent;
  if (!code || code.startsWith('//')) {
    showNotification('Παρακαλώ παράγετε πρώτα τον κώδικα!');
    return;
  }
  navigator.clipboard.writeText(code);
  showNotification('Ο κώδικας αντιγράφηκε στο πρόχειρο!');
}

/* Save generated configuration code as config.js file */
/* Αποθήκευση του παραγόμενου κώδικα ρυθμίσεων ως αρχείο config.js */
async function saveConfigFile() {
  const code = document.getElementById('outputCode').textContent;
  if (!code || code.startsWith('//')) {
    showNotification('Παρακαλώ παράγετε πρώτα τον κώδικα!');
    return;
  }

  if ('showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'config.js',
        types: [{
          description: 'JavaScript File',
          accept: { 'text/javascript': ['.js'] },
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(code);
      await writable.close();
      showNotification('Το αρχείο αποθηκεύτηκε επιτυχώς!');
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn('Αποτυχία File System Access API, μετάβαση σε Blob download...', err);
    }
  }

  const blob = new Blob([code], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'config.js';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showNotification('Το αρχείο λήφθηκε επιτυχώς!');
}

/* ==========================================================================
   Schedule Import / Export Operations (.xlsx & .csv)
   Λειτουργίες Εισαγωγής / Εξαγωγής Προγράμματος (.xlsx & .csv)
   ========================================================================== */

/* Export schedule rows to Excel (.xlsx) file using SheetJS */
/* Εξαγωγή γραμμών προγράμματος σε αρχείο Excel (.xlsx) μέσω της SheetJS */
async function exportScheduleXLSX() {
  const rows = document.querySelectorAll('.schedule-item');
  if (rows.length === 0) {
    showNotification('Δεν υπάρχουν στοιχεία στο πρόγραμμα για εξαγωγή!');
    return;
  }

  if (typeof XLSX === 'undefined') {
    showNotification('Σφάλμα: Δεν βρέθηκε η τοπική βιβλιοθήκη assets/libs/xlsx.full.min.js');
    return;
  }

  const data = [['Όνομα', 'Έναρξη', 'Λήξη']];
  rows.forEach(row => {
    const label = row.querySelector('.sched-label').value;
    const start = row.querySelector('.sched-start').value;
    const end = row.querySelector('.sched-end').value;
    data.push([label, start, end]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Πρόγραμμα');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

  if ('showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'schedule.xlsx',
        types: [{
          description: 'Excel Workbook',
          accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(excelBuffer);
      await writable.close();
      showNotification('Το πρόγραμμα αποθηκεύτηκε επιτυχώς ως .xlsx!');
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn('Μετάβαση σε λήψη αρχείου...', err);
    }
  }

  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'schedule.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showNotification('Το πρόγραμμα εξήχθη επιτυχώς ως .xlsx!');
}

/* Import schedule file (.xlsx / .csv) and automatically calculate breaks */
/* Εισαγωγή αρχείου προγράμματος (.xlsx / .csv) με αυτόματο υπολογισμό διαλειμμάτων */
function importScheduleFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const fileName = file.name.toLowerCase();
  const reader = new FileReader();

  reader.onload = function(e) {
    let rawLectures = [];

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      if (typeof XLSX === 'undefined') {
        showNotification('Σφάλμα: Δεν βρέθηκε η τοπική βιβλιοθήκη assets/libs/xlsx.full.min.js');
        event.target.value = '';
        return;
      }

      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      jsonData.forEach((row, index) => {
        if (!row || row.length < 3) return;
        
        const label = String(row[0] || '').trim();
        const start = String(row[1] || '').trim();
        const end = String(row[2] || '').trim();

        if (index === 0 && (label.includes('Όνομα') || label.includes('Name'))) return;

        const isBreak = label.toLowerCase().includes('διάλειμμα') || label.toLowerCase().includes('break');
        if (!isBreak && start && end) {
          rawLectures.push({ label, start, end });
        }
      });
    } else {
      const text = e.target.result;
      const lines = text.split(/\r\n|\n/);

      lines.forEach((line, index) => {
        if (!line.trim()) return;
        if (index === 0 && (line.includes('Όνομα') || line.includes('Name'))) return;

        const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
        if (parts.length >= 3) {
          const label = parts[0];
          const start = parts[1];
          const end = parts[2];
          
          const isBreak = label.toLowerCase().includes('διάλειμμα') || label.toLowerCase().includes('break');
          if (!isBreak && start && end) {
            rawLectures.push({ label, start, end });
          }
        }
      });
    }

    if (rawLectures.length === 0) {
      showNotification('Δεν βρέθηκαν έγκυρες εγγραφές διδακτικών ωρών!');
      event.target.value = '';
      return;
    }

    rawLectures.sort((a, b) => a.start.localeCompare(b.start));

    const fullSchedule = [];
    rawLectures.forEach((lec, idx) => {
      fullSchedule.push({
        type: 'lecture',
        label: lec.label,
        start: lec.start,
        end: lec.end
      });

      if (idx < rawLectures.length - 1) {
        const nextLec = rawLectures[idx + 1];
        if (lec.end < nextLec.start) {
          fullSchedule.push({
            type: 'break',
            label: 'Διάλειμμα',
            start: lec.end,
            end: nextLec.start
          });
        }
      }
    });

    const container = document.getElementById('scheduleContainer');
    container.innerHTML = '';

    fullSchedule.forEach(item => {
      const div = document.createElement('div');
      div.className = 'row schedule-item';
      div.innerHTML = `
        <select class="sched-type">
          <option value="lecture" ${item.type === 'lecture' ? 'selected' : ''}>Διδακτική Ώρα</option>
          <option value="break" ${item.type === 'break' ? 'selected' : ''}>Διάλειμμα</option>
        </select>
        <input type="text" class="sched-label" placeholder="Ετικέτα" value="${item.label}">
        <input type="text" class="sched-start" placeholder="Έναρξη" value="${item.start}">
        <input type="text" class="sched-end" placeholder="Λήξη" value="${item.end}">
        <button type="button" class="btn-danger" onclick="removeRow(this)">X</button>
      `;
      container.appendChild(div);
    });

    event.target.value = '';
    showNotification(`Εισήχθησαν ${rawLectures.length} διδακτικές ώρες με αυτόματο υπολογισμό διαλειμμάτων!`);
  };

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    reader.readAsArrayBuffer(file);
  } else {
    reader.readAsText(file, 'UTF-8');
  }
}