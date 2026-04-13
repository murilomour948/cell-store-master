import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { useEstoque } from '../contexts/EstoqueContext';
import { useDialog } from '../contexts/DialogContext';
import NotaVenda from './NotaVenda';

// --- ESTILOS PREMIUM MR IMPORTS ---
const PageContainer = styled.div`padding: 40px; color: #fff; font-family: 'Segoe UI', sans-serif; background-color: #0d0d0d; min-height: 100vh; @media (max-width: 768px) { padding: 16px; }`;
const Header = styled.div`margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end;`;
const Title = styled.h1`font-weight: 300; color: #ffffff; letter-spacing: 1px; margin: 0;`;
const Subtitle = styled.p`color: #a0a0a0; margin-top: 5px; font-size: 14px;`;

const TopBar = styled.div`display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;`;
const SearchInput = styled.input`
  flex: 1; padding: 12px 20px; background: #121212; border: 1px solid #333; 
  border-radius: 8px; color: #fff; outline: none; &:focus { border-color: #ffffff; }
`;
const SelectFilter = styled.select`
  padding: 12px 20px; background: #121212; border: 1px solid #333; border-radius: 8px; color: #fff; outline: none;
`;

const FilterButton = styled.button`
  padding: 12px 20px;
  background: #121212;
  border: 1px solid #333;
  border-radius: 8px;
  color: #fff;
  outline: none;
  cursor: pointer;
  font-weight: bold;
  transition: 0.2s;
  &:hover { border-color: #ffffff; }
`;

const TableContainer = styled.div`background: #121212; border: 1px solid #222; border-radius: 12px; overflow: hidden; @media (max-width: 768px) { overflow-x: auto; }`;
const Table = styled.table`width: 100%; border-collapse: collapse; text-align: left;`;
const Th = styled.th`padding: 15px 20px; background: #1a1a1a; color: #888; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #333;`;
const Td = styled.td`padding: 15px 20px; color: #ccc; font-size: 14px; border-bottom: 1px solid #222;`;

const ActionButton = styled.button`
  background: ${props => props.danger ? 'transparent' : '#ffffff'};
  color: ${props => props.danger ? '#ff4d4d' : '#000'};
  border: ${props => props.danger ? '1px solid #ff4d4d' : 'none'};
  padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 11px; text-transform: uppercase; margin-right: 10px;
  &:hover { background: ${props => props.danger ? '#ff4d4d' : '#e0e0e0'}; color: ${props => props.danger ? '#fff' : '#000'}; }
`;

const Badge = styled.span`
  background: ${props => props.tipo === 'IPHONE' ? '#ffffff' : props.tipo === 'SERVICO' ? '#555' : '#333'};
  color: ${props => props.tipo === 'IPHONE' ? '#000' : '#fff'};
  padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 30px;
  padding: 20px;
  @media print { display: none; }
`;

const PageButton = styled.button`
  background: #1a1a1a;
  border: 1px solid #333;
  color: #fff;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: 0.3s;
  &:hover:not(:disabled) { border-color: #ffffff; color: #ffffff; transform: translateY(-2px); }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`;

const PageInfo = styled.span`
  color: #888;
  font-size: 14px;
  letter-spacing: 1px;
`;

