import { carregarDadosIniciais } from './estoqueDataLoader';

describe('carregarDadosIniciais', () => {
  it('retorna snapshot nulo sem autenticação', async () => {
    const apiFetch = jest.fn();

    const snapshot = await carregarDadosIniciais({ authToken: null, userLogado: null, apiFetch });

    expect(snapshot).toBeNull();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('carrega e normaliza os dados principais do contexto', async () => {
    const responses = {
      '/produtos': [{ id: '1', modelo: 'iPhone', condicao: 'Novo' }],
      '/acessorios': [{ id: '2', nome: 'Capa' }],
      '/vendas': [{ id: '3', cpf: '12345678909', tipo: 'IPHONE', timestamp: 10 }],
      '/clientes': [{ id: '4', nome: 'Maria', cpf: '12345678909' }],
      '/scooters': [{ id: '5', modelo: 'Scooter', asin: '500W' }],
      '/assistencias': [{ id: '6', cliente: 'ana', updatedAt: 2 }],
      '/fornecedores': [{ id: '7', nome: 'zeta' }, { id: '8', nome: 'alpha' }],
      '/logs': [{ id: '9', user: 'admin', timestamp: 5 }],
      '/despesas': [{ id: '10', descricao: 'Energia' }],
      '/usuarios': [{ id: '11', user: 'admin' }],
    };

    const apiFetch = jest.fn(async (path) => ({
      json: async () => responses[path],
    }));

    const snapshot = await carregarDadosIniciais({
      authToken: 'token-ok',
      userLogado: { role: 'ADMIN' },
      apiFetch,
    });

    expect(snapshot.produtos[0]).toMatchObject({ modelo: 'iPhone', estado: 'Novo' });
    expect(snapshot.vendas[0]).toMatchObject({ cpf: '123.456.789-09', origemCliente: 'Balcão' });
    expect(snapshot.clientes[0]).toMatchObject({ cpf: '123.456.789-09' });
    expect(snapshot.scooters[0]).toMatchObject({ potencia: '500W' });
    expect(snapshot.logs[0]).toMatchObject({ usuario: 'admin' });
    expect(snapshot.fornecedores.map(item => item.nome)).toEqual(['ALPHA', 'ZETA']);
    expect(apiFetch).toHaveBeenCalledWith('/usuarios');
  });
});
