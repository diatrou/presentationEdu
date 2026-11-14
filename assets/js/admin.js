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

  if (cfg.weeks && cfg.weeks.length > 0) {
    const weeksContainer = document.getElementById('weeksContainer');
    weeksContainer.innerHTML = '';

    cfg.weeks.forEach(item => {
      const weekType = item.type || 'js';
      const div = document.createElement('div');
      div.className = 'row week-item';
      div.innerHTML = `
        <input type="number" class="week-id" placeholder="ΑΡ" value="${item.id}" style="width: 60px;">
        <select class="week-type" onchange="onWeekTypeChange(this)" style="width: 130px;">
          <option value="js" ${weekType === 'js' ? 'selected' : ''}>JS (Data)</option>
          <option value="html" ${weekType === 'html' ? 'selected' : ''}>HTML (Iframe)</option>
        </select>
        <input type="text" class="week-title" placeholder="Τίτλος Εβδομάδας" value="${item.title || ''}" style="flex: 2;">
        <input type="text" class="week-file" placeholder="Διαδρομή Αρχείου" value="${item.file || ''}" style="flex: 2;">
        <button type="button" class="btn-danger" onclick="removeRow(this)">X</button>
      `;
      weeksContainer.appendChild(div);
    });
  }
}

document.addEventListener('DOMContentLoaded', loadExistingConfig);

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

function addWeekRow() {
  const container = document.getElementById('weeksContainer');
  const nextId = container.querySelectorAll('.week-item').length + 1;
  const padId = String(nextId).padStart(2, '0');
  
  const div = document.createElement('div');
  div.className = 'row week-item';
  div.innerHTML = `
    <input type="number" class="week-id" placeholder="ΑΡ" value="${nextId}" style="width: 60px;">
    <select class="week-type" onchange="onWeekTypeChange(this)" style="width: 130px;">
      <option value="js" selected>JS (Data)</option>
      <option value="html">HTML (Iframe)</option>
    </select>
    <input type="text" class="week-title" placeholder="Τίτλος Εβδομάδας" style="flex: 2;">
    <input type="text" class="week-file" placeholder="Διαδρομή Αρχείου" value="assets/data/week${padId}.js" style="flex: 2;">
    <button type="button" class="btn-danger" onclick="removeRow(this)">X</button>
  `;
  container.appendChild(div);
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

  document.querySelectorAll('.week-item').forEach(row => {
    weekItems.push({
      id: parseInt(row.querySelector('.week-id').value, 10),
      type: row.querySelector('.week-type').value,
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

/* (Οι συναρτήσεις εξαγωγής/εισαγωγής Excel για το πρόγραμμα παραμένουν αμετάβλητες) */
async function exportScheduleXLSX() { /* ... */ }
function importScheduleFile(event) { /* ... */ }