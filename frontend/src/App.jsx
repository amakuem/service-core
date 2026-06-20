import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css'
import ServicesPage from './pages/ServicesPage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'

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
          <button onClick={handleLogout} className="link-sign" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            Выйти
          </button>
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
          
          <Route path="*" element={<h2>⚠️ Страница не найдена (404)</h2>} />
        </Routes>
      </main>
    </div>
  );
}

export default App
