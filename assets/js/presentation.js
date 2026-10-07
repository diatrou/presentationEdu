// Initialization upon DOM content load
// Αρχικοποίηση κατά τη φόρτωση του περιεχομένου του DOM
document.addEventListener('DOMContentLoaded', () => {
    // Read URL query parameter (?week=X)
    // Ανάγνωση παραμέτρου URL (?week=X)
    const urlParams = new URLSearchParams(window.location.search);
    const weekParam = parseInt(urlParams.get('week')) || 1;

    // Locate week configuration object from config.js
    // Εντοπισμός στοιχείου ρυθμίσεων εβδομάδας από το config.js
    const config = window.CONFIG || {};
    const weekDataConfig = config.weeks ? config.weeks.find(w => w.id === weekParam) : null;
    
    // Fallback path construction matching exact assets/data/weekXX.js structure
    // Κατασκευή διαδρομής με βάση το config.js ή τη δομή assets/data/weekXX.js
    const formattedWeekNum = weekParam < 10 ? `0${weekParam}` : `${weekParam}`;
    const dataFilePath = (weekDataConfig && weekDataConfig.file) ? weekDataConfig.file : `assets/data/week${formattedWeekNum}.js`;

    // Dynamically load the weekly JS data file
    // Δυναμική φόρτωση του JS αρχείου δεδομένων της εβδομάδας
    loadScript(dataFilePath)
        .then(() => {
            const currentData = window.CURRENT_WEEK_DATA;
            if (!currentData) {
                console.error("Δεν βρέθηκαν δεδομένα για την εβδομάδα / No data found for week:", weekParam);
                return;
            }

            // Update title heading in the control bar
            // Ενημέρωση τίτλου στην μπάρα ελέγχου
            const weekTitleEl = document.getElementById('week-title');
            if (weekTitleEl) {
                weekTitleEl.textContent = `Εβδομάδα ${currentData.week}: ${currentData.title}`;
            }

            // Dynamically create slide elements in the DOM
            // Δημιουργία των διαφανειών στο DOM
            buildSlides(currentData.slides);

            // Initialize Reveal.js presentation engine and Highlight.js
            // Αρχικοποίηση Reveal.js & Highlight.js
            initReveal();

            // Initialize UI controls (Side Drawer, Link Toggle)
            // Αρχικοποίηση στοιχείων UI (Drawer, Toggle Συνδέσμων)
            initUIControls();

            // Start class schedule and automated break/next-class timer
            // Έναρξη ωρολογίου προγράμματος & αυτόματης αντίστροφης μέτρησης
            initScheduleTimer();
        })
        .catch(err => {
            console.error("Σφάλμα κατά τη φόρτωση των δεδομένων της εβδομάδας / Error loading week data:", err);
        });
});

/**
 * Helper function for dynamic script loading
 * Βοηθητική συνάρτηση δυναμικής φόρτωσης script
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Αποτυχία φόρτωσης script / Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
}

/**
 * Construct slides inside the DOM
 * Κατασκευή DOM διαφανειών
 */
function buildSlides(slides) {
    const container = document.getElementById('slidesContainer');
    if (!container) return;

    container.innerHTML = ''; // Clear initial container content / Καθαρισμός αρχικού περιεχομένου

    slides.forEach(slide => {
        if (slide.subslides && Array.isArray(slide.subslides)) {
            // Create vertical subslides container
            // Δημιουργία κατακόρυφων διαφανειών (Vertical Subslides)
            const parentSection = document.createElement('section');
            slide.subslides.forEach(subslide => {
                const childSection = createSlideElement(subslide);
                parentSection.appendChild(childSection);
            });
            container.appendChild(parentSection);
        } else {
            // Create standard horizontal slide
            // Απλή οριζόντια διαφάνεια
            const section = createSlideElement(slide);
            container.appendChild(section);
        }
    });
}

/**
 * Create an individual <section> element based on slide type
 * Δημιουργία μεμονωμένου <section> ανάλογα με τον τύπο της διαφάνειας
 */
