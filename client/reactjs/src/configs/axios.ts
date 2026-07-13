import axios from 'axios';

const baseURL =
    (import.meta.env.VITE_BASE_URL || import.meta.env.VITE_BASEURL || 'http://127.0.0.1:5050')
        .trim()
        .replace('http://localhost:5000', 'http://127.0.0.1:5050')
        .replace('http://127.0.0.1:5000', 'http://127.0.0.1:5050');

const api = axios.create({
    baseURL,
})

export default api;
