// retrocompatibilità modello vecchio a url singolo
function normalizeLink(link) {
    const { url, ...rest } = link;
    let urls = Array.isArray(link.urls) ? link.urls.filter(Boolean) : [];
    if (urls.length === 0 && url) urls = [url];
    return { ...rest, urls };
}

// chiave per riconoscere doppioni
function linkKey(link) {
    return link.urls.join('\n');
}
