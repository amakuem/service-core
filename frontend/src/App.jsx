import { useEffect, useState } from 'react'
import logoutIcon from './assets/logout.png'
import adminIcon from './assets/icon-admin.png'
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import './App.css'
import ServicesPage from './pages/ServicesPage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import ProfilePage from './pages/ProfilePage';
import MyOrdersPage from './pages/MyOrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import OrdersPage from './pages/OrdersPage';
import MasterOrdersPage from './pages/MasterOrdersPage';
import NotificationBell from './components/NotificationBell';
import AdminLayout from './components/AdminLayout';
import AdminServicesPage from './pages/AdminServicesPage';
import AdminLogsPage from './pages/AdminLogsPage';
import AdminUsersPage from './pages/AdminUsersPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  const [userRole, setUserRole] = useState(localStorage.getItem('role'));
  const navigate = useNavigate();

  useEffect( () => {
    const checkAuth = () => {
      setIsAuthenticated(!!localStorage.getItem('token'));
      setUserRole(localStorage.getItem('role'));
    }

    checkAuth();
    

    window.addEventListener('storage', checkAuth);
    window.addEventListener('authChange', checkAuth);
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('authChange', checkAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setIsAuthenticated(false);
    setUserRole(null);
    navigate('/login');
  }

  const isStaff = userRole === 'admin' || userRole === 'master';

  return (
    <div>
      <nav className="navigate">
        <Link to="/" className="link">
          Услуги
        </Link>
        



        {isAuthenticated ? (
          <>
            {isStaff ? (
              <>
                <Link to="/orders" className="link">
                  Заказы
                </Link>
                <Link to="/master/my-orders" className="link">
                  Мои заказы
                </Link>
              </>
            ) :(
              <Link to="/my-orders" className="link">
                Мои заказы
              </Link>
            )}
            <div className='link-sign'>
              <NotificationBell /> 
            </div>
            {isStaff && (
              <Link to="/admin" className="link adminBtn">
                <img src={adminIcon} alt="Админ панель" className="adminIcon" />
              </Link>
            )}
            
            <Link to="/profile" className="link">
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

          <Route path='/login' element={
            <LoginPage setIsAuthenticated={(auth) => {
              setIsAuthenticated(auth);
              setUserRole(localStorage.getItem('role'));
            }} />
          } />

          <Route path="/sign-up" element={<SignUpPage />} />

          <Route path="/profile" element={<ProfilePage />} />

          <Route path="/my-orders" element={<MyOrdersPage />} />
          <Route 
            path="/orders" 
            element={isStaff ? <OrdersPage /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/master/my-orders"
            element={isStaff ? <MasterOrdersPage /> : <Navigate to="/" replace />}
          />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/order/:id" element={<OrderDetailPage />} />

          <Route 
            path="/admin" 
            element={userRole === 'admin' ? <AdminLayout /> : <Navigate to="/" replace />}
          >
            <Route index element={<Navigate to="services" replace />} />
            
            <Route path="services" element={<AdminServicesPage />} />
            
            <Route path="logs" element={<AdminLogsPage />} /> 
            
            <Route path="users" element={<AdminUsersPage />} />
            
            {/* <Route path="users" element={<div>Управление пользователями (в разработке)</div>} /> */}
          </Route>


          
          <Route path="*" element={<h2>⚠️ Страница не найдена (404)</h2>} />
        </Routes>
      </main>
    </div>
  );
}

export default App
