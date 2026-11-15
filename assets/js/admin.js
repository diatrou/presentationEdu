/* ==========================================================================
   Admin Dashboard Script (`admin.html`)
   Σενάριο Λειτουργιών Πίνακα Διαχείρισης (`admin.html`)
   ========================================================================== */

function loadExistingConfig() {
  if (typeof window.CONFIG === 'undefined') return;

  const cfg = window.CONFIG;

  if (cfg.institution) document.getElementById('institution').value = cfg.institution;
  if (cfg.semester) document.getElementById('semester').value = cfg.semester;
  if (cfg.department) document.getElementById('department').value = cfg.department;
  if (cfg.courseTitle) document.getElementById('courseTitle').value = cfg.courseTitle;

  if (cfg.instructors && cfg.instructors.length > 0) {
    const inst = cfg.instructors[0];
    if (inst.name) document.getElementById('instructorName').value = inst.name;
    if (inst.email) document.getElementById('instructorEmail').value = inst.email;
    if (inst.role) document.getElementById('instructorRole').value = inst.role;
  }

  if (cfg.schedule && cfg.schedule.length > 0) {
    const schedContainer = document.getElementById('scheduleContainer');
    schedContainer.replaceChildren();

    cfg.schedule.forEach(item => {
      schedContainer.appendChild(createScheduleRow(item));
    });
  }

  if (cfg.weeks && cfg.weeks.length > 0) {
    const weeksContainer = document.getElementById('weeksContainer');
    weeksContainer.replaceChildren();

    cfg.weeks.forEach(item => {
      weeksContainer.appendChild(createWeekRow(item));
    });
  }
}

document.addEventListener('DOMContentLoaded', loadExistingConfig);

/* ==========================================================================
   Row Management & Reindexing
   Διαχείριση & Επαναρίθμηση Γραμμών
   ========================================================================== */

function createInput(type, className, placeholder, value = '') {
  const input = document.createElement('input');
  input.type = type;
  input.className = className;
  input.placeholder = placeholder;
  input.value = value;
  return input;
}

function createRemoveButton() {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn-danger';
  button.textContent = 'X';
  button.addEventListener('click', () => removeRow(button));
  return button;
}

function createScheduleRow(item = {}) {
  const row = document.createElement('div');
  row.className = 'row schedule-item';

  const typeSelect = document.createElement('select');
  typeSelect.className = 'sched-type';
  [
    { value: 'lecture', label: 'Διδακτική Ώρα' },
    { value: 'break', label: 'Διάλειμμα' }
  ].forEach(({ value, label }) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    typeSelect.appendChild(option);
  });
  typeSelect.value = item.type === 'break' ? 'break' : 'lecture';

  row.appendChild(typeSelect);
  row.appendChild(createInput('text', 'sched-label', 'Ετικέτα', item.label ?? ''));
  row.appendChild(createInput('text', 'sched-start', 'Έναρξη', item.start ?? ''));
  row.appendChild(createInput('text', 'sched-end', 'Λήξη', item.end ?? ''));
  row.appendChild(createRemoveButton());
  return row;
}

function createWeekRow(item = {}) {
  const row = document.createElement('div');
  row.className = 'row week-item';
  const idInput = createInput('number', 'week-id', 'ΑΡ', item.id ?? '');
  idInput.style.width = '60px';

  const typeSelect = document.createElement('select');
  typeSelect.className = 'week-type';
  typeSelect.style.width = '130px';
  [
    { value: 'js', label: 'JS (Data)' },
    { value: 'html', label: 'HTML (Iframe)' }
  ].forEach(({ value, label }) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    typeSelect.appendChild(option);
  });
  typeSelect.value = item.type === 'html' ? 'html' : 'js';
  typeSelect.addEventListener('change', () => onWeekTypeChange(typeSelect));

  const titleInput = createInput('text', 'week-title', 'Τίτλος Εβδομάδας', item.title ?? '');
  titleInput.style.flex = '2';
  const fileInput = createInput('text', 'week-file', 'Διαδρομή Αρχείου', item.file ?? '');
  fileInput.style.flex = '2';

  row.appendChild(idInput);
  row.appendChild(typeSelect);
  row.appendChild(titleInput);
  row.appendChild(fileInput);
  row.appendChild(createRemoveButton());
  return row;
}

