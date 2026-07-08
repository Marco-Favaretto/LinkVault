document.addEventListener('DOMContentLoaded', async () => {
    // recupera la scheda attiva
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const themeData = await chrome.storage.local.get('theme');
    document.documentElement.setAttribute('data-bs-theme', themeData.theme || 'light');

    if (tab) {
        document.getElementById('input-title').value = tab.title || '';
        document.getElementById('input-url').value = tab.url || '';
    }

    // apertura dashboard
    document.getElementById('btn-open-dashboard').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    // form
    document.getElementById('form-save-link').addEventListener('submit', async (e) => {
        e.preventDefault();

        // estrai tag (separati da virgola)
        const tagsInput = document.getElementById('input-tags').value;
        const tagsArray = tagsInput ? tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(t => t) : [];

        // estrae autori inseriti
        const authsInput = document.getElementById('input-author').value;
        const authsArray = authsInput ? authsInput.split(',').map(a => a.trim().toLowerCase()).filter(a => a) : [];

        // crea oggetto link
        const newLink = {
            id: Date.now().toString(),
            title: document.getElementById('input-title').value,
            url: document.getElementById('input-url').value,
            category: document.getElementById('input-category').value.trim() || 'Generale',
            tags: tagsArray,
            authors: authsArray,
            favorite: false,
            description: document.getElementById('input-description').value.trim()
        };

        const data = await chrome.storage.local.get('links');
        const currentLinks = data.links || [];
        
        currentLinks.push(newLink);
        
        await chrome.storage.local.set({ links: currentLinks });

        window.close();
    });
});