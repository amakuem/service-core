import axios from 'axios';

const API = axios.create({
    baseURL: 'http://127.0.0.1:8000'
})

export const orderApi = {
    getAll: () => API.get('/orders'),
    getById: (id) => API.get(`/order/${id}`),
    create: (orderData) => API.post('/orders', orderData),
    update: (id, updateData) => API.patch(`/order/${id}`, updateData),
    delete: (id) => API.delete(`/order/${id}`),
    removeService: (orderId, serviceId) => API.delete(`/order/${orderId}/services/${serviceId}`)
};

export const serviceApi = {
    getAll: () => API.get('/services'),
    getById: (id) => API.get(`/service/${id}`),
    create: (serviceData) => API.post('/services', serviceData),
    update: (id, updateData) => API.patch(`/service/${id}`, updateData),
    delete: (id) => API.delete(`/servoce/${id}`)
}

export const usesrApi = {
    getAll: (id) => API.get('/users'),
    getById: (id) => API.get(`/user/${id}`),
    create: (userData) => API.post('/users', userData),
    update: (id, updateData) => API.patch(`/user/${id}`, updateData),
}

export const logsApi = {
    getAll: () => API.get('/users')
}