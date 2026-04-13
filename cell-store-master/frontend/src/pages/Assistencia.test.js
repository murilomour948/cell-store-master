import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Assistencia from './Assistencia';
import { useDialog } from '../contexts/DialogContext';
import { useEstoque } from '../contexts/EstoqueContext';

jest.mock('./OrdemEntrada', () => () => <div>Recibo de entrada</div>);
jest.mock('./TermoGarantiaFinal', () => () => <div>Termo de garantia</div>);

jest.mock('../contexts/DialogContext', () => ({
  useDialog: jest.fn()
}));

jest.mock('../contexts/EstoqueContext', () => ({
  useEstoque: jest.fn()
}));

describe('Assistencia', () => {
  const showAlert = jest.fn();
  const showConfirm = jest.fn();
  const registrarServico = jest.fn();
  const salvarAssistencia = jest.fn();
  const importarAssistencias = jest.fn();
  const removerAssistencia = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    useDialog.mockReturnValue({ showAlert, showConfirm });
    useEstoque.mockReturnValue({
      registrarServico,
      clientes: [],
      assistencias: [],
      salvarAssistencia,
      importarAssistencias,
      removerAssistencia,
      isAdmin: true
    });
  });

  it('migra assistencias legadas do localStorage', async () => {
    const antigas = [
      { id: 1, os: 'OS-1234', cliente: 'Cliente legado', aparelho: 'IPHONE 13', checklist: {} }
    ];
    importarAssistencias.mockResolvedValue(undefined);
    localStorage.setItem('@MRImports:assistencia', JSON.stringify(antigas));

    render(<Assistencia />);

    await waitFor(() => {
      expect(importarAssistencias).toHaveBeenCalledWith(antigas);
      expect(localStorage.getItem('@MRImports:assistencia')).toBeNull();
    });
  });

  it('salva uma nova ordem de servico e mostra o recibo de entrada', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
    salvarAssistencia.mockResolvedValue({
      id: '1700000000000',
      os: 'OS-4321',
      cliente: 'ANA',
      aparelho: 'IPHONE 11'
    });

    render(<Assistencia />);

    await userEvent.click(screen.getByRole('button', { name: /\+\s*abrir o\.s\./i }));
    await userEvent.type(screen.getByPlaceholderText(/nome completo/i), 'ana');
    await userEvent.type(screen.getByPlaceholderText(/modelo/i), 'iphone 11');
    await userEvent.click(screen.getByRole('button', { name: /salvar e gerar recibo/i }));

    await waitFor(() => {
      expect(salvarAssistencia).toHaveBeenCalledWith(
        expect.objectContaining({
          cliente: 'ANA',
          aparelho: 'IPHONE 11'
        }),
        null
      );
    });

    expect(await screen.findByText(/recibo de entrada/i)).toBeInTheDocument();
    Date.now.mockRestore();
  });
});
