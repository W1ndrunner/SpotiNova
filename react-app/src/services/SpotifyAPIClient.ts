import axios from 'axios';

const getToken = async (email: string) => {
    const response = await axios.get('http://16.171.9.42:3000/users/getToken', {params: {email}});
    return response.data;
};

const getTopTracks = async (accessToken: string) => {
    const result = await fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=5&offset=0`, {
        method: 'GET',
        headers: {'Authorization': `Bearer ${accessToken}`}
    });

    const data = await result.json();
    return data.items;
};

const getTopArtists = async (accessToken: string) => {
    const result = await fetch(`https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=5&offset=0`, {
        method: 'GET',
        headers: {'Authorization': `Bearer ${accessToken}`}
    });

    const data = await result.json();
    return data.items;
};

const getTrackFeatures = async (accessToken: string, trackIds: string[]) => {
    const result = await fetch(`https://api.spotify.com/v1/audio-features?ids=${trackIds.join(',')}`, {
        method: 'GET',
        headers: {'Authorization': `Bearer ${accessToken}`}
    });
    
    const data = await result.json();
    return data.audio_features;
};

const getTrackInfo = async (accessToken: string, trackIds: string[]) => {
    const result = await fetch(`https://api.spotify.com/v1/tracks?ids=${trackIds.join(',')}`, {
        method: 'GET',
        headers: {'Authorization': `Bearer ${accessToken}`}
    });
    const data = await result.json();
    return data.tracks;
};
export { getToken, getTopTracks, getTopArtists, getTrackFeatures, getTrackInfo };