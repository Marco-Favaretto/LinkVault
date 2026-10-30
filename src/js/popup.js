const WEB_URL = /^https?:\/\//i;

document.addEventListener('DOMContentLoaded', async () => {
    const titleInput = document.getElementById('input-title');
    const urlsInput = document.getElementById('input-urls');
    const urlsLabel = document.getElementById('lbl-urls');
    const chkAllTabs = document.getElementById('chk-all-tabs');
    const lblAllTabs = document.getElementById('lbl-all-tabs');

    // recupera la scheda attiva e tutte le schede della finestra
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const windowTabs = await chrome.tabs.query({ currentWindow: true });

    const allUrls = [...new Set(
        windowTabs.map(t => t.url).filter(u => u && WEB_URL.test(u))
    )];
    const singleUrls = tab && tab.url ? [tab.url] : [];
    const singleTitle = tab ? (tab.title || '') : '';

    const themeData = await chrome.storage.local.get('theme');
    document.documentElement.setAttribute('data-bs-theme', themeData.theme || 'light');

    lblAllTabs.textContent = `Salva tutte le schede della finestra (${allUrls.length})`;

    let autoTitle = singleTitle;
    titleInput.value = singleTitle;

    function currentUrls() {
        return chkAllTabs.checked ? allUrls : singleUrls;
    }

    function refreshUrls() {
        const urls = currentUrls();
        urlsInput.value = urls.join('\n');
        urlsInput.rows = Math.min(Math.max(urls.length, 1), 5);
        urlsLabel.textContent = urls.length > 1 ? `URL (${urls.length})` : 'URL';
    }

    refreshUrls();

    chkAllTabs.addEventListener('change', () => {
        const newAuto = chkAllTabs.checked
            ? `${allUrls.length} schede - ${new Date().toLocaleDateString('it-IT')}`
            : singleTitle;
        if (titleInput.value === autoTitle) titleInput.value = newAuto;
        autoTitle = newAuto;
        refreshUrls();
    });

    // apertura dashboard
    document.getElementById('btn-open-dashboard').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    // form
    document.getElementById('form-save-link').addEventListener('submit', async (e) => {
        e.preventDefault();

        const urls = currentUrls();
        if (urls.length === 0) {
            alert('Nessun URL da salvare.');
            return;
        }

        // estrai tag (separati da virgola)
        const tagsInput = document.getElementById('input-tags').value;
        const tagsArray = tagsInput ? tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(t => t) : [];

        // estrae autori inseriti
        const authsInput = document.getElementById('input-author').value;
        const authsArray = authsInput ? authsInput.split(',').map(a => a.trim().toLowerCase()).filter(a => a) : [];

        // crea oggetto link
        const newLink = {
            id: Date.now().toString(),
            title: titleInput.value,
            urls: urls,
            category: document.getElementById('input-category').value.trim() || 'Generale',
            tags: tagsArray,
            authors: authsArray,
            favorite: false,
            description: document.getElementById('input-description').value.trim()
        };

        const data = await chrome.storage.local.get('links');
        const currentLinks = (data.links || []).map(normalizeLink);

        currentLinks.push(newLink);

        await chrome.storage.local.set({ links: currentLinks });

        window.close();
    });
});
