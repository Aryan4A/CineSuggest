// DOM Elements
const views = document.querySelectorAll('.view');
const navHome = document.getElementById('nav-home');
const navRecommend = document.getElementById('nav-recommend');
const navFav = document.getElementById('nav-favorites');
const navLogo = document.getElementById('nav-logo');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const moviesGrid = document.getElementById('movies-grid');
const favoritesGrid = document.getElementById('favorites-grid');
const detailsView = document.getElementById('view-details');
const spinner = document.getElementById('spinner');
const noFavMsg = document.getElementById('no-favorites-msg');

const recommendationView = document.getElementById('view-recommendations');
const heroRecommendBtn = document.getElementById('hero-recommend-btn');
const getRecommendationsBtn = document.getElementById('get-recommendations-btn');
const changePreferencesBtn = document.getElementById('change-preferences-btn');
const recommendationResults = document.getElementById('recommendation-results');
const recommendationsGrid = document.getElementById('recommendations-grid');
const recommendationSummary = document.getElementById('recommendation-summary');
const prefGenre = document.getElementById('pref-genre');
const prefMood = document.getElementById('pref-mood');
const prefLanguage = document.getElementById('pref-language');
const prefRating = document.getElementById('pref-rating');
const prefEra = document.getElementById('pref-era');

// State
let favorites = JSON.parse(localStorage.getItem('cineSuggestFavs')) || [];
let isInitialLoadComplete = false;
let currentTrendingIds = [];

// --- Routing / View Management ---
function switchView(viewId) {
    views.forEach(view => view.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');

    navHome.classList.remove('active');
    navRecommend.classList.remove('active');
    navFav.classList.remove('active');

    if (viewId === 'view-home') navHome.classList.add('active');
    if (viewId === 'view-recommendations') navRecommend.classList.add('active');
    if (viewId === 'view-favorites') navFav.classList.add('active');
}

// --- Init & Loading ---
async function init() {
    if (isInitialLoadComplete) return;

    showSpinner(true);
    const data = await API.getTrending();

    if (data && data.results) {
        renderMovies(data.results, moviesGrid);
        renderHeroCollage(data.results);
        currentTrendingIds = data.results.map(m => m.id);
        loadGenreRows();
        loadRecommendationGenres();
        isInitialLoadComplete = true;
    } else {
        moviesGrid.innerHTML = '<p class="message">Failed to load movies. Please try again.</p>';
    }

    showSpinner(false);
}

function showSpinner(show) {
    if (show) spinner.classList.remove('hidden');
    else spinner.classList.add('hidden');
}

// --- Genre Rows ---
async function loadGenreRows() {
    const rowsEl = document.getElementById('genre-rows');
    rowsEl.innerHTML = '';

    const genreData = await API.getGenres();
    if (!genreData || !genreData.genres) return;

    const seenIds = new Set(currentTrendingIds);
    const picks = genreData.genres.slice(0, 6);

    for (const g of picks) {
        const data = await API.getMoviesByGenre(g.id);
        if (!data || !data.results || !data.results.length) continue;

        const unique = data.results.filter(m => !seenIds.has(m.id));
        if (!unique.length) continue;

        unique.forEach(m => seenIds.add(m.id));

        const section = document.createElement('div');
        section.innerHTML = `<h2 class="section-title">${g.name}</h2><div class="movies-grid"></div>`;
        rowsEl.appendChild(section);
        renderMovies(unique, section.querySelector('.movies-grid'));
    }
}

// --- Recommendation Preferences ---
async function loadRecommendationGenres() {
    const genreData = await API.getGenres();
    if (!genreData || !genreData.genres) return;

    prefGenre.innerHTML = '<option value="">Any genre</option>';

    genreData.genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre.id;
        option.textContent = genre.name;
        prefGenre.appendChild(option);
    });
}

