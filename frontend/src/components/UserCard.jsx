function UserCard({first_name, last_name, email, phone}){
  return(
    <div className="user-card">
        <h1>Имя: {first_name}</h1>
        <h1>Фамилия: {last_name}</h1>
        <h1>Email: {email}</h1>
        <h1>Номер телефона: {phone}</h1>
    </div>
  );  
};

export default UserCard;