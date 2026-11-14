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

        loadScript(dataFilePath)
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

function setupHtmlPresentation(weekConfig) {
    const container = document.getElementById('slidesContainer');
    if (!container) return;

    container.innerHTML = '';

    const section = document.createElement('section');
    section.classList.add('html-embed-section');
    section.style.width = '100%';
    section.style.height = '100%';
    section.style.margin = '0';
    section.style.padding = '0';

    const iframe = document.createElement('iframe');
    iframe.src = weekConfig.file;
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

    container.innerHTML = '';

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

    switch (slide.type) {
        case 'intro':
            section.innerHTML = `
                <h2>${slide.title || ''}</h2>
                ${slide.subtitle ? `<h3>${slide.subtitle}</h3>` : ''}
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
            `;
            break;
        default:
            section.innerHTML = `
                ${slide.title ? `<h3>${slide.title}</h3>` : ''}
                ${slide.content || ''}
            `;
            break;
    }

    if (slide.image) {
        const imgEl = document.createElement('img');
        imgEl.src = slide.image;
        imgEl.alt = slide.title || 'Slide Image';
        imgEl.classList.add('slide-image');
        section.appendChild(imgEl);
    }

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
    if (weeksList) {
        weeksList.innerHTML = '';

        const dashLi = document.createElement('li');
        dashLi.classList.add('dashboard-link-item');
        const dashA = document.createElement('a');
        dashA.href = 'index.html';
        dashA.innerHTML = '<strong>Πίνακας Ελέγχου (Dashboard)</strong>';
        dashLi.appendChild(dashA);
        weeksList.appendChild(dashLi);

        const hrLi = document.createElement('li');
        hrLi.innerHTML = '<hr style="border: 0; border-top: 1px solid #334155; margin: 12px 0;">';
        weeksList.appendChild(hrLi);

        const titleLi = document.createElement('li');
        titleLi.innerHTML = `<span style="font-size: 0.85rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold;">Εξωτερική Παρουσίαση HTML (Εβδ. ${weekConfig.id})</span>`;
        titleLi.style.marginBottom = '8px';
        weeksList.appendChild(titleLi);
    }
}

function initUIControlsForJs(currentData) {
    setupDrawerBasicBehavior();

    const weeksList = document.getElementById('weeks-list');
    if (weeksList) {
        weeksList.innerHTML = '';

        const dashLi = document.createElement('li');
        dashLi.classList.add('dashboard-link-item');
        const dashA = document.createElement('a');
        dashA.href = 'index.html';
        dashA.innerHTML = '<strong>Πίνακας Ελέγχου (Dashboard)</strong>';
        dashLi.appendChild(dashA);
        weeksList.appendChild(dashLi);

        const hrLi = document.createElement('li');
        hrLi.innerHTML = '<hr style="border: 0; border-top: 1px solid #334155; margin: 12px 0;">';
        weeksList.appendChild(hrLi);

        const titleLi = document.createElement('li');
        titleLi.innerHTML = `<span style="font-size: 0.85rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold;">Διαφάνειες Εβδομάδας ${currentData.week || ''}</span>`;
        titleLi.style.marginBottom = '8px';
        weeksList.appendChild(titleLi);

        const slides = currentData.slides || [];
        let slideIndex = 0;

        slides.forEach((slide) => {
            const mainNumberStr = `${slideIndex + 1}`;

            if (slide.subslides && Array.isArray(slide.subslides)) {
                slide.subslides.forEach((subslide, subIndex) => {
                    const rawTitle = subslide.title || slide.title || 'Διαφάνεια';

                    if (subIndex === 0) {
                        const li = createSlideLinkItem(mainNumberStr, rawTitle, slideIndex, subIndex, 1);
                        weeksList.appendChild(li);
                    } else {
                        const subNumberStr = `${slideIndex + 1}.${subIndex}`;
                        const li = createSlideLinkItem(subNumberStr, rawTitle, slideIndex, subIndex, 2);
                        weeksList.appendChild(li);
                    }
                });
            } else {
                const rawTitle = slide.title || 'Διαφάνεια';
                const li = createSlideLinkItem(mainNumberStr, rawTitle, slideIndex, null, 1);
                weeksList.appendChild(li);
            }
            slideIndex++;
        });
    }
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

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}