function createSlideElement(slide) {
    const section = document.createElement('section');

    switch (slide.type) {
        case 'intro':
            section.innerHTML = `
                <h2>${slide.title || ''}</h2>
                ${slide.subtitle ? `<h3>${slide.subtitle}</h3>` : ''}
                ${slide.content || ''}
            `;
            break;

        case 'theory':
            let bulletsHtml = '';
            if (slide.bullets && slide.bullets.length > 0) {
                bulletsHtml = `<ul>${slide.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
            }
            section.innerHTML = `
                <h3>${slide.title || ''}</h3>
                ${bulletsHtml}
                ${slide.content || ''}
            `;
            break;

        case 'code':
            section.innerHTML = `
                <h3>${slide.title || ''}</h3>
                <pre><code class="language-${slide.language || 'javascript'}">${escapeHtml(slide.codeSnippet || '')}</code></pre>
                ${slide.explanation ? `<p><small>${slide.explanation}</small></p>` : ''}
            `;
            break;

        case 'lab':
            let stepsHtml = '';
            if (slide.steps && slide.steps.length > 0) {
                stepsHtml = `<ol>${slide.steps.map(s => `<li>${s}</li>`).join('')}</ol>`;
            }
            section.innerHTML = `
                <h3>${slide.title || ''}</h3>
                ${stepsHtml}
                ${slide.content || ''}
            `;
            break;

        case 'image':
            let imagesHtml = '';
            if (slide.images && Array.isArray(slide.images)) {
                imagesHtml = `<div class="image-gallery ${slide.images.length === 2 ? 'two-images' : 'single-image'}">
                    ${slide.images.map(img => `
                        <div class="img-wrapper">
                            <img src="${img.url \vert{}\vert{} img}" alt="${img.caption || slide.title || 'Slide Image'}" class="slide-image">
                            ${img.caption ? `<p class="img-caption"><small>${img.caption}</small></p>` : ''}
                        </div>
                    `).join('')}
                </div>`;
            } else if (slide.image) {
                imagesHtml = `<img src="${slide.image}" alt="${slide.title || 'Slide Image'}" class="slide-image">`;
            }
            section.innerHTML = `
                ${slide.title ? `<h3>${slide.title}</h3>` : ''}
                ${imagesHtml}
                ${slide.content ? `<div class="image-description">${slide.content}</div>` : ''}
            `;
            break;

        case 'summary':
            let summaryBullets = '';
            if (slide.bullets && slide.bullets.length > 0) {
                summaryBullets = `<ul>${slide.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
            }
            section.innerHTML = `
                <h3>${slide.title || ''}</h3>
                ${summaryBullets}
                ${slide.content || ''}
            `;
            break;

        default:
            // Default generic slide template supporting raw HTML
            // Προεπιλεγμένη/Generic διαφάνεια (υποστηρίζει και απευθείας HTML content)
            section.innerHTML = `
                ${slide.title ? `<h3>${slide.title}</h3>` : ''}
                ${slide.content || ''}
            `;
            break;
    }

    // Attach single image if specified and not handled by 'image' type
    // Προσθήκη εικόνας αν υπάρχει και δεν έχει ήδη επεξεργαστεί από τύπο 'image'
    if (slide.image && slide.type !== 'image') {
        const imgEl = document.createElement('img');
        imgEl.src = slide.image;
        imgEl.alt = slide.title || 'Slide Image';
        imgEl.classList.add('slide-image');
        section.appendChild(imgEl);
    }

    // Attach optional hyperlink elements
    // Προσθήκη υπερσυνδέσμων (links) αν υπάρχουν
    if (slide.links && slide.links.length > 0) {
        const linksContainer = document.createElement('div');
        linksContainer.classList.add('slide-links-container', 'hidden-links');
        
        slide.links.forEach(link => {
            const a = document.createElement('a');
            a.href = link.url;
            a.textContent = link.text;
            a.target = '_blank';
            a.classList.add('slide-link');
            linksContainer.appendChild(a);
        });
        
        section.appendChild(linksContainer);
    }

    // Attach speaker notes for Reveal.js (accessible via 'S' key)
    // Προσθήκη σημειώσεων ομιλητή για το Reveal.js (προσβάσιμες με το πλήκτρο 'S')
    if (slide.notes) {
        const notesEl = document.createElement('aside');
        notesEl.classList.add('notes');
        notesEl.textContent = slide.notes;
        section.appendChild(notesEl);
    }

    return section;
}

/**
 * Initialize Reveal.js instance and syntax highlighter
 * Αρχικοποίηση Reveal.js
 */
function initReveal() {
    if (typeof Reveal !== 'undefined') {
        Reveal.initialize({
            controls: true,
            progress: true,
            center: true,
            hash: true,
            slideNumber: 'c/t'
        }).then(() => {
            // Apply syntax highlighting using Highlight.js
            // Αρχικοποίηση Highlight.js για τον κώδικα
            if (typeof hljs !== 'undefined') {
                document.querySelectorAll('pre code').forEach((block) => {
                    hljs.highlightElement(block);
                });
            }
        });

        // Reset hyperlink visibility upon slide change
        // Επαναφορά απόκρυψης συνδέσμων σε κάθε αλλαγή διαφάνειας
        Reveal.on('slidechanged', () => {
            const toggleCheckbox = document.getElementById('link-toggle-checkbox');
            if (toggleCheckbox && !toggleCheckbox.checked) {
                document.querySelectorAll('.slide-links-container').forEach(el => {
                    el.classList.add('hidden-links');
                });
            }
        });
    }
}

/**
 * Initialize UI control listeners and drawer content
 * Αρχικοποίηση στοιχείων UI (Drawer & Toggle Συνδέσμων)
 */
function initUIControls() {
    // 1. Hyperlink visibility toggle
    // 1. Toggle Συνδέσμων
    const toggleCheckbox = document.getElementById('link-toggle-checkbox');
    if (toggleCheckbox) {
        toggleCheckbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            document.querySelectorAll('.slide-links-container').forEach(el => {
                if (isChecked) {
                    el.classList.remove('hidden-links');
                } else {
                    el.classList.add('hidden-links');
                }
            });
        });
    }

    // 2. Navigation Side Drawer controls
    // 2. Πλευρικό Μενού (Side Drawer)
    const drawer = document.getElementById('side-drawer');
    const openBtn = document.getElementById('drawer-toggle-btn');
    const closeBtn = document.getElementById('drawer-close-btn');
    const weeksList = document.getElementById('weeks-list');

    if (openBtn && drawer) {
        openBtn.addEventListener('click', () => drawer.classList.add('open'));
    }

    if (closeBtn && drawer) {
        closeBtn.addEventListener('click', () => drawer.classList.remove('open'));
    }

    // Populate drawer with Dashboard link, section header, and multi-level numbered slides
    // Γέμισμα λίστας Drawer με σύνδεσμο Dashboard, τίτλο ενότητας και σωστή αρίθμηση επιπέδων
    if (weeksList && window.CURRENT_WEEK_DATA) {
        weeksList.innerHTML = '';

        // Add link for returning to Dashboard
        // Προσθήκη συνδέσμου επιστροφής στον Πίνακα Ελέγχου
        const dashLi = document.createElement('li');
        dashLi.classList.add('dashboard-link-item');
        const dashA = document.createElement('a');
        dashA.href = 'index.html';
        dashA.innerHTML = '<strong>Πίνακας Ελέγχου (Dashboard)</strong>';
        dashLi.appendChild(dashA);
        weeksList.appendChild(dashLi);

        // Add separator
        // Προσθήκη διαχωριστικού
        const hrLi = document.createElement('li');
        hrLi.innerHTML = '<hr style="border: 0; border-top: 1px solid #334155; margin: 12px 0;">';
        weeksList.appendChild(hrLi);

        // Add drawer section title for current week slides
        // Προσθήκη τίτλου ενότητας διαφανειών εβδομάδας
        const titleLi = document.createElement('li');
        titleLi.innerHTML = `<span style="font-size: 0.85rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold;">Διαφάνειες Εβδομάδας ${window.CURRENT_WEEK_DATA.week || ''}</span>`;
        titleLi.style.marginBottom = '8px';
        weeksList.appendChild(titleLi);

        // Populate numbered slide titles ensuring all main sections get level 1 numbering
        // Γέμισμα αριθμημένων τίτλων εξασφαλίζοντας ότι όλες οι κύριες ενότητες παίρνουν αρίθμηση 1ου επιπέδου
        const slides = window.CURRENT_WEEK_DATA.slides || [];
        let slideIndex = 0;

        slides.forEach((slide) => {
            const mainNumberStr = `${slideIndex + 1}`;

            if (slide.subslides && Array.isArray(slide.subslides)) {
                slide.subslides.forEach((subslide, subIndex) => {
                    const rawTitle = subslide.title || slide.title || 'Διαφάνεια';

                    if (subIndex === 0) {
                        const li = createSlideLinkItem(mainNumberStr, rawTitle, slideIndex, subIndex, drawer, 1);
                        weeksList.appendChild(li);
                    } else {
                        const subNumberStr = `${slideIndex + 1}.${subIndex}`;
                        const li = createSlideLinkItem(subNumberStr, rawTitle, slideIndex, subIndex, drawer, 2);
                        weeksList.appendChild(li);
                    }
                });
            } else {
                const rawTitle = slide.title || 'Διαφάνεια';
                const li = createSlideLinkItem(mainNumberStr, rawTitle, slideIndex, null, drawer, 1);
                weeksList.appendChild(li);
            }
            slideIndex++;
        });
    }
}

