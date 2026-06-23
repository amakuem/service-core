import React, { useState, useEffect } from "react";
import { authApi, userApi } from "../api/api";
import styles from "./AdminUsersPage.module.css";

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [role, setRole] = useState("user");
    const [isSaving, setIsSaving] = useState(false);
    const [phone, setPhone] = useState("");

    const fetchUsers = async () => {
        try {
            const response = await userApi.getAll();
            setUsers(response.data);
        } catch (err) {
            console.error(err);
            setError("Не удалось загрузить список пользователей. Проверьте права администратора.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        try {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            
            await userApi.changeRole(userId, newRole);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.detail || "Не удалось изменить роль пользователя");
            fetchUsers(); 
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        const userData = {
            email: email,
            password: password,
            first_name: firstName || null,
            last_name: lastName || null,
            phone: phone.trim() === "" ? null : phone
        };

        try {
            const response = await authApi.register(userData);
            const createdUser = response.data; 

            if (role !== "user" && createdUser && createdUser.id) {
                await userApi.changeRole(createdUser.id, role);
            }

            fetchUsers();
            closeModal();
        } catch (err) {
            console.error("Полная ошибка запроса:", err);

            let errorMessage = "Ошибка при создании пользователя.";

            if (err.response?.data?.detail) {
                const detail = err.response.data.detail;

                if (typeof detail === "string") {
                    errorMessage = detail;
                } else if (Array.isArray(detail)) {
                    errorMessage = "Ошибка валидации полей:\n" + detail.map(errObj => {
                        const fieldName = errObj.loc ? errObj.loc[errObj.loc.length - 1] : "поле";
                        return `• ${fieldName}: ${errObj.msg}`;
                    }).join("\n");
                }
            } else if (err.message) {
                errorMessage = err.message;
            }

            alert(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const openModal = () => {
        setEmail("");
        setPassword("");
        setFirstName("");
        setLastName("");
        setRole("user");
        setIsModalOpen(true);
        setPhone("");
    };

    const closeModal = () => setIsModalOpen(false);

    const getRoleClass = (userRole) => {
        if (userRole === "admin") return styles.roleAdmin;
        if (userRole === "master") return styles.roleMaster;
        return styles.roleUser;
    };

    if (loading) return <div className={styles.centered}>⏳ Загрузка списка пользователей...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <div>
                    <h2>👥 Управление пользователями</h2>
                    <p className={styles.subtitle}>Просмотр сотрудников/клиентов и управление их уровнями доступа</p>
                </div>
                <button className={styles.addBtn} onClick={openModal}>
                    ➕ Создать пользователя
                </button>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Имя и Фамилия</th>
                            <th>Email</th>
                            <th>Текущая роль</th>
                            <th>Изменить роль</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td>#{user.id}</td>
                                <td className={styles.fontBold}>
                                    {user.first_name || user.last_name 
                                        ? `${user.first_name || ""} ${user.last_name || ""}` 
                                        : <span className={styles.muted}>Не указано</span>}
                                </td>
                                <td>{user.email}</td>
                                <td>
                                    <span className={`${styles.roleBadge} ${getRoleClass(user.role)}`}>
                                        {user.role === "admin" ? "Администратор" : user.role === "master" ? "Мастер" : "Клиент"}
                                    </span>
                                </td>
                                <td>
                                    <select 
                                        value={user.role} 
                                        className={styles.roleSelect}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                    >
                                        <option value="user">Клиент (user)</option>
                                        <option value="master">Мастер (master)</option>
                                        <option value="admin">Администратор (admin)</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>Регистрация нового пользователя</h3>
                        <form onSubmit={handleCreateUser} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Email *</label>
                                <input 
                                    type="email" 
                                    required 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    placeholder="example@mail.com"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Пароль *</label>
                                <input 
                                    type="password" 
                                    required 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    placeholder="Минимум 6 символов"
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Имя</label>
                                    <input 
                                        type="text" 
                                        value={firstName} 
                                        onChange={(e) => setFirstName(e.target.value)} 
                                        placeholder="Иван"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Фамилия</label>
                                    <input 
                                        type="text" 
                                        value={lastName} 
                                        onChange={(e) => setLastName(e.target.value)} 
                                        placeholder="Иванов"
                                    />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Телефон (Необязательно)</label>
                                <input 
                                    type="text" 
                                    value={phone} 
                                    onChange={(e) => setPhone(e.target.value)} 
                                    placeholder="80 (29) XXX-XX-XX или +375..."
                                />
                                <small style={{ color: '#6b7280', fontSize: '11px' }}>
                                    Формат: Белорусский номер телефона
                                </small>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Начальная роль</label>
                                <select value={role} onChange={(e) => setRole(e.target.value)} className={styles.modalSelect}>
                                    <option value="user">Клиент (user)</option>
                                    <option value="master">Мастер (master)</option>
                                    <option value="admin">Администратор (admin)</option>
                                </select>
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelBtn} onClick={closeModal} disabled={isSaving}>
                                    Отмена
                                </button>
                                <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                                    {isSaving ? "Создание..." : "Создать"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsersPage;