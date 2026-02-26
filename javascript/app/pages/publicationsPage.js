import { DATA_FILES } from '../config.js';
import { getCopy, publicationTypeLabel } from '../i18n/localization.js';
import { byId, createElement } from '../utils/dom.js';
import { fetchJsonCached } from '../utils/fetch.js';
import { resolvePublicationLink } from '../utils/paths.js';

const UNDATED_KEY = '__undated__';

const normalizePublication = publication => {
    if (!publication || publication.hidden === true || publication.visible === false || publication.draft === true) {
        return null;
    }

    const yearValue = typeof publication.year === 'string'
        ? Number.parseInt(publication.year, 10)
        : publication.year;

    const type = (publication.type || 'other').toString().toLowerCase();
    const title = (publication.title || '').toString().trim();
    const authors = (publication.authors || '').toString().trim();
    const venue = (publication.venue || '').toString().trim();
    const typeLabel = publicationTypeLabel(type);
    const link = resolvePublicationLink(publication.link || '');

    if (!title) {
        return null;
    }

    return {
        title,
        authors,
        venue,
        year: Number.isFinite(yearValue) ? yearValue : null,
        type,
        typeLabel,
        link,
        searchText: [title, authors, venue, typeLabel].filter(Boolean).join(' ').toLowerCase()
    };
};

const comparePublications = (left, right) => {
    if (left.year && right.year && left.year !== right.year) {
        return right.year - left.year;
    }
    return left.title.localeCompare(right.title);
};

const compareYearKeys = (left, right) => {
    if (left === UNDATED_KEY) {
        return 1;
    }
    if (right === UNDATED_KEY) {
        return -1;
    }
    return Number.parseInt(right, 10) - Number.parseInt(left, 10);
};

function applyFilterLabels(searchInput) {
    const yearLabel = document.querySelector('label[for="publication-year-filter"]');
    const typeLabel = document.querySelector('label[for="publication-type-filter"]');
    const searchLabel = document.querySelector('label[for="publication-search"]');

    if (yearLabel) {
        yearLabel.textContent = getCopy('publications', 'filterYearLabel');
    }
    if (typeLabel) {
        typeLabel.textContent = getCopy('publications', 'filterTypeLabel');
    }
    if (searchLabel) {
        searchLabel.textContent = getCopy('publications', 'filterSearchLabel');
    }

    if (searchInput) {
        searchInput.placeholder = getCopy('publications', 'searchPlaceholder');
        searchInput.setAttribute('aria-label', getCopy('publications', 'filterSearchLabel'));
    }
}

function resetFilterOptions(yearFilter, typeFilter, years, types, previousYear, previousType) {
    if (yearFilter) {
        yearFilter.innerHTML = '';

        const allYears = createElement('option');
        allYears.value = 'all';
        allYears.textContent = getCopy('publications', 'allYears');
        yearFilter.appendChild(allYears);

        years.forEach(year => {
            const option = createElement('option');
            option.value = String(year);
            option.textContent = String(year);
            yearFilter.appendChild(option);
        });

        const shouldKeepYear = previousYear !== 'all' && years.includes(Number.parseInt(previousYear, 10));
        yearFilter.value = shouldKeepYear ? previousYear : 'all';
    }

    if (typeFilter) {
        typeFilter.innerHTML = '';

        const allTypes = createElement('option');
        allTypes.value = 'all';
        allTypes.textContent = getCopy('publications', 'allTypes');
        typeFilter.appendChild(allTypes);

        types.forEach(type => {
            const option = createElement('option');
            option.value = type;
            option.textContent = publicationTypeLabel(type);
            typeFilter.appendChild(option);
        });

        const shouldKeepType = previousType !== 'all' && types.includes(previousType);
        typeFilter.value = shouldKeepType ? previousType : 'all';
    }
}

