import React, { useState, useEffect } from "react";
import { serviceApi } from "../api/api";
import styles from './ServicesPage.module.css';

function ServicesPage(){
    const [services, setServices] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        serviceApi.getAll()
        .then((response) =>{
            setServices(response.data);
        })
        .catch((err) => {
            console.error("Ошибка при получении услуг:", err);
            setError("Не удалось загрузить  прайс-лист. Проверить бэкенд.")
        });
    }, []);

    if (error) return <div style={{ padding: '20px', color: 'red', fontSize: '18px' }}>❌ {error}</div>

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>🛠️ Прайс-лист услуг сервисного центра</h1>
            
            {services.length === 0 ? (
                <p>В базе данных пока нет ни одной услуги.</p>
            ) : (
                <div className={styles.grid}>
                    {services.map((service) => {

                        const cardClass = `${styles.card} ${!service.is_active ? styles.archived : ''}`;
                        const statusClass = `${styles.statusBadge} ${service.is_active ? styles.statusActive : styles.statusArchived}`;
                        
                        return (
                            <div key={service.id} className={cardClass}>
                                <h3 className={styles.cardTitle}>{service.name}</h3>
                                
                                <p className={styles.cardDescription}>
                                    {service.description || <em>Описание отсутствует</em>}
                                </p>
                                
                                <div className={styles.cardFooter}>
                                    <span className={styles.price}>
                                        {service.base_price} BYN
                                    </span>
                                    
                                    <span className={statusClass}>
                                        {service.is_active ? 'Активна' : 'Архив'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
export default ServicesPage;