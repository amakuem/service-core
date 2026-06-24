import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignUpPage from './SignUpPage';
import { authApi } from '../api/api';
import { describe, test, expect, beforeEach, vi } from 'vitest';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

// Мокаем API
vi.mock('../api/api', () => ({
    authApi: {
        register: vi.fn(),
    },
}));

describe('SignUpPage - Юнит-тесты бизнес-логики (Vitest)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers(); 
    });

    const fillForm = (overrides = {}) => {
        const data = {
            first_name: 'Иван',
            last_name: 'Иванов',
            phone: '+375291112233',
            email: 'test@example.com',
            password: 'password123',
            ...overrides
        };

        fireEvent.change(screen.getByLabelText(/Имя:/i), { target: { value: data.first_name } });
        fireEvent.change(screen.getByLabelText(/Фамилия:/i), { target: { value: data.last_name } });
        fireEvent.change(screen.getByLabelText(/Телефон:/i), { target: { value: data.phone } });
        fireEvent.change(screen.getByLabelText(/Email:/i), { target: { value: data.email } });
        fireEvent.change(screen.getByLabelText(/Пароль:/i), { target: { value: data.password } });
    };

    test('1. Должен показать ошибку, если пароль меньше 8 символов', async () => {
        render(<SignUpPage />);
        
        fillForm({ password: '123' });
        fireEvent.click(screen.getByRole('button', { name: /Создать аккаунт/i }));

        expect(screen.getByText('Пароль должен содержать минимум 8 символов')).toBeInTheDocument();
        expect(authApi.register).not.toHaveBeenCalled();
    });

    test('2. Должен автоматически преобразовывать формат телефона "80..." в "+375..." перед отправкой', async () => {
        authApi.register.mockResolvedValueOnce({ data: {} });
        render(<SignUpPage />);

        fillForm({ phone: '80291112233' });
        fireEvent.click(screen.getByRole('button', { name: /Создать аккаунт/i }));

        await waitFor(() => {
            expect(authApi.register).toHaveBeenCalledWith({
                first_name: 'Иван',
                last_name: 'Иванов',
                phone: '+375291112233',
                email: 'test@example.com',
                password: 'password123',
            });
        });
    });

    test('3. Должен добавлять плюс к телефону, если он введен как "375..."', async () => {
        authApi.register.mockResolvedValueOnce({ data: {} });
        render(<SignUpPage />);

        fillForm({ phone: '375449998877' });
        fireEvent.click(screen.getByRole('button', { name: /Создать аккаунт/i }));

        await waitFor(() => {
            expect(authApi.register).toHaveBeenCalledWith(
                expect.objectContaining({ phone: '+375449998877' })
            );
        });
    });

    test('4. Должен показать ошибку, если код оператора не входит в разрешенный список бэкенда', async () => {
        render(<SignUpPage />);

        fillForm({ phone: '+375221112233' }); 
        fireEvent.click(screen.getByRole('button', { name: /Создать аккаунт/i }));

        expect(screen.getByText(/Неверный формат номера/i)).toBeInTheDocument();
        expect(authApi.register).not.toHaveBeenCalled();
    });

    test('5. При успешном ответе API должен показать экран успеха и перенаправить на /login', async () => {
        vi.useFakeTimers(); 
        authApi.register.mockResolvedValueOnce({ data: {} });
        render(<SignUpPage />);

        fillForm();
        fireEvent.click(screen.getByRole('button', { name: /Создать аккаунт/i }));

        await vi.runAllTimersAsync(); 
        
        expect(screen.getByText(/Успешно!/i)).toBeInTheDocument();
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('6. Должен корректно отображать ошибку, если бэкенд вернул массив ошибок (FastAPI detail)', async () => {
        const mockBackendError = {
            response: {
                data: {
                    detail: [
                        { loc: ['body', 'email'], msg: 'Пользователь с таким email уже существует' }
                    ]
                }
            }
        };
        authApi.register.mockRejectedValueOnce(mockBackendError);
        render(<SignUpPage />);

        fillForm();
        fireEvent.click(screen.getByRole('button', { name: /Создать аккаунт/i }));

        const expectedErrorText = 'Ошибка в поле [email]: Пользователь с таким email уже существует';
        expect(await screen.findByText(expectedErrorText)).toBeInTheDocument();
    });
});