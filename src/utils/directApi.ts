import axios from 'axios';

const directApi = axios.create({
  baseURL: 'http://crmstaging.sipzon.com:7480/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  // Bypass any proxy settings
  proxy: false
});

export default directApi;
