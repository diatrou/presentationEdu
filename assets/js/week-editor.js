let projectDirectoryHandle = null;
let loadedWeekId = null;

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
    select.value = String(weeks[0].id);
  }

  select.addEventListener('change', loadSelectedWeek);
  document.getElementById('generateButton').addEventListener('click', generateWeekFile);
  document.getElementById('copyButton').addEventListener('click', copyCode);
  document.getElementById('saveButton').addEventListener('click', saveWeekFile);
  document.getElementById('selectDirectoryButton').addEventListener('click', selectProjectDirectory);
  document.getElementById('textTarget').addEventListener('change', updateTextToolFields);
  document.getElementById('textSlide').addEventListener('change', updateCodeLanguage);
  document.getElementById('insertContentButton').addEventListener('click', insertContent);
  document.getElementById('slidePlacement').addEventListener('change', updateTemplatePlacement);
  document.getElementById('effectSlide').addEventListener('change', syncContentEffectSelection);
  document.getElementById('insertTemplateButton').addEventListener('click', insertSlideTemplate);
  document.getElementById('applySettingsButton').addEventListener('click', applyPresentationSettings);
  document.getElementById('weekData').addEventListener('input', () => {
    document.getElementById('outputCode').dataset.generated = 'false';
    document.getElementById('weekDataStatus').textContent = '';
    refreshSlideSelectors();
    syncPresentationSettings();
  });

  updateTextToolFields();
  updateTemplatePlacement();
  if (weeks.length > 0) loadSelectedWeek();
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

async function loadSelectedWeek() {
  const week = selectedWeek();
  const select = document.getElementById('weekSelect');
  const editor = document.getElementById('weekData');
  const status = document.getElementById('weekDataStatus');
  const output = document.getElementById('outputCode');
  if (!week) return;

  select.disabled = true;
  loadedWeekId = null;
  editor.value = '';
  output.dataset.generated = 'false';
  status.textContent = `Φόρτωση δεδομένων από ${week.file}…`;
  try {
    const data = await loadWeekData(week);
    editor.value = JSON.stringify(data, null, 2);
    loadedWeekId = week.id;
    status.textContent = `Φορτώθηκαν όλα τα δεδομένα από ${week.file}.`;
    refreshSlideSelectors();
    syncPresentationSettings();
  } catch (error) {
    console.error('Αποτυχία φόρτωσης δεδομένων εβδομάδας:', error);
    status.textContent = `Δεν ήταν δυνατή η φόρτωση: ${error.message}`;
    showNotification(`Δεν ήταν δυνατή η φόρτωση της εβδομάδας: ${error.message}`);
  } finally {
    select.disabled = false;
  }
}

function loadWeekData(week) {
  return new Promise((resolve, reject) => {
    const previousData = Object.getOwnPropertyDescriptor(window, 'CURRENT_WEEK_DATA');
    const script = document.createElement('script');
    const restoreData = () => {
      if (previousData) {
        Object.defineProperty(window, 'CURRENT_WEEK_DATA', previousData);
      } else {
        delete window.CURRENT_WEEK_DATA;
      }
      script.remove();
    };

    delete window.CURRENT_WEEK_DATA;
    script.src = week.file;
    script.onload = () => {
      const data = window.CURRENT_WEEK_DATA;
      restoreData();
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        reject(new Error(`Το ${week.file} δεν όρισε έγκυρο αντικείμενο CURRENT_WEEK_DATA.`));
        return;
      }
      try {
        const serialized = JSON.stringify(data);
        if (typeof serialized !== 'string') throw new Error('Τα δεδομένα δεν μπορούν να μετατραπούν σε JSON.');
        const parsed = JSON.parse(serialized);
        if (!Array.isArray(parsed.slides)) {
          throw new Error('Τα δεδομένα της εβδομάδας πρέπει να περιέχουν πίνακα slides.');
        }
        resolve(parsed);
      } catch (error) {
        reject(new Error(`Μη έγκυρα δεδομένα στο ${week.file}: ${error.message}`));
      }
    };
    script.onerror = () => {
      restoreData();
      reject(new Error(`Αποτυχία φόρτωσης του αρχείου ${week.file}.`));
    };
    document.head.appendChild(script);
  });
}