function renderPublicationsList(directory, publications) {
    directory.innerHTML = '';

    if (!publications.length) {
        const empty = createElement('p', 'directory-empty-state');
        empty.textContent = getCopy('publications', 'noMatches');
        directory.appendChild(empty);
        return;
    }

    const groupedByYear = publications.reduce((map, publication) => {
        const key = publication.year ? String(publication.year) : UNDATED_KEY;
        if (!map.has(key)) {
            map.set(key, []);
        }
        map.get(key).push(publication);
        return map;
    }, new Map());

    Array.from(groupedByYear.keys()).sort(compareYearKeys).forEach(yearKey => {
        const section = createElement('section', 'publications-year-group directory-group');
        section.dataset.year = yearKey;

        const heading = createElement('h2');
        heading.textContent = yearKey === UNDATED_KEY ? getCopy('publications', 'undatedHeading') : yearKey;
        section.appendChild(heading);

        const list = createElement('ul', 'publications-list directory-list');
        groupedByYear.get(yearKey).sort((a, b) => a.title.localeCompare(b.title)).forEach(publication => {
            const item = createElement('li', 'publications-list-item directory-card');
            item.dataset.type = publication.type;

            const titleLine = createElement('div', 'publication-title-line directory-card-title-line');
            const typeBadge = createElement('span', 'publication-type directory-badge');
            typeBadge.textContent = publicationTypeLabel(publication.type);
            titleLine.appendChild(typeBadge);

            const titleElement = createElement(publication.link ? 'a' : 'span', 'publication-title directory-card-title');
            if (publication.link) {
                titleElement.href = publication.link;
                if (/^https?:\/\//i.test(publication.link)) {
                    titleElement.target = '_blank';
                    titleElement.rel = 'noopener';
                }
            }
            titleElement.textContent = publication.title;
            titleLine.appendChild(titleElement);

            item.appendChild(titleLine);

            const metadata = [publication.authors, publication.venue].filter(Boolean);
            if (metadata.length) {
                const metaElement = createElement('p', 'publication-meta directory-muted');
                metaElement.textContent = metadata.join(' · ');
                item.appendChild(metaElement);
            }

            list.appendChild(item);
        });

        section.appendChild(list);
        directory.appendChild(section);
    });
}

export async function loadPublicationsPage() {
    const directory = byId('publications-directory');
    if (!directory) {
        return;
    }

    const yearFilter = byId('publication-year-filter');
    const typeFilter = byId('publication-type-filter');
    const searchInput = byId('publication-search');

    const previousYear = yearFilter ? yearFilter.value : 'all';
    const previousType = typeFilter ? typeFilter.value : 'all';
    const previousSearch = searchInput ? searchInput.value : '';

    applyFilterLabels(searchInput);
    if (searchInput) {
        searchInput.value = previousSearch;
    }

    try {
        const sourcePublications = await fetchJsonCached(DATA_FILES.publications, {
            cacheKey: 'data:publications'
        });

        const allPublications = (sourcePublications || [])
            .map(normalizePublication)
            .filter(Boolean)
            .sort(comparePublications);

        const years = Array.from(new Set(
            allPublications
                .filter(publication => publication.year)
                .map(publication => publication.year)
        )).sort((a, b) => b - a);

        const types = Array.from(new Set(allPublications.map(publication => publication.type)))
            .sort((a, b) => publicationTypeLabel(a).localeCompare(publicationTypeLabel(b)));

        resetFilterOptions(yearFilter, typeFilter, years, types, previousYear, previousType);

        const render = () => {
            const selectedYear = yearFilter ? yearFilter.value : 'all';
            const selectedType = typeFilter ? typeFilter.value : 'all';
            const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

            const filtered = allPublications.filter(publication => {
                const yearMatches = selectedYear === 'all'
                    || (publication.year && String(publication.year) === selectedYear);
                const typeMatches = selectedType === 'all' || publication.type === selectedType;
                const searchMatches = !searchTerm || publication.searchText.includes(searchTerm);
                return yearMatches && typeMatches && searchMatches;
            });

            renderPublicationsList(directory, filtered);
        };

        if (yearFilter) {
            yearFilter.onchange = render;
        }
        if (typeFilter) {
            typeFilter.onchange = render;
        }
        if (searchInput) {
            searchInput.oninput = render;
        }

        render();
    } catch (error) {
        console.error('Error loading publications:', error);
        directory.innerHTML = '';
        const empty = createElement('p', 'directory-empty-state');
        empty.textContent = 'Unable to load publications right now.';
        directory.appendChild(empty);
    }
}
