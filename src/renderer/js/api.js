const MODRINTH_API_URL = 'https://api.modrinth.com/v2';

async function fetchMods(query = '', type = 'mod', loader = '', version = '', category = '', sort = 'relevance', limit = 20, offset = 0) {
    const facets = [];
    facets.push([`project_type:${type}`]);

    if (loader !== '') facets.push([`categories:${loader}`]);
    if (version !== '') facets.push([`versions:${version}`]);
    if (category !== '') facets.push([`categories:${category}`]);

    const facetString = encodeURIComponent(JSON.stringify(facets));
    const url = `${MODRINTH_API_URL}/search?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&index=${sort}&facets=${facetString}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch data from Modrinth');
        // Return the full data object so we can access total_hits for the page numbers!
        return await response.json(); 
    } catch (
        const response = aw
        console.error("Modrinth API Error:", error);
        return null;
    }
}

async function fetchModVersions(projectId) {
    const url = `${MODRINTH_API_URL}/project/${projectId}/version`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch versions');
        return await response.json();
    } catch (error) {
        console.error("Modrinth API Error:", error);
        return [];
    }
}

async function fetchGameVersions() {
    const url = `${MODRINTH_API_URL}/tag/game_version`;
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        return [];
    }
}

async function fetchLoaders() {
    const url = `${MODRINTH_API_URL}/tag/loader`;
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        return [];
    }
}