function editorData() {
  const data = JSON.parse(document.getElementById('weekData').value);
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Τα δεδομένα της εβδομάδας πρέπει να είναι αντικείμενο JSON.');
  }
  if (!Array.isArray(data.slides)) {
    throw new Error('Τα δεδομένα της εβδομάδας πρέπει να περιέχουν πίνακα slides.');
  }
  return data;
}

function slideEntries(data) {
  const entries = [];
  const visit = (slides, parentPath = '') => {
    slides.forEach((slide, index) => {
      if (!slide || typeof slide !== 'object' || Array.isArray(slide)) {
        throw new Error('Κάθε διαφάνεια πρέπει να είναι αντικείμενο JSON.');
      }
      const path = parentPath ? `${parentPath}.${index}` : String(index);
      if (Array.isArray(slide.subslides) && slide.subslides.length > 0) {
        visit(slide.subslides, path);
        return;
      }
      const indices = path.split('.').map(Number);
      const number = indices.slice(1).reduce(
        (label, childIndex) => childIndex === 0 ? label : `${label}.${childIndex}`,
        String(indices[0] + 1)
      );
      entries.push({
        path,
        label: `Διαφάνεια ${number}: ${slide.title || slide.type || 'Χωρίς τίτλο'}`,
        slide,
        container: slides,
        index
      });
    });
  };
  visit(data.slides);
  return entries;
}

function refreshSlideSelectors() {
  const editor = document.getElementById('weekData');
  let entries = [];
  try {
    entries = slideEntries(editorData());
  } catch (error) {
    document.getElementById('weekDataStatus').textContent =
      `Ελέγξτε το JSON για να ενημερωθούν οι επιλογές εργαλείων: ${error.message}`;
  }

  ['textSlide', 'templateSlide', 'effectSlide'].forEach(id => {
    const select = document.getElementById(id);
    const previousValue = select.value;
    select.replaceChildren();
    entries.forEach(entry => {
      const option = document.createElement('option');
      option.value = entry.path;
      option.textContent = entry.label;
      select.appendChild(option);
    });
    if (entries.some(entry => entry.path === previousValue)) select.value = previousValue;
    select.disabled = entries.length === 0;
  });
  if (document.getElementById('textTarget').value === 'code') updateCodeLanguage();
}

function updateTextToolFields() {
  const target = document.getElementById('textTarget').value;
  const isWeekTitle = target === 'week_title';
  const isLink = target === 'links';
  const isImage = target === 'image';
  const isTwoColumn = target === 'two_column';
  const showText = !isImage;

  document.getElementById('textSlideGroup').classList.toggle('is-hidden', isWeekTitle);
  document.getElementById('insertModeGroup').classList.toggle('is-hidden', isLink || isImage);
  document.getElementById('toolTextGroup').classList.toggle('is-hidden', !showText);
  document.getElementById('toolLanguageGroup').classList.toggle('is-hidden', target !== 'code');
  document.getElementById('toolUrlGroup').classList.toggle('is-hidden', !isLink);
  document.getElementById('toolImageGroup').classList.toggle('is-hidden', !isImage && !isTwoColumn);
  document.getElementById('toolCaptionGroup').classList.toggle('is-hidden', !isImage && !isTwoColumn);

  const labels = {
    week_title: 'Τίτλος εβδομάδας',
    slide_title: 'Κείμενο τίτλου',
    slide_content: 'Κείμενο διαφάνειας',
    code: 'Κώδικας παραδείγματος',
    explanation: 'Επεξήγηση κώδικα',
    notes: 'Σημειώσεις ομιλητή',
    html: 'Κώδικας HTML',
    links: 'Κείμενο συνδέσμου',
    image: 'Λεζάντα εικόνας',
    two_column: 'Κείμενο αριστερής στήλης'
  };
  document.getElementById('toolTextLabel').textContent = labels[target] || 'Κείμενο';
  if (target === 'code') updateCodeLanguage();
}

