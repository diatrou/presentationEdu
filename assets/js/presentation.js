// Αρχικοποίηση κατά τη φόρτωση του περιεχομένου του DOM
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const weekParam = parseInt(urlParams.get('week')) || 1;

    const config = window.CONFIG || {};
    const weekDataConfig = config.weeks ? config.weeks.find(w => w.id === weekParam) : null;

    if (!weekDataConfig) {
        console.error("Δεν βρέθηκαν ρυθμίσεις για την εβδομάδα:", weekParam);
        return;
    }

    const weekTitleEl = document.getElementById('week-title');
    if (weekTitleEl) {
        weekTitleEl.textContent = `Εβδομάδα ${weekDataConfig.id}: ${weekDataConfig.title}`;
    }

    if (weekDataConfig.type === 'html') {
        setupHtmlPresentation(weekDataConfig);
    } else {
        const formattedNum = weekParam < 10 ? `0${weekParam}` : `${weekParam}`;
        const dataFilePath = weekDataConfig.file || `assets/data/week${formattedNum}.js`;
        const safeDataFilePath = resolveLocalAssetPath(dataFilePath);
        if (!safeDataFilePath) {
            console.error('Απορρίφθηκε μη τοπική διαδρομή αρχείου εβδομάδας:', dataFilePath);
            return;
        }

        loadScript(safeDataFilePath)
            .then(() => {
                const currentData = window.CURRENT_WEEK_DATA;
                if (!currentData) {
                    console.error("Δεν βρέθηκαν δεδομένα για την εβδομάδα:", weekParam);
                    return;
                }

                buildSlides(currentData.slides);
                initReveal();
                initUIControlsForJs(currentData);
            })
            .catch(err => {
                console.error("Σφάλμα κατά τη φόρτωση των δεδομένων της εβδομάδας:", err);
            });
    }
});

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Αποτυχία φόρτωσης script: ${src}`));
        document.head.appendChild(script);
    });
}

function resolveLocalAssetPath(path) {
    if (typeof path !== 'string' || !path.trim() || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(path)) {
        return null;
    }

    const url = new URL(path, document.baseURI);
    const baseUrl = new URL(document.baseURI);
    const assetsUrl = new URL('assets/', document.baseURI);
    if (url.origin !== baseUrl.origin || !['file:', 'http:', 'https:'].includes(url.protocol) ||
        !url.pathname.startsWith(assetsUrl.pathname)) {
        return null;
    }
    return url.href;
}

function setupHtmlPresentation(weekConfig) {
    // Προσθήκη ειδικής κλάσης στο body για τις HTML παρουσιάσεις
    // Add special class to body for HTML presentations
    document.body.classList.add('html-mode');

    const container = document.getElementById('slidesContainer');
    if (!container) return;

    const safeHtmlPath = resolveLocalAssetPath(weekConfig.file);
    if (!safeHtmlPath) {
        console.error('Απορρίφθηκε μη τοπική διαδρομή HTML εβδομάδας:', weekConfig.file);
        return;
    }

    container.replaceChildren();

    const section = document.createElement('section');
    section.classList.add('html-embed-section');
    section.style.width = '100%';
    section.style.height = '100%';
    section.style.margin = '0';
    section.style.padding = '0';

    const iframe = document.createElement('iframe');
    iframe.src = safeHtmlPath;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.display = 'block';
    iframe.title = weekConfig.title;

    section.appendChild(iframe);
    container.appendChild(section);

    if (typeof Reveal !== 'undefined') {
        Reveal.initialize({
            controls: false,
            progress: false,
            center: true,
            hash: true,
            slideNumber: false,
            width: 1280,
            height: 720,
            margin: 0.04
        });
    }

    initUIControlsForHtml(weekConfig);
}

function buildSlides(slides) {
    const container = document.getElementById('slidesContainer');
    if (!container) return;

    container.replaceChildren();

    slides.forEach(slide => {
        if (slide.subslides && Array.isArray(slide.subslides)) {
            const parentSection = document.createElement('section');
            slide.subslides.forEach(subslide => {
                const childSection = createSlideElement(subslide);
                parentSection.appendChild(childSection);
            });
            container.appendChild(parentSection);
        } else {
            const section = createSlideElement(slide);
            container.appendChild(section);
        }
    });
}

function createSlideElement(slide) {
    const section = document.createElement('section');
    const appendText = (tagName, text, parent = section) => {
        const element = document.createElement(tagName);
        element.textContent = text ?? '';
        parent.appendChild(element);
        return element;
    };
    const appendList = (tagName, items) => {
        if (!Array.isArray(items) || items.length === 0) return;

        const list = document.createElement(tagName);
        items.forEach(item => appendText('li', item, list));
        section.appendChild(list);
    };

    switch (slide.type) {
        case 'intro':
            appendText('h2', slide.title || '');
            if (slide.subtitle) appendText('h3', slide.subtitle);
            break;
        case 'theory':
            appendText('h3', slide.title || '');
            appendList('ul', slide.bullets);
            if (slide.content) appendText('p', slide.content);
            break;
        case 'code':
            appendText('h3', slide.title || '');
            const pre = document.createElement('pre');
            const code = document.createElement('code');
            const language = typeof slide.language === 'string' && /^[a-z0-9_-]+$/i.test(slide.language)
                ? slide.language
                : 'javascript';
            code.classList.add(`language-${language}`);
            code.textContent = slide.codeSnippet || '';
            pre.appendChild(code);
            section.appendChild(pre);
            if (slide.explanation) {
                const explanation = document.createElement('p');
                appendText('small', slide.explanation, explanation);
                section.appendChild(explanation);
            }
            break;
        case 'lab':
            appendText('h3', slide.title || '');
            appendList('ol', slide.steps);
            break;
        case 'summary':
            appendText('h3', slide.title || '');
            appendList('ul', slide.bullets);
            break;
        default:
            if (slide.title) appendText('h3', slide.title);
            if (slide.content) appendText('p', slide.content);
            break;
    }

    if (slide.image) {
        const imgEl = document.createElement('img');
        imgEl.src = slide.image;
        imgEl.alt = slide.title || 'Slide Image';
        imgEl.classList.add('slide-image');
        section.appendChild(imgEl);
    }

    if (Array.isArray(slide.links) && slide.links.length > 0) {
        const linksContainer = document.createElement('div');
        linksContainer.classList.add('slide-links-container', 'hidden-links');
        
        slide.links.forEach(link => {
            if (!link || typeof link.url !== 'string') {
                console.warn('Ignoring slide link with an invalid URL:', link);
                return;
            }

            let url;
            try {
                url = new URL(link.url, document.baseURI);
            } catch (error) {
                console.warn('Ignoring slide link with an invalid URL:', link.url, error);
                return;
            }
            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                console.warn('Ignoring slide link with a disallowed URL protocol:', link.url);
                return;
            }

            const a = document.createElement('a');
            a.href = url.href;
            a.textContent = link.text ?? '';
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.classList.add('slide-link');
            linksContainer.appendChild(a);
        });
        if (linksContainer.childElementCount > 0) section.appendChild(linksContainer);
    }

    if (slide.notes) {
        const notesEl = document.createElement('aside');
        notesEl.classList.add('notes');
        notesEl.textContent = slide.notes;
        section.appendChild(notesEl);
    }

    return section;
}

function initReveal() {
    if (typeof Reveal !== 'undefined') {
        Reveal.initialize({
            controls: true,
            progress: true,
            center: true,
            hash: true,
            slideNumber: 'c/t',
            width: 1280,
            height: 720,
            margin: 0.04
        }).then(() => {
            if (typeof hljs !== 'undefined') {
                document.querySelectorAll('pre code').forEach((block) => {
                    hljs.highlightElement(block);
                });
            }
        });

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

function initUIControlsForHtml(weekConfig) {
    setupDrawerBasicBehavior();

    const weeksList = document.getElementById('weeks-list');
    if (weeksList) populateDrawerHeader(weeksList, `Εξωτερική Παρουσίαση HTML (Εβδ. ${weekConfig.id})`);
}

function initUIControlsForJs(currentData) {
    setupDrawerBasicBehavior();

    const weeksList = document.getElementById('weeks-list');
    if (!weeksList) return;

    populateDrawerHeader(weeksList, `Διαφάνειες Εβδομάδας ${currentData.week || ''}`);
    const slides = currentData.slides || [];
    let slideIndex = 0;

    slides.forEach((slide) => {
        const mainNumberStr = `${slideIndex + 1}`;

        if (slide.subslides && Array.isArray(slide.subslides)) {
            slide.subslides.forEach((subslide, subIndex) => {
                const rawTitle = subslide.title || slide.title || 'Διαφάνεια';

                if (subIndex === 0) {
                    weeksList.appendChild(createSlideLinkItem(mainNumberStr, rawTitle, slideIndex, subIndex, 1));
                } else {
                    const subNumberStr = `${slideIndex + 1}.${subIndex}`;
                    weeksList.appendChild(createSlideLinkItem(subNumberStr, rawTitle, slideIndex, subIndex, 2));
                }
            });
        } else {
            const rawTitle = slide.title || 'Διαφάνεια';
            weeksList.appendChild(createSlideLinkItem(mainNumberStr, rawTitle, slideIndex, null, 1));
        }
        slideIndex++;
    });
}

function setupDrawerBasicBehavior() {
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

    const drawer = document.getElementById('side-drawer');
    const openBtn = document.getElementById('drawer-toggle-btn');
    const closeBtn = document.getElementById('drawer-close-btn');

    if (openBtn && drawer) {
        openBtn.addEventListener('click', () => drawer.classList.add('open'));
    }

    if (closeBtn && drawer) {
        closeBtn.addEventListener('click', () => drawer.classList.remove('open'));
    }
}

function populateDrawerHeader(weeksList, title) {
    weeksList.replaceChildren();

    const dashLi = document.createElement('li');
    dashLi.classList.add('dashboard-link-item');
    const dashA = document.createElement('a');
    dashA.href = 'index.html';
    const dashLabel = document.createElement('strong');
    dashLabel.textContent = 'Πίνακας Ελέγχου (Dashboard)';
    dashA.appendChild(dashLabel);
    dashLi.appendChild(dashA);
    weeksList.appendChild(dashLi);

    const hrLi = document.createElement('li');
    const divider = document.createElement('hr');
    divider.style.border = '0';
    divider.style.borderTop = '1px solid #334155';
    divider.style.margin = '12px 0';
    hrLi.appendChild(divider);
    weeksList.appendChild(hrLi);

    const titleLi = document.createElement('li');
    const sectionTitle = document.createElement('span');
    sectionTitle.textContent = title;
    sectionTitle.style.fontSize = '0.85rem';
    sectionTitle.style.color = '#94a3b8';
    sectionTitle.style.textTransform = 'uppercase';
    sectionTitle.style.letterSpacing = '0.5px';
    sectionTitle.style.fontWeight = 'bold';
    titleLi.appendChild(sectionTitle);
    titleLi.style.marginBottom = '8px';
    weeksList.appendChild(titleLi);
}

function createSlideLinkItem(numberStr, titleText, hIndex, vIndex, level) {
    const drawer = document.getElementById('side-drawer');
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
