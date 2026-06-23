import React, { useState, useEffect } from "react";
import {serviceApi } from "../api/api";
import styles from "./AdminServicesPage.module.css";

const AdminServicesPage = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null); 

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [basePrice, setBasePrice] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchServices = async () => {
        try {
            const response = await serviceApi.getAll();
            setServices(response.data);
        } catch (err) {
            console.error(err);
            setError("Не удалось загрузить список услуг");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const openModal = (service = null) => {
        setEditingService(service);
        if (service) {
            setName(service.name);
            setDescription(service.description || "");
            setBasePrice(service.base_price);
            setIsActive(service.is_active);
        } else {
            setName("");
            setDescription("");
            setBasePrice("");
            setIsActive(true);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingService(null);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        const serviceData = {
            name,
            description,
            base_price: parseFloat(basePrice),
            is_active: isActive
        };

        try {
            if (editingService) {
                await serviceApi.update(editingService.id, serviceData);
            } else {
                await serviceApi.create(serviceData);
            }
            fetchServices(); 
            closeModal();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.detail || "Ошибка при сохранении услуги");
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleActive = async (service) => {
        try {
            const updatedStatus = !service.is_active;
            
            setServices(prev => prev.map(s => s.id === service.id ? { ...s, is_active: updatedStatus } : s));
            
            await serviceApi.update(service.id, { is_active: updatedStatus });
        } catch (err) {
            console.error(err);
            alert("Не удалось изменить статус услуги");
            fetchServices(); 
        }
    };

    if (loading) return <div className={styles.centered}>⏳ Загрузка панели управления услугами...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <h2>Управление услугами</h2>
                <button className={styles.addBtn} onClick={() => openModal(null)}>
                    ➕ Добавить услугу
                </button>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Название</th>
                            <th>Описание</th>
                            <th>Базовая цена</th>
                            <th>Статус</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services.map((service) => (
                            <tr key={service.id} className={!service.is_active ? styles.rowInactive : ""}>
                                <td>{service.id}</td>
                                <td className={styles.fontBold}>{service.name}</td>
                                <td className={styles.descCell}>{service.description || <span className={styles.muted}>Нет описания</span>}</td>
                                <td>{parseFloat(service.base_price).toFixed(2)} ₽</td>
                                <td>
                                    <button 
                                        className={`${styles.statusBadge} ${service.is_active ? styles.active : styles.inactive}`}
                                        onClick={() => handleToggleActive(service)}
                                        title="Нажмите, чтобы переключить статус"
                                    >
                                        {service.is_active ? "Активна" : "Неактивна"}
                                    </button>
                                </td>
                                <td>
                                    <button className={styles.editBtn} onClick={() => openModal(service)}>
                                        ✏️ Редактировать
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>{editingService ? `Редактирование услуги #${editingService.id}` : "Добавление новой услуги"}</h3>
                        <form onSubmit={handleSave} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Название услуги *</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    placeholder="Например: Замена дисплея iPhone 11"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Описание</label>
                                <textarea 
                                    value={description} 
                                    onChange={(e) => setDescription(e.target.value)} 
                                    placeholder="Укажите детали, используемые запчасти или гарантию..."
                                    rows={3}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Базовая цена (₽) *</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    required 
                                    value={basePrice} 
                                    onChange={(e) => setBasePrice(e.target.value)} 
                                    placeholder="0.00"
                                />
                            </div>

                            <div className={styles.formGroupCheckbox}>
                                <label>
                                    <input 
                                        type="checkbox" 
                                        checked={isActive} 
                                        onChange={(e) => setIsActive(e.target.checked)} 
                                    />
                                    Услуга активна (доступна для выбора при заказе)
                                </label>
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelBtn} onClick={closeModal} disabled={isSaving}>
                                    Отмена
                                </button>
                                <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                                    {isSaving ? "Сохранение..." : "Сохранить"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminServicesPage;