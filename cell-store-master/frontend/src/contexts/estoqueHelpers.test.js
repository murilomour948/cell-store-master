import {
  formatarCpf,
  normalizarAssistencia,
  normalizarFornecedor,
  normalizarProduto,
  normalizarVenda,
  sortByNomeAsc,
  sortByTimestampDesc,
  sortByUpdatedDesc,
  toNum,
} from './estoqueHelpers';

describe('estoqueHelpers', () => {
  it('formata CPF e preserva valor inválido como texto limpo', () => {
    expect(formatarCpf('12345678909')).toBe('123.456.789-09');
    expect(formatarCpf('123')).toBe('123');
  });

  it('normaliza valores numéricos vindos do app', () => {
    expect(toNum('R$ 4.999,90')).toBe(4999.9);
    expect(toNum('450')).toBe(450);
    expect(toNum('')).toBe(0);
  });

  it('normaliza assistências, fornecedores, produtos e vendas', () => {
    expect(normalizarAssistencia({ id: 7, cliente: 'ana', checklist: { telaRiscada: true } })).toMatchObject({
      id: '7',
      cliente: 'ANA',
      status: 'orcamento',
      checklist: {
        telaRiscada: true,
        carcacaAmassada: false,
        faceIdRuim: false,
        cameraMancha: false,
      },
    });

    expect(normalizarFornecedor({ id: 9, nome: 'mega imports', telefone: '1199' })).toMatchObject({
      id: '9',
      nome: 'MEGA IMPORTS',
      telefone: '1199',
    });

    expect(normalizarProduto({ modelo: 'iPhone', condicao: 'Semi Novo' })).toMatchObject({
      modelo: 'iPhone',
      condicao: 'Semi Novo',
      estado: 'Semi Novo',
    });

    expect(normalizarVenda({ cpf: '12345678909', tipo: 'IPHONE' })).toMatchObject({
      cpf: '123.456.789-09',
      origemCliente: 'Balcão',
      tipoOriginal: 'IPHONE',
    });
  });

  it('ordena coleções derivadas corretamente', () => {
    expect(sortByNomeAsc([{ nome: 'Zeta' }, { nome: 'Alpha' }]).map(item => item.nome)).toEqual(['Alpha', 'Zeta']);
    expect(sortByTimestampDesc([{ id: 1, timestamp: 1 }, { id: 2, timestamp: 3 }]).map(item => item.id)).toEqual([2, 1]);
    expect(sortByUpdatedDesc([{ id: 1, updatedAt: 1 }, { id: 2, updatedAt: 3 }]).map(item => item.id)).toEqual([2, 1]);
  });
});