function updateCodeLanguage() {
  const languageSelect = document.getElementById('toolLanguage');
  try {
    const slide = findSlideEntry(editorData(), document.getElementById('textSlide').value)?.slide;
    const supportedLanguage = [...languageSelect.options].some(option => option.value === slide?.language);
    languageSelect.value = supportedLanguage ? slide.language : 'javascript';
  } catch (error) {
    languageSelect.value = 'javascript';
    document.getElementById('weekDataStatus').textContent =
      `Η γλώσσα κώδικα δεν ανανεώθηκε: ${error.message}`;
  }
}

function updateTemplatePlacement() {
  const placeBySlide = document.getElementById('slidePlacement').value !== 'end';
  document.getElementById('templateSlideGroup').classList.toggle('is-hidden', !placeBySlide);
}

function findSlideEntry(data, path) {
  return slideEntries(data).find(entry => entry.path === path);
}

function setTextValue(target, currentValue, newValue, mode) {
  if (mode === 'replace' || typeof currentValue !== 'string' || currentValue.length === 0) {
    return newValue;
  }
  const separator = target === 'slide_title' || target === 'week_title' ? ' ' : '\n';
  return `${currentValue}${separator}${newValue}`;
}

function validateImagePath(value) {
  const path = value.trim();
  if (!path) throw new Error('Συμπληρώστε τη διαδρομή ή το URL της εικόνας.');
  const url = new URL(path, document.baseURI);
  if (!['http:', 'https:', 'file:'].includes(url.protocol)) {
    throw new Error('Η εικόνα πρέπει να έχει τοπική διαδρομή ή URL http/https.');
  }
  return path;
}

function saveEditorData(data, message) {
  const editor = document.getElementById('weekData');
  editor.value = JSON.stringify(data, null, 2);
  editor.dispatchEvent(new Event('input', { bubbles: true }));
  document.getElementById('weekDataStatus').textContent = message;
}

function insertContent() {
  const target = document.getElementById('textTarget').value;
  const text = document.getElementById('toolText').value;
  const mode = document.getElementById('insertMode').value;
  try {
    const data = editorData();
    const slide = target === 'week_title' ? null : findSlideEntry(data, document.getElementById('textSlide').value)?.slide;
    if (target !== 'week_title' && !slide) {
      throw new Error('Επιλέξτε διαφάνεια για την εισαγωγή.');
    }

    switch (target) {
      case 'week_title':
        if (!text.trim()) throw new Error('Συμπληρώστε τον τίτλο της εβδομάδας.');
        data.displayTitle = setTextValue(target, data.displayTitle || data.title, text, mode);
        break;
      case 'slide_title':
      case 'slide_content':
      case 'notes':
      case 'html':
        if (!text.trim()) throw new Error('Συμπληρώστε το κείμενο που θέλετε να εισαγάγετε.');
        {
          const property = {
            slide_title: 'title',
            slide_content: 'content',
            notes: 'notes',
            html: 'html'
          }[target];
          slide[property] = setTextValue(target, slide[property], text, mode);
        }
        break;
      case 'code':
      case 'explanation':
        if (!text.trim()) throw new Error('Συμπληρώστε τον κώδικα ή την επεξήγησή του.');
        slide[target === 'code' ? 'codeSnippet' : 'explanation'] = setTextValue(
          target,
          slide[target === 'code' ? 'codeSnippet' : 'explanation'],
          text,
          mode
        );
        if (target === 'code') slide.language = document.getElementById('toolLanguage').value;
        break;
      case 'links': {
        const href = document.getElementById('toolUrl').value.trim();
        if (!text.trim() || !href) throw new Error('Συμπληρώστε το κείμενο και το URL του συνδέσμου.');
        const url = new URL(href, document.baseURI);
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('Ο σύνδεσμος πρέπει να χρησιμοποιεί http ή https.');
        }
        if (!Array.isArray(slide.links)) slide.links = [];
        slide.links.push({ text, url: href });
        break;
      }
      case 'image': {
        slide.layout = 'image';
        slide.image = validateImagePath(document.getElementById('toolImage').value);
        slide.imageCaption = document.getElementById('toolCaption').value.trim();
        if (!slide.imageCaption) throw new Error('Συμπληρώστε τη λεζάντα της εικόνας.');
        break;
      }
      case 'two_column': {
        if (!text.trim()) throw new Error('Συμπληρώστε το κείμενο της αριστερής στήλης.');
        slide.layout = 'two-column';
        slide.content = setTextValue(target, slide.content, text, mode);
        slide.image = validateImagePath(document.getElementById('toolImage').value);
        slide.imageCaption = document.getElementById('toolCaption').value.trim();
        break;
      }
      default:
        throw new Error('Επιλέξτε έγκυρο πεδίο προορισμού.');
    }

    saveEditorData(data, 'Το περιεχόμενο προστέθηκε στο πεδίο που επιλέξατε.');
  } catch (error) {
    document.getElementById('weekDataStatus').textContent = error.message;
    showNotification(`Δεν προστέθηκε το περιεχόμενο: ${error.message}`);
  }
}