/**
 * Helper function to create a structured slide navigation link inside the drawer
 * Βοηθητική συνάρτηση δημιουργίας δομημένου συνδέσμου πλοήγησης διαφάνειας στο drawer
 */
function createSlideLinkItem(numberStr, titleText, hIndex, vIndex, drawer, level) {
    const li = document.createElement('li');
    li.classList.add('slide-nav-item', `level-${level}`);

    const a = document.createElement('a');
    a.href = '#';

    const numSpan = document.createElement('span');
    numSpan.classList.add('slide-num');
    numSpan.textContent = `${numberStr}.`;

    const titleSpan = document.createElement('span');
    titleSpan.classList.add('slide-title-text');
    titleSpan.textContent = titleText;

    a.appendChild(numSpan);
    a.appendChild(titleSpan);

    a.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof Reveal !== 'undefined') {
            if (vIndex !== null) {
                Reveal.slide(hIndex, vIndex);
            } else {
                Reveal.slide(hIndex);
            }
        }
        if (drawer) drawer.classList.remove('open');
    });

    li.appendChild(a);
    return li;
}

/**
 * Smart schedule timer function calculating active class or countdown to next session
 * Έξυπνος μηχανισμός υπολογισμού τρέχουσας διδακτικής ώρας ή αντίστροφης μέτρησης
 */
