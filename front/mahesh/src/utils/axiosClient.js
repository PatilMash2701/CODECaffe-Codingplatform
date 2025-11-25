import axios from 'axios'

const axiosClient =axios.create({
    baseURL:'http://localhost:3000',
    withCredentials:true,
    headers:{
        'content-Type':'application/json'
    }
})

export default axiosClient;