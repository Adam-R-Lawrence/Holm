import { DATA_FILES } from '../config.js';
import { getLocalizedText } from '../i18n/localization.js';
import { byId, createElement } from '../utils/dom.js';
import { fetchJsonCached } from '../utils/fetch.js';
import { resolvePath } from '../utils/paths.js';

function renderProjectsEmptyState(grid, message) {
    grid.innerHTML = '';
    const empty = createElement('p', 'directory-empty-state');
    empty.textContent = message;
    grid.appendChild(empty);
}

export async function loadProjectsPage() {
    const grid = byId('projects-grid');
    if (!grid) {
        return;
    }

    try {
        const projects = await fetchJsonCached(DATA_FILES.projects, { cacheKey: 'data:projects' });
        grid.innerHTML = '';

        (projects || []).forEach(project => {
            if (!project) {
                return;
            }

            const item = createElement('div', 'project-item');
            const link = createElement('a');

            const href = resolvePath(project.link);
            if (href) {
                link.href = href;
            }

            const titleText = getLocalizedText(project.title, project.title?.english || project.title || '');
            const descriptionText = getLocalizedText(project.description, project.description || '');
            const altText = getLocalizedText(project.imageAlt, `${titleText} image`);

            if (project.image) {
                const media = createElement('div', 'project-card-media');
                const image = createElement('img', 'content-image');
                image.src = resolvePath(project.image);
                image.alt = altText;
                image.loading = 'lazy';
                image.decoding = 'async';
                if (Number.isFinite(project.imageWidth) && Number.isFinite(project.imageHeight)) {
                    image.width = project.imageWidth;
                    image.height = project.imageHeight;
                }
                media.appendChild(image);
                link.appendChild(media);
            }

            const body = createElement('div', 'project-card-body');
            const statusText = getLocalizedText(project.status, '');
            if (statusText) {
                const status = createElement('p', 'project-card-status');
                status.textContent = statusText;
                body.appendChild(status);
            }

            const title = createElement('h2');
            title.textContent = titleText;
            body.appendChild(title);

            const summaryText = getLocalizedText(project.summary, descriptionText);
            if (summaryText) {
                const description = createElement('p', 'project-card-summary');
                description.textContent = summaryText;
                body.appendChild(description);
            }

            const tags = Array.isArray(project.tags) ? project.tags.filter(Boolean) : [];
            if (tags.length) {
                const metadata = createElement('p', 'project-card-metadata');
                metadata.textContent = tags.join(', ');
                body.appendChild(metadata);
            }

            link.appendChild(body);
            item.appendChild(link);
            grid.appendChild(item);
        });

        if (!grid.children.length) {
            renderProjectsEmptyState(grid, 'No projects available yet.');
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        renderProjectsEmptyState(grid, 'Unable to load projects right now.');
    }
}