const Historico = () => {
  const { vendas, logs, estornarVenda, isAdmin } = useEstoque();
  const { showAlert, showConfirm } = useDialog();
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [filtroUsuario, setFiltroUsuario] = useState('TODOS');
  const [periodoSistema, setPeriodoSistema] = useState('TUDO');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [reciboAtivo, setReciboAtivo] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('VENDAS'); // 'VENDAS' ou 'SISTEMA'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Função blindada para ler valores financeiros
  const parseValue = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    
    const valStr = String(val);
    
    if (valStr.includes('R$') || valStr.includes(',')) {
      const clean = valStr.replace(/[R$\s.]/g, "").replace(",", ".");
      return Number(clean) || 0;
    }
    
    const numericVal = Number(valStr);
    if (!isNaN(numericVal)) {
      return numericVal;
    }
    
    const cleanStr = valStr.replace(/\D/g, "");
    return cleanStr === "" ? 0 : Number(cleanStr);
  };

  // --- FILTRO DE VENDAS ---
  const vendasFiltradas = useMemo(() => {
    return (vendas || []).filter(v => {
        const itemTipo = (v.tipo || v.tipoOriginal || '').toUpperCase();
      const matchBusca = (v.cliente?.toLowerCase().includes(busca.toLowerCase())) || 
                         (v.modelo?.toLowerCase().includes(busca.toLowerCase())) ||
                         (v.imei?.includes(busca));
      const matchTipo = filtroTipo === 'TODOS' || itemTipo === filtroTipo;
      return matchBusca && matchTipo;
    }).sort((a, b) => new Date(b.dataVenda) - new Date(a.dataVenda)); // Mais recentes primeiro
  }, [vendas, busca, filtroTipo]);

  const usuariosDisponiveis = useMemo(() => {
    const set = new Set();
    (logs || []).forEach(l => {
      const u = String(l?.usuario || '').trim();
      if (u) set.add(u);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [logs]);

  const logsFiltrados = useMemo(() => {
    return (logs || []).filter(l => {
      if (filtroUsuario === 'TODOS') return true;
      return String(l?.usuario || '').trim() === filtroUsuario;
    });
  }, [logs, filtroUsuario]);

  const logsFiltradosPorData = useMemo(() => {
    if (!dataInicial && !dataFinal) return logsFiltrados;
    const inicio = dataInicial ? new Date(`${dataInicial}T00:00:00`) : null;
    const fim = dataFinal ? new Date(`${dataFinal}T23:59:59.999`) : null;
    const range = (inicio && fim && inicio > fim) ? { inicio: fim, fim: inicio } : { inicio, fim };
    return (logsFiltrados || []).filter(l => {
      const dt = l?.timestamp ? new Date(Number(l.timestamp)) : new Date(l?.data);
      if (!(dt instanceof Date) || Number.isNaN(dt.getTime())) return false;
      if (range.inicio && dt < range.inicio) return false;
      if (range.fim && dt > range.fim) return false;
      return true;
    });
  }, [logsFiltrados, dataInicial, dataFinal]);

  const listaExibida = useMemo(() => {
    return abaAtiva === 'VENDAS' ? vendasFiltradas : logsFiltradosPorData;
  }, [abaAtiva, vendasFiltradas, logsFiltradosPorData]);

  const totalPages = Math.ceil(listaExibida.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return listaExibida.slice(indexOfFirstItem, indexOfLastItem);
  }, [listaExibida, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [busca, filtroTipo, filtroUsuario, periodoSistema, dataInicial, dataFinal, abaAtiva]);

  // --- AÇÕES ---
  const handleEstorno = async (venda) => {
    if (!isAdmin) {
      await showAlert("Apenas contas com privilégio de gerência podem realizar o estorno financeiro de vendas.", "error", "Acesso Negado");
      return;
    }
    
    const confirmar = await showConfirm(`ATENÇÃO: Deseja realmente estornar o registro de venda de <strong>${venda.modelo || venda.nome}</strong> efetuada para <strong>${venda.cliente}</strong>?<br/>A receita desta venda será deduzida do seu caixa.`, "Confirmar Estorno", "Confirmar", "#ff4d4d");
    if (confirmar) {
      const devolver = await showConfirm("Deseja DEVOLVER este item (Aparelho ou Peça) fisicamente para o estoque disponível?\n\nSe ele puder ser vendido novamente, clique em <strong>Devolver Produto</strong>.", "Retorno ao Estoque", "Devolver Produto", "#2196f3");
      const sucesso = await estornarVenda(venda.idVenda || venda.id, devolver);
      if (sucesso) await showAlert("A venda foi estornada com sucesso e o fluxo de caixa atualizado.", "success", "Estorno Concluído");
    }
  };

  const abrirRecibo = (venda) => {
    const totalNum = parseValue(venda.total ?? venda.precoVenda ?? venda.valorCobrado);
    let subtotalNum = parseValue(venda.subtotal ?? venda.subtotalBruto ?? venda.valorBruto ?? venda.precoSemDesconto);
    let descontoNum = parseValue(venda.desconto ?? venda.descontoValor);
    const descontoPercentualNum = Math.max(0, Math.min(100, Number(venda.descontoPercentual ?? venda.descontoPercentualNum ?? 0) || 0));

    const precoOriginalNum = parseValue(venda.precoOriginal ?? venda.precoTabela ?? venda.precoBase ?? venda.preco);
    if (!subtotalNum && precoOriginalNum > 0) {
      subtotalNum = precoOriginalNum;
    }
    if (!descontoNum && precoOriginalNum > 0 && precoOriginalNum > totalNum) {
      descontoNum = precoOriginalNum - totalNum;
    }

    if (!descontoNum && subtotalNum > 0 && subtotalNum > totalNum) {
      descontoNum = subtotalNum - totalNum;
    }

    if (!subtotalNum && descontoNum > 0) {
      subtotalNum = totalNum + descontoNum;
    }

    if ((!subtotalNum || !descontoNum) && descontoPercentualNum > 0 && totalNum > 0) {
      const fator = 1 - (descontoPercentualNum / 100);
      if (fator > 0) {
        if (!subtotalNum) subtotalNum = totalNum / fator;
        if (!descontoNum) descontoNum = Math.max(0, subtotalNum - totalNum);
      }
    }

    const carrinho = Array.isArray(venda.carrinho) && venda.carrinho.length > 0
      ? venda.carrinho.map(item => ({
          ...item,
          preco: parseValue(item.preco)
        }))
      : [{
          nome: venda.modelo || venda.nome,
          quantidade: 1,
          preco: subtotalNum > 0 ? subtotalNum : totalNum,
          imei: venda.imei || 'N/A'
        }];

    const dadosRecibo = {
      id: (venda.idVenda || venda.id || Date.now()).toString().slice(-6),
      data: new Date(venda.dataVenda).toLocaleDateString('pt-BR'),
      cliente: { nome: venda.cliente || 'Consumidor', cpf: venda.cpf || '-', telefone: venda.telefone || '-' },
      carrinho,
      subtotal: subtotalNum,
      desconto: descontoNum,
      total: totalNum,
      formaPagamento: venda.formaPagamento
    };
    setReciboAtivo(dadosRecibo);
  };

  if (reciboAtivo) {
    return <NotaVenda venda={reciboAtivo} onVoltar={() => setReciboAtivo(null)} />;
  }

  return (
    <PageContainer>
      <Header>
        <div>
          <Title>Histórico de Operações</Title>
          <Subtitle>Acompanhe vendas, gere segundas vias e gerencie estornos.</Subtitle>
        </div>
        <div style={{display: 'flex', gap: '10px'}}>
          <ActionButton danger={abaAtiva !== 'VENDAS'} onClick={() => setAbaAtiva('VENDAS')} style={abaAtiva === 'VENDAS' ? {borderColor:'#ffffff', background: 'transparent', color: '#ffffff'} : {borderColor:'#333', color:'#888'}}>Vendas</ActionButton>
          <ActionButton danger={abaAtiva !== 'SISTEMA'} onClick={() => setAbaAtiva('SISTEMA')} style={abaAtiva === 'SISTEMA' ? {borderColor:'#ffffff', background: 'transparent', color: '#ffffff'} : {borderColor:'#333', color:'#888'}}>Logs de Sistema</ActionButton>
        </div>
      </Header>

      {abaAtiva === 'VENDAS' ? (
        <>
          <TopBar>
            <SearchInput 
              placeholder="Buscar por cliente, modelo ou IMEI..." 
              value={busca} onChange={(e) => setBusca(e.target.value)} 
            />
            <SelectFilter value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
              <option value="TODOS">Todas as Categorias</option>
              <option value="IPHONE">Apenas iPhones</option>
              <option value="ACESSORIO">Apenas Acessórios</option>
              <option value="SERVICO">Apenas Assistência</option>
            </SelectFilter>
          </TopBar>

          <TableContainer>
            <Table>
              <thead>
                <tr>
                  <Th>Data</Th>
                  <Th>Cliente</Th>
                  <Th>Produto / Serviço</Th>
                  <Th>Categoria</Th>
                  <Th>Valor Pago</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? currentItems.map(v => (
                  <tr key={v.idVenda || v.id}>
                    <Td>{new Date(v.dataVenda).toLocaleDateString('pt-BR')}</Td>
                    <Td><strong style={{color:'#fff'}}>{v.cliente}</strong></Td>
                    <Td>
                      {v.modelo || v.nome}
                      {v.imei && v.imei !== 'N/A' && <div style={{fontSize:'11px', color:'#666', marginTop:'4px'}}>IMEI: {v.imei}</div>}
                    </Td>
                    <Td>
                      <Badge tipo={v.tipo || v.tipoOriginal}>{(v.tipo || v.tipoOriginal) || 'OUTRO'}</Badge>
                      {isAdmin && parseValue(v.precoCusto || v.custo || v.custoNum) > 0 && (
                        <div style={{fontSize:'11px', color:'#666', marginTop:'4px'}}>
                          Custo: {parseValue(v.precoCusto || v.custo || v.custoNum).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                        </div>
                      )}
                    </Td>
                    <Td style={{color: '#4caf50', fontWeight: 'bold'}}>
                      {parseValue(v.precoVenda || v.valorCobrado).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                    </Td>
                    <Td>
                      <ActionButton onClick={() => abrirRecibo(v)}>🖨️ Recibo</ActionButton>
                      {isAdmin && (
                        <ActionButton danger onClick={() => handleEstorno(v)}>Estornar</ActionButton>
                      )}
                    </Td>
                  </tr>
                )) : (
                  <tr><Td colSpan="6" style={{textAlign:'center', padding:'40px', color:'#666'}}>Nenhuma venda encontrada com estes filtros.</Td></tr>
                )}
              </tbody>
            </Table>
          </TableContainer>
        </>
      ) : (
        /* ABA DE LOGS DE SISTEMA (Auditoria) */
        <>
          <TopBar>
            <SelectFilter value={filtroUsuario} onChange={(e) => setFiltroUsuario(e.target.value)}>
              <option value="TODOS">Todos os Usuários</option>
              {usuariosDisponiveis.map(u => <option key={u} value={u}>{u}</option>)}
            </SelectFilter>
            <SelectFilter value={periodoSistema} onChange={(e) => {
              const p = e.target.value;
              setPeriodoSistema(p);
              if (p === 'TUDO') {
                setDataInicial('');
                setDataFinal('');
                return;
              }
              const now = new Date();
              const yyyy = now.getFullYear();
              const mm = String(now.getMonth() + 1).padStart(2, '0');
              const dd = String(now.getDate()).padStart(2, '0');
              const hoje = `${yyyy}-${mm}-${dd}`;
              if (p === 'PERSONALIZADO') {
                return;
              }
              if (p === 'HOJE') {
                setDataInicial(hoje);
                setDataFinal(hoje);
                return;
              }
              if (p === 'ONTEM') {
                const ontemDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
                const o = `${ontemDate.getFullYear()}-${String(ontemDate.getMonth() + 1).padStart(2, '0')}-${String(ontemDate.getDate()).padStart(2, '0')}`;
                setDataInicial(o);
                setDataFinal(o);
                return;
              }
              if (p === '7DIAS') {
                const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
                const s = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
                setDataInicial(s);
                setDataFinal(hoje);
                return;
              }
              if (p === 'MES') {
                const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                const s = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
                setDataInicial(s);
                setDataFinal(hoje);
              }
            }}>
              <option value="TUDO">Todo Período</option>
              <option value="HOJE">Hoje</option>
              <option value="ONTEM">Ontem</option>
              <option value="7DIAS">7 Dias</option>
              <option value="MES">Este Mês</option>
              <option value="PERSONALIZADO">Personalizado</option>
            </SelectFilter>
            <input
              type="date"
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
              disabled={periodoSistema !== 'PERSONALIZADO' && periodoSistema !== 'TUDO'}
              style={{ padding: '12px 20px', background: '#121212', border: '1px solid #333', borderRadius: '8px', color: '#fff', outline: 'none' }}
            />
            <input
              type="date"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
              disabled={periodoSistema !== 'PERSONALIZADO' && periodoSistema !== 'TUDO'}
              style={{ padding: '12px 20px', background: '#121212', border: '1px solid #333', borderRadius: '8px', color: '#fff', outline: 'none' }}
            />
            <FilterButton onClick={() => {
              setFiltroUsuario('TODOS');
              setPeriodoSistema('TUDO');
              setDataInicial('');
              setDataFinal('');
            }}>
              Limpar
            </FilterButton>
          </TopBar>
          <TableContainer>
            <Table>
              <thead>
                <tr>
                  <Th style={{width: '200px'}}>Data / Hora</Th>
                  <Th style={{width: '160px'}}>Usuário</Th>
                  <Th>Registro de Atividade</Th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((log, idx) => (
                  <tr key={log.id || idx}>
                    <Td style={{fontSize: '12px', color: '#888'}}>{log.data}</Td>
                    <Td style={{fontSize: '12px', color: '#888'}}>{log.usuario || '-'}</Td>
                    <Td style={{color: '#ccc'}}>{log.mensagem}</Td>
                  </tr>
                ))}
                {currentItems.length === 0 && (
                  <tr><Td colSpan="3" style={{textAlign:'center', padding:'40px', color:'#666'}}>Nenhum log encontrado.</Td></tr>
                )}
              </tbody>
            </Table>
          </TableContainer>
        </>
      )}

      {totalPages > 1 && (
        <PaginationContainer>
          <PageButton 
            disabled={currentPage === 1} 
            onClick={() => handlePageChange(currentPage - 1)}
          >
            ANTERIOR
          </PageButton>
          <PageInfo>Página {currentPage} de {totalPages}</PageInfo>
          <PageButton 
            disabled={currentPage === totalPages} 
            onClick={() => handlePageChange(currentPage + 1)}
          >
            PRÓXIMA
          </PageButton>
        </PaginationContainer>
      )}
    </PageContainer>
  );
};

export default Historico;
