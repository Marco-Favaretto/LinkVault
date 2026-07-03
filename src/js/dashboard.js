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

// Inietta le card dei link nel container principale
function renderLinks(linksToRender) {
    const container = document.getElementById('links-container');
    
    if (linksToRender.length === 0) {
        container.innerHTML = '<div class="col-100 text-muted w-100 text-center py-5">Nessun link trovato.</div>';
        return;
    }

    container.innerHTML = linksToRender.map(link => `
        <div class="col">
            <div class="card h-100 shadow-sm">
                <div class="card-body">
                    <h5 class="card-title text-truncate">${link.title || link.url}</h5>
                    <h6 class="card-subtitle mb-2 text-muted small">${link.category || 'Nessuna categoria'}</h6>
                    <p class="card-text small text-secondary">${link.description || 'Nessuna descrizione.'}</p>
                    <div class="mb-3">
                        ${(link.tags || []).map(t => `<span class="badge bg-light text-dark me-1">#${t}</span>`).join('')}
                    </div>
                    <a href="${link.url}" target="_blank" class="btn btn-primary btn-sm">Apri link</a>
                </div>
            </div>
        </div>
    `).join('');
}