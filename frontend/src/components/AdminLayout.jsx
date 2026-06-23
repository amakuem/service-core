import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import styles from "./AdminLayout.module.css";

const AdminLayout = () => {
    const location = useLocation();

    const isActive = (path) => location.pathname === path ? styles.activeLink : "";

    return (
        <div className={styles.adminContainer}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <h3>Панель управления</h3>
                </div>
                <nav className={styles.sidebarNav}>
                    <Link to="/admin/services" className={`${styles.navLink} ${isActive("/admin/services")}`}>
                        🛠️ Управление услугами
                    </Link>
                    <Link to="/admin/logs" className={`${styles.navLink} ${isActive("/admin/logs")}`}>
                        📜 Логи системы
                    </Link>
                    <Link to="/admin/users" className={`${styles.navLink} ${isActive("/admin/users")}`}>
                        👥 Пользователи
                    </Link>
                </nav>
            </aside>

            <main className={styles.contentArea}>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;