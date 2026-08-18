// CineSuggest - TMDB API through Vercel backend

const BASE_URL = '/api/movies';

// TMDB image servers
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const IMG_URL_ORIGINAL = 'https://image.tmdb.org/t/p/original';

async function fetchAPI(endpoint, params = {}) {
    try {
        const query = new URLSearchParams({
            endpoint: endpoint,
            ...params
        });

        const response = await fetch(`${BASE_URL}?${query.toString()}`);

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        return await response.json();

    } catch (error) {
        console.error('API Fetch Error:', error);
        return null;
    }
}

const API = {

    getTrending: async () => {
        return await fetchAPI('/trending/movie/week');
    },

    searchMovies: async (query) => {
        return await fetchAPI('/search/movie', {
            query: query
        });
    },

    getMovieDetails: async (id) => {
        return await fetchAPI(`/movie/${id}`, {
            append_to_response: 'credits,similar'
        });
    },

    getGenres: async () => {
        return await fetchAPI('/genre/movie/list');
    },

    getMoviesByGenre: async (genreId) => {
        return await fetchAPI('/discover/movie', {
            with_genres: genreId,
            sort_by: 'popularity.desc'
        });
    }
};
