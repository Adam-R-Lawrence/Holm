import { DATA_FILES } from '../config.js';
import { getActiveLanguage, getCopy, getLocalizedText } from '../i18n/localization.js';
import { byId, createElement } from '../utils/dom.js';
import { fetchJsonCached } from '../utils/fetch.js';
import { resolvePath, slugify } from '../utils/paths.js';

const DEFAULT_WRITING_PREVIEW_IMAGE = 'images/about_me/utah.webp';
const DEFAULT_WRITING_PREVIEW_IMAGE_WIDTH = 2339;
const DEFAULT_WRITING_PREVIEW_IMAGE_HEIGHT = 1559;

function normalizeThemes(themeList) {
    if (!Array.isArray(themeList)) {
        return { ids: [], labels: [] };
    }

    const ids = [];
    const labels = [];

    themeList.forEach(theme => {
        if (!theme) {
            return;
        }

        if (typeof theme === 'string') {
            const id = slugify(theme);
            if (!id) {
                return;
            }
            ids.push(id);
            labels.push(getLocalizedText({ english: theme }, theme));
            return;
        }

        if (typeof theme === 'object') {
            const labelSource = theme.label || theme;
            const labelText = getLocalizedText(labelSource, labelSource?.english || '');
            const id = theme.id || theme.slug || slugify(labelText);
            if (!id) {
                return;
            }
            ids.push(id);
            labels.push(labelText);
        }
    });

    return { ids, labels };
}

function buildDateNode(rawDate) {
    const dateContainer = createElement('div', 'date');
    const dateValue = rawDate || '';
    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) {
        dateContainer.textContent = dateValue;
        return dateContainer;
    }

    const isChinese = getActiveLanguage() === 'chinese';
    const locale = isChinese ? 'zh-CN' : 'en-US';
    const monthDayText = parsedDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' });

    const monthDay = createElement('span', 'month-day');
    monthDay.textContent = isChinese ? monthDayText : `${monthDayText},`;

    const year = createElement('span', 'year');
    year.textContent = String(parsedDate.getFullYear());

    dateContainer.appendChild(monthDay);
    dateContainer.appendChild(year);
    return dateContainer;
}

function renderWritingsEmptyState(directory, message) {
    directory.innerHTML = '';
    const empty = createElement('p', 'directory-empty-state');
    empty.textContent = message;
    directory.appendChild(empty);
}

function createHomeWritingRow(writing) {
    const item = createElement('article', 'home-directory-row home-writing-row');
    const content = createElement('div', 'home-directory-body');

    const titleLink = createElement('a', 'home-directory-title');
    const href = resolvePath(writing.link);
    if (href) {
        titleLink.href = href;
    }
    const titleText = getLocalizedText(writing.title, writing.title?.english || '');
    titleLink.textContent = titleText;
    content.appendChild(titleLink);

    const summaryText = getLocalizedText(writing.summary, '');
    if (summaryText) {
        const summary = createElement('p', 'home-directory-summary directory-muted');
        summary.textContent = summaryText;
        content.appendChild(summary);
    }

    const { labels: themeLabelList } = normalizeThemes(writing.themes);
    if (themeLabelList.length) {
        const themeText = createElement('p', 'home-directory-meta home-writing-themes directory-muted');
        themeText.textContent = getCopy('writings', 'topicPrefix') + themeLabelList.join(', ');
        content.appendChild(themeText);
    }

    const metadata = createElement('div', 'home-directory-date directory-muted');
    metadata.appendChild(buildDateNode(writing.date));

    const previewLink = createElement('a', 'home-writing-preview');
    if (href) {
        previewLink.href = href;
    }
    previewLink.setAttribute('aria-label', titleText ? `Read ${titleText}` : 'Read writing');

    const previewImage = createElement('img');
    previewImage.src = resolvePath(writing.previewImage || writing.image || DEFAULT_WRITING_PREVIEW_IMAGE);
    previewImage.alt = getLocalizedText(
        writing.previewImageAlt || writing.imageAlt,
        titleText ? `Preview image for ${titleText}` : 'Writing preview image'
    );
    previewImage.width = Number.isFinite(writing.previewImageWidth)
        ? writing.previewImageWidth
        : DEFAULT_WRITING_PREVIEW_IMAGE_WIDTH;
    previewImage.height = Number.isFinite(writing.previewImageHeight)
        ? writing.previewImageHeight
        : DEFAULT_WRITING_PREVIEW_IMAGE_HEIGHT;
    previewImage.loading = 'lazy';
    previewImage.decoding = 'async';
    previewLink.appendChild(previewImage);

    item.appendChild(metadata);
    item.appendChild(content);
    item.appendChild(previewLink);
    return item;
}

function renderHomeWritingsDirectory(directory, writings) {
    directory.innerHTML = '';

    (writings || []).forEach(writing => {
        if (writing) {
            directory.appendChild(createHomeWritingRow(writing));
        }
    });

    if (!directory.children.length) {
        renderWritingsEmptyState(directory, 'No writings available yet.');
    }
}

