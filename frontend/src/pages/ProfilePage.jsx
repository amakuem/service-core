import React, { useEffect, useState } from "react";
import { userApi } from '../api/api';
import styles from './ProfilePage.module.css';

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ first_name: '', last_name: '', phone: '' });
    const [updateLoading, setUpdateLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await userApi.getMe();
                setUser(response.data);

                setEditForm({
                    first_name: response.data.first_name,
                    last_name: response.data.last_name,
                    phone: response.data.phone || ''
                });

            } catch(err){
                console.error(err);
    
                let errorMessage = 'Не удалось загрузить профиль';
                if (err.response?.data?.detail) {
                    const detail = err.response.data.detail;
                    if (typeof detail === 'string') {
                        errorMessage = detail;
                    } else if (Array.isArray(detail)) {
                        const firstError = detail[0];
                        const field = firstError.loc ? firstError.loc[firstError.loc.length - 1] : '';
                        errorMessage = `Ошибка валидации бэкенда в поле [${field}]: ${firstError.msg}`;
                    }
                }
                setError(errorMessage);
            }finally {
                setLoading(false); 
            }

        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setEditForm({
            ...editForm,
            [e.target.name]: e.target.value
        });
    };

    const handleCancel = () => {
        setEditForm({
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone || ''
        });
        setIsEditing(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setUpdateLoading(true);
        setError('');

        try {
            const response = await userApi.update(user.id, editForm);
            
            setUser(response.data); 
            setIsEditing(false);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Не удалось обновить профиль');
        } finally {
            setUpdateLoading(false);
        }
    };

    if (error) {
        return <div className={styles.errorContainer}>⚠️ {error}</div>;
    }

    if (loading || !user) {
        return <div className={styles.centered}>⏳ Загрузка профиля...</div>;
    }

    const getRoleLabel = (role) => {
        switch(role){
            case 'admin': return 'Администратор';
            case 'master': return 'Мастер';
            default: return 'Клиент';
        }
    };

    return (
        <div className={styles.profileContainer}>
            <div className={styles.profileCard}>
                <div className={styles.avatarZone}>
                    <div className={styles.avatar}>
                        {user.first_name ? user.first_name[0] : 'U'}
                    </div>
                    <h2>{user.first_name} {user.last_name}</h2>
                    <span className={`${styles.badge} ${styles[user.role]}`}>
                        {user.role ? user.role.toUpperCase() : ''}
                    </span>
                </div>
                
                <hr className={styles.divider} />

                <form onSubmit={handleSave} className={styles.infoFields}>
                    <div className={styles.infoGroup}>
                        <label>Имя</label>
                        {isEditing ? (
                            <input 
                                type="text" 
                                name="first_name" 
                                value={editForm.first_name} 
                                onChange={handleChange} 
                                className={styles.input} 
                                required 
                            />
                        ) : (
                            <p>{user.first_name}</p>
                        )}
                    </div>

                    <div className={styles.infoGroup}>
                        <label>Фамилия</label>
                        {isEditing ? (
                            <input 
                                type="text" 
                                name="last_name" 
                                value={editForm.last_name} 
                                onChange={handleChange} 
                                className={styles.input} 
                                required 
                            />
                        ) : (
                            <p>{user.last_name}</p>
                        )}
                    </div>

                    <div className={styles.infoGroup}>
                        <label>Номер телефона</label>
                        {isEditing ? (
                            <input 
                                type="tel" 
                                name="phone" 
                                value={editForm.phone} 
                                onChange={handleChange} 
                                className={styles.input} 
                            />
                        ) : (
                            <p>{user.phone || 'Не указан'}</p>
                        )}
                    </div>

                    <div className={styles.infoGroup}>
                        <label>Email адрес (Неизменяемый)</label>
                        <p className={styles.disabledText}>{user.email}</p>
                    </div>

                    <div className={styles.infoGroup}>
                        <label>Роль в системе</label>
                        <p className={styles.disabledText}>{getRoleLabel(user.role)}</p>
                    </div>

                    <div className={styles.actions}>
                        {isEditing ? (
                            <>
                                <button type="button" onClick={handleCancel} className={styles.cancelBtn} disabled={updateLoading}>
                                    Отмена
                                </button>
                                <button type="submit" className={styles.saveBtn} disabled={updateLoading}>
                                    {updateLoading ? 'Сохранение...' : 'Сохранить'}
                                </button>
                            </>
                        ) : (
                            <button type="button" onClick={() => setIsEditing(true)} className={styles.editBtn}>
                                Редактировать профиль
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;