function buildRecommendationPreferences() {
    const mood = prefMood.value;

    const preferences = {
        with_genres: prefGenre.value,
        with_original_language: prefLanguage.value,
        vote_average_gte: prefRating.value,
        sort_by: 'popularity.desc'
    };

    if (prefEra.value === 'recent') {
        const date = new Date();
        const start = new Date(date.getFullYear() - 3, date.getMonth(), date.getDate());
        preferences.primary_release_date_gte = start.toISOString().split('T')[0];
    } else if (prefEra.value === '2010s') {
        preferences.primary_release_date_gte = '2010-01-01';
        preferences.primary_release_date_lte = '2019-12-31';
    } else if (prefEra.value === '2000s') {
        preferences.primary_release_date_gte = '2000-01-01';
        preferences.primary_release_date_lte = '2009-12-31';
    } else if (prefEra.value === 'classic') {
        preferences.primary_release_date_lte = '1999-12-31';
    }

    // TMDB does not have a universal "mood" filter.
    // We translate mood into sensible discovery/sorting behavior.
    if (mood === 'feel-good') {
        preferences.sort_by = 'vote_average.desc';
        preferences.vote_average_gte = preferences.vote_average_gte || '7';
    } else if (mood === 'exciting') {
        preferences.sort_by = 'popularity.desc';
    } else if (mood === 'mind-bending') {
        preferences.sort_by = 'vote_average.desc';
        preferences.vote_average_gte = preferences.vote_average_gte || '7.5';
    } else if (mood === 'dark') {
        preferences.sort_by = 'vote_average.desc';
        preferences.vote_average_gte = preferences.vote_average_gte || '7';
    } else if (mood === 'emotional') {
        preferences.sort_by = 'vote_average.desc';
        preferences.vote_average_gte = preferences.vote_average_gte || '7';
    } else if (mood === 'highly-rated') {
        preferences.sort_by = 'vote_average.desc';
        preferences.vote_average_gte = preferences.vote_average_gte || '7.5';
    }

    return preferences;
}

function getPreferenceSummary() {
    const parts = [];

    if (prefGenre.value) {
        parts.push(prefGenre.options[prefGenre.selectedIndex].text);
    }

    if (prefMood.value) {
        parts.push(prefMood.options[prefMood.selectedIndex].text);
    }

    if (prefLanguage.value) {
        parts.push(prefLanguage.options[prefLanguage.selectedIndex].text);
    }

    if (prefRating.value !== '0') {
        parts.push(`${prefRating.value}+ rating`);
    }

    if (prefEra.value) {
        parts.push(prefEra.options[prefEra.selectedIndex].text);
    }

    return parts.length ? parts.join(' • ') : 'A mix of popular movies selected for you';
}

