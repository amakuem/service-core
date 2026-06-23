import React, { useState, useEffect } from "react";
import { logsApi } from "../api/api";
import styles from "./AdminLogsPage.module.css";

const AdminLogsPage = () => { 
    const [logs, setlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    const [selectedLog, setSelectedLog] = useState(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await logsApi.getAll();

                const sortedLogs = response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setlogs(sortedLogs);
            } catch (err) {
                console.error(err);
                setError("Не удалось загрузить логи системы");
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    const sanitizeData = (data) => {
        if (!data) return null;

        try {
            const dataCopy = JSON.parse(JSON.stringify(data));

            const removeSensitiveFields = (obj) =>{
                for (let key in obj){
                    const lowerKey = key.toLowerCase();

                    if (lowerKey === "password"){
                        obj[key] = "********"
                    } else if (typeof obj[key] === "object" && obj[key] !== null){
                        removeSensitiveFields(obj[key]);
                    }
                }
            };

            removeSensitiveFields(dataCopy);
            return dataCopy;
        } catch (e) {
            console.error("Ошибка при очистке конфиденциальных данных:", e);
            return data;
        }
    };

    const formatDateTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    const getActionBadgeClass = (actionType) => {
        switch (actionType.toLowerCase()) {
            case "create":
            case "создание":
                return styles.badgeCreate;
            case "update":
            case "изменение":
                return styles.badgeUpdate;
            case "delete":
            case "удаление":
                return styles.badgeDelete;
            default:
                return styles.badgeDefault;
        }
    };

    if (loading) return <div className={styles.centered}>⏳ Загрузка системных логов...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <h2>📜 Логи активности пользователей</h2>
                <p className={styles.subtitle}>История изменений сущностей и действий администраторов/мастеров</p>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Дата и время</th>
                            <th>Пользователь (ID)</th>
                            <th>Действие</th>
                            <th>Сущность</th>
                            <th>ID сущности</th>
                            <th>Детали</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => (
                            <tr key={log.id}>
                                <td>#{log.id}</td>
                                <td className={styles.timeCell}>{formatDateTime(log.created_at)}</td>
                                <td>
                                    {log.user_id ? (
                                        <span className={styles.userId}>👤 ID {log.user_id}</span>
                                    ) : (
                                        <span className={styles.muted}>Система</span>
                                    )}
                                </td>
                                <td>
                                    <span className={`${styles.badge} ${getActionBadgeClass(log.action_type)}`}>
                                        {log.action_type.toUpperCase()}
                                    </span>
                                </td>
                                <td className={styles.entityName}>{log.entity_name}</td>
                                <td>{log.entity_id || <span className={styles.muted}>—</span>}</td>
                                <td>
                                    {(log.old_data || log.new_data) ? (
                                        <button className={styles.viewBtn} onClick={() => setSelectedLog(log)}>
                                            🔍 Посмотреть данные
                                        </button>
                                    ) : (
                                        <span className={styles.muted}>Нет данных</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedLog && (
                <div className={styles.modalOverlay} onClick={() => setSelectedLog(null)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Детали лога #{selectedLog.id}</h3>
                            <button className={styles.closeBtn} onClick={() => setSelectedLog(null)}>×</button>
                        </div>
                        <div className={styles.modalInfo}>
                            <p><strong>Действие:</strong> {selectedLog.action_type}</p>
                            <p><strong>Сущность:</strong> {selectedLog.entity_name} (ID: {selectedLog.entity_id || "—"})</p>
                            <p><strong>Время:</strong> {formatDateTime(selectedLog.created_at)}</p>
                        </div>

                        <div className={styles.jsonContainer}>
                            <div className={styles.jsonBlock}>
                                <h4>Было (old_data):</h4>
                                <pre className={styles.jsonPre}>
                                    {selectedLog.old_data 
                                        ? JSON.stringify(sanitizeData(selectedLog.old_data), null, 2)
                                        : "null (Сущность создана с нуля)"}
                                </pre>
                            </div>

                            <div className={styles.jsonBlock}>
                                <h4>Стало (new_data):</h4>
                                <pre className={`${styles.jsonPre} ${styles.jsonNew}`}>
                                    {selectedLog.new_data 
                                        ? JSON.stringify(sanitizeData(selectedLog.new_data), null, 2)
                                        : "null (Сущность удалена)"}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLogsPage;