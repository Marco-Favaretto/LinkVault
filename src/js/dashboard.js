let allLinks = [];
let activeCategory = null;
let activeTag = null;

document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    // Recupero dati da chrome.storage.local
    const data = await chrome.storage.local.get('links');
    allLinks = data.links || [];

    // Registra gli eventi per la barra di ricerca e import/export
    setupEventListeners();

    // Renderizza l'interfaccia
    renderAll();
}

function setupEventListeners() {
    document.getElementById('search-bar').addEventListener('input', applyFiltersAndSearch);
    
    // TODO tasti e listener export/import
}

function renderAll() {
    renderFilters();
    applyFiltersAndSearch();
}

// Estrae categorie e tag unici e li stampa nella sidebar
function renderFilters() {
    const categoriesDiv = document.getElementById('filter-categories');
    const tagsDiv = document.getElementById('filter-tags');

    // Set -> niente duplicati
    const categories = new Set();
    const tags = new Set();

    allLinks.forEach(link => {
        if (link.category) categories.add(link.category);
        if (link.tags) link.tags.forEach(t => tags.add(t));
    });

    // Render Categorie
    categoriesDiv.innerHTML = `
        <button class="list-group-item list-group-item-action ${!activeCategory ? 'active' : ''}" data-category="">
            Tutte le categorie
        </button>
    `;
    categories.forEach(cat => {
        categoriesDiv.innerHTML += `
            <button class="list-group-item list-group-item-action ${activeCategory === cat ? 'active' : ''}" data-category="${cat}">
                ${cat}
            </button>
        `;
    });

    // Render Tag
    tagsDiv.innerHTML = '';
    tags.forEach(tag => {
        const isActive = activeTag === tag;
        tagsDiv.innerHTML += `
            <button class="btn ${isActive ? 'btn-primary' : 'btn-outline-secondary'} btn-sm" data-tag="${tag}">
                #${tag}
            </button>
        `;
    });

    attachFilterListeners();
}

function attachFilterListeners() {
    // Click sulle categorie
    document.querySelectorAll('#filter-categories button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            activeCategory = e.target.dataset.category || null;
            renderFilters();
            applyFiltersAndSearch();
        });
    });

    // Click sui tag
    document.querySelectorAll('#filter-tags button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const clickedTag = e.target.dataset.tag;
            // Se clicco su un tag già attivo, lo disattivo
            activeTag = activeTag === clickedTag ? null : clickedTag;
            renderFilters();
            applyFiltersAndSearch();
        });
    });
}

// Applica filtri + ricerca testuale
function applyFiltersAndSearch() {
    const searchTerm = document.getElementById('search-bar').value.toLowerCase();

    const filtered = allLinks.filter(link => {
        // Categoria
        if (activeCategory && link.category !== activeCategory) return false;

        // Tag
        if (activeTag && (!link.tags || !link.tags.includes(activeTag))) return false;

        // Testo (titolo, url, descrizione, tag)
        if (searchTerm) {
            const matchesTitle = link.title?.toLowerCase().includes(searchTerm);
            const matchesUrl = link.url?.toLowerCase().includes(searchTerm);
            const matchesDesc = link.description?.toLowerCase().includes(searchTerm);
            const matchesTags = link.tags?.some(t => t.toLowerCase().includes(searchTerm));
            
            return matchesTitle || matchesUrl || matchesDesc || matchesTags;
        }

        return true;
    });

    renderLinks(filtered);
}

// Inietta le righe della tabella
function renderLinks(linksToRender) {
    const container = document.getElementById('links-container');
    
    if (linksToRender.length === 0) {
        container.innerHTML = '<tr><td colspan="4" class="text-muted text-center py-5">Nessun link trovato.</td></tr>';
        return;
    }

    container.innerHTML = linksToRender.map(link => `
        <tr>
            <!-- Titolo e URL -->
            <td>
                <div class="fw-bold text-truncate" style="max-width: 250px;" title="${link.title || link.url}">
                    ${link.title || link.url}
                </div>
                <div class="text-muted small text-truncate" style="max-width: 250px;">
                    <a href="${link.url}" target="_blank" class="text-decoration-none text-secondary">${link.url}</a>
                </div>
            </td>
            
            <!-- Categoria -->
            <td>
                <span class="badge bg-secondary-subtle text-secondary-emphasis">
                    ${link.category || 'Generale'}
                </span>
            </td>
            
            <!-- Descrizione e Tag -->
            <td>
                <div class="small text-secondary text-truncate mb-1" style="max-width: 350px;" title="${link.description || ''}">
                    ${link.description || '<span class="text-muted italic small">Nessuna descrizione</span>'}
                </div>
                <div class="d-flex flex-wrap gap-1">
                    ${(link.tags || []).map(t => `<span class="badge bg-light text-dark border small">#${t}</span>`).join('')}
                </div>
            </td>
            
            <!-- Azioni -->
            <td class="text-end">
                <a href="${link.url}" target="_blank" class="btn btn-sm btn-outline-primary" title="Apri Link">
                    Apri link
                </a>
                <!-- In futuro qui metteremo il tasto Elimina -->
            </td>
        </tr>
    `).join('');
}