// Paste your TMDb API Key inside the quotes!
const API_KEY = '4bad841bec1a382517e28919017f051e'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const IMG_URL_ORIGINAL = 'https://image.tmdb.org/t/p/original';

// Generic Fetch function with error handling
async function fetchAPI(endpoint) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('API Fetch Error:', error);
        return null;
    }
}

// API Endpoints for TMDb
const API = {
    getTrending: async () => {
        return await fetchAPI(`/trending/movie/week?api_key=${API_KEY}`);
    },
    searchMovies: async (query) => {
        return await fetchAPI(`/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
    },
    getMovieDetails: async (id) => {
        return await fetchAPI(`/movie/${id}?api_key=${API_KEY}&append_to_response=credits,similar`);
    }
};