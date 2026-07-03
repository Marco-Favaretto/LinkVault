let allLinks = [];
let activeCategory = null;
let activeTags = new Set();

document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    const themeData = await chrome.storage.local.get('theme');
    const currentTheme = themeData.theme || 'light';
    applyTheme(currentTheme);

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
    document.getElementById('form-edit-link').addEventListener('submit', saveEdit);
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('btn-clear-all').addEventListener('click', clearAllLinks);
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
                    Apri
                </a>
                <button class="btn btn-sm btn-outline-warning btn-edit" data-id="${link.id}" title="Modifica Link">
                    Modifica
                </button>
                <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${link.id}" title="Elimina Link">
                    Elimina
                </button>
            </td>
        </tr>
    `).join('');

    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', openEditModal);
    });
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', deleteLink);
    });
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

// Istanza modale bootstrap per poterlo chiudere via codice
let bootstrapEditModal = null;

function openEditModal(e) {
    const linkId = e.target.dataset.id;
    const link = allLinks.find(l => l.id === linkId);
    
    if (!link) return;

    // Popola i campi del modale con i dati correnti
    document.getElementById('edit-id').value = link.id;
    document.getElementById('edit-title').value = link.title || '';
    document.getElementById('edit-url').value = link.url || '';
    document.getElementById('edit-category').value = link.category === 'Generale' ? '' : (link.category || '');
    document.getElementById('edit-tags').value = (link.tags || []).join(', ');
    document.getElementById('edit-description').value = link.description || '';

    // Mostra modale usando api js bootstrap
    if (!bootstrapEditModal) {
        bootstrapEditModal = new bootstrap.Modal(document.getElementById('editModal'));
    }
    bootstrapEditModal.show();
}

async function saveEdit(e) {
    e.preventDefault();

    const linkId = document.getElementById('edit-id').value;
    
    // Trova l'indice del link all'interno dell'array globale
    const index = allLinks.findIndex(l => l.id === linkId);
    if (index === -1) return;

    // Pulisce i tag inseriti
    const tagsInput = document.getElementById('edit-tags').value;
    const tagsArray = tagsInput ? tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(t => t) : [];

    // Aggiorna l'oggetto mantenendo lo stato 'favorite' invariato
    allLinks[index] = {
        ...allLinks[index],
        title: document.getElementById('edit-title').value,
        url: document.getElementById('edit-url').value,
        category: document.getElementById('edit-category').value.trim() || 'Generale',
        tags: tagsArray,
        description: document.getElementById('edit-description').value.trim()
    };

    // Salva nello storage e aggiorna la vista
    await chrome.storage.local.set({ links: allLinks });
    renderAll();

    // Chiude il modale
    bootstrapEditModal.hide();
}

async function deleteLink(e) {
    const linkId = e.target.dataset.id;
    const link = allLinks.find(l => l.id === linkId);

    if (!link) return;

    const confirmDelete = confirm(`Sei sicuro di voler eliminare il link "${link.title || link.url}"?`);
    if (!confirmDelete) return;

    allLinks = allLinks.filter(l => l.id !== linkId);

    await chrome.storage.local.set({ links: allLinks });

    renderAll();
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    
    // Aggiorna bottone
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.innerHTML = theme === 'dark' ? 'Join the light side' : 'Join the dark side';
    }
}

async function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Salva preferenza nel browser
    await chrome.storage.local.set({ theme: newTheme });
    
    applyTheme(newTheme);
}

async function clearAllLinks() {
    const firstConfirm = confirm("Sei sicuro di voler cancellare TUTTI i link salvati? Questa azione e' irreversibile.");
    if (!firstConfirm) return;

    const secondConfirm = confirm("ATTENZIONE: Stai per eliminare definitivamente ogni dato. Confermi davvero?");
    if (!secondConfirm) return;

    allLinks = [];
    
    await chrome.storage.local.set({ links: [] });
    
    renderAll();
    
    alert("Database svuotato con successo.");
}