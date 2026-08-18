export default async function handler(req, res) {
    try {
        const { endpoint, ...params } = req.query;

        if (!endpoint) {
            return res.status(400).json({
                error: 'Missing endpoint'
            });
        }

        // Only allow TMDB API paths
        if (!endpoint.startsWith('/')) {
            return res.status(400).json({
                error: 'Invalid endpoint'
            });
        }

        const url = new URL(`https://api.themoviedb.org/3${endpoint}`);

        // Add requested parameters
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                url.searchParams.set(key, value);
            }
        });

        // Add the secret TMDB key stored in Vercel
        url.searchParams.set('api_key', process.env.TMDB_API_KEY);

        const response = await fetch(url.toString());

        if (!response.ok) {
            const text = await response.text();

            return res.status(response.status).json({
                error: 'TMDB request failed',
                details: text
            });
        }

        const data = await response.json();

        return res.status(200).json(data);

    } catch (error) {
        console.error('TMDB Proxy Error:', error);

        return res.status(500).json({
            error: 'Server error'
        });
    }
}
