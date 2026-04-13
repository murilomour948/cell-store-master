import {
  normalizarAssistencia,
  normalizarCliente,
  normalizarFornecedor,
  normalizarLog,
  normalizarProduto,
  normalizarScooter,
  normalizarVenda,
  sortByNomeAsc,
  sortByTimestampDesc,
  sortByUpdatedDesc,
} from './estoqueHelpers';

export const carregarDadosIniciais = async ({ authToken, userLogado, apiFetch }) => {
  if (!authToken || !userLogado) return null;

  const isAdminLocal = (userLogado?.role || '').toUpperCase() === 'ADMIN';
  const [produtos, acessorios, vendas, clientes, scooters, assistencias, fornecedores] = await Promise.all([
    apiFetch('/produtos').then(r => r.json()),
    apiFetch('/acessorios').then(r => r.json()),
    apiFetch('/vendas').then(r => r.json()),
    apiFetch('/clientes').then(r => r.json()),
    apiFetch('/scooters').then(r => r.json()),
    apiFetch('/assistencias').then(r => r.json()),
    apiFetch('/fornecedores').then(r => r.json()),
  ]);

  const [logs, despesas, usuarios] = isAdminLocal
    ? await Promise.all([
        apiFetch('/logs').then(r => r.json()),
        apiFetch('/despesas').then(r => r.json()),
        apiFetch('/usuarios').then(r => r.json()),
      ])
    : [[], [], []];

  return {
    produtos: Array.isArray(produtos) ? produtos.map(normalizarProduto) : [],
    acessorios: Array.isArray(acessorios) ? acessorios : [],
    vendas: sortByTimestampDesc(Array.isArray(vendas) ? vendas.map(normalizarVenda) : []),
    clientes: Array.isArray(clientes) ? clientes.map(normalizarCliente) : [],
    scooters: Array.isArray(scooters) ? scooters.map(normalizarScooter) : [],
    assistencias: sortByUpdatedDesc(Array.isArray(assistencias) ? assistencias.map(normalizarAssistencia) : []),
    fornecedores: sortByNomeAsc(Array.isArray(fornecedores) ? fornecedores.map(normalizarFornecedor) : []),
    logs: sortByTimestampDesc(Array.isArray(logs) ? logs.map(normalizarLog) : []),
    despesas: Array.isArray(despesas) ? despesas : [],
    usuarios: Array.isArray(usuarios) ? usuarios : [],
  };
};
