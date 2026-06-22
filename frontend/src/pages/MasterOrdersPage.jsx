import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { orderApi, userApi } from "../api/api";
import styles from "./MasterOrdersPage.module.css"

const MasterOrdersPage = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [statusFilter, setStatusFilter] = useState("all");
    const [ sortOrder, setSortOrder] = useState("desc");

    useEffect (() => {
        const fetchMasterOrders = async () => {
            try {
                const userResponse = await userApi.getMe();
                const masterId = userResponse.data.id;

                const ordersResponse = await orderApi.getAll();
                const assignedToMe = ordersResponse.data.filter(
                    (order) => order.master_id === masterId
                );
                setOrders(assignedToMe);
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.detail || "Не удалось загрузить ваши заказы");
            } finally {
                setLoading(false);
            }
        };

        fetchMasterOrders();
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
    }

    const filteredOrders = orders
        .filter((order) => {
            if (statusFilter === "all") return true;
            return order.status === statusFilter;
        })
        .sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
        });

    if (loading) return <div className={styles.centered}>⏳ Загрузка ваших заказов...</div>;
    if (error) return <div className={styles.errorContainer}>⚠️ {error}</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>🛠️ Моя рабочая панель (Заказы в работе)</h2>
                <p>Всего закреплено за мной: {orders.length} | Отображено: {filteredOrders.length}</p>
            </div>

            <div className={styles.filtersPanel}>
                <div className={styles.filterGroup}>
                    <label>Статус:</label>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={styles.select}
                    >
                        <option value="all">Все мои заказы</option>
                        <option value="new">Новые</option>
                        <option value="diagnostics">Диагностика</option>
                        <option value="wfp">Ожидает з/п</option>
                        <option value="in_progress">В работе</option>
                        <option value="ready">Готовы к выдаче</option>
                        <option value="completed">Завершенные</option>
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label>Сортировка:</label>
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
                    {orders.length === 0 
                        ? "У вас пока нет назначенных заказов. Вы можете взять их со страницы «Все заказы»." 
                        : "Нет заказов с выбранным статусом"}
                </div>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Устройство</th>
                                <th>Дата назначения</th>
                                <th>Статус</th>
                                <th>Действие</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className={styles.row}>
                                    <td className={styles.orderId}>#{order.id}</td>
                                    <td>
                                        <div className={styles.deviceName}>{order.device_name}</div>
                                        {order.serial_number && <small className={styles.serial}>S/N: {order.serial_number}</small>}
                                    </td>
                                    <td>
                                        {new Date(order.created_at).toLocaleDateString('ru-RU')}
                                        <div className={styles.timeLabel}>
                                            {new Date(order.created_at).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles[order.status]}`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            onClick={() => navigate(`/orders/${order.id}`)} 
                                            className={styles.detailsBtn}
                                        >
                                            Открыть 🔎
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

export default MasterOrdersPage;