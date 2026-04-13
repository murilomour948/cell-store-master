import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Clientes from './Clientes';
import { useEstoque } from '../contexts/EstoqueContext';

jest.mock('../contexts/EstoqueContext', () => ({
  useEstoque: jest.fn()
}));

describe('Clientes', () => {
  const removerCliente = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useEstoque.mockReturnValue({
      clientes: [
        {
          id: 'cli-1',
          nome: 'ANA SILVA',
          origem: 'Instagram',
          cpf: '123.456.789-01',
          telefone: '(11) 98888-7777',
          qtdCompras: 3,
          totalGasto: 15000,
          dataNascimento: '1995-05-10',
          ultimaCompra: '2026-04-10T12:00:00Z'
        },
        {
          id: 'cli-2',
          nome: 'BRUNO COSTA',
          origem: 'Balcao',
          cpf: '987.654.321-00',
          telefone: '(21) 97777-6666',
          qtdCompras: 1,
          totalGasto: 900,
          dataNascimento: '',
          ultimaCompra: '2026-04-01T12:00:00Z'
        }
      ],
      removerCliente,
      isAdmin: true
    });
  });

  it('filtra clientes usando CPF sem pontuacao', async () => {
    render(<Clientes />);

    await userEvent.type(screen.getByPlaceholderText(/buscar por nome, telefone ou cpf/i), '12345678901');

    expect(screen.getByText('ANA SILVA')).toBeInTheDocument();
    expect(screen.queryByText('BRUNO COSTA')).not.toBeInTheDocument();
  });

  it('remove um cliente apos confirmacao no modal', async () => {
    render(<Clientes />);

    const linhaCliente = screen.getByText('ANA SILVA').closest('tr');
    const botaoExcluir = within(linhaCliente).getByTitle(/remover cliente/i);

    await userEvent.click(botaoExcluir);
    expect(screen.getByText(/tem certeza que deseja apagar o cliente/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /sim, excluir/i }));

    await waitFor(() => {
      expect(removerCliente).toHaveBeenCalledWith('cli-1', 'ANA SILVA');
    });
  });
});