/* Add a new schedule row entry */
/* Προσθήκη νέας εγγραφής γραμμής ωρολογίου προγράμματος */
function addScheduleRow() {
  const container = document.getElementById('scheduleContainer');
  container.appendChild(createScheduleRow());
}

function addWeekRow() {
  const container = document.getElementById('weeksContainer');
  const nextId = container.querySelectorAll('.week-item').length + 1;
  const padId = String(nextId).padStart(2, '0');
  container.appendChild(createWeekRow({
    id: nextId,
    type: 'js',
    file: `assets/data/week${padId}.js`
  }));
}

/* Αυτόματη αλλαγή προεπιλεγμένης διαδρομής αρχείου ανάλογα με τον τύπο */
function onWeekTypeChange(selectEl) {
  const row = selectEl.closest('.week-item');
  const idInput = row.querySelector('.week-id');
  const fileInput = row.querySelector('.week-file');
  if (!idInput || !fileInput) return;

  const num = parseInt(idInput.value, 10) || 1;
  const padId = String(num).padStart(2, '0');

  if (selectEl.value === 'html') {
    fileInput.value = `assets/content/week${padId}/index.html`;
  } else {
    fileInput.value = `assets/data/week${padId}.js`;
  }
}

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

function reindexWeeks() {
  const rows = document.querySelectorAll('#weeksContainer .week-item');
  rows.forEach((row, index) => {
    const newNum = index + 1;
    const padId = String(newNum).padStart(2, '0');
    
    const idInput = row.querySelector('.week-id');
    if (idInput) idInput.value = newNum;
    
    const typeSelect = row.querySelector('.week-type');
    const fileInput = row.querySelector('.week-file');
    
    if (fileInput) {
      if (typeSelect && typeSelect.value === 'html') {
        fileInput.value = `assets/content/week${padId}/index.html`;
      } else {
        fileInput.value = `assets/data/week${padId}.js`;
      }
    }
  });
}

function generateConfig() {
  const scheduleItems = [];
  const weekItems = [];

  for (const row of document.querySelectorAll('.week-item')) {
    const id = Number(row.querySelector('.week-id').value);
    if (!Number.isSafeInteger(id) || id < 1) {
      showNotification('Παρακαλώ ορίστε έγκυρο θετικό αριθμό για κάθε εβδομάδα.');
      return;
    }

    weekItems.push({
      id,
      type: row.querySelector('.week-type').value,
      title: row.querySelector('.week-title').value,
      file: row.querySelector('.week-file').value
    });
  }

  document.querySelectorAll('.schedule-item').forEach(row => {
    scheduleItems.push({
      type: row.querySelector('.sched-type').value,
      label: row.querySelector('.sched-label').value,
      start: row.querySelector('.sched-start').value,
      end: row.querySelector('.sched-end').value
    });
  });

  const config = {
    institution: document.getElementById('institution').value,
    semester: document.getElementById('semester').value,
    department: document.getElementById('department').value,
    courseTitle: document.getElementById('courseTitle').value,
    instructors: [{
      name: document.getElementById('instructorName').value,
      email: document.getElementById('instructorEmail').value,
      role: document.getElementById('instructorRole').value
    }],
    schedule: scheduleItems,
    weeks: weekItems
  };
  const configText = `// General institution, course, instructor, schedule, and week settings
// Γενικές ρυθμίσεις ιδρύματος, μαθήματος, εκπαιδευτή, προγράμματος και εβδομάδων
window.CONFIG = Object.freeze(${JSON.stringify(config, null, 2)});`;

  document.getElementById('outputCode').textContent = configText;
  showNotification('Ο κώδικας παράχθηκε με επιτυχία!');
}

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

function copyCode() {
  const code = document.getElementById('outputCode').textContent;
  if (!code || code.startsWith('//')) {
    showNotification('Παρακαλώ παράγετε πρώτα τον κώδικα!');
    return;
  }
  navigator.clipboard.writeText(code);
  showNotification('Ο κώδικας αντιγράφηκε στο πρόχειρο!');
}

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
    container.replaceChildren();

    fullSchedule.forEach(item => {
      container.appendChild(createScheduleRow(item));
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
