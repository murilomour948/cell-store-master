import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from './Login';
import { useEstoque } from '../contexts/EstoqueContext';

const mockNavigate = jest.fn();

jest.mock('../contexts/EstoqueContext', () => ({
  useEstoque: jest.fn()
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}), { virtual: true });

describe('Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redireciona admin para o dashboard apos autenticar', async () => {
    const realizarLogin = jest.fn().mockResolvedValue({
      sucesso: true,
      user: { role: 'ADMIN' }
    });
    useEstoque.mockReturnValue({ realizarLogin });

    const { container } = render(<Login />);
    const [usuarioInput] = container.querySelectorAll('input[type="text"]');
    const senhaInput = container.querySelector('input[type="password"]');

    await userEvent.type(usuarioInput, 'admin');
    await userEvent.type(senhaInput, 'segredo');
    await userEvent.click(screen.getByRole('button', { name: /autenticar/i }));

    await waitFor(() => {
      expect(realizarLogin).toHaveBeenCalledWith('admin', 'segredo');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('mostra alerta e limpa a senha quando o login falha', async () => {
    const realizarLogin = jest.fn().mockResolvedValue({
      sucesso: false,
      erro: 'INVALID_CREDENTIALS',
      tentativas: 2
    });
    useEstoque.mockReturnValue({ realizarLogin });

    const { container } = render(<Login />);
    const [usuarioInput] = container.querySelectorAll('input[type="text"]');
    const senhaInput = container.querySelector('input[type="password"]');

    await userEvent.type(usuarioInput, 'vendedor');
    await userEvent.type(senhaInput, 'senha-errada');
    await userEvent.click(screen.getByRole('button', { name: /autenticar/i }));

    expect(await screen.findByText(/3 tentativas/i)).toBeInTheDocument();
    expect(senhaInput).toHaveValue('');
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