export async function loadWritingsPage() {
    const directory = byId('writings-directory');
    const homeDirectory = byId('home-writings-directory');
    if (!directory && !homeDirectory) {
        return;
    }

    const filterContainer = directory ? byId('writing-filter-controls') : null;
    if (filterContainer) {
        filterContainer.classList.add('directory-toolbar');
    }

    const previousFilterValue = filterContainer?.querySelector('select')?.value || 'all';

    try {
        const writings = await fetchJsonCached(DATA_FILES.writings, { cacheKey: 'data:writings' });

        if (homeDirectory) {
            renderHomeWritingsDirectory(homeDirectory, writings);
        }

        if (!directory) {
            return;
        }

        directory.innerHTML = '';

        const items = [];
        const themeLabels = new Map();

        (writings || []).forEach(writing => {
            if (!writing) {
                return;
            }

            const item = createElement('div', 'writing-item directory-card');
            const content = createElement('div', 'writing-content');
            const metadata = createElement('div', 'writing-meta directory-muted');

            const { ids: themeIds, labels: themeLabelList } = normalizeThemes(writing.themes);
            if (themeIds.length) {
                item.dataset.themes = themeIds.join(',');
            }

            const titleLink = createElement('a', 'writing-title directory-card-title');
            const href = resolvePath(writing.link);
            if (href) {
                titleLink.href = href;
            }
            titleLink.textContent = getLocalizedText(writing.title, writing.title?.english || '');
            content.appendChild(titleLink);

            const summaryText = getLocalizedText(writing.summary, '');
            if (summaryText) {
                const summary = createElement('p', 'explanatory-text directory-muted');
                summary.textContent = summaryText;
                content.appendChild(summary);
            }

            if (themeLabelList.length) {
                const themeText = createElement('p', 'writing-themes directory-muted');
                themeText.textContent = getCopy('writings', 'topicPrefix') + themeLabelList.join(', ');
                content.appendChild(themeText);
            }

            metadata.appendChild(buildDateNode(writing.date));

            item.appendChild(content);
            item.appendChild(metadata);
            directory.appendChild(item);
            items.push(item);

            themeIds.forEach((id, index) => {
                if (!themeLabels.has(id)) {
                    themeLabels.set(id, themeLabelList[index]);
                }
            });
        });

        const emptyState = createElement('p', 'directory-empty-state');
        emptyState.textContent = getCopy('writings', 'noMatches');
        emptyState.hidden = true;
        directory.appendChild(emptyState);

        const applyThemeFilter = selectedValue => {
            let visibleCount = 0;

            items.forEach(item => {
                if (selectedValue === 'all') {
                    item.hidden = false;
                    visibleCount += 1;
                    return;
                }

                const itemThemes = item.dataset.themes ? item.dataset.themes.split(',') : [];
                const shouldDisplay = itemThemes.includes(selectedValue);
                item.hidden = !shouldDisplay;
                if (shouldDisplay) {
                    visibleCount += 1;
                }
            });

            emptyState.hidden = visibleCount !== 0;
        };

        if (filterContainer) {
            filterContainer.innerHTML = '';

            if (themeLabels.size > 0) {
                filterContainer.hidden = false;
                const field = createElement('div', 'toolbar-field');

                const label = createElement('label');
                label.setAttribute('for', 'theme-filter');
                label.textContent = getCopy('writings', 'filterLabel');

                const select = createElement('select');
                select.id = 'theme-filter';

                const allOption = createElement('option');
                allOption.value = 'all';
                allOption.textContent = getCopy('writings', 'allThemes');
                select.appendChild(allOption);

                Array.from(themeLabels.entries())
                    .sort((left, right) => left[1].localeCompare(right[1]))
                    .forEach(([id, labelText]) => {
                        const option = createElement('option');
                        option.value = id;
                        option.textContent = labelText;
                        select.appendChild(option);
                    });

                const targetValue = previousFilterValue !== 'all' && themeLabels.has(previousFilterValue)
                    ? previousFilterValue
                    : 'all';
                select.value = targetValue;

                select.addEventListener('change', () => {
                    applyThemeFilter(select.value);
                });

                field.appendChild(label);
                field.appendChild(select);
                filterContainer.appendChild(field);

                applyThemeFilter(select.value);
            } else {
                filterContainer.hidden = true;
                emptyState.hidden = items.length !== 0;
            }
        } else {
            applyThemeFilter('all');
        }
    } catch (error) {
        console.error('Error loading writings:', error);
        if (directory) {
            renderWritingsEmptyState(directory, 'Unable to load writings right now.');
        }
        if (homeDirectory) {
            renderWritingsEmptyState(homeDirectory, 'Unable to load writings right now.');
        }
    }
}