function insertSlideTemplate() {
  const templates = {
    intro: { type: 'intro', title: 'Τίτλος διαφάνειας', subtitle: 'Υπότιτλος' },
    theory: { type: 'theory', title: 'Τίτλος διαφάνειας', bullets: ['Σημείο 1', 'Σημείο 2'] },
    code: {
      type: 'code',
      title: 'Παράδειγμα κώδικα',
      language: 'javascript',
      codeSnippet: 'console.log("Γεια σου κόσμε!");',
      explanation: 'Επεξήγηση του παραδείγματος.'
    },
    lab: { type: 'lab', title: 'Άσκηση εργαστηρίου', steps: ['Βήμα 1', 'Βήμα 2'] },
    summary: { type: 'summary', title: 'Ανακεφαλαίωση', bullets: ['Σημείο 1'] },
    subslides: {
      subslides: [
        { type: 'theory', title: 'Υποδιαφάνεια 1', bullets: ['Σημείο 1'] },
        { type: 'code', title: 'Υποδιαφάνεια κώδικα', language: 'javascript', codeSnippet: '' }
      ]
    },
    html: { title: 'Τίτλος διαφάνειας', html: '<p>Περιεχόμενο διαφάνειας</p>', attributes: {}, notes: '' }
  };
  const selection = document.getElementById('slideTemplate');
  const template = templates[selection.value];
  if (!template) {
    showNotification('Επιλέξτε πρώτα ένα πρότυπο διαφάνειας.');
    return;
  }
  try {
    const data = editorData();
    const placement = document.getElementById('slidePlacement').value;
    if (placement !== 'end') {
      const selectedEntry = findSlideEntry(data, document.getElementById('templateSlide').value);
      if (!selectedEntry) throw new Error('Επιλέξτε διαφάνεια για τη θέση του προτύπου.');
      if (template.subslides && selectedEntry.container !== data.slides) {
        throw new Error('Το πρότυπο κατακόρυφων υποδιαφανειών πρέπει να προστεθεί στο τέλος ή πριν/μετά από κύρια διαφάνεια.');
      }
      const insertionIndex = selectedEntry.index + (placement === 'after' ? 1 : 0);
      selectedEntry.container.splice(insertionIndex, 0, template);
    } else {
      data.slides.push(template);
    }
    saveEditorData(data, 'Η διαφάνεια προστέθηκε στη θέση που επιλέξατε.');
    selection.value = '';
  } catch (error) {
    document.getElementById('weekDataStatus').textContent = error.message;
    showNotification(`Δεν προστέθηκε η διαφάνεια: ${error.message}`);
  }
}

function syncPresentationSettings() {
  try {
    const data = editorData();
    const reveal = data.reveal && typeof data.reveal === 'object' && !Array.isArray(data.reveal)
      ? data.reveal
      : {};
    document.getElementById('revealControls').checked = reveal.controls !== false;
    document.getElementById('revealProgress').checked = reveal.progress !== false;
    document.getElementById('revealCenter').checked = reveal.center !== false;
    document.getElementById('revealHash').checked = reveal.hash !== false;
    document.getElementById('showNotes').checked = data.showNotes !== false;
    document.getElementById('showLinks').checked = data.showLinks === true;
    document.getElementById('slideNumberMode').value = reveal.slideNumber === false
      ? 'off'
      : reveal.slideNumber === true || reveal.slideNumber === 'c'
        ? 'number'
        : 'current-total';
    document.getElementById('transitionEffect').value = reveal.transition || 'slide';
    document.getElementById('backgroundEffect').value = reveal.backgroundTransition || 'fade';

    syncContentEffect(data);
  } catch (error) {
    document.getElementById('weekDataStatus').textContent =
      `Οι ρυθμίσεις εργαλείων δεν ανανεώθηκαν: ${error.message}`;
  }
}

