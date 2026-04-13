import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PDV from './PDV';
import { useDialog } from '../contexts/DialogContext';
import { useEstoque } from '../contexts/EstoqueContext';

jest.mock('./NotaVenda', () => () => <div>Nota de venda</div>);

jest.mock('../contexts/DialogContext', () => ({
  useDialog: jest.fn()
}));

jest.mock('../contexts/EstoqueContext', () => ({
  useEstoque: jest.fn()
}));

describe('PDV', () => {
  const showAlert = jest.fn();
  const venderProduto = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    useDialog.mockReturnValue({ showAlert });
    useEstoque.mockReturnValue({
      produtos: [
        {
          id: 'iphone-1',
          modelo: 'IPHONE 14 PRO',
          capacidade: '128GB',
          imei: '123456789012345',
          precoVenda: 'R$ 5.000,00',
          precoCusto: 'R$ 4.000,00'
        }
      ],
      acessorios: [],
      venderProduto,
      clientes: [
        {
          id: 'cli-1',
          nome: 'ANA SILVA',
          cpf: '123.456.789-01',
          telefone: '(11) 98888-7777',
          dataNascimento: '1995-05-10'
        }
      ],
      isAdmin: true
    });
  });

  it('autopreenche cliente por CPF e finaliza a venda com os dados do checkout', async () => {
    venderProduto.mockResolvedValue(true);

    render(<PDV />);

    await userEvent.type(screen.getByPlaceholderText(/buscar por modelo ou imei/i), 'IPHONE 14');
    await userEvent.click(await screen.findByText(/IPHONE 14 PRO/i));

    const cpfInput = screen.getByPlaceholderText('000.000.000-00');
    const nomeInput = screen.getByPlaceholderText(/nome completo/i);
    const telefoneInput = screen.getByPlaceholderText(/\(00\)\s00000-0000/i);

    await userEvent.type(cpfInput, '12345678901');

    await waitFor(() => {
      expect(nomeInput).toHaveValue('ANA SILVA');
      expect(telefoneInput).toHaveValue('(11) 98888-7777');
    });

    await userEvent.click(screen.getByRole('button', { name: /^finalizar$/i }));

    await waitFor(() => {
      expect(venderProduto).toHaveBeenCalledWith(
        'iphone-1',
        expect.objectContaining({
          cliente: 'ANA SILVA',
          cpf: '123.456.789-01',
          telefone: '(11) 98888-7777',
          dataNascimento: '1995-05-10',
          quantidade: 1,
          formaPagamento: 'PIX',
          tipoOriginal: 'IPHONE',
          total: 5000
        })
      );
    }, { timeout: 2000 });

    expect(await screen.findByText(/venda conclu/i, {}, { timeout: 2000 })).toBeInTheDocument();
  });
});
