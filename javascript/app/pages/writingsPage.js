import { DATA_FILES } from '../config.js';
import { getActiveLanguage, getCopy, getLocalizedText } from '../i18n/localization.js';
import { byId, createElement } from '../utils/dom.js';
import { fetchJsonCached } from '../utils/fetch.js';
import { resolvePath, slugify } from '../utils/paths.js';

const DEFAULT_WRITING_PREVIEW_IMAGE = 'images/about_me/utah.webp';
const DEFAULT_WRITING_PREVIEW_IMAGE_WIDTH = 2339;
const DEFAULT_WRITING_PREVIEW_IMAGE_HEIGHT = 1559;
const WRITING_PREVIEW_IMAGE_FITS = new Set(['contain', 'cover', 'fill', 'none', 'scale-down']);
const OTHER_WRITING_GROUP_ID = 'other';
let activeHomeWritingGroup = 'all';

function normalizeGroup(group) {
    if (!group) {
        return {
            id: OTHER_WRITING_GROUP_ID,
            label: getCopy('writings', 'otherGroup')
        };
    }

    if (typeof group === 'string') {
        const id = slugify(group);
        return id
            ? { id, label: group }
            : { id: OTHER_WRITING_GROUP_ID, label: getCopy('writings', 'otherGroup') };
    }

    const labelSource = group.label || group;
    const label = getLocalizedText(labelSource, labelSource?.english || '');
    const id = group.id || group.slug || slugify(label);

    return id
        ? { id, label: label || id }
        : { id: OTHER_WRITING_GROUP_ID, label: getCopy('writings', 'otherGroup') };
}

function buildDateNode(rawDate) {
    const dateContainer = createElement('div', 'date');
    const dateValue = rawDate || '';
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
    const parsedDate = dateOnlyMatch
        ? new Date(
            Number(dateOnlyMatch[1]),
            Number(dateOnlyMatch[2]) - 1,
            Number(dateOnlyMatch[3])
        )
        : new Date(dateValue);
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

function createHomeWritingRow(writing, group) {
    const item = createElement('article', 'home-directory-row home-writing-row');
    item.dataset.group = group.id;
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

    const topicText = createElement('p', 'home-directory-meta home-writing-themes directory-muted');
    topicText.textContent = getCopy('writings', 'topicPrefix') + group.label;
    content.appendChild(topicText);

    const metadata = createElement('div', 'home-directory-date directory-muted');
    metadata.appendChild(buildDateNode(writing.date));
    content.insertBefore(metadata, titleLink);

    const previewLink = createElement('a', 'home-writing-preview');
    if (href) {
        previewLink.href = href;
    }
    previewLink.setAttribute('aria-label', titleText ? `${getCopy('writings', 'readPrefix')}${titleText}` : getCopy('writings', 'readWriting'));

    const previewImage = createElement('img');
    previewImage.src = resolvePath(writing.previewImage || writing.image || DEFAULT_WRITING_PREVIEW_IMAGE);
    previewImage.alt = getLocalizedText(
        writing.previewImageAlt || writing.imageAlt,
        titleText ? `Preview image for ${titleText}` : 'Writing preview image'
    );
    const previewWidth = Number.isFinite(writing.previewImageWidth)
        ? writing.previewImageWidth
        : DEFAULT_WRITING_PREVIEW_IMAGE_WIDTH;
    const previewHeight = Number.isFinite(writing.previewImageHeight)
        ? writing.previewImageHeight
        : DEFAULT_WRITING_PREVIEW_IMAGE_HEIGHT;
    previewImage.width = previewWidth;
    previewImage.height = previewHeight;
    const previewImageFit = WRITING_PREVIEW_IMAGE_FITS.has(writing.previewImageFit)
        ? writing.previewImageFit
        : '';
    if (previewImageFit) {
        previewImage.dataset.fit = previewImageFit;
        previewImage.style.objectFit = previewImageFit;
        previewLink.dataset.imageFit = previewImageFit;
        if (previewImageFit === 'contain') {
            previewLink.style.aspectRatio = `${previewWidth} / ${previewHeight}`;
        }
    }
    previewImage.loading = 'lazy';
    previewImage.decoding = 'async';
    previewLink.appendChild(previewImage);

    item.appendChild(content);
    item.appendChild(previewLink);
    return item;
}

function applyHomeGroupFilter(rows, filterContainer) {
    rows.forEach(row => {
        row.hidden = activeHomeWritingGroup !== 'all'
            && row.dataset.group !== activeHomeWritingGroup;
    });

    filterContainer.querySelectorAll('button[data-group]').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.group === activeHomeWritingGroup));
    });
}

function renderHomeGroupFilters(filterContainer, rows, groupLabels) {
    filterContainer.innerHTML = '';

    if (groupLabels.size < 2) {
        activeHomeWritingGroup = 'all';
        rows.forEach(row => { row.hidden = false; });
        filterContainer.hidden = true;
        return;
    }

    if (activeHomeWritingGroup !== 'all' && !groupLabels.has(activeHomeWritingGroup)) {
        activeHomeWritingGroup = 'all';
    }

    filterContainer.hidden = false;
    filterContainer.setAttribute('role', 'group');
    filterContainer.setAttribute('aria-labelledby', 'home-writing-group-filter-label');

    const label = createElement('span', 'home-writing-group-filter-label');
    label.id = 'home-writing-group-filter-label';
    label.textContent = getCopy('writings', 'groupFilterLabel');
    filterContainer.appendChild(label);

    const addButton = (groupId, labelText) => {
        const button = createElement('button', 'home-writing-group-filter');
        button.type = 'button';
        button.dataset.group = groupId;
        button.textContent = labelText;
        button.setAttribute('aria-pressed', String(groupId === activeHomeWritingGroup));
        button.addEventListener('click', () => {
            activeHomeWritingGroup = groupId;
            applyHomeGroupFilter(rows, filterContainer);
        });
        filterContainer.appendChild(button);
    };

    addButton('all', getCopy('writings', 'allGroups'));
    groupLabels.forEach((labelText, groupId) => {
        addButton(groupId, labelText);
    });

    applyHomeGroupFilter(rows, filterContainer);
}

function renderHomeWritingsDirectory(directory, filterContainer, writings) {
    directory.innerHTML = '';
    const rows = [];
    const groupLabels = new Map();

    (writings || []).forEach(writing => {
        if (writing) {
            const group = normalizeGroup(writing.group);
            if (!groupLabels.has(group.id)) {
                groupLabels.set(group.id, group.label);
            }
            const row = createHomeWritingRow(writing, group);
            directory.appendChild(row);
            rows.push(row);
        }
    });

    if (!rows.length) {
        renderWritingsEmptyState(directory, 'No writings available yet.');
    }

    if (filterContainer) {
        renderHomeGroupFilters(filterContainer, rows, groupLabels);
    }
}

export async function loadWritingsPage() {
    const directory = byId('home-writings-directory');
    if (!directory) {
        return;
    }

    const filterContainer = byId('home-writing-group-filters');

    try {
        const writings = await fetchJsonCached(DATA_FILES.writings, { cacheKey: 'data:writings' });
        renderHomeWritingsDirectory(directory, filterContainer, writings);
    } catch (error) {
        console.error('Error loading writings:', error);
        renderWritingsEmptyState(directory, 'Unable to load writings right now.');
        if (filterContainer) {
            filterContainer.hidden = true;
        }
    }
}
