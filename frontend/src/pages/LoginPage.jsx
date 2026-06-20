import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/api'
import styles from './LoginPage.module.css';


const LoginPage = ({ setIsAuthenticated }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('')

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await authApi.login(email, password);

            const { access_token } = response.data;

            localStorage.setItem('token', access_token);

            if (setIsAuthenticated) {
                setIsAuthenticated(true); 
            }

            navigate('/');
        } catch(err) {
            const errorMessage = err.response?.data?.detail || 'Ошибка при входе в систему';
            setError(errorMessage);
        }
    };

    return (
        <div className={styles.container}>
            <form onSubmit={handleSubmit} className={styles.form}>
                <h2 style={{color: '#9ca3af'}}>Вход в CRM</h2>
                
                {error && <div className={styles.error}>{error}</div>}
                
                <div className={styles.inputGroup}>
                    <label>Email:</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label>Пароль:</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />
                </div>

                <button type="submit"  className={styles.button}>
                    Войти
                </button>
            </form>
        </div>
    );
}

export default LoginPage;