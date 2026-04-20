import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useDialog } from './DialogContext';
import { carregarDadosIniciais } from './estoqueDataLoader';
import {
  API_URL,
  AUTH_TOKEN_STORAGE_KEY,
  clearAuthSession,
  formatarCpf,
  hydrateStoredUser,
  normalizarAcessorio,
  normalizarAssistencia,
  normalizarCpf,
  normalizarChecklistAssistencia,
  normalizarFornecedor,
  persistAuthSession,
  persistStoredUser,
  sortByNomeAsc,
  sortByUpdatedDesc,
  toNum,
} from './estoqueHelpers';

const EstoqueContext = createContext();

export const EstoqueProvider = ({ children }) => {
  const [produtos, setProdutos] = useState([]);
  const [acessorios, setAcessorios] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [logs, setLogs] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [assistencias, setAssistencias] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [scooters, setScooters] = useState([]);
  const [authToken, setAuthToken] = useState(() => sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || null);
  const [userLogado, setUserLogado] = useState(() => hydrateStoredUser());
  const { showAlert } = useDialog();

  const apiFetch = useCallback(async (path, options = {}) => {
    const headers = { ...(options.headers || {}) };
    if (!headers['Content-Type'] && options.body) headers['Content-Type'] = 'application/json';
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    if (res.status === 401) {
      setUserLogado(null);
      setAuthToken(null);
      clearAuthSession();
    }
    return res;
  }, [authToken]);

  const fetchData = useCallback(async () => {
    try {
      const snapshot = await carregarDadosIniciais({ authToken, userLogado, apiFetch });
      if (!snapshot) return;

      setProdutos(snapshot.produtos);
      setAcessorios(snapshot.acessorios);
      setVendas(snapshot.vendas);
      setLogs(snapshot.logs);
      setClientes(snapshot.clientes);
      setAssistencias(snapshot.assistencias);
      setFornecedores(snapshot.fornecedores);
      setDespesas(snapshot.despesas);
      setUsuarios(snapshot.usuarios);
      setScooters(snapshot.scooters);
    } catch (err) {
      console.error("Erro ao buscar dados do backend Python:", err);
    }
  }, [apiFetch, authToken, userLogado]);

  useEffect(() => {
    if (!authToken || !userLogado) return;
    fetchData();
    const intervalId = setInterval(fetchData, 15000);
    const handleFocus = () => fetchData();
    const handleVisibility = () => {
      if (!document.hidden) fetchData();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchData, authToken, userLogado]);

  // --- LÓGICA DE AUTENTICAÇÃO ---
  const realizarLogin = async (username, password) => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: username, pass: password })
      });

      const data = await res.json();

      if (res.ok) {
        setUserLogado(data.user);
        setAuthToken(data.token);
        persistAuthSession(data.user, data.token);
        await fetch(`${API_URL}/logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${data.token}` },
          body: JSON.stringify({
            id: Date.now().toString(),
            mensagem: `LOGIN: Usuário ${data.user.user} acessou o sistema`,
            data: new Date().toLocaleString(),
            tipo: 'AUTH',
            timestamp: Date.now(),
            usuario: data.user.user
          })
        });
        return { sucesso: true, user: data.user };
      }

      return { sucesso: false, erro: data.error, tentativas: data.tentativas };
    } catch (err) {
      console.error(err);
      return { sucesso: false, erro: 'SERVER_ERROR' };
    }
  };

  const trocarSenha = async (username, novaSenha) => {
    const user = usuarios.find(u => u.user.toLowerCase() === username.toLowerCase());
    if (user) {
      await apiFetch(`/usuarios/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ pass: novaSenha })
      });
      setUsuarios(prev => prev.map(u => u.id === user.id ? { ...u } : u));

      if (userLogado?.user.toLowerCase() === username.toLowerCase()) {
        const atualizado = { ...userLogado };
        setUserLogado(atualizado);
        persistStoredUser(atualizado);
      }
      registrarLog('SENHA', `Senha de ${username} redefinida`, 'EDIT');
    }
  };

  const logout = async () => {
    if (userLogado) {
      registrarLog('LOGOUT', `Usuário ${userLogado.user} saiu`, 'AUTH');
    }
    try {
      await apiFetch('/logout', { method: 'POST' });
    } catch {}
    setUserLogado(null);
    setAuthToken(null);
    clearAuthSession();
  };

  const encontrarCliente = ({ nome = '', cpf = '' } = {}) => {
    const nomeLimpo = String(nome || '').toUpperCase().trim();
    const cpfNormalizado = normalizarCpf(cpf);
    return clientes.find(c => {
      const cpfCliente = normalizarCpf(c?.cpf);
      if (cpfNormalizado && cpfCliente && cpfCliente === cpfNormalizado) return true;
      return Boolean(nomeLimpo) && c?.nome === nomeLimpo;
    });
  };

  const registrarLog = async (acao, itemDesc, tipo) => {
    const novoLog = { 
      id: Date.now().toString(),
      mensagem: `${acao}: ${itemDesc}`, 
      data: new Date().toLocaleString(), 
      tipo, 
      timestamp: Date.now(),
      usuario: userLogado?.user || ''
    };
    await apiFetch(`/logs`, {
      method: 'POST',
      body: JSON.stringify(novoLog)
    });
    setLogs(prev => [novoLog, ...prev]);
  };

  const atualizarCRM = async ({
    nome,
    telefone,
    valor,
    dataNascimento,
    cpf,
    origem,
    endereco
  } = {}) => {
    if (!nome || nome.toUpperCase() === 'CONSUMIDOR') return;

    const nomeLimpo = nome.toUpperCase().trim();
    const valorNum = toNum(valor);
    const cpfFormatado = formatarCpf(cpf);
    const agora = new Date().toISOString();
    const clienteExistente = encontrarCliente({ nome: nomeLimpo, cpf: cpfFormatado });
    const origemResolvida = origem || clienteExistente?.origem || 'Balcão';

    if (clienteExistente) {
      const atualizado = {
        ...clienteExistente,
        nome: nomeLimpo,
        cpf: cpfFormatado || clienteExistente.cpf || '',
        telefone: telefone || clienteExistente.telefone || '',
        origem: origemResolvida,
        endereco: endereco || clienteExistente.endereco || '',
        totalGasto: toNum(clienteExistente.totalGasto) + valorNum,
        qtdCompras: (Number(clienteExistente.qtdCompras) || 0) + 1,
        primeiraCompra: clienteExistente.primeiraCompra || agora,
        ultimaCompra: agora,
        dataNascimento: dataNascimento || clienteExistente.dataNascimento || ''
      };
      const response = await apiFetch(`/clientes/${clienteExistente.id}`, {
        method: 'PUT',
        body: JSON.stringify(atualizado)
      });
      if (!response.ok) {
        throw new Error('Falha ao atualizar cliente no CRM.');
      }
      const responseData = await response.json().catch(() => ({}));
      const clienteAtualizado = responseData?.client
        ? { ...responseData.client, cpf: formatarCpf(responseData.client.cpf) }
        : atualizado;
      setClientes(prev => prev.map(c => c.id === clienteExistente.id ? clienteAtualizado : c));
    } else {
      const novo = {
        id: Date.now().toString(),
        nome: nomeLimpo,
        cpf: cpfFormatado,
        telefone: telefone || '',
        origem: origemResolvida,
        endereco: endereco || '',
        totalGasto: valorNum,
        qtdCompras: 1,
        primeiraCompra: agora,
        ultimaCompra: agora,
        dataNascimento: dataNascimento || ''
      };
      const response = await apiFetch(`/clientes`, {
        method: 'POST',
        body: JSON.stringify(novo)
      });
      if (!response.ok) {
        throw new Error('Falha ao criar cliente no CRM.');
      }
      const responseData = await response.json().catch(() => ({}));
      const clienteCriado = responseData?.client
        ? { ...responseData.client, cpf: formatarCpf(responseData.client.cpf) }
        : novo;
      setClientes(prev => [...prev, clienteCriado]);
    }
  };

  const removerCliente = async (id, nome) => {
    try {
      await apiFetch(`/clientes/${id}`, { method: 'DELETE' });
      setClientes(prev => prev.filter(c => c.id !== id));
      registrarLog('CLIENTE', `Cliente removido: ${nome}`, 'DELETE');
    } catch (err) {
      console.error(err);
    }
  };

  // --- FUNÇÕES DE ESTOQUE E VENDAS ---
  const adicionarProduto = async (novo) => {
    if (produtos.some(p => p.imei?.trim() === novo.imei?.trim() && novo.imei !== '')) {
      showAlert('IMEI já cadastrado no sistema!', 'error', 'Operação Negada'); return false;
    }
    const novoProduto = { ...novo, id: Date.now().toString(), dataEntrada: new Date().toISOString() };
    const payload = {
      ...novoProduto,
      condicao: novoProduto.condicao || novoProduto.estado || '',
      estado: novoProduto.estado || novoProduto.condicao || 'Novo'
    };
    const response = await apiFetch(`/produtos`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      await showAlert('Erro ao salvar o produto no servidor.', 'error', 'Falha no Servidor');
      return false;
    }
    setProdutos(prev => [...prev, payload]);
    registrarLog('PRODUTO', `${novo.modelo}`, 'ADD');
    return true;
  };

  const removerProduto = async (id, modelo) => {
    await apiFetch(`/produtos/${id}`, { method: 'DELETE' });
    setProdutos(prev => prev.filter(p => p.id !== id));
    registrarLog('EXCLUSAO', `${modelo}`, 'DELETE');
  };

  const editarProduto = async (id, dados) => {
    const payload = {
      ...dados,
      condicao: dados?.condicao || dados?.estado || '',
      estado: dados?.estado || dados?.condicao || 'Novo'
    };
    const response = await apiFetch(`/produtos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      await showAlert('Erro ao atualizar o produto no servidor.', 'error', 'Falha no Servidor');
      return false;
    }
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, ...payload } : p));
    registrarLog('EDICAO', `${payload.modelo}`, 'EDIT');
    return true;
  };

  // --- ACESSÓRIOS ---
  const adicionarAcessorio = async (novo) => {
    const novoAcessorio = { ...novo, id: Date.now().toString() };
    const response = await apiFetch(`/acessorios`, {
      method: 'POST',
      body: JSON.stringify(novoAcessorio)
    });
    if (!response.ok) {
      await showAlert('Erro ao salvar o acessório no servidor.', 'error', 'Falha no Servidor');
      return false;
    }
    const responseData = await response.json().catch(() => ({}));
    const acessorioSalvo = normalizarAcessorio(responseData?.item || novoAcessorio);
    setAcessorios(prev => [...prev, acessorioSalvo]);
    registrarLog('ACESSORIO', `${novo.nome}`, 'ADD');
    return true;
  };

  const editarAcessorio = async (id, dados) => {
    const response = await apiFetch(`/acessorios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados)
    });
    if (!response.ok) {
      await showAlert('Erro ao atualizar o acessório no servidor.', 'error', 'Falha no Servidor');
      return false;
    }
    const responseData = await response.json().catch(() => ({}));
    const acessorioAtualizado = normalizarAcessorio(responseData?.item || { ...dados, id });
    setAcessorios(prev => prev.map(a => a.id === id ? acessorioAtualizado : a));
    registrarLog('EDIT ACESSORIO', `${dados.nome}`, 'EDIT');
    return true;
  };

  const removerAcessorio = async (id) => {
    await apiFetch(`/acessorios/${id}`, { method: 'DELETE' });
    const item = acessorios.find(a => a.id === id);
    setAcessorios(prev => prev.filter(a => a.id !== id));
    registrarLog('EXCLUIR ACESSORIO', `${item?.nome || 'Item'}`, 'DELETE');
  };

  // --- SCOOTERS ---
  const adicionarScooter = async (nova) => {
    const novaScooter = { ...nova, id: Date.now().toString(), dataEntrada: new Date().toISOString() };
    await apiFetch(`/scooters`, {
      method: 'POST',
      body: JSON.stringify(novaScooter)
    });
    setScooters(prev => [...prev, novaScooter]);
    registrarLog('SCOOTER', `${nova.modelo}`, 'ADD');
    return true;
  };

  const editarScooter = async (id, dados) => {
    await apiFetch(`/scooters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados)
    });
    setScooters(prev => prev.map(s => s.id === id ? { ...s, ...dados } : s));
    registrarLog('EDIT SCOOTER', `${dados.modelo}`, 'EDIT');
  };

  const removerScooter = async (id) => {
    await apiFetch(`/scooters/${id}`, { method: 'DELETE' });
    const item = scooters.find(s => s.id === id);
    setScooters(prev => prev.filter(s => s.id !== id));
    registrarLog('EXCLUIR SCOOTER', `${item?.modelo || 'Item'}`, 'DELETE');
  };

  const venderProduto = async (id, detalhes = {}) => {
    const isAcessorio = String(detalhes.tipoOriginal || detalhes.tipo || '').toUpperCase() === 'ACESSORIO';
    const isScooter = String(detalhes.tipoOriginal || detalhes.tipo || '').toUpperCase() === 'SCOOTER';
    const qtdVenda = Math.max(1, Number(detalhes.quantidade) || 1);
    const tipoVenda = String(detalhes.tipo || detalhes.tipoOriginal || (isAcessorio ? 'ACESSORIO' : isScooter ? 'SCOOTER' : 'IPHONE')).toUpperCase();
    const itemVendido = isAcessorio
      ? acessorios.find(a => a.id === id)
      : isScooter
        ? scooters.find(s => s.id === id)
        : produtos.find(p => p.id === id);

    if (!itemVendido) {
      await showAlert('O item selecionado não foi encontrado no estoque atual.', 'error', 'Item Indisponível');
      return false;
    }

    if ((isAcessorio || isScooter) && Number(itemVendido.quantidade) < qtdVenda) {
      await showAlert('Estoque insuficiente para concluir a venda.', 'error', 'Operação Negada');
      return false;
    }

    const valorVenda = toNum(detalhes.precoVenda);
    const clienteRelacionado = encontrarCliente({ nome: detalhes.cliente, cpf: detalhes.cpf });
    const cpfCliente = formatarCpf(detalhes.cpf || clienteRelacionado?.cpf || '');
    const telefoneCliente = detalhes.telefone || clienteRelacionado?.telefone || '';
    const origemCliente = detalhes.origemCliente || clienteRelacionado?.origem || 'Balcão';
    const novaVenda = {
      ...itemVendido,
      ...detalhes,
      cpf: cpfCliente,
      telefone: telefoneCliente,
      origemCliente,
      tipo: tipoVenda,
      tipoOriginal: detalhes.tipoOriginal || tipoVenda,
      quantidade: qtdVenda,
      id: Date.now().toString(),
      dataVenda: new Date().toISOString(),
      timestamp: Date.now()
    };

    const resCheckout = await apiFetch('/checkout', {
      method: 'POST',
      body: JSON.stringify({
        ...novaVenda,
        itemId: id,
        itemType: tipoVenda
      })
    });
    const checkoutData = await resCheckout.json().catch(() => ({}));

    if (!resCheckout.ok) {
      const checkoutError = checkoutData?.error;
      if (checkoutError === 'INSUFFICIENT_STOCK') {
        await showAlert('Estoque insuficiente para concluir a venda.', 'error', 'Operação Negada');
      } else if (checkoutError === 'ITEM_NOT_FOUND') {
        await showAlert('O item não está mais disponível no estoque.', 'error', 'Item Indisponível');
      } else {
        await showAlert('Erro ao registrar a venda no servidor.', 'error', 'Falha no Servidor');
      }
      return false;
    }

    const inventoryData = checkoutData?.inventory || {};
    const saleRecord = { ...novaVenda, ...(checkoutData?.sale || {}) };

    if (tipoVenda === 'ACESSORIO') {
      setAcessorios(prev => prev.map(a => (
        a.id === id
          ? { ...a, quantidade: inventoryData.remainingQuantity ?? Math.max(0, Number(a.quantidade) - qtdVenda) }
          : a
      )));
    } else if (tipoVenda === 'SCOOTER') {
      setScooters(prev => prev.map(s => (
        s.id === id
          ? { ...s, quantidade: inventoryData.remainingQuantity ?? Math.max(0, Number(s.quantidade) - qtdVenda) }
          : s
      )));
    } else {
      setProdutos(prev => prev.filter(p => p.id !== id));
    }

    setVendas(prev => [saleRecord, ...prev]);
    try {
      await atualizarCRM({
        nome: detalhes.cliente,
        telefone: telefoneCliente,
        valor: valorVenda,
        dataNascimento: detalhes.dataNascimento,
        cpf: cpfCliente,
        origem: origemCliente
      });
    } catch (error) {
      console.error('Falha ao atualizar CRM após venda:', error);
    }
    registrarLog('VENDA', `${itemVendido.modelo || itemVendido.nome}`, 'SALE');
    return true;
  };

  const registrarServico = async (dados) => {
    const valorServ = toNum(dados.valorCobrado);
    const novaVenda = {
      ...dados,
      id: Date.now().toString(),
      tipo: 'SERVICO',
      precoVenda: valorServ, // Garante que o campo principal seja enviado.
      dataVenda: new Date().toISOString(),
      timestamp: Date.now()
    };
    const response = await apiFetch(`/vendas`, {
      method: 'POST',
      body: JSON.stringify(novaVenda)
    });
    if (!response.ok) {
      await showAlert('Erro ao registrar o serviço no servidor.', 'error', 'Falha no Servidor');
      return false;
    }
    const responseData = await response.json().catch(() => ({}));
    const vendaRegistrada = { ...novaVenda, ...(responseData?.sale || {}) };
    setVendas(prev => [vendaRegistrada, ...prev]);
    try {
      await atualizarCRM({
        nome: dados.cliente,
        telefone: dados.telefone,
        valor: valorServ,
        cpf: dados.cpf,
        origem: dados.origem,
        endereco: dados.endereco
      });
    } catch (error) {
      console.error('Falha ao atualizar CRM após serviço:', error);
    }
    registrarLog('ASSISTÊNCIA', `${dados.modelo}`, 'SALE');
    return true;
  };

  const salvarAssistencia = async (dados, idExistente = null) => {
    const payloadBase = normalizarAssistencia(dados);
    const payload = {
      ...payloadBase,
      id: String(idExistente || payloadBase.id || Date.now()),
      checklist: normalizarChecklistAssistencia(payloadBase.checklist)
    };
    const endpoint = idExistente ? `/assistencias/${idExistente}` : '/assistencias';
    const method = idExistente ? 'PUT' : 'POST';
    const response = await apiFetch(endpoint, {
      method,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      await showAlert('Erro ao salvar a ordem de serviço no servidor.', 'error', 'Falha no Servidor');
      return null;
    }

    const responseData = await response.json().catch(() => ({}));
    const assistenciaSalva = normalizarAssistencia(responseData?.assistencia || payload);
    setAssistencias(prev => {
      const restantes = prev.filter(item => item.id !== assistenciaSalva.id);
      return sortByUpdatedDesc([assistenciaSalva, ...restantes]);
    });
    registrarLog(idExistente ? 'EDIT O.S.' : 'NOVA O.S.', `${assistenciaSalva.os} - ${assistenciaSalva.cliente}`, idExistente ? 'EDIT' : 'ADD');
    return assistenciaSalva;
  };

  const importarAssistencias = async (lista = []) => {
    if (!Array.isArray(lista) || lista.length === 0) return { imported: 0, skipped: 0 };

    const idsExistentes = new Set(assistencias.map(item => String(item.id)));
    let imported = 0;
    let skipped = 0;

    for (const item of lista) {
      const itemId = String(item?.id || '');
      if (itemId && idsExistentes.has(itemId)) {
        skipped += 1;
        continue;
      }
      const assistenciaSalva = await salvarAssistencia(item, itemId || null);
      if (assistenciaSalva) {
        imported += 1;
        idsExistentes.add(String(assistenciaSalva.id));
      }
    }

    return { imported, skipped };
  };

  const removerAssistencia = async (id) => {
    const assistenciaAtual = assistencias.find(item => item.id === String(id));
    const response = await apiFetch(`/assistencias/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      await showAlert('Erro ao remover a ordem de serviço do servidor.', 'error', 'Falha no Servidor');
      return false;
    }
    setAssistencias(prev => prev.filter(item => item.id !== String(id)));
    if (assistenciaAtual) {
      registrarLog('EXCLUIR O.S.', `${assistenciaAtual.os} - ${assistenciaAtual.cliente}`, 'DELETE');
    }
    return true;
  };

  const salvarFornecedor = async (dados, idExistente = null) => {
    const payloadBase = normalizarFornecedor(dados);
    const payload = {
      ...payloadBase,
      id: String(idExistente || payloadBase.id || Date.now())
    };
    const endpoint = idExistente ? `/fornecedores/${idExistente}` : '/fornecedores';
    const method = idExistente ? 'PUT' : 'POST';
    const response = await apiFetch(endpoint, {
      method,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      await showAlert('Erro ao salvar o fornecedor no servidor.', 'error', 'Falha no Servidor');
      return null;
    }

    const responseData = await response.json().catch(() => ({}));
    const fornecedorSalvo = normalizarFornecedor(responseData?.fornecedor || payload);
    setFornecedores(prev => {
      const restantes = prev.filter(item => item.id !== fornecedorSalvo.id);
      return sortByNomeAsc([...restantes, fornecedorSalvo]);
    });
    registrarLog(idExistente ? 'EDIT FORNECEDOR' : 'NOVO FORNECEDOR', fornecedorSalvo.nome, idExistente ? 'EDIT' : 'ADD');
    return fornecedorSalvo;
  };

  const importarFornecedores = async (lista = []) => {
    if (!Array.isArray(lista) || lista.length === 0) return { imported: 0, skipped: 0 };

    const idsExistentes = new Set(fornecedores.map(item => String(item.id)));
    let imported = 0;
    let skipped = 0;

    for (const item of lista) {
      const itemId = String(item?.id || '');
      if (itemId && idsExistentes.has(itemId)) {
        skipped += 1;
        continue;
      }
      const fornecedorSalvo = await salvarFornecedor(item, itemId || null);
      if (fornecedorSalvo) {
        imported += 1;
        idsExistentes.add(String(fornecedorSalvo.id));
      }
    }

    return { imported, skipped };
  };

  const removerFornecedor = async (id) => {
    const fornecedorAtual = fornecedores.find(item => item.id === String(id));
    const response = await apiFetch(`/fornecedores/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      await showAlert('Erro ao remover o fornecedor do servidor.', 'error', 'Falha no Servidor');
      return false;
    }
    setFornecedores(prev => prev.filter(item => item.id !== String(id)));
    if (fornecedorAtual) {
      registrarLog('EXCLUIR FORNECEDOR', fornecedorAtual.nome, 'DELETE');
    }
    return true;
  };

  const estornarVenda = async (idVenda, devolver = true) => {
    const venda = vendas.find(v => v.id === idVenda || v.idVenda === idVenda);
    if (!venda) return false;
    
    if (devolver) {
      const tipoItem = String(venda.tipo || venda.tipoOriginal || (venda.imei ? 'IPHONE' : '')).toUpperCase();
      
      if (tipoItem === 'IPHONE') {
        const precoRetorno = toNum(venda.precoVenda || venda.valorCobrado || venda.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const custoRetorno = toNum(venda.precoCusto || venda.custo || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const condicaoRetorno = venda.condicao || venda.estado || '';
        const estadoRetorno = venda.estado || venda.condicao || 'Novo';
        const novoProduto = {
          id: Date.now().toString(),
          modelo: venda.modelo || venda.nome || '',
          imei: venda.imei || '',
          precoCusto: custoRetorno,
          precoVenda: precoRetorno,
          preco: precoRetorno,
          dataEntrada: new Date().toISOString(),
          cor: venda.cor || '',
          condicao: condicaoRetorno,
          estado: estadoRetorno,
          imagem: venda.imagem || ''
        };
        await apiFetch(`/produtos`, {
          method: 'POST',
          body: JSON.stringify(novoProduto)
        });
        setProdutos(prev => [...prev, novoProduto]);
      } else if (tipoItem === 'ACESSORIO') {
        const aces = acessorios.find(a => a.nome === venda.nome || a.nome === venda.modelo);
        if (aces) {
          const atualizado = { ...aces, quantidade: Number(aces.quantidade) + 1 };
          await apiFetch(`/acessorios/${aces.id}`, {
            method: 'PUT',
            body: JSON.stringify(atualizado)
          });
          setAcessorios(prev => prev.map(a => a.id === aces.id ? atualizado : a));
        }
      } else if (tipoItem === 'SCOOTER') {
        const scoot = scooters.find(s => s.modelo === venda.modelo || s.modelo === venda.nome);
        if (scoot) {
          const atualizado = { ...scoot, quantidade: Number(scoot.quantidade) + 1 };
          await apiFetch(`/scooters/${scoot.id}`, {
            method: 'PUT',
            body: JSON.stringify(atualizado)
          });
          setScooters(prev => prev.map(s => s.id === scoot.id ? atualizado : s));
        }
      }
    }
    
    await apiFetch(`/vendas/${idVenda}`, { method: 'DELETE' });
    setVendas(prev => prev.filter(v => v.id !== idVenda));
    registrarLog('ESTORNO', 'Venda cancelada', 'DELETE');
    return true;
  };

  const adicionarDespesa = async (nova) => {
    const novaDesp = { ...nova, id: Date.now().toString() };
    await apiFetch(`/despesas`, {
      method: 'POST',
      body: JSON.stringify(novaDesp)
    });
    setDespesas(prev => [...prev, novaDesp]);
  };

  const removerDespesa = async (id) => {
    await apiFetch(`/despesas/${id}`, { method: 'DELETE' });
    setDespesas(prev => prev.filter(d => d.id !== id));
  };

  return (
    <EstoqueContext.Provider value={{ 
      produtos, acessorios, vendas, logs, clientes, assistencias, fornecedores, despesas, usuarios, userLogado, scooters,
      realizarLogin, trocarSenha, logout, 
      isAdmin: userLogado?.role === 'ADMIN',
      adicionarProduto, editarProduto, removerProduto, venderProduto,
      adicionarAcessorio, editarAcessorio, removerAcessorio,
      adicionarScooter, editarScooter, removerScooter,
      registrarServico, salvarAssistencia, importarAssistencias, removerAssistencia,
      salvarFornecedor, importarFornecedores, removerFornecedor,
      estornarVenda, adicionarDespesa, removerDespesa,
      atualizarCRM, removerCliente
    }}>
      {children}
    </EstoqueContext.Provider>
  );
};

export const useEstoque = () => useContext(EstoqueContext);
