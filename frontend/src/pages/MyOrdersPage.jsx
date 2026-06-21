import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Добавили импорт роутера
import { orderApi, userApi, serviceApi } from "../api/api";
import styles from './MyOrdersPage.module.css';

const MyOrdersPage = () => {
    const navigate = useNavigate(); // Инициализация навигации
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [services, setServices] = useState([]);
    const [userId, setUserId] = useState(null);

    // Состояния для модального окна создания заказа
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);

    // Поля формы
    const [formData, setFormData] = useState({
        device_name: '',
        serial_number: '',
        issue_description: ''
    });

    // ID текущей выбранной в селекте услуги
    const [currentSelectedServiceId, setCurrentSelectedServiceId] = useState('');
    // Список услуг, которые пользователь УЖЕ добавил в этот заказ
    const [selectedServicesList, setSelectedServicesList] = useState([]);

    const loadData = async () => {
        try {
            const userResponse = await userApi.getMe();
            const currentUserId = userResponse.data.id;
            setUserId(currentUserId);

            const ordersResponse = await orderApi.getAll();
            const myFilteredOrders = ordersResponse.data.filter(
                (order) => order.client_id === currentUserId
            );
            setOrders(myFilteredOrders);

            const servicesResponse = await serviceApi.getAll();
            setServices(servicesResponse.data);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Не удалось загрузить данные');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleAddServiceToList = () => {
        if (!currentSelectedServiceId) return;

        const alreadyAdded = selectedServicesList.some(s => s.id === parseInt(currentSelectedServiceId));
        if (alreadyAdded) {
            alert('Эта услуга уже добавлена в заказ');
            return;
        }

        const serviceInfo = services.find(s => s.id === parseInt(currentSelectedServiceId));
        if (serviceInfo) {
            setSelectedServicesList([...selectedServicesList, serviceInfo]);
            setCurrentSelectedServiceId('');
        }
    };

    const handleRemoveServiceFromList = (id) => {
        setSelectedServicesList(selectedServicesList.filter(s => s.id !== id));
    };

    const handleCreateOrder = async (e) => {
        e.preventDefault();
        if (!formData.device_name || !formData.issue_description) {
            alert('Пожалуйста, заполните обязательные поля');
            return;
        }

        if (selectedServicesList.length === 0) {
            alert('Пожалуйста, добавьте хотя бы одну услугу в заказ');
            return;
        }

        setCreateLoading(true);
        try {
            const formattedServices = selectedServicesList.map(service => ({
                service_id: service.id,
                quantity: 1
            }));

            const newOrderData = {
                device_name: formData.device_name,
                serial_number: formData.serial_number || null,
                issue_description: formData.issue_description,
                client_id: userId,
                services: formattedServices
            };

            await orderApi.create(newOrderData);
            
            setIsModalOpen(false);
            setFormData({ device_name: '', serial_number: '', issue_description: '' });
            setSelectedServicesList([]);
            setCurrentSelectedServiceId('');
            loadData(); 
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.detail || 'Ошибка при создании заказа');
        } finally {
            setCreateLoading(false);
        }
    };

    const calculateTotalPrice = (orderServices) => {
        if (!orderServices || orderServices.length === 0) return '0.00 ₽';
        
        const total = orderServices.reduce((sum, item) => {
            const serviceInfo = services.find(s => s.id === item.service_id);
            const price = serviceInfo ? parseFloat(serviceInfo.base_price) : parseFloat(item.fixed_price || 0);
            return sum + (price * item.quantity);
        }, 0);

        return `${total.toFixed(2)} ₽`;
    };

    const calculateModalTotal = () => {
        const total = selectedServicesList.reduce((sum, s) => sum + parseFloat(s.base_price), 0);
        return `${total.toFixed(2)} ₽`;
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'new': return 'Новый';
            case 'diagnostics': return 'Диагностика';
            case 'wfp': return 'Ожидает з/п или оплаты';
            case 'in_progress': return 'В работе';
            case 'ready': return 'Готов к выдаче';
            case 'completed': return 'Завершен';
            default: return status;
        }
    };

    if (loading) {
        return <div className={styles.centered}>⏳ Загрузка данных...</div>;
    }

    if (error) {
        return <div className={styles.errorContainer}>⚠️ {error}</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.headerRow}>
                <h2 className={styles.title}>Мои заказы</h2>
                <button className={styles.createBtn} onClick={() => setIsModalOpen(true)}>
                    + Создать заказ
                </button>
            </div>

            {orders.length === 0 ? (
                <div className={styles.noOrders}>
                    <p>У вас пока нет ни одного заказа. 👀</p>
                </div>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.ordersTable}>
                        <thead>
                            <tr>
                                <th>ID Заказа</th>
                                <th>Устройство</th>
                                <th>Дата создания</th>
                                <th>Статус</th>
                                <th>Стоимость</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr 
                                    key={order.id} 
                                    className={styles.clickableRow} 
                                    onClick={() => navigate(`/orders/${order.id}`)}
                                    title="Нажмите для просмотра деталей заказа"
                                >
                                    <td className={styles.orderId}>#{order.id}</td>
                                    <td>
                                        <div className={styles.deviceName}>{order.device_name}</div>
                                        {order.serial_number && <small className={styles.serial}>S/N: {order.serial_number}</small>}
                                    </td>
                                    <td>{new Date(order.created_at).toLocaleDateString('ru-RU')}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles[order.status]}`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </td>
                                    <td className={styles.totalPrice}>
                                        {calculateTotalPrice(order.services)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* МОДАЛЬНОЕ ОКНО СОЗДАНИЯ ЗАКАЗА */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>Оформление нового заказа</h3>
                        <form onSubmit={handleCreateOrder}>
                            
                            <div className={styles.formGroup}>
                                <label>Название устройства *</label>
                                <input 
                                    type="text"
                                    name="device_name"
                                    placeholder="Например: iPhone 13 Pro"
                                    value={formData.device_name}
                                    onChange={handleInputChange}
                                    className={styles.inputField}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Серийный номер (если есть)</label>
                                <input 
                                    type="text"
                                    name="serial_number"
                                    placeholder="S/N или IMEI"
                                    value={formData.serial_number}
                                    onChange={handleInputChange}
                                    className={styles.inputField}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Описание проблемы *</label>
                                <textarea 
                                    name="issue_description"
                                    placeholder="Что именно сломалось или не работает?"
                                    value={formData.issue_description}
                                    onChange={handleInputChange}
                                    className={styles.textareaField}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Добавить услуги в заказ *</label>
                                <div className={styles.selectRow}>
                                    <select 
                                        value={currentSelectedServiceId} 
                                        onChange={(e) => setCurrentSelectedServiceId(e.target.value)}
                                        className={styles.select}
                                    >
                                        <option value="">-- Выберите услугу из списка --</option>
                                        {services.filter(s => s.is_active).map((service) => (
                                            <option key={service.id} value={service.id}>
                                                {service.name} ({parseFloat(service.base_price).toFixed(2)} ₽)
                                            </option>
                                        ))}
                                    </select>
                                    <button 
                                        type="button" 
                                        onClick={handleAddServiceToList}
                                        className={styles.addServiceBtn}
                                        disabled={!currentSelectedServiceId}
                                    >
                                        Добавить
                                    </button>
                                </div>
                            </div>

                            {selectedServicesList.length > 0 && (
                                <div className={styles.addedServicesBlock}>
                                    <h4>Выбранные услуги ({calculateModalTotal()}):</h4>
                                    <ul className={styles.servicesListList}>
                                        {selectedServicesList.map((service) => (
                                            <li key={service.id} className={styles.serviceItem}>
                                                <span>{service.name}</span>
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleRemoveServiceFromList(service.id)}
                                                    className={styles.removeServiceBtn}
                                                >
                                                    ❌
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className={styles.modalActions}>
                                <button 
                                    type="button" 
                                    className={styles.cancelBtn} 
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setSelectedServicesList([]);
                                    }}
                                    disabled={createLoading}
                                >
                                    Отмена
                                </button>
                                <button 
                                    type="submit" 
                                    className={styles.submitBtn}
                                    disabled={createLoading || selectedServicesList.length === 0}
                                >
                                    {createLoading ? 'Создание...' : 'Подтвердить заказ'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyOrdersPage;