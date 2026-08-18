// CineSuggest - TMDB requests go through the Vercel backend

const BASE_URL = '/api/movies';

const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const IMG_URL_ORIGINAL = 'https://image.tmdb.org/t/p/original';

async function fetchAPI(endpoint, params = {}) {
    try {
        const query = new URLSearchParams({
            endpoint,
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
        return await fetchAPI('/search/movie', { query });
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
    },

    getRecommendations: async (preferences) => {
        const params = {
            sort_by: preferences.sort_by || 'popularity.desc',
            include_adult: 'false',
            include_video: 'false',
            page: '1'
        };

        if (preferences.with_genres) params.with_genres = preferences.with_genres;
        if (preferences.with_original_language) {
            params.with_original_language = preferences.with_original_language;
        }
        if (preferences.vote_average_gte) {
            params.vote_average_gte = preferences.vote_average_gte;
        }
        if (preferences.primary_release_date_gte) {
            params.primary_release_date_gte = preferences.primary_release_date_gte;
        }
        if (preferences.primary_release_date_lte) {
            params.primary_release_date_lte = preferences.primary_release_date_lte;
        }

        return await fetchAPI('/discover/movie', params);
    }
};