async function getRecommendations() {
    showSpinner(true);

    const preferences = buildRecommendationPreferences();
    const data = await API.getRecommendations(preferences);

    showSpinner(false);

    if (!data || !data.results) {
        recommendationSummary.textContent = 'We could not load recommendations. Please try again.';
        recommendationResults.classList.remove('hidden');
        recommendationsGrid.innerHTML = '';
        return;
    }

    let results = data.results.filter(movie => movie.poster_path);

    // If filters are too restrictive, still give the user something useful.
    if (results.length < 5 && (preferences.vote_average_gte || preferences.with_genres || preferences.with_original_language)) {
        const relaxed = { ...preferences };
        delete relaxed.vote_average_gte;
        const fallback = await API.getRecommendations(relaxed);
        if (fallback && fallback.results) {
            results = fallback.results.filter(movie => movie.poster_path);
        }
    }

    results = results.slice(0, 12);

    recommendationSummary.textContent = `Based on: ${getPreferenceSummary()}`;
    recommendationResults.classList.remove('hidden');
    renderMovies(results, recommendationsGrid);

    recommendationResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// --- Hero Collage ---
function renderHeroCollage(movies) {
    const heroBg = document.getElementById('hero-bg');
    if (!heroBg) return;

    const tiles = movies.filter(m => m.backdrop_path).slice(0, 6);

    heroBg.innerHTML = tiles.map((m, i) => `
        <div class="hero-tile" style="background-image: url('${IMG_URL_ORIGINAL + m.backdrop_path}'); animation-delay: ${i * 0.15}s;"></div>
    `).join('');
}

// --- Render Logic ---
function renderMovies(movies, container) {
    container.innerHTML = '';

    if (!movies || movies.length === 0) {
        container.innerHTML = '<p class="message">No movies found.</p>';
        return;
    }

    movies.forEach(movie => {
        if (!movie.poster_path) return;

        const card = document.createElement('div');
        card.className = 'movie-card';
        card.onclick = () => loadMovieDetails(movie.id);

        const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'NR';

        card.innerHTML = `
            <div class="movie-poster">
                <img src="${IMG_URL + movie.poster_path}" alt="${movie.title}" loading="lazy">
            </div>
            <div class="movie-info">
                <h3>${movie.title}</h3>
                <div class="movie-meta">
                    <span>${year}</span>
                    <span class="rating"><i class="fas fa-star"></i> ${rating}</span>
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}

// --- Movie Details ---
async function loadMovieDetails(id) {
    showSpinner(true);
    switchView('view-details');

    const movie = await API.getMovieDetails(id);
    showSpinner(false);

    if (!movie) {
        detailsView.innerHTML = '<p class="message">Error loading details.</p>';
        return;
    }

    const year = movie.release_date ? movie.release_date.split('-')[0] : '';
    const isFav = favorites.some(f => f.id === movie.id);

    detailsView.innerHTML = `
        <div class="details-banner" style="background-image: url('${IMG_URL_ORIGINAL + movie.backdrop_path}')"></div>
        <div class="container details-content">
            <img src="${IMG_URL + movie.poster_path}" alt="${movie.title}" class="details-poster">
            <div class="details-info">
                <h1>${movie.title} (${year})</h1>
                <div class="details-meta">
                    <span><i class="fas fa-star" style="color:#f5c518"></i> ${movie.vote_average.toFixed(1)}</span>
                    <span>${movie.runtime} min</span>
                    <div class="genres">
                        ${movie.genres.map(g => `<span>${g.name}</span>`).join('')}
                    </div>
                </div>
                <p class="overview">${movie.overview}</p>
                <button class="btn-fav" onclick="toggleFavorite(${movie.id}, '${movie.title.replace(/'/g, "\'")}', '${movie.poster_path}')">
                    <i class="fas fa-heart" style="color: ${isFav ? 'white' : 'transparent'}; stroke: white; stroke-width: 2px;"></i>
                    ${isFav ? 'Remove from Favorites' : 'Add to Favorites'}
                </button>
            </div>
        </div>
        <div class="container">
            <h2 class="section-title">Similar Movies</h2>
            <div id="similar-grid" class="movies-grid"></div>
        </div>
    `;

    if (movie.similar && movie.similar.results.length > 0) {
        renderMovies(movie.similar.results.slice(0, 5), document.getElementById('similar-grid'));
    } else {
        document.getElementById('similar-grid').innerHTML =
            '<p style="color: var(--text-muted);">No similar movies found.</p>';
    }
}

// --- Search Logic ---
async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    switchView('view-home');
    document.querySelector('.hero').classList.add('hidden');
    document.getElementById('genre-rows').innerHTML = '';
    document.querySelector('#view-home .section-title').textContent = `Search Results for "${query}"`;

    showSpinner(true);
    const data = await API.searchMovies(query);

    if (data) renderMovies(data.results, moviesGrid);

    showSpinner(false);
}

// --- Favorites Logic ---
function toggleFavorite(id, title, poster_path) {
    const index = favorites.findIndex(f => f.id === id);

    if (index === -1) {
        favorites.push({ id, title, poster_path });
    } else {
        favorites.splice(index, 1);
    }

    localStorage.setItem('cineSuggestFavs', JSON.stringify(favorites));
    loadMovieDetails(id);
}

// --- Render Favorites Grid ---
function renderFavorites() {
    if (favorites.length === 0) {
        favoritesGrid.innerHTML = '';
        noFavMsg.classList.remove('hidden');
    } else {
        noFavMsg.classList.add('hidden');

        const formattedFavs = favorites.map(fav => ({
            id: fav.id,
            title: fav.title,
            poster_path: fav.poster_path,
            release_date: '',
            vote_average: 0
        }));

        renderMovies(formattedFavs, favoritesGrid);
    }
}

// --- Navigation ---
async function goHome() {
    document.querySelector('.hero').classList.remove('hidden');
    document.querySelector('#view-home .section-title').textContent = 'Trending Now';
    searchInput.value = '';
    switchView('view-home');

    showSpinner(true);
    const data = await API.getTrending();

    if (data && data.results) {
        renderMovies(data.results, moviesGrid);
        currentTrendingIds = data.results.map(m => m.id);
        loadGenreRows();
    }

    showSpinner(false);
}

function openRecommendations() {
    switchView('view-recommendations');
    recommendationResults.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- Event Listeners ---
navHome.addEventListener('click', (e) => {
    e.preventDefault();
    goHome();
});

navLogo.addEventListener('click', goHome);

navRecommend.addEventListener('click', (e) => {
    e.preventDefault();
    openRecommendations();
});

heroRecommendBtn.addEventListener('click', openRecommendations);

navFav.addEventListener('click', (e) => {
    e.preventDefault();
    renderFavorites();
    switchView('view-favorites');
});

searchBtn.addEventListener('click', handleSearch);

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

getRecommendationsBtn.addEventListener('click', getRecommendations);

changePreferencesBtn.addEventListener('click', () => {
    recommendationResults.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Boot app once on load
init();
