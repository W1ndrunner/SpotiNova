import axios from 'axios';

const serverBaseURL = 'http://localhost:3000';

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