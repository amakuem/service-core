import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { orderApi, serviceApi, userApi } from "../api/api"; 
import styles from "./OrderDetailPage.module.css";

const OrderDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [order, setOrder] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [currentUser, setCurrentUser] = useState(null);
    const [masterComment, setMasterComment] = useState("");
    const [isSavingComment, setIsSavingComment] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const [masters, setMasters] = useState([]); 
    const [isAssigningMaster, setIsAssigningMaster] = useState(false);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const userResponse = await userApi.getMe();
                setCurrentUser(userResponse.data);

                const orderResponse = await orderApi.getById(id); 
                setOrder(orderResponse.data);
                setMasterComment(orderResponse.data.master_comment || "");

                const servicesResponse = await serviceApi.getAll();
                setServices(servicesResponse.data);

                if (userResponse.data.role === "admin") {
                    const usersResponse = await userApi.getAll();
                    const mastersList = usersResponse.data.filter(u => u.role === "master" || u.role === "admin");
                    setMasters(mastersList);
                }
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.detail || "Не удалось загрузить информацию о заказе");
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [id]);

    const handleStatusChange = async (newStatus) => {
        setIsUpdatingStatus(true);
        try {
            if (orderApi.update) {
                await orderApi.update(id, { status: newStatus });
                setOrder(prev => ({ ...prev, status: newStatus }));
            } else {
                console.warn("Метод orderApi.update(id, data) не найден");
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.detail || "Не удалось обновить статус заказа");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleSaveComment = async () => {
        setIsSavingComment(true);
        setSaveSuccess(false);
        try {
            if (orderApi.update) {
                await orderApi.update(id, { master_comment: masterComment });
            }
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.detail || "Не удалось сохранить комментарий");
        } finally {
            setIsSavingComment(false);
        }
    };

    const handleTakeOrder = async () => {
        setIsAssigningMaster(true);
        try {
            const updateData = { 
                master_id: currentUser.id,
                status: order.status === "new" ? "diagnostics" : order.status
            };
            
            await orderApi.update(id, updateData);
            
            setOrder(prev => ({ 
                ...prev, 
                master_id: currentUser.id,
                master_name: currentUser.first_name,
                master_last_name: currentUser.last_name,
                status: updateData.status
            }));
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.detail || "Не удалось взять заказ в работу");
        } finally {
            setIsAssigningMaster(false);
        }
    };

    const handleAssignMaster = async (masterId) => {
        setIsAssigningMaster(true);
        try {
            const parsedId = masterId ? parseInt(masterId) : null;
            await orderApi.update(id, { master_id: parsedId });
            
            const selectedMaster = masters.find(m => m.id === parsedId);
            
            setOrder(prev => ({
                ...prev,
                master_id: parsedId,
                master_name: selectedMaster ? selectedMaster.first_name : null,
                master_last_name: selectedMaster ? selectedMaster.last_name : null
            }));
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.detail || "Не удалось переназначить мастера");
        } finally {
            setIsAssigningMaster(false);
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'new': return 'Новый';
            case 'diagnostics': return 'Диагностика';
            case 'wfp': return 'Ожидает запчастей';
            case 'in_progress': return 'В работе';
            case 'ready': return 'Готов к выдаче';
            case 'completed': return 'Завершен';
            default: return status;
        }
    };

    const calculateTotalPrice = () => {
        if (!order?.services || order.services.length === 0) return "0.00 ₽";
        const total = order.services.reduce((sum, item) => {
            const serviceInfo = services.find(s => s.id === item.service_id);
            const price = serviceInfo ? parseFloat(serviceInfo.base_price) : parseFloat(item.fixed_price || 0);
            return sum + (price * item.quantity);
        }, 0);
        return `${total.toFixed(2)} ₽`;
    };

    if (loading) return <div className={styles.centered}>⏳ Загрузка деталей заказа...</div>;
    if (error) return <div className={styles.errorContainer}>⚠️ {error} <br/><button onClick={() => navigate("/orders")} className={styles.backBtn}>Назад к списку</button></div>;
    if (!order) return <div className={styles.centered}>Заказ не найден</div>;

    const isAdmin = currentUser?.role === "admin";
    const isAssignedMaster = currentUser?.role === "master" && order?.master_id === currentUser?.id;
    
    const canEdit = isAdmin || isAssignedMaster;

    return (
        <div className={styles.container}>
            <button onClick={() => navigate(-1)} className={styles.backBtn}>
                ← Назад к списку
            </button>

            <div className={styles.card}>
                <div className={styles.header}>
                    <div>
                        <h2 className={styles.title}>Заказ #{order.id}</h2>
                        <p className={styles.date}>Оформлен: {new Date(order.created_at).toLocaleString('ru-RU')}</p>
                    </div>
                    
                    {canEdit ? (
                        <div className={styles.statusSelectWrapper}>
                            <select
                                value={order.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className={`${styles.statusSelect} ${styles[order.status]}`}
                                disabled={isUpdatingStatus}
                                title="Изменить статус заказа"
                            >
                                <option value="new">Новый</option>
                                <option value="diagnostics">Диагностика</option>
                                <option value="wfp">Ожидает з/п или оплаты</option>
                                <option value="in_progress">В работе</option>
                                <option value="ready">Готов к выдаче</option>
                                <option value="completed">Завершен</option>
                            </select>
                            {isUpdatingStatus && <span className={styles.miniLoader}>⏳</span>}
                        </div>
                    ) : (
                        <span className={`${styles.statusBadge} ${styles[order.status]}`}>
                            {getStatusLabel(order.status)}
                        </span>
                    )}
                </div>

                <hr className={styles.divider} />

                <div className={styles.section}>
                    <h3>Информация об устройстве</h3>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoBlock}>
                            <span className={styles.label}>Устройство:</span>
                            <span className={styles.value}>{order.device_name}</span>
                        </div>
                        <div className={styles.infoBlock}>
                            <span className={styles.label}>Серийный номер / IMEI:</span>
                            <span className={styles.value}>{order.serial_number || "—"}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <h3>Описание неисправности (от клиента)</h3>
                    <div className={styles.box}>
                        {order.issue_description}
                    </div>
                </div>

                <div className={styles.section}>
                    <h3>Ход выполнения и заметки мастера</h3>
                    <div className={styles.boxSecondary}>
                        
                        <div className={styles.masterManagerRow} style={{ marginBottom: "15px" }}>
                            <strong>Мастер:</strong>{" "}
                            {isAdmin ? (
                                <select
                                    value={order.master_id || ""}
                                    onChange={(e) => handleAssignMaster(e.target.value)}
                                    className={styles.masterSelect}
                                    disabled={isAssigningMaster}
                                >
                                    <option value="">-- Не назначен (Выбрать мастера) --</option>
                                    {masters.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {`${m.first_name || ""} ${m.last_name || ""}`.trim()} ({m.email})
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                order.master_id ? (
                                    <span>{`${order.master_name || ""} ${order.master_last_name || ""}`.trim()}</span>
                                ) : (
                                    <span style={{ color: "#e74c3c", fontWeight: "bold" }}>Назначается...</span>
                                )
                            )}

                            {!isAdmin && currentUser?.role === "master" && !order.master_id && (
                                <button
                                    onClick={handleTakeOrder}
                                    className={styles.takeOrderBtn}
                                    disabled={isAssigningMaster}
                                >
                                    {isAssigningMaster ? "Оформление..." : "Взять заказ в работу 🛠️"}
                                </button>
                            )}
                        </div>
                        
                        {order.estimated_ready_date && (
                            <p><strong>Планируемая дата готовности:</strong> {new Date(order.estimated_ready_date).toLocaleDateString('ru-RU')}</p>
                        )}
                        
                        <div className={styles.technicalConclusion}>
                            <strong className={styles.conclusionLabel}>Техническое заключение:</strong>
                            
                            {canEdit ? (
                                <div className={styles.editCommentBlock}>
                                    <textarea
                                        className={styles.textarea}
                                        value={masterComment}
                                        onChange={(e) => setMasterComment(e.target.value)}
                                        placeholder="Введите результаты диагностики, описание проделанной работы или список необходимых запчастей..."
                                        rows={4}
                                    />
                                    <div className={styles.actionRow}>
                                        <button
                                            onClick={handleSaveComment}
                                            className={styles.saveBtn}
                                            disabled={isSavingComment}
                                        >
                                            {isSavingComment ? "Сохранение..." : "Сохранить заметку 💾"}
                                        </button>
                                        {saveSuccess && <span className={styles.successLabel}>✓ Успешно сохранено!</span>}
                                    </div>
                                </div>
                            ) : (
                                <p className={styles.clientCommentText}>
                                    {masterComment ? masterComment : "Диагностика еще не завершена."}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <h3>Выполняемые услуги</h3>
                    <ul className={styles.servicesList}>
                        {order.services?.map((item, idx) => {
                            const serviceInfo = services.find(s => s.id === item.service_id);
                            return (
                                <li key={idx} className={styles.serviceItem}>
                                    <span>{serviceInfo ? serviceInfo.name : 'Услуга'} (x{item.quantity})</span>
                                    <span className={styles.servicePrice}>
                                        {serviceInfo ? `${parseFloat(serviceInfo.base_price).toFixed(2)} ₽` : `${parseFloat(item.fixed_price).toFixed(2)} ₽`}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <div className={styles.totalRow}>
                    <span>Итоговая стоимость:</span>
                    <span className={styles.totalPrice}>{calculateTotalPrice()}</span>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailPage;