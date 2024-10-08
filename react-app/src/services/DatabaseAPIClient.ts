import axios from 'axios';

const serverBaseURL = 'http://16.171.9.42:3000';

export const createUser = async (userData : {email: string, password: string}) => {
    try{
        const response = await axios.post(`${serverBaseURL}/users/create`, userData);
        return response.data;
    } catch (error: any) {
        throw error.response.data;
    }
};

export const authenticateUser = async (userData: {email: string, password: string}) => {
    try{
        const response = await axios.get(`${serverBaseURL}/users/authenticate`, {params: userData,});
        return response.data;
    } catch (error: any) {
        throw error.response.data;
    }
};

export const connectSpotify = async () => {
    try{
        const response = await axios.get(`${serverBaseURL}/connect`);
        return response.data;
    } catch(error: any) {
        throw error.response.data;
    }
};

export const addTokens = async (userData : {email: string, accessToken: string, refreshToken: string}) => {
    try{
        const response = await axios.post(`${serverBaseURL}/users/addTokens`, userData);
        return response.data;
    } catch (error: any) {
        throw error.response.data;
    }
};


export const addTopTracks = async (userData: {email: string, tracks: any}) => {
    try{
        const response = await axios.post(`${serverBaseURL}/users/addTopTracks`, userData);
        return response.data;
    } catch (error: any) {
        throw error.response.data;
    }
};

export const getRecommendations = async (userData: {email: string}) => {
    try{
        const response = await axios.get(`${serverBaseURL}/users/recommendations`, {params: userData});
        return response.data;
    } catch (error: any) {
        throw error.response.data;
    }
};