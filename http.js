const axios = require('axios');

const axiosInstance = axios.create({
    //baseURL: 'http://184.72.206.2:3000',
    baseURL: 'http://localhost:3000',
    "Content-Type": "application/json",
})