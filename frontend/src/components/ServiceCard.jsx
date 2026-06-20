function ServiceCard({name, price}){
    return (
        <div className="service-card">
            <h1>{name}</h1>
            <p>Цена: {price} BYN</p>
        </div>
    );
}

export default ServiceCard;