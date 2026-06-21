import { useEffect, useState } from 'react'
import logoutIcon from './assets/logout.png'
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css'
import ServicesPage from './pages/ServicesPage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import ProfilePage from './pages/ProfilePage';

function App() {

  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const navigate = useNavigate();

  useEffect( () => {
    const checkAuth = () => {
      setIsAuthenticated(!!localStorage.getItem('token'));
    }

    checkAuth();

    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setIsAuthenticated(false);
    navigate('/login');
  }

  return (
    <div>
      <nav className="navigate">
        <Link to="/" className="link">
          Услуги
        </Link>
        <Link to="/logs" className="link">
          Логи системы
        </Link>



        {isAuthenticated ? (
          <>
            <Link to="/profile" className="link-sign">
              Профиль
            </Link>
            <button onClick={handleLogout} className="logoutBtn">
              <img src={logoutIcon} alt="Выход" className="logoutIcon" />
              Выйти
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="link-sign">
              Вход
            </Link>
            <div>/</div>
            <Link to="/sign-up" className="link">
              Регистрация
            </Link>
          </>
        )}
      </nav>

      <main className="main-container">
        <Routes>
          <Route path="/" element={<ServicesPage />} />

          <Route path='/login' element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />

          <Route path="/sign-up" element={<SignUpPage />} />

          <Route path="/profile" element={<ProfilePage />} />
          
          <Route path="*" element={<h2>⚠️ Страница не найдена (404)</h2>} />
        </Routes>
      </main>
    </div>
  );
}

export default App