function initScheduleTimer() {
    const timerEl = document.getElementById('schedule-timer');
    if (!timerEl) return;

    function updateTimer() {
        const config = window.CONFIG || {};
        const schedule = config.schedule || [];
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const currentSeconds = now.getSeconds();

        // Check if schedule.js provides custom parsing logic
        if (typeof window.getScheduleStatus === 'function') {
            timerEl.textContent = window.getScheduleStatus(schedule, now);
            return;
        }

        if (!schedule || schedule.length === 0) {
            timerEl.textContent = "Χωρίς Πρόγραμμα";
            return;
        }

        let activePeriod = null;
        let nextPeriod = null;

        for (let i = 0; i < schedule.length; i++) {
            const item = schedule[i];
            const [startH, startM] = item.start.split(':').map(Number);
            const [endH, endM] = item.end.split(':').map(Number);

            const startTotal = startH * 60 + startM;
            const endTotal = endH * 60 + endM;

            // Retrieve label or name from schedule object
            const periodName = item.label || item.name || `${item.start} - ${item.end}`;

            if (currentMinutes >= startTotal && currentMinutes < endTotal) {
                activePeriod = { ...item, periodName };
                break;
            } else if (currentMinutes < startTotal) {
                if (!nextPeriod || startTotal < (nextPeriod.startH * 60 + nextPeriod.startM)) {
                    nextPeriod = { ...item, periodName, startTotal, startH, startM };
                }
            }
        }

        if (activePeriod) {
            timerEl.textContent = `${activePeriod.periodName}`;
            timerEl.title = `Τρέχουσα ώρα: ${activePeriod.start} - ${activePeriod.end}`;
        } else if (nextPeriod) {
            const targetSeconds = nextPeriod.startTotal * 60;
            const nowSeconds = currentMinutes * 60 + currentSeconds;
            const diffSeconds = targetSeconds - nowSeconds;

            const remMinutes = Math.floor(diffSeconds / 60);
            const remSecs = diffSeconds % 60;

            const formattedTime = `${String(remMinutes).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
            timerEl.textContent = `Έναρξη σε: ${formattedTime}`;
            timerEl.title = `Επόμενη ώρα (${nextPeriod.periodName}) στις ${nextPeriod.start}`;
        } else {
            timerEl.textContent = "Εκτός Ωραρίου";
            timerEl.title = "Δεν υπάρχει άλλη προγραμματισμένη ώρα για σήμερα";
        }
    }

    updateTimer();
    setInterval(updateTimer, 1000);
}

/**
 * Escape special HTML characters for code snippets
 * Βοηθητική συνάρτηση escape HTML για ασφαλή προβολή κώδικα
 */
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}