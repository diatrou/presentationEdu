const DEFAULT_REVEAL_OPTIONS = {
  controls: true,
  progress: true,
  center: true,
  hash: true,
  slideNumber: 'c/t',
  width: 1280,
  height: 720,
  margin: 0.04,
  transition: 'slide',
  backgroundTransition: 'fade'
};

let projectDirectoryHandle = null;

document.addEventListener('DOMContentLoaded', () => {
  const weeks = (window.CONFIG?.weeks || [])
    .filter(week => week.type === 'js' && isWeekDataPath(week.file))
    .sort((a, b) => a.id - b.id);
  const select = document.getElementById('weekSelect');

  weeks.forEach(week => {
    const option = document.createElement('option');
    option.value = String(week.id);
    option.textContent = `Εβδομάδα ${week.id}: ${week.title}`;
    select.appendChild(option);
  });

  if (weeks.length === 0) {
    select.disabled = true;
    showNotification('Δεν βρέθηκε εβδομάδα JS με διαδρομή assets/data/*.js στο config.js.');
  } else {
    document.getElementById('weekTitle').value = weeks[0].title || '';
  }

  document.getElementById('revealOptions').value = JSON.stringify(DEFAULT_REVEAL_OPTIONS, null, 2);
  addSlide();
  document.getElementById('weekSelect').addEventListener('change', updateWeekTitle);
  document.getElementById('addSlideButton').addEventListener('click', () => addSlide());
  document.getElementById('generateButton').addEventListener('click', generateWeekFile);
  document.getElementById('copyButton').addEventListener('click', copyCode);
  document.getElementById('saveButton').addEventListener('click', saveWeekFile);
  document.getElementById('selectDirectoryButton').addEventListener('click', selectProjectDirectory);
});

function isWeekDataPath(path) {
  return typeof path === 'string' &&
    /^assets\/data\/[a-z0-9_-]+\.js$/i.test(path);
}

function selectedWeek() {
  const id = Number(document.getElementById('weekSelect').value);
  return (window.CONFIG?.weeks || []).find(week =>
    week.id === id && week.type === 'js' && isWeekDataPath(week.file)
  );
}

function updateWeekTitle() {
  const week = selectedWeek();
  document.getElementById('weekTitle').value = week?.title || '';
}

function addSlide(slide = {}) {
  const card = document.createElement('article');
  card.className = 'slide-editor card';

  const header = document.createElement('div');
  header.className = 'slide-editor-header';
  const heading = document.createElement('h3');
  heading.textContent = `Διαφάνεια ${document.querySelectorAll('.slide-editor').length + 1}`;
  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'btn-danger';
  removeButton.textContent = 'Αφαίρεση';
  removeButton.addEventListener('click', () => {
    card.remove();
    renumberSlides();
  });
  header.append(heading, removeButton);

  const titleGroup = createField('Τίτλος διαφάνειας', 'slide-title', 'text', slide.title || '');
  const htmlGroup = createField('Περιεχόμενο HTML', 'slide-html', 'textarea', slide.html || '');
  htmlGroup.querySelector('textarea').rows = 10;
  htmlGroup.querySelector('textarea').spellcheck = false;
  htmlGroup.querySelector('textarea').placeholder = '<h2>Τίτλος</h2>\n<p class="fragment">Εμφανίζεται σταδιακά</p>';
  const attributesGroup = createField(
    'Χαρακτηριστικά διαφάνειας (JSON)',
    'slide-attributes',
    'textarea',
    JSON.stringify(slide.attributes || {}, null, 2)
  );
  attributesGroup.querySelector('textarea').rows = 5;
  attributesGroup.querySelector('textarea').spellcheck = false;
  attributesGroup.querySelector('textarea').placeholder = '{"data-background":"#123456","data-transition":"zoom"}';
  const notesGroup = createField('Σημειώσεις ομιλητή', 'slide-notes', 'textarea', slide.notes || '');
  notesGroup.querySelector('textarea').rows = 3;

  card.append(header, titleGroup, htmlGroup, attributesGroup, notesGroup);
  document.getElementById('slidesContainer').appendChild(card);
}

function createField(labelText, className, elementType, value) {
  const group = document.createElement('div');
  group.className = 'form-group editor-field';
  const id = `${className}-${document.querySelectorAll('.slide-editor').length}`;
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = labelText;
  const field = document.createElement(elementType);
  field.id = id;
  field.className = className;
  field.value = value;
  if (elementType === 'input') field.placeholder = labelText;
  group.append(label, field);
  return group;
}

function renumberSlides() {
  document.querySelectorAll('.slide-editor-header h3').forEach((heading, index) => {
    heading.textContent = `Διαφάνεια ${index + 1}`;
  });
}

function parseJsonField(element, label) {
  try {
    return JSON.parse(element.value);
  } catch (error) {
    throw new Error(`${label}: μη έγκυρο JSON (${error.message}).`);
  }
}

