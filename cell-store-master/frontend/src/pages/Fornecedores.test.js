import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Fornecedores from './Fornecedores';
import { useDialog } from '../contexts/DialogContext';
import { useEstoque } from '../contexts/EstoqueContext';

jest.mock('../contexts/DialogContext', () => ({
  useDialog: jest.fn()
}));

jest.mock('../contexts/EstoqueContext', () => ({
  useEstoque: jest.fn()
}));

describe('Fornecedores', () => {
  const showConfirm = jest.fn();
  const salvarFornecedor = jest.fn();
  const importarFornecedores = jest.fn();
  const removerFornecedor = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    useDialog.mockReturnValue({ showConfirm });
    useEstoque.mockReturnValue({
      fornecedores: [],
      salvarFornecedor,
      importarFornecedores,
      removerFornecedor
    });
  });

  it('migra fornecedores legados do localStorage uma unica vez', async () => {
    const antigos = [
      { id: 1, nome: 'Fornecedor legado', categoria: 'Aparelhos', telefone: '(11) 99999-0000' }
    ];
    importarFornecedores.mockResolvedValue(undefined);
    localStorage.setItem('@MRImports:fornecedores', JSON.stringify(antigos));

    render(<Fornecedores />);

    await waitFor(() => {
      expect(importarFornecedores).toHaveBeenCalledWith(antigos);
      expect(localStorage.getItem('@MRImports:fornecedores')).toBeNull();
    });
  });

  it('salva um novo fornecedor com nome em caixa alta e telefone formatado', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(123456789);
    salvarFornecedor.mockResolvedValue({ id: '123456789' });

    render(<Fornecedores />);

    await userEvent.type(screen.getByPlaceholderText(/mega/i), 'mega center');
    await userEvent.type(screen.getByPlaceholderText(/\(00\)\s00000-0000/i), '11999990000');
    await userEvent.click(screen.getByRole('button', { name: /\+\s*salvar contato/i }));

    await waitFor(() => {
      expect(salvarFornecedor).toHaveBeenCalledWith({
        id: 123456789,
        nome: 'MEGA CENTER',
        categoria: 'Aparelhos',
        telefone: '(11) 99999-0000'
      });
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/mega/i)).toHaveValue('');
      expect(screen.getByPlaceholderText(/\(00\)\s00000-0000/i)).toHaveValue('');
    });
    Date.now.mockRestore();
  });

  it('remove um fornecedor apos confirmacao', async () => {
    showConfirm.mockResolvedValue(true);
    useEstoque.mockReturnValue({
      fornecedores: [{ id: 'forn-1', nome: 'FORN TESTE', categoria: 'Aparelhos', telefone: '(11) 99999-0000' }],
      salvarFornecedor,
      importarFornecedores,
      removerFornecedor
    });

    render(<Fornecedores />);

    const linha = screen.getByText('FORN TESTE').closest('tr');
    const deleteButton = within(linha).getByRole('button');

    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(showConfirm).toHaveBeenCalled();
      expect(removerFornecedor).toHaveBeenCalledWith('forn-1');
    });
  });
});
