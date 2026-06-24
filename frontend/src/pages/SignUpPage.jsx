import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/api'; 
import styles from './LoginPage.module.css';

const SignUpPage = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.password.length < 8) {
            setError('Пароль должен содержать минимум 8 символов');
            return;
        }

        let cleanPhone = formData.phone.replace(/[^\d+]/g, '');

        if (cleanPhone.startsWith('80') && cleanPhone.length === 11) {
            cleanPhone = '+375' + cleanPhone.slice(2);
        }

        if (cleanPhone.startsWith('375') && cleanPhone.length === 12) {
            cleanPhone = '+' + cleanPhone;
        }
        const phoneRegex = /^\+375(25|29|33|44|17)\d{7}$/;
        if (!phoneRegex.test(cleanPhone)) {
            setError('Неверный формат номера. Используйте +375 (XX) XXX-XX-XX или 80 (XX) XXX-XX-XX');
            return;
        }
        const payload = {
            ...formData,
            phone: cleanPhone
        };

        try {
            await authApi.register(payload);
            
            setSuccess(true);

            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            let errorMessage = 'Ошибка при регистрации';

            if (err.response?.data?.detail) {
                const detail = err.response.data.detail;
                
                if (typeof detail === 'string') {
                    errorMessage = detail;
                } else if (Array.isArray(detail)) {
                    const firstError = detail[0];
                    const field = firstError.loc ? firstError.loc[firstError.loc.length - 1] : '';
                    errorMessage = `Ошибка в поле [${field}]: ${firstError.msg}`;
                }
            }
            
            setError(errorMessage); 
        }
    };

    if (success) {
        return (
            <div className={styles.container}>
                <div className={styles.form} style={{ textAlign: 'center' }}>
                    <h2 style={{ color: '#10b981' }}>🎉 Успешно!</h2>
                    <p style={{ color: '#9ca3af' }}>Вы зарегистрировались. Перенаправление на страницу входа...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <form onSubmit={handleSubmit} className={styles.form}>
                <h2>Регистрация в CRM</h2>
                
                {error && <div className={styles.error}>{error}</div>}
                
                <div className={styles.inputGroup}>
                    <label htmlFor="first_name">Имя:</label>
                    <input 
                        id="first_name"
                        type="text" 
                        name="first_name"
                        value={formData.first_name} 
                        onChange={handleChange} 
                        required 
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label htmlFor="last_name">Фамилия:</label>
                    <input 
                        id="last_name"
                        type="text" 
                        name="last_name"
                        value={formData.last_name} 
                        onChange={handleChange} 
                        required 
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label htmlFor="phone">Телефон:</label>
                    <input 
                        id="phone"
                        type="tel" 
                        name="phone"
                        placeholder="+375 (29) 111-22-33 или 80 (29)..."
                        value={formData.phone} 
                        onChange={handleChange} 
                        required 
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label htmlFor="email">Email:</label>
                    <input 
                        id="email"
                        type="email" 
                        name="email"
                        value={formData.email} 
                        onChange={handleChange} 
                        required 
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label htmlFor="password">Пароль:</label>
                    <input 
                        id="password"
                        type="password" 
                        name="password"
                        value={formData.password} 
                        onChange={handleChange} 
                        placeholder="Минимум 8 символов"
                        required 
                    />
                </div>

                <button type="submit" className={styles.button}>
                    Создать аккаунт
                </button>
            </form>
        </div>
    );
};

export default SignUpPage;