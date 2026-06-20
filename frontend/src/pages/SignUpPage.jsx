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

    // Универсальный обработчик для всех инпутов
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // Отправляем данные на бэкенд в формате JSON
            await authApi.register(formData);
            
            setSuccess(true);
            // Через 2 секунды после успеха перенаправляем на страницу входа
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            let errorMessage = 'Ошибка при регистрации';

            if (err.response?.data?.detail) {
                const detail = err.response.data.detail;
                
                if (typeof detail === 'string') {
                    // Если бэк вернул простую строку (например, raise HTTPException(400, detail="..."))
                    errorMessage = detail;
                } else if (Array.isArray(detail)) {
                    // Если это ошибка валидации Pydantic (массив 422)
                    // Берем первое сообщение об ошибке и локацию поля
                    const firstError = detail[0];
                    const field = firstError.loc ? firstError.loc[firstError.loc.length - 1] : '';
                    errorMessage = `Ошибка в поле [${field}]: ${firstError.msg}`;
                }
            }
            
            setError(errorMessage); // Теперь здесь ВСЕГДА будет строка, и React не упадет!
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
                <h2 style={{ color: '#9ca3af', marginBottom: '20px' }}>Регистрация в CRM</h2>
                
                {error && <div className={styles.error} style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
                
                <div className={styles.inputGroup}>
                    <label>Имя:</label>
                    <input 
                        type="text" 
                        name="first_name"
                        value={formData.first_name} 
                        onChange={handleChange} 
                        required 
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label>Фамилия:</label>
                    <input 
                        type="text" 
                        name="last_name"
                        value={formData.last_name} 
                        onChange={handleChange} 
                        required 
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label>Телефон:</label>
                    <input 
                        type="tel" 
                        name="phone"
                        placeholder="+375291112233"
                        value={formData.phone} 
                        onChange={handleChange} 
                        required 
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label>Email:</label>
                    <input 
                        type="email" 
                        name="email"
                        value={formData.email} 
                        onChange={handleChange} 
                        required 
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label>Пароль:</label>
                    <input 
                        type="password" 
                        name="password"
                        value={formData.password} 
                        onChange={handleChange} 
                        required 
                    />
                </div>

                <button type="submit" className={styles.button} style={{ marginTop: '10px' }}>
                    Создать аккаунт
                </button>
            </form>
        </div>
    );
};

export default SignUpPage;