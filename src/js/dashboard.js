let allLinks = [];
let activeCategory = null;
let activeTags = new Set();

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
    
    document.getElementById('btn-export').addEventListener('click', exportJSON);
    document.getElementById('input-import').addEventListener('change', importJSON);
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
        const isActive = activeTags.has(tag);
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
            if (activeTags.has(clickedTag)) {
                activeTags.delete(clickedTag);
            } else {
                activeTags.add(clickedTag);
            }
            renderFilters();
            applyFiltersAndSearch();
        });
    });
}

// Applica filtri + ricerca testuale
function applyFiltersAndSearch() {
    const searchTerm = document.getElementById('search-bar').value.toLowerCase();

    const filtered = allLinks.filter(link => {
        if (activeCategory && link.category !== activeCategory) return false;

        if (activeTags.size > 0) {
            const hasAllTags = Array.from(activeTags).every(tag => link.tags && link.tags.includes(tag));
            if (!hasAllTags) return false;
        }

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

function exportJSON() {
    if (allLinks.length === 0) {
        alert("Non ci sono link da esportare.");
        return;
    }

    const dataStr = JSON.stringify({ links: allLinks }, null, 2);
    
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Crea un elemento 'a' temporaneo per simulare il click di download
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = `linkvault_backup_${Date.now()}.json`;
    
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);
}

function importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = async (event) => {
        try {
            const parsedData = JSON.parse(event.target.result);

            // Validazione base del formato
            if (!parsedData || !Array.isArray(parsedData.links)) {
                throw new Error("Formato JSON non valido. Deve contenere un array 'links'.");
            }

            // Recupera i link attuali per non sovrascriverli (unione dei dati)
            const data = await chrome.storage.local.get('links');
            const currentLinks = data.links || [];

            // Opzionale: Evita duplicati identici controllando l'URL
            const existingUrls = new Set(currentLinks.map(l => l.url));
            const newLinksFiltered = parsedData.links.filter(l => !existingUrls.has(l.url));

            if (newLinksFiltered.length === 0) {
                alert("Tutti i link nel file sono già presenti nell'estensione.");
                return;
            }

            // Unisci i vecchi link con i nuovi filtrati
            allLinks = [...currentLinks, ...newLinksFiltered];

            // Salva nello storage locale
            await chrome.storage.local.set({ links: allLinks });

            // Aggiorna l'interfaccia visiva
            renderAll();
            alert(`Importazione completata! Aggiunti ${newLinksFiltered.length} nuovi link.`);

        } catch (err) {
            alert(`Errore durante l'importazione: ${err.message}`);
        } finally {
            // Resetta l'input file per permettere di ricaricare lo stesso file in seguito
            e.target.value = '';
        }
    };

    reader.readAsText(file);
}