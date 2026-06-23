import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { notificationApi } from "../api/api";
import styles from "./NotificationBell.module.css";

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const fetchNotifications = async () => {
        try {
            const response = await notificationApi.getAll();
            setNotifications(response.data);
        } catch (err) {
            console.error("Не удалось загрузить уведомления:", err);
        }
    };

    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(fetchNotifications, 3000);
        
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggleDropdown = async () => {
        setIsOpen(!isOpen);
        
        if (!isOpen && unreadCount > 0) {
            try {
                await notificationApi.markAsRead();
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            } catch (err) {
                console.error("Не удалось отметить уведомления как прочитанные:", err);
            }
        }
    };

    return (
        <div className={styles.bellWrapper} ref={dropdownRef}>
            <button onClick={handleToggleDropdown} className={styles.bellBtn} title="Уведомления">
                🔔
                {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                        <h3>Уведомления</h3>
                    </div>
                    
                    <div className={styles.list}>
                        {notifications.length === 0 ? (
                            <div className={styles.empty}>У вас пока нет уведомлений</div>
                        ) : (
                            notifications.map((notif) => (
                                <div 
                                    key={notif.id} 
                                    className={`${styles.item} ${!notif.is_read ? styles.unread : ""}`}
                                >
                                    <div className={styles.itemHeader}>
                                        <span className={styles.title}>{notif.title}</span>
                                        
                                        <span className={styles.time}>
                                            {(() => {
                                                const dateStr = notif.created_at;
                                                if (!dateStr) return "";

                                                const isUtc = dateStr.includes("Z") || dateStr.includes("+");
                                                const safeDateStr = isUtc ? dateStr : `${dateStr}Z`;

                                                return new Date(safeDateStr).toLocaleString("ru-RU", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    day: "2-digit",
                                                    month: "2-digit"
                                                });
                                            })()}
                                        </span>
                                    </div>
                                    <p className={styles.message}>{notif.message}</p>
                                    
                                    {notif.order_id ? (
                                        <Link 
                                            to={`/orders/${notif.order_id}`} 
                                            className={styles.orderLink}
                                            onClick={() => setIsOpen(false)} 
                                        >
                                            Перейти к заказу →
                                        </Link>
                                    ) : (
                                        <span className={styles.deletedOrder}>🚫 Заказ удален из системы</span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;