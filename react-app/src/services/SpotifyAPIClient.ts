import axios, {AxiosRequestConfig} from 'axios';

const spotifyAPI = (function() {
    const _getToken = async (email: string) => {
        const response = await axios.get('http://localhost:3000/getToken', {params: {email}});
        return response.data;
    };

    const _getTopTracks = async (accessToken: string) => {

        const result = await fetch(`https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=5&offset=0`,{
            method: 'GET',
            headers: {'Authorization': `Bearer ${accessToken}`}
        });

        const data = await result.json();
        return data.items;
    }

    const _getTopArtists = async (accessToken: string) => {

        const result = await fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=5&offset=0`,{
            method: 'GET',
            headers: {'Authorization': `Bearer ${accessToken}`}
        });

        const data = await result.json();
        return data.items;
    }

    return {
        getToken: async (email: string) => {
            return await _getToken(email);
        },
        getTopTracks: async (accessToken: string) => {
            return await _getTopTracks(accessToken);
        },
        getTopArtists: async (accessToken: string) => {
            return await _getTopArtists(accessToken);
        }
    }
});

export default spotifyAPI;