function syncContentEffect(data = editorData()) {
  const selectedSlide = findSlideEntry(data, document.getElementById('effectSlide').value)?.slide;
  document.getElementById('contentEffect').value = selectedSlide?.fragmentEffect || 'none';
}

function syncContentEffectSelection() {
  try {
    syncContentEffect();
  } catch (error) {
    document.getElementById('weekDataStatus').textContent =
      `Το εφέ εμφάνισης δεν ανανεώθηκε: ${error.message}`;
  }
}

function applyPresentationSettings() {
  try {
    const data = editorData();
    if (!data.reveal || typeof data.reveal !== 'object' || Array.isArray(data.reveal)) {
      data.reveal = {};
    }
    data.reveal.controls = document.getElementById('revealControls').checked;
    data.reveal.progress = document.getElementById('revealProgress').checked;
    data.reveal.center = document.getElementById('revealCenter').checked;
    data.reveal.hash = document.getElementById('revealHash').checked;

    const slideNumberMode = document.getElementById('slideNumberMode').value;
    data.reveal.slideNumber = slideNumberMode === 'off'
      ? false
      : slideNumberMode === 'number'
        ? 'c'
        : 'c/t';
    data.reveal.transition = document.getElementById('transitionEffect').value;
    data.reveal.backgroundTransition = document.getElementById('backgroundEffect').value;
    data.showNotes = document.getElementById('showNotes').checked;
    data.showLinks = document.getElementById('showLinks').checked;

    const slide = findSlideEntry(data, document.getElementById('effectSlide').value)?.slide;
    const effect = document.getElementById('contentEffect').value;
    if (effect !== 'none' && !slide) throw new Error('Επιλέξτε διαφάνεια για το εφέ εμφάνισης.');
    if (slide) {
      if (effect === 'none') delete slide.fragmentEffect;
      else slide.fragmentEffect = effect;
    }

    saveEditorData(data, 'Οι λειτουργίες και τα εφέ εφαρμόστηκαν.');
  } catch (error) {
    document.getElementById('weekDataStatus').textContent = error.message;
    showNotification(`Δεν εφαρμόστηκαν οι ρυθμίσεις: ${error.message}`);
  }
}

function generateWeekFile() {
  const week = selectedWeek();
  if (!week) {
    showNotification('Επιλέξτε έγκυρη εβδομάδα JS.');
    return;
  }

  try {
    if (loadedWeekId !== week.id) throw new Error('Περιμένετε να φορτωθούν τα δεδομένα της επιλεγμένης εβδομάδας.');
    const data = JSON.parse(document.getElementById('weekData').value);
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Τα δεδομένα της εβδομάδας πρέπει να είναι αντικείμενο JSON.');
    }
    if (!Array.isArray(data.slides) || data.slides.length === 0) {
      throw new Error('Τα δεδομένα της εβδομάδας πρέπει να περιέχουν τουλάχιστον μία διαφάνεια στον πίνακα slides.');
    }
    const code = `// Περιεχόμενο παρουσίασης εβδομάδας ${week.id}\nwindow.CURRENT_WEEK_DATA = Object.freeze(${JSON.stringify(data, null, 2)});\n`;
    const output = document.getElementById('outputCode');
    output.textContent = code;
    output.dataset.generated = 'true';
    document.getElementById('weekDataStatus').textContent = 'Το JSON είναι έγκυρο.';
    showNotification('Ο κώδικας της εβδομάδας δημιουργήθηκε.');
  } catch (error) {
    document.getElementById('weekDataStatus').textContent = error.message;
    showNotification(`Δεν ήταν δυνατή η παραγωγή αρχείου: ${error.message}`);
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