function generateWeekFile() {
  const week = selectedWeek();
  if (!week) {
    showNotification('Επιλέξτε έγκυρη εβδομάδα JS.');
    return;
  }

  try {
    const revealOptions = parseJsonField(document.getElementById('revealOptions'), 'Οι ρυθμίσεις Reveal');
    if (!revealOptions || Array.isArray(revealOptions) || typeof revealOptions !== 'object') {
      throw new Error('Οι ρυθμίσεις Reveal πρέπει να είναι αντικείμενο JSON.');
    }

    const slides = [...document.querySelectorAll('.slide-editor')].map((card, index) => {
      const attributes = parseJsonField(card.querySelector('.slide-attributes'), `Τα χαρακτηριστικά της διαφάνειας ${index + 1}`);
      if (!attributes || Array.isArray(attributes) || typeof attributes !== 'object') {
        throw new Error(`Τα χαρακτηριστικά της διαφάνειας ${index + 1} πρέπει να είναι αντικείμενο JSON.`);
      }
      return {
        title: card.querySelector('.slide-title').value,
        html: card.querySelector('.slide-html').value,
        attributes,
        notes: card.querySelector('.slide-notes').value
      };
    });

    if (slides.length === 0) throw new Error('Προσθέστε τουλάχιστον μία διαφάνεια.');
    const data = {
      week: week.id,
      displayTitle: document.getElementById('weekTitle').value,
      reveal: revealOptions,
      slides
    };
    const code = `// Περιεχόμενο παρουσίασης εβδομάδας ${week.id}\nwindow.CURRENT_WEEK_DATA = Object.freeze(${JSON.stringify(data, null, 2)});\n`;
    const output = document.getElementById('outputCode');
    output.textContent = code;
    output.dataset.generated = 'true';
    showNotification('Ο κώδικας της εβδομάδας δημιουργήθηκε.');
  } catch (error) {
    showNotification(error.message);
  }
}

function generatedCode() {
  const output = document.getElementById('outputCode');
  if (output.dataset.generated !== 'true') {
    showNotification('Παράγετε πρώτα τον κώδικα της εβδομάδας.');
    return null;
  }
  return output.textContent;
}

async function selectProjectDirectory() {
  if (!window.showDirectoryPicker) {
    showNotification('Η επιλογή φακέλου δεν υποστηρίζεται από αυτόν τον browser. Μπορείτε να κατεβάσετε το αρχείο JS.');
    return;
  }
  try {
    projectDirectoryHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    document.getElementById('directoryStatus').textContent =
      `Επιλεγμένος φάκελος project: ${projectDirectoryHandle.name}`;
    document.getElementById('directoryStatus').classList.add('is-selected');
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Αποτυχία επιλογής φακέλου project:', error);
      showNotification(`Δεν ήταν δυνατή η επιλογή φακέλου: ${error.message}`);
    }
  }
}

async function saveWeekFile() {
  const code = generatedCode();
  const week = selectedWeek();
  if (!code || !week) return;

  if (projectDirectoryHandle && window.showDirectoryPicker) {
    if (!window.confirm(`Να αντικατασταθεί το ${week.file};`)) return;
    try {
      const permission = await projectDirectoryHandle.queryPermission({ mode: 'readwrite' });
      const granted = permission === 'granted'
        ? permission
        : await projectDirectoryHandle.requestPermission({ mode: 'readwrite' });
      if (granted !== 'granted') throw new Error('Δεν δόθηκε άδεια εγγραφής στον φάκελο.');

      const directory = await projectDirectoryHandle.getDirectoryHandle('assets')
        .then(assets => assets.getDirectoryHandle('data'));
      const fileHandle = await directory.getFileHandle(week.file.split('/').pop(), { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(code);
      await writable.close();
      showNotification(`Αποθηκεύτηκε το ${week.file}.`);
      return;
    } catch (error) {
      console.error('Αποτυχία αποθήκευσης αρχείου εβδομάδας:', error);
      showNotification(`Δεν ήταν δυνατή η αποθήκευση: ${error.message}`);
      return;
    }
  }

  downloadWeekFile(code, week.file.split('/').pop());
}

function downloadWeekFile(code, fileName) {
  const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showNotification(`Λήφθηκε το αρχείο ${fileName}. Αντιγράψτε το στο assets/data.`);
}

async function copyCode() {
  const code = generatedCode();
  if (!code) return;
  try {
    await navigator.clipboard.writeText(code);
    showNotification('Ο κώδικας αντιγράφηκε.');
  } catch (error) {
    console.error('Αποτυχία αντιγραφής κώδικα:', error);
    showNotification('Η αντιγραφή δεν είναι διαθέσιμη. Χρησιμοποιήστε τη λήψη αρχείου.');
  }
}

function showNotification(message) {
  let toast = document.getElementById('toastNotification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastNotification';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  window.setTimeout(() => { toast.style.opacity = '0'; }, 4000);
}
