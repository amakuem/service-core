import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import { Routes, Route, Link } from 'react-router-dom';
import './App.css'
import ServicesPage from './pages/ServicesPage'

function App() {

  return (
    <div>
      <nav class="navigate">
        <Link to="/" class="link">
          Услуги
        </Link>
        <Link to="/logs" class="link">
          Логи системы
        </Link>



        <Link to="/log-in" class="link-sign">
          Вход
        </Link>
        <div>
          /
        </div>
        <Link to="/sign-up" class="link">
          Регистрация
        </Link>
      </nav>

      <main class="main-container">
        <Routes>
          <Route path="/" element={<ServicesPage />} />

          <Route path="*" element={<h2>⚠️ Страница не найдена (404)</h2>} />
        </Routes>
      </main>
    </div>
  );
}

export default App
