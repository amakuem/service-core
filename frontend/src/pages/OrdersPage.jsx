import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { orderApi } from "../api/api";
import styles from "./OrdersPage.module.css";

const OrdersPage = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Новые состояния для фильтрации и сортировки
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('desc'); // 'desc' - сначала новые

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await orderApi.getAll();
                setOrders(response.data);
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.detail || "Не удалось загрузить список заказов");
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const getStatusLabel = (status) => {
        switch (status) {
            case 'new': return 'Новый';
            case 'diagnostics': return 'Диагностика';
            case 'wfp': return 'Ожидает з/п';
            case 'in_progress': return 'В работе';
            case 'ready': return 'Готов к выдаче';
            case 'completed': return 'Завершен';
            default: return status;
        }
    };

    // Применяем фильтрацию и сортировку "на лету"
    const filteredOrders = orders
        .filter((order) => {
            if (statusFilter === 'all') return true;
            return order.status === statusFilter;
        })
        .sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            // Если 'desc', новые выше. Если 'asc', старые выше.
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

    if (loading) return <div className={styles.centered}>⏳ Загрузка списка заказов...</div>;
    if (error) return <div className={styles.errorContainer}>⚠️ {error}</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>📋 Все заказы (Панель мастера)</h2>
                <p>Всего заказов: {orders.length} | Найдено по фильтру: {filteredOrders.length}</p>
            </div>

            {/* ПАНЕЛЬ ФИЛЬТРОВ */}
            <div className={styles.filtersPanel}>
                <div className={styles.filterGroup}>
                    <label>Показать:</label>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={styles.select}
                    >
                        <option value="all">Все заказы</option>
                        <option value="new">Только новые</option>
                        <option value="diagnostics">На диагностике</option>
                        <option value="wfp">Ожидают запчастей</option>
                        <option value="in_progress">В работе</option>
                        <option value="ready">Готовы к выдаче</option>
                        <option value="completed">Завершенные</option>
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label>Дата оформления:</label>
                    <select 
                        value={sortOrder} 
                        onChange={(e) => setSortOrder(e.target.value)}
                        className={styles.select}
                    >
                        <option value="desc">Сначала новые</option>
                        <option value="asc">Сначала старые</option>
                    </select>
                </div>
            </div>

            {filteredOrders.length === 0 ? (
                <div className={styles.noOrders}>
                    {orders.length === 0 ? "Заказов пока нет" : "По вашему фильтру ничего не найдено"}
                </div>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Дата оформления</th>
                                <th>Устройство</th>
                                <th>Статус</th>
                                <th>Мастер</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className={styles.row}>
                                    <td><strong>#{order.id}</strong></td>
                                    <td>
                                        {/* Форматируем дату и время */}
                                        {new Date(order.created_at).toLocaleDateString('ru-RU')}
                                        <div className={styles.timeLabel}>
                                            {new Date(order.created_at).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.deviceName}>{order.device_name}</div>
                                        <small className={styles.serial}>SN: {order.serial_number || "—"}</small>
                                    </td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles[order.status]}`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </td>
                                    <td>
                                        {order.master_name || order.master_last_name
                                            ? `${order.master_name || ""} ${order.master_last_name || ""}`.trim()
                                            : <span className={styles.unassigned}>Не назначен</span>}
                                    </td>
                                    <td>
                                        <button 
                                            onClick={() => navigate(`/order/${order.id}`)} 
                                            className={styles.detailsBtn}
                                        >
                                            Детали 🔍
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default OrdersPage;