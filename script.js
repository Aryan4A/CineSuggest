// DOM Elements
const views = document.querySelectorAll('.view');
const navHome = document.getElementById('nav-home');
const navFav = document.getElementById('nav-favorites');
const navLogo = document.getElementById('nav-logo');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const moviesGrid = document.getElementById('movies-grid');
const favoritesGrid = document.getElementById('favorites-grid');
const detailsView = document.getElementById('view-details');
const spinner = document.getElementById('spinner');
const noFavMsg = document.getElementById('no-favorites-msg');

// State
let favorites = JSON.parse(localStorage.getItem('cineSuggestFavs')) || [];
let isInitialLoadComplete = false;

// --- Routing / View Management ---
function switchView(viewId) {
    views.forEach(view => view.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
    
    // Manage active nav state
    navHome.classList.remove('active');
    navFav.classList.remove('active');
    if (viewId === 'view-home') navHome.classList.add('active');
    if (viewId === 'view-favorites') navFav.classList.add('active');
}

// --- Init & Loading ---
async function init() {
    // Prevent multiple simultaneous init runs
    if (isInitialLoadComplete) return; 
    
    showSpinner(true);
    const data = await API.getTrending();
    if (data && data.results) {
        renderMovies(data.results, moviesGrid);
        isInitialLoadComplete = true;
    } else {
        moviesGrid.innerHTML = '<p class="message">Failed to load movies. (Make sure your VPN is on!)</p>';
    }
    showSpinner(false);
}

function showSpinner(show) {
    if (show) spinner.classList.remove('hidden');
    else spinner.classList.add('hidden');
}

// --- Render Logic ---
function renderMovies(movies, container) {
    container.innerHTML = '';
    if (!movies || movies.length === 0) {
        container.innerHTML = '<p class="message">No movies found.</p>';
        return;
    }

    movies.forEach(movie => {
        if (!movie.poster_path) return; // Skip if no image
        
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
                <button class="btn-fav" onclick="toggleFavorite(${movie.id}, '${movie.title.replace(/'/g, "\\'")}', '${movie.poster_path}')">
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
        document.getElementById('similar-grid').innerHTML = '<p style="color: var(--text-muted);">No similar movies found.</p>';
    }
}

// --- Search Logic ---
async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) return;
    
    switchView('view-home');
    document.querySelector('.hero').classList.add('hidden'); // Hide hero on search
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
    loadMovieDetails(id); // Re-render to update button text
}

// --- Render Favorites Grid ---
function renderFavorites() {
    if (favorites.length === 0) {
        favoritesGrid.innerHTML = '';
        noFavMsg.classList.remove('hidden');
    } else {
        noFavMsg.classList.add('hidden');
        
        // Map favorites data structure back to match renderMovies expectations
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

// --- Event Listeners ---
// --- Helper Function to Reset Home ---
async function goHome() {
    // Reset the UI
    document.querySelector('.hero').classList.remove('hidden');
    document.querySelector('#view-home .section-title').textContent = 'Trending Now';
    searchInput.value = '';
    switchView('view-home');
    
    // Re-fetch the trending movies to overwrite search results
    showSpinner(true);
    const data = await API.getTrending();
    if (data && data.results) {
        renderMovies(data.results, moviesGrid);
    }
    showSpinner(false);
}

// --- Event Listeners ---
navHome.addEventListener('click', (e) => {
    e.preventDefault();
    goHome();
});

navLogo.addEventListener('click', goHome);

navFav.addEventListener('click', (e) => {
    e.preventDefault();
    renderFavorites();
    switchView('view-favorites');
});

searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

// Boot app once on load
init();