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