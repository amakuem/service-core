import axios from 'axios';

const API = axios.create({
    baseURL: 'http://127.0.0.1:8000'
})

API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            if (!window.location.pathname.includes('/login')) {
                console.warn('Сессия устарела. Перенаправление на вход...');
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
)

export const authApi = {
    register: (userData) => API.post('/auth/register', userData),
    login: (email, password) => {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        
        return API.post('/auth/token', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
    }
}

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
    delete: (id) => API.delete(`/service/${id}`)
}

export const userApi = {
    getAll: () => API.get('/users'),
    getById: (id) => API.get(`/user/${id}`),
    create: (userData) => API.post('/users', userData),
    update: (id, updateData) => API.patch(`/user/${id}`, updateData),
    getMe: () => API.get('/user/me')
}

export const logsApi = {
    getAll: () => API.get('/users-logs')
}

export const notificationApi = {
    getAll: () => API.get('/notifications'),
    markAsRead: () => API.post('/notifications/mark-as-read')
}