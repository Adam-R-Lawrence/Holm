(function() {
    'use strict';

    const sourceTextarea = document.getElementById('publications-source');
    const parseBibtexBtn = document.getElementById('parse-bibtex');
    const parseOrcidBtn = document.getElementById('parse-orcid');
    const parseJsonBtn = document.getElementById('parse-json');
    const parseStatus = document.getElementById('parse-status');

    const existingTableBody = document.getElementById('existing-publications-body');
    const existingCount = document.getElementById('existing-count');

    const mergeBtn = document.getElementById('merge-existing');
    const copyBtn = document.getElementById('copy-json');
    const downloadBtn = document.getElementById('download-json');
    const resetBtn = document.getElementById('reset-working');

    const workingCount = document.getElementById('working-count');
    const workingOutput = document.getElementById('publications-output');
    const workingTableWrapper = document.getElementById('working-table-wrapper');
    const workingBody = document.getElementById('working-publications-body');

    let existingPublications = [];
    let workingPublications = [];

    const TYPE_MAP_BIBTEX = {
        article: 'journal',
        inproceedings: 'conference',
        proceedings: 'conference',
        conference: 'conference',
        incollection: 'book',
        book: 'book',
        inbook: 'book',
        mastersthesis: 'thesis',
        phdthesis: 'thesis',
        thesis: 'thesis',
        techreport: 'preprint',
        report: 'preprint',
        misc: 'other'
    };

    const TYPE_MAP_ORCID = {
        'journal-article': 'journal',
        'journal-issue': 'journal',
        'conference-paper': 'conference',
        'conference-proceeding': 'conference',
        'conference-abstract': 'conference',
        'thesis': 'thesis',
        'dissertation': 'thesis',
        'book': 'book',
        'book-chapter': 'book',
        'report': 'preprint',
        'working-paper': 'preprint'
    };

    const sanitizeText = value => (value || '').toString().replace(/[{}]/g, '').trim();

    const normalizeAuthors = value => {
        if (!value) {
            return '';
        }
        if (Array.isArray(value)) {
            return value.map(normalizeSingleAuthor).filter(Boolean).join(', ');
        }
        return value
            .split(/\b[aA][nN][dD]\b|;/)
            .map(segment => segment.replace(/[,]+/g, ' ').trim())
            .map(normalizeSingleAuthor)
            .filter(Boolean)
            .join(', ');
    };

    function normalizeSingleAuthor(author) {
        if (!author) return '';
        const cleaned = sanitizeText(author).replace(/\s+/g, ' ').trim();
        if (!cleaned) return '';
        return cleaned
            .split(',')
            .map(part => part.trim())
            .reverse()
            .join(' ')
            .replace(/\s+/g, ' ') // collapse double spaces
            .trim();
    }

    const toNumberOrNull = value => {
        const num = parseInt(value, 10);
        return Number.isFinite(num) ? num : null;
    };

    const guessType = (rawType, map) => {
        if (!rawType) {
            return 'other';
        }
        const key = rawType.toString().toLowerCase();
        return map[key] || key;
    };

    const pickVenue = tags => {
        if (!tags) return '';
        return sanitizeText(tags.JOURNAL || tags.BOOKTITLE || tags.SCHOOL || tags.INSTITUTION || tags.PUBLISHER || tags.NOTE || '');
    };

    const buildLink = (primary, fallback) => {
        const link = primary || fallback;
        if (!link) return '';
        const trimmed = link.trim();
        if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('mailto:')) {
            return trimmed;
        }
        if (trimmed.startsWith('doi:')) {
            return `https://doi.org/${trimmed.replace(/^doi:/i, '')}`;
        }
        if (/^10\.\d{4,9}\//.test(trimmed)) {
            return `https://doi.org/${trimmed}`;
        }
        return trimmed;
    };

    const normalizePublication = pub => {
        const normalized = {
            title: sanitizeText(pub.title),
            authors: sanitizeText(pub.authors),
            venue: sanitizeText(pub.venue),
            year: pub.year && Number.isFinite(pub.year) ? pub.year : toNumberOrNull(pub.year),
            type: (pub.type || 'other').toString().toLowerCase(),
            link: (pub.link || '').toString().trim()
        };

        if (pub.draft === true) {
            normalized.draft = true;
        }
        if (pub.visible === false) {
            normalized.visible = false;
        }
        if (pub.hidden === true) {
            normalized.hidden = true;
        }

        return normalized;
    };

    const renderExisting = () => {
        existingTableBody.innerHTML = '';
        if (existingPublications.length === 0) {
            existingCount.textContent = 'No existing publications found.';
            return;
        }
        existingPublications.forEach(pub => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${escapeHtml(pub.title)}</td><td>${pub.year || ''}</td><td>${escapeHtml(pub.type || '')}</td>`;
            existingTableBody.appendChild(row);
        });
        existingCount.textContent = `${existingPublications.length} item(s) loaded from data/publications.json.`;
    };

    const renderWorking = () => {
        workingBody.innerHTML = '';
        if (workingPublications.length === 0) {
            workingTableWrapper.classList.add('hidden');
            workingCount.textContent = 'No normalized publications yet.';
        } else {
            workingTableWrapper.classList.remove('hidden');
            workingPublications.forEach(pub => {
                const row = document.createElement('tr');
                row.innerHTML = `<td>${escapeHtml(pub.title)}</td><td>${pub.year || ''}</td><td>${escapeHtml(pub.type)}</td><td>${escapeHtml(pub.authors)}</td>`;
                workingBody.appendChild(row);
            });
            workingCount.textContent = `${workingPublications.length} normalized entr${workingPublications.length === 1 ? 'y' : 'ies'} ready.`;
        }
        workingOutput.textContent = JSON.stringify(workingPublications, null, 2);
        const hasWorking = workingPublications.length > 0;
        copyBtn.disabled = !hasWorking;
        downloadBtn.disabled = !hasWorking;
        mergeBtn.disabled = !hasWorking;
        resetBtn.disabled = !hasWorking;
    };

    const setWorkingPublications = publications => {
        workingPublications = publications
            .map(normalizePublication)
            .filter(pub => pub.title);
        workingPublications.sort((a, b) => {
            if (a.year && b.year && a.year !== b.year) {
                return b.year - a.year;
            }
            return a.title.localeCompare(b.title);
        });
        renderWorking();
    };

    const escapeHtml = text => sanitizeText(text).replace(/[&<>"']/g, ch => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[ch]));

    const handleError = error => {
        console.error(error);
        parseStatus.textContent = error instanceof Error ? error.message : String(error);
        parseStatus.style.color = '#b00020';
    };

    const handleSuccess = message => {
        parseStatus.textContent = message;
        parseStatus.style.color = 'inherit';
    };

    const ensureSource = () => {
        const value = sourceTextarea.value.trim();
        if (!value) {
            throw new Error('Paste data into the input textarea first.');
        }
        return value;
    };

    const parseBibtex = text => {
        if (!window.bibtexParse || typeof window.bibtexParse.toJSON !== 'function') {
            throw new Error('BibTeX parser failed to load.');
        }
        const entries = window.bibtexParse.toJSON(text);
        if (!Array.isArray(entries) || entries.length === 0) {
            throw new Error('No BibTeX entries detected.');
        }
        return entries.map(entry => {
            const tags = entry.entryTags || {};
            const type = guessType(entry.entryType, TYPE_MAP_BIBTEX);
            const year = toNumberOrNull(tags.YEAR);
            const doi = sanitizeText(tags.DOI);
            const link = buildLink(sanitizeText(tags.URL), doi);
            return normalizePublication({
                title: sanitizeText(tags.TITLE),
                authors: normalizeAuthors(tags.AUTHOR),
                venue: pickVenue(tags),
                year,
                type,
                link
            });
        });
    };

    const parseOrcid = raw => {
        const data = JSON.parse(raw);
        const summaries = extractOrcidSummaries(data);
        if (summaries.length === 0) {
            throw new Error('No ORCID work summaries found.');
        }
        return summaries.map(summary => {
            const type = guessType(summary.type, TYPE_MAP_ORCID);
            const year = toNumberOrNull(summary['publication-date']?.year?.value || summary['publication-date']?.year);
            const doi = pickExternalId(summary, ['doi']);
            const url = pickExternalId(summary, ['uri', 'url']) || summary.url?.value;
            const contributors = (summary.contributors?.contributor || []).map(contrib =>
                sanitizeText(contrib['credit-name']?.value || contrib['contributor-email']?.value || contrib['contributor-orcid']?.path)
            ).filter(Boolean);
            return normalizePublication({
                title: sanitizeText(summary.title?.title?.value || summary['full-title']?.value || summary['short-description']),
                authors: normalizeAuthors(contributors.length ? contributors : 'Adam R. Lawrence'),
                venue: sanitizeText(summary['journal-title']?.value || summary['conference-title']?.value || summary['media-type']),
                year,
                type,
                link: buildLink(url, doi)
            });
        });
    };

    const extractOrcidSummaries = data => {
        if (!data) return [];
        if (Array.isArray(data)) {
            return data;
        }
        if (Array.isArray(data['work-summary'])) {
            return data['work-summary'];
        }
        if (Array.isArray(data.group)) {
            return data.group.flatMap(item => item['work-summary'] || []).filter(Boolean);
        }
        const works = data['activities-summary']?.works;
        if (Array.isArray(works?.group)) {
            return works.group.flatMap(item => item['work-summary'] || []).filter(Boolean);
        }
        if (Array.isArray(data.result)) {
            return data.result;
        }
        return [];
    };

    const pickExternalId = (summary, types) => {
        const ids = summary['external-ids']?.['external-id'];
        if (!Array.isArray(ids)) return '';
        for (const targetType of types) {
            const match = ids.find(id => id['external-id-type']?.toLowerCase() === targetType);
            if (match) {
                return match['external-id-url']?.value || match['external-id-normalized']?.value || match['external-id-value'];
            }
        }
        return '';
    };

    const parseJsonArray = raw => {
        const parsed = JSON.parse(raw);
        const array = Array.isArray(parsed)
            ? parsed
            : Array.isArray(parsed.publications)
                ? parsed.publications
                : Array.isArray(parsed.items)
                    ? parsed.items
                    : null;
        if (!Array.isArray(array)) {
            throw new Error('JSON input must be an array or contain a publications/items array.');
        }
        return array.map(normalizePublication);
    };

    const mergeWithExisting = () => {
        const lookup = new Map();
        const keyFor = pub => `${pub.title.toLowerCase()}-${pub.year || 'na'}`;
        const merged = [];

        existingPublications.forEach(pub => {
            const key = keyFor(pub);
            lookup.set(key, normalizePublication(pub));
        });

        workingPublications.forEach(pub => {
            const key = keyFor(pub);
            lookup.set(key, normalizePublication(pub));
        });

        lookup.forEach(value => merged.push(value));

        setWorkingPublications(merged);
        handleSuccess('Merged working entries with existing publications.');
    };

    const copyToClipboard = async () => {
        if (!navigator.clipboard) {
            throw new Error('Clipboard API is not available in this browser.');
        }
        await navigator.clipboard.writeText(workingOutput.textContent);
        handleSuccess('Copied JSON to clipboard.');
    };

    const downloadJson = () => {
        const blob = new Blob([workingOutput.textContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'publications.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        handleSuccess('Download started.');
    };

    const resetWorking = () => {
        workingPublications = [];
        renderWorking();
        handleSuccess('Cleared working dataset.');
    };

    const init = () => {
        fetch('../data/publications.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Unable to load existing publications.json');
                }
                return response.json();
            })
            .then(data => {
                existingPublications = Array.isArray(data) ? data.map(normalizePublication) : [];
                renderExisting();
            })
            .catch(error => {
                existingPublications = [];
                renderExisting();
                handleError(error);
            });
    };

    parseBibtexBtn.addEventListener('click', () => {
        try {
            const text = ensureSource();
            const parsed = parseBibtex(text);
            setWorkingPublications(parsed);
            handleSuccess(`Parsed ${parsed.length} BibTeX entr${parsed.length === 1 ? 'y' : 'ies'}.`);
        } catch (error) {
            handleError(error);
        }
    });

    parseOrcidBtn.addEventListener('click', () => {
        try {
            const raw = ensureSource();
            const parsed = parseOrcid(raw);
            setWorkingPublications(parsed);
            handleSuccess(`Parsed ${parsed.length} ORCID record${parsed.length === 1 ? '' : 's'}.`);
        } catch (error) {
            handleError(error);
        }
    });

    parseJsonBtn.addEventListener('click', () => {
        try {
            const raw = ensureSource();
            const parsed = parseJsonArray(raw);
            setWorkingPublications(parsed);
            handleSuccess(`Loaded ${parsed.length} publication${parsed.length === 1 ? '' : 's'} from JSON.`);
        } catch (error) {
            handleError(error);
        }
    });

    mergeBtn.addEventListener('click', () => {
        try {
            mergeWithExisting();
        } catch (error) {
            handleError(error);
        }
    });

    copyBtn.addEventListener('click', () => {
        copyToClipboard().catch(handleError);
    });

    downloadBtn.addEventListener('click', () => {
        try {
            downloadJson();
        } catch (error) {
            handleError(error);
        }
    });

    resetBtn.addEventListener('click', () => {
        resetWorking();
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
