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

                if (weekTitleEl && typeof currentData.displayTitle === 'string' && currentData.displayTitle) {
                    weekTitleEl.textContent = `Εβδομάδα ${weekDataConfig.id}: ${currentData.displayTitle}`;
                }

                buildSlides(currentData.slides, {
                    showNotes: currentData.showNotes !== false,
                    showLinks: currentData.showLinks === true
                });
                initReveal(currentData.reveal);
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
            margin: 0.04,
            katex: {
                local: 'assets/libs/katex'
            },
            plugins: [RevealMarkdown, RevealNotes, RevealSearch, RevealZoom, RevealMath.KaTeX]
        });
    }

    initUIControlsForHtml(weekConfig);
}

function buildSlides(slides, settings = {}) {
    const container = document.getElementById('slidesContainer');
    if (!container) return;

    container.replaceChildren();

    slides.forEach(slide => {
        if (slide.subslides && Array.isArray(slide.subslides)) {
            const parentSection = document.createElement('section');
            slide.subslides.forEach(subslide => {
                const childSection = createSlideElement(subslide, settings);
                parentSection.appendChild(childSection);
            });
            container.appendChild(parentSection);
        } else {
            const section = createSlideElement(slide, settings);
            container.appendChild(section);
        }
    });
}

function createSlideElement(slide, settings = {}) {
    const section = document.createElement('section');
    if (slide.attributes && typeof slide.attributes === 'object' && !Array.isArray(slide.attributes)) {
        Object.entries(slide.attributes).forEach(([name, value]) => {
            if (/^[a-z_:][a-z0-9:._-]*$/i.test(name) && !/^on/i.test(name) &&
                (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')) {
                section.setAttribute(name, String(value));
            }
        });
    }
    const appendText = (tagName, text, parent = section) => {
        const element = document.createElement(tagName);
        element.textContent = text ?? '';
        parent.appendChild(element);
        return element;
    };
    const fragmentEffects = new Set([
        'fade-in', 'fade-out', 'fade-up', 'fade-down', 'fade-left', 'fade-right',
        'grow', 'shrink', 'highlight-red', 'highlight-green', 'highlight-blue'
    ]);
    const fragmentEffect = fragmentEffects.has(slide.fragmentEffect) ? slide.fragmentEffect : '';
    const addFragmentEffect = element => {
        if (fragmentEffect) element.classList.add('fragment', fragmentEffect);
        return element;
    };
    const appendContentText = (tagName, text, parent = section) =>
        addFragmentEffect(appendText(tagName, text, parent));
    const appendImage = (parent, useFigure = false) => {
        const image = document.createElement('img');
        image.src = slide.image;
        image.alt = slide.imageCaption || slide.title || 'Slide Image';
        image.classList.add('slide-image');
        if (useFigure || slide.imageCaption) {
            const figure = document.createElement('figure');
            figure.classList.add('slide-image-figure');
            addFragmentEffect(figure);
            figure.appendChild(image);
            if (slide.imageCaption) {
                const caption = document.createElement('figcaption');
                caption.textContent = slide.imageCaption;
                figure.appendChild(caption);
            }
            parent.appendChild(figure);
        } else {
            addFragmentEffect(image);
            parent.appendChild(image);
        }
    };
    const appendList = (tagName, items) => {
        if (!Array.isArray(items) || items.length === 0) return;

        const list = document.createElement(tagName);
        items.forEach(item => appendContentText('li', item, list));
        section.appendChild(list);
    };

    const hasImageOnlyLayout = slide.layout === 'image' && typeof slide.image === 'string' && slide.image;
    const hasTwoColumnImage = slide.layout === 'two-column' && typeof slide.image === 'string' && slide.image;
    if (hasImageOnlyLayout) {
        if (slide.title) appendText('h3', slide.title);
        appendImage(section, true);
    } else if (hasTwoColumnImage) {
        if (slide.title) appendText('h3', slide.title);
        const columns = document.createElement('div');
        columns.classList.add('slide-two-column');
        const textColumn = document.createElement('div');
        textColumn.classList.add('slide-two-column-text');
        if (slide.content) appendContentText('p', slide.content, textColumn);
        const imageColumn = document.createElement('div');
        imageColumn.classList.add('slide-two-column-image');
        appendImage(imageColumn, true);
        columns.append(textColumn, imageColumn);
        section.appendChild(columns);
    } else {
        if (typeof slide.html === 'string') {
            if (slide.title) appendText('h2', slide.title);
            const content = document.createElement('template');
            content.innerHTML = slide.html;
            if (fragmentEffect) {
                const wrapper = document.createElement('div');
                addFragmentEffect(wrapper);
                wrapper.appendChild(content.content.cloneNode(true));
                section.appendChild(wrapper);
            } else {
                section.appendChild(content.content.cloneNode(true));
            }
        } else switch (slide.type) {
            case 'intro':
                appendText('h2', slide.title || '');
                if (slide.subtitle) appendText('h3', slide.subtitle);
                break;
            case 'theory':
                appendText('h3', slide.title || '');
                appendList('ul', slide.bullets);
                break;
            case 'code': {
                appendText('h3', slide.title || '');
                break;
            }
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
                break;
        }
        if (slide.content) appendContentText('p', slide.content);
        if (slide.image) appendImage(section);
        if (typeof slide.codeSnippet === 'string' && slide.codeSnippet) {
            const pre = document.createElement('pre');
            const code = document.createElement('code');
            const language = typeof slide.language === 'string' && /^[a-z0-9_-]+$/i.test(slide.language)
                ? slide.language
                : 'javascript';
            code.classList.add(`language-${language}`);
            code.textContent = slide.codeSnippet;
            pre.appendChild(code);
            addFragmentEffect(pre);
            section.appendChild(pre);
        }
        if (slide.explanation) {
            const explanation = appendContentText('p', '');
            appendText('small', slide.explanation, explanation);
        }
    }

    if (Array.isArray(slide.links) && slide.links.length > 0) {
        const linksContainer = document.createElement('div');
        linksContainer.classList.add('slide-links-container');
        if (!settings.showLinks) linksContainer.classList.add('hidden-links');
        
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

    if (slide.notes && settings.showNotes !== false) {
        const notesEl = document.createElement('aside');
        notesEl.classList.add('notes');
        notesEl.textContent = slide.notes;
        section.appendChild(notesEl);
    }

    return section;
}

function initReveal(revealOptions = {}) {
    if (typeof Reveal !== 'undefined') {
        const defaults = {
            controls: true,
            progress: true,
            center: true,
            hash: true,
            slideNumber: 'c/t',
            width: 1280,
            height: 720,
            margin: 0.04,
            katex: {
                local: 'assets/libs/katex'
            }
        };
        const options = Object.assign({}, defaults, revealOptions, {
            katex: Object.assign({}, defaults.katex, revealOptions.katex || {}),
            plugins: [RevealMarkdown, RevealNotes, RevealSearch, RevealZoom, RevealMath.KaTeX]
        });
        Reveal.initialize(options).then(() => {
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
    const linkToggle = document.getElementById('link-toggle-checkbox');
    if (linkToggle) linkToggle.checked = currentData.showLinks === true;
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
