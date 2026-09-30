import { STORAGE_KEYS, TRANSLATION_FILES } from '../config.js';
import { appState } from '../state.js';
import { all, byId } from '../utils/dom.js';
import { fetchJsonCached } from '../utils/fetch.js';
import { getStoredValue, setStoredValue } from '../utils/storage.js';

const localizedCopy = {
    english: {
        controls: {
            skipToMain: 'Skip to main content',
            toggleTheme: 'Toggle theme',
            toggleLanguage: 'Toggle language',
            toggleNavigation: 'Toggle navigation menu',
            scrollToTop: 'Scroll to Top'
        },
        publications: {
            filterYearLabel: 'Year',
            filterTypeLabel: 'Type',
            filterSearchLabel: 'Search',
            searchPlaceholder: 'Title, authors, venue',
            allYears: 'All Years',
            allTypes: 'All Types',
            noMatches: 'No publications match the selected filters.',
            noPublicItemsTitle: 'Publications are being prepared for public listing.',
            noPublicItemsBody: 'Current public research context is available through the homepage writings section while formal outputs are added here.',
            writingsLink: 'Writings',
            undatedHeading: 'Undated',
            typeLabels: {
                journal: 'Journal',
                conference: 'Conference',
                poster: 'Poster',
                thesis: 'Thesis',
                book: 'Book',
                preprint: 'Preprint',
                other: 'Other'
            }
        },
        writings: {
            groupFilterLabel: 'Filter by topic',
            allGroups: 'All',
            otherGroup: 'Other',
            topicPrefix: 'Topic: ',
            readPrefix: 'Read ',
            readWriting: 'Read writing'
        }
    },
    chinese: {
        controls: {
            skipToMain: '跳转到主要内容',
            toggleTheme: '切换主题',
            toggleLanguage: '切换语言',
            toggleNavigation: '切换导航菜单',
            scrollToTop: '返回顶部'
        },
        publications: {
            filterYearLabel: '年份',
            filterTypeLabel: '类型',
            filterSearchLabel: '搜索',
            searchPlaceholder: '标题、作者或刊物',
            allYears: '全部年份',
            allTypes: '全部类型',
            noMatches: '没有符合筛选条件的出版物。',
            noPublicItemsTitle: '公开出版物列表正在准备中。',
            noPublicItemsBody: '在正式成果加入此页之前，可以先通过主页的文章部分了解当前公开研究内容。',
            writingsLink: '文章',
            undatedHeading: '未注明年份',
            typeLabels: {
                journal: '期刊',
                conference: '会议',
                poster: '海报',
                thesis: '论文',
                book: '图书',
                preprint: '预印本',
                other: '其他'
            }
        },
        writings: {
            groupFilterLabel: '按主题筛选',
            allGroups: '全部',
            otherGroup: '其他',
            topicPrefix: '主题：',
            readPrefix: '阅读：',
            readWriting: '阅读文章'
        }
    }
};

const normalizeLanguage = language => (language === 'chinese' ? 'chinese' : 'english');
let translationRequestId = 0;

export function setActiveLanguage(language) {
    appState.activeLanguage = normalizeLanguage(language);
    return appState.activeLanguage;
}

export function getActiveLanguage() {
    return appState.activeLanguage;
}

export function persistLanguage(language) {
    const normalized = normalizeLanguage(language);
    setStoredValue(STORAGE_KEYS.language, normalized);
    return normalized;
}

export function getPreferredLanguage() {
    const storedLanguage = getStoredValue(STORAGE_KEYS.language);
    if (storedLanguage) {
        return normalizeLanguage(storedLanguage);
    }

    let browserLanguage = '';
    if (navigator.languages && navigator.languages.length > 0) {
        browserLanguage = navigator.languages[0];
    } else if (navigator.language) {
        browserLanguage = navigator.language;
    }

    const inferredLanguage = browserLanguage.toLowerCase().startsWith('zh') ? 'chinese' : 'english';
    setStoredValue(STORAGE_KEYS.language, inferredLanguage);
    return inferredLanguage;
}

export function getCopy(section, key) {
    const languageCopy = localizedCopy[getActiveLanguage()] || localizedCopy.english;
    const fallbackCopy = localizedCopy.english;
    const sectionCopy = languageCopy?.[section] || {};
    const fallbackSection = fallbackCopy?.[section] || {};

    if (key === 'typeLabels') {
        return sectionCopy.typeLabels || fallbackSection.typeLabels || {};
    }

    return sectionCopy[key] || fallbackSection[key] || '';
}

export function publicationTypeLabel(type) {
    const labels = getCopy('publications', 'typeLabels');
    const key = (type || 'other').toString().toLowerCase();

    if (labels[key]) {
        return labels[key];
    }

    return key.replace(/(^|[-_\s])(\w)/g, (_, __, char) => char.toUpperCase());
}

export function getLocalizedText(value, fallback = '') {
    if (typeof value === 'string') {
        return value;
    }

    if (value && typeof value === 'object') {
        return value[getActiveLanguage()] || value.english || value.en || fallback;
    }

    return fallback;
}

async function getTranslations(language) {
    const normalized = normalizeLanguage(language);
    const file = TRANSLATION_FILES[normalized];
    if (!file) {
        return null;
    }

    try {
        return await fetchJsonCached(file, { cacheKey: `translations:${normalized}` });
    } catch (error) {
        console.error('Error loading translations:', error);
        return null;
    }
}

export async function applyTranslations(language = getActiveLanguage()) {
    const requestId = ++translationRequestId;
    const normalized = setActiveLanguage(language);
    const dictionary = await getTranslations(normalized);
    if (requestId !== translationRequestId || normalized !== getActiveLanguage()
        || !dictionary || typeof dictionary !== 'object') {
        return;
    }

    Object.entries(dictionary).forEach(([id, text]) => {
        const element = byId(id);
        if (element) {
            element.innerHTML = String(text);
        }
    });
}

export function updateLanguageToggleVisuals(language = getActiveLanguage()) {
    const normalized = normalizeLanguage(language);
    const isChinese = normalized === 'chinese';

    all('.language-english').forEach(element => {
        element.hidden = !isChinese;
    });

    all('.language-chinese').forEach(element => {
        element.hidden = isChinese;
    });

    all('.language-toggle').forEach(button => {
        button.setAttribute('aria-pressed', String(isChinese));
    });

    return isChinese;
}

export function applyLanguageDomState(language = getActiveLanguage()) {
    const normalized = normalizeLanguage(language);
    const isChinese = normalized === 'chinese';

    if (document.body) {
        document.body.classList.toggle('chinese', isChinese);
    }
    document.documentElement.setAttribute('lang', isChinese ? 'zh' : 'en');

    const controlLabels = {
        '.skip-link': 'skipToMain',
        '.theme-toggle': 'toggleTheme',
        '.language-toggle': 'toggleLanguage',
        '.nav-toggle': 'toggleNavigation',
        '#scroll-to-top-btn': 'scrollToTop'
    };
    Object.entries(controlLabels).forEach(([selector, key]) => {
        all(selector).forEach(element => {
            element.setAttribute('aria-label', getCopy('controls', key));
        });
    });

    return isChinese;
}
