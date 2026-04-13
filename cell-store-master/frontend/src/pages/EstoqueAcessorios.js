import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { useEstoque } from '../contexts/EstoqueContext';
import { useDialog } from '../contexts/DialogContext';

// --- FUNÇÕES DE FORMATAÇÃO ---
const parseNum = (v) => Number(String(v).replace(/\D/g, "")) || 0;
const formatMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseNum(v) / 100);
const toReais = (v) => {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  const s = String(v).trim();
  if (!s) return 0;
  if (s.includes('R$') || s.includes(',')) {
    const clean = s.replace(/[R$\s.]/g, "").replace(",", ".");
    return Number(clean) || 0;
  }
  if (/^\d+(\.\d+)?$/.test(s)) return Number(s) || 0;
  const digits = s.replace(/\D/g, "");
  if (!digits) return 0;
  if (digits.length >= 3) return (Number(digits) || 0) / 100;
  return Number(digits) || 0;
};

// --- ESTILOS ---
const PageContainer = styled.div`padding: 40px; color: #fff; @media (max-width: 768px) { padding: 16px; }`;
const Header = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; gap: 12px; flex-wrap: wrap; button { white-space: nowrap; } @media (max-width: 768px) { margin-bottom: 20px; button { width: 100%; } }`;
const Title = styled.h1`font-weight: 300; color: #ffffff; letter-spacing: 1px; margin: 0;`;

const SummaryBar = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;`;
const StatCard = styled.div`background: #121212; border: 1px solid #222; padding: 15px; border-radius: 10px; border-left: 3px solid ${props => props.c || '#ffffff'}; h3 { font-size: 20px; margin-top: 5px; } small { color: #888; text-transform: uppercase; font-size: 10px; }`;

const ToolBar = styled.div`margin-bottom: 25px; display: flex; gap: 15px; flex-wrap: wrap;`;
const SearchInput = styled.input`flex: 1; padding: 12px; background: #121212; border: 1px solid #333; color: #fff; border-radius: 8px; outline: none; &:focus { border-color: #ffffff; }`;

const TableContainer = styled.div`background: #121212; border-radius: 12px; border: 1px solid #222; overflow: hidden; @media (max-width: 768px) { overflow-x: auto; }`;
const Table = styled.table`width: 100%; border-collapse: collapse; text-align: left;`;
const Th = styled.th`padding: 15px; background: #1a1a1a; color: #888; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #333;`;
const Td = styled.td`padding: 15px; border-bottom: 1px solid #222; font-size: 13px;`;

const EstoqueBadge = styled.span`
  padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;
  background: ${props => props.qtd <= props.min ? 'rgba(255, 77, 77, 0.1)' : 'rgba(76, 175, 80, 0.1)'};
  color: ${props => props.qtd <= props.min ? '#ff4d4d' : '#4caf50'};
  border: 1px solid ${props => props.qtd <= props.min ? '#ff4d4d33' : '#4caf5033'};
`;

const ActionBtn = styled.button`background: transparent; border: 1px solid #333; color: ${props => props.c || '#fff'}; padding: 5px 10px; border-radius: 4px; font-size: 10px; cursor: pointer; margin-right: 5px;`;

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

const ModalOverlay = styled.div`position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 10px;`;
const ModalBox = styled.div`background: #151515; padding: 30px; border-radius: 12px; width: 100%; max-width: 500px; border: 1px solid #333; @media (max-width: 768px) { padding: 16px; }`;

const FormGroup = styled.div`margin-bottom: 15px; display: flex; flex-direction: column; text-align: left;`;
const Label = styled.label`font-size: 11px; color: #ffffff; text-transform: uppercase; margin-bottom: 6px; font-weight: bold; letter-spacing: 0.5px;`;
const Input = styled.input`width: 100%; padding: 12px; background: #0a0a0a; border: 1px solid #333; border-radius: 6px; color: #fff; outline: none; &:focus { border-color: #ffffff; }`;
const Select = styled.select`width: 100%; padding: 12px; background: #0a0a0a; border: 1px solid #333; border-radius: 6px; color: #fff; outline: none;`;

const EstoqueAcessorios = () => {
  const { acessorios, vendas, adicionarAcessorio, editarAcessorio, removerAcessorio, isAdmin } = useEstoque();
  const { showAlert, showConfirm } = useDialog();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [form, setForm] = useState({ nome: '', categoria: 'Capinha', precoCusto: '', precoVenda: '', quantidade: 1, estoqueMinimo: 2 });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let val = value;
    if (['precoCusto', 'precoVenda'].includes(name)) val = formatMoney(value);
    if (name === 'nome') val = value.toUpperCase();
    setForm({ ...form, [name]: val });
  };

  const handleSalvar = async () => {
    if (!form.nome || !form.precoVenda) {
      await showAlert("Por favor, preencha o Nome e o Preço de Venda do produto.", "error", "Campos Obrigatórios");
      return;
    }
    
    const itemFinal = { ...form };
    if (!isAdmin && editId) {
      const original = acessorios.find(a => a.id === editId);
      itemFinal.precoCusto = original.precoCusto; 
    }

    if (editId) {
      await editarAcessorio(editId, itemFinal);
      setEditId(null);
    } else {
      await adicionarAcessorio(itemFinal);
    }
    setForm({ nome: '', categoria: 'Capinha', precoCusto: '', precoVenda: '', quantidade: 1, estoqueMinimo: 2 });
    setIsModalOpen(false);
  };

  const excluir = async (id) => {
    if (await showConfirm("Excluir este item permanentemente do sistema?", "Remover Acessório", "Apagar Item", "#ff4d4d")) {
      removerAcessorio(id);
    }
  };

  const listaFiltrada = useMemo(() => {
    return acessorios.filter(a => a.nome.toUpperCase().includes(search.toUpperCase()));
  }, [acessorios, search]);

  const totalPages = Math.ceil(listaFiltrada.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return listaFiltrada.slice(indexOfFirstItem, indexOfLastItem);
  }, [listaFiltrada, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const stats = useMemo(() => {
    let totalItens = 0, valorInvestido = 0, alertas = 0;
    acessorios.forEach(a => {
      totalItens += Number(a.quantidade);
      const custo = parseNum(a.precoCusto || a.custo) / 100;
      valorInvestido += custo * Number(a.quantidade);
      if (Number(a.quantidade) <= Number(a.estoqueMinimo)) alertas++;
    });
    return { totalItens, valorInvestido, alertas };
  }, [acessorios]);

  const valorLiquidoPorUnidade = useMemo(() => {
    const lista = Array.isArray(vendas) ? vendas : [];
    const vendasAcessorios = lista.filter(v => String(v?.tipo || v?.tipoOriginal || '').toUpperCase() === 'ACESSORIO');
    const totalUn = vendasAcessorios.reduce((acc, v) => acc + (Number(v?.quantidade) || 1), 0);
    const totalValor = vendasAcessorios.reduce((acc, v) => acc + toReais(v?.precoVenda ?? v?.valorCobrado ?? v?.preco ?? 0), 0);
    const media = totalUn > 0 ? (totalValor / totalUn) : 0;
    return { totalUn, totalValor, media };
  }, [vendas]);

  return (
    <PageContainer>
      {/* ... (renderização mantida, atualizando referências de custo para precoCusto) ... */}
      <Header>
        <div>
          <Title>Estoque de Acessórios & Peças</Title>
          <p style={{color: '#888', fontSize: '14px', marginTop: '5px'}}>Controle de volume, giro rápido e margem.</p>
        </div>
        <button onClick={() => { setEditId(null); setForm({ nome: '', categoria: 'Capinha', precoCusto: '', precoVenda: '', quantidade: 1, estoqueMinimo: 2 }); setIsModalOpen(true); }} style={{background: '#ffffff', color: '#000', border:'none', padding:'12px 24px', borderRadius:'8px', fontWeight:'bold', cursor:'pointer'}}>+ Adicionar Item</button>
      </Header>

      <SummaryBar>
        <StatCard><small>Volume Físico (Itens)</small><h3>{stats.totalItens} un.</h3></StatCard>
        
        {isAdmin && (
          <StatCard c="#4caf50">
            <small>Custo do Estoque</small>
            <h3>R$ {stats.valorInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </StatCard>
        )}

        {isAdmin && (
          <StatCard c="#66b2ff">
            <small>Valor Líquido por Unidade</small>
            <h3>R$ {valorLiquidoPorUnidade.media.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            <small style={{ display: 'block', marginTop: '6px', color: '#666' }}>
              {valorLiquidoPorUnidade.totalUn > 0
                ? `${valorLiquidoPorUnidade.totalUn} un vendidas • R$ ${valorLiquidoPorUnidade.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} no total`
                : 'Sem vendas de acessórios registradas'}
            </small>
          </StatCard>
        )}
        
        <StatCard c="#ff4d4d"><small>Alertas de Reposição</small><h3 style={{color: stats.alertas > 0 ? '#ff4d4d' : '#fff'}}>{stats.alertas} Produtos</h3></StatCard>
      </SummaryBar>

      <ToolBar><SearchInput placeholder="Buscar por nome (Ex: Capa MagSafe)..." value={search} onChange={e => setSearch(e.target.value)} /></ToolBar>

      <TableContainer>
        <Table>
          <thead>
            <tr>
              <Th>Produto</Th>
              <Th>Categoria</Th>
              {isAdmin && <Th>Custo</Th>}
              <Th>Venda</Th>
              <Th>Em Estoque</Th>
              <Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? <tr><Td colSpan={isAdmin ? "6" : "5"} style={{textAlign:'center'}}>Nenhum acessório cadastrado.</Td></tr> : currentItems.map(item => (
              <tr key={item.id}>
                <Td><strong>{item.nome}</strong></Td>
                <Td style={{color: '#888'}}>{item.categoria}</Td>
                
                {isAdmin && <Td style={{color: '#ff4d4d'}}>{item.precoCusto || item.custo || 'R$ 0,00'}</Td>}
                
                <Td style={{color: '#4caf50', fontWeight: 'bold'}}>{item.precoVenda || item.preco}</Td>
                <Td><EstoqueBadge qtd={item.quantidade} min={item.estoqueMinimo}>{item.quantidade} un. {Number(item.quantidade) <= Number(item.estoqueMinimo) && '⚠️'}</EstoqueBadge></Td>
                <Td>
                  <ActionBtn c="#ffffff" onClick={() => { setForm({ ...item, precoCusto: item.precoCusto || item.custo, precoVenda: item.precoVenda || item.preco }); setEditId(item.id); setIsModalOpen(true); }}>Editar</ActionBtn>
                  {isAdmin && <ActionBtn c="#ff4d4d" onClick={() => excluir(item.id)}>X</ActionBtn>}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>

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

      {isModalOpen && (
        <ModalOverlay>
          <ModalBox>
            <h2 style={{color: '#ffffff', marginBottom: '20px', textAlign: 'center'}}>{editId ? 'EDITAR ITEM' : 'NOVO ACESSÓRIO'}</h2>
            
            <FormGroup>
              <Label>Descrição do Produto</Label>
              <Input name="nome" placeholder="Ex: CAPA MAGSAFE IPHONE 15" value={form.nome} onChange={handleInputChange} />
            </FormGroup>

            <FormGroup>
              <Label>Categoria</Label>
              <Select name="categoria" value={form.categoria} onChange={handleInputChange}>
                <option value="Capinha">Capinha</option>
                <option value="Película">Película</option>
                <option value="Cabo/Fonte">Cabo / Fonte</option>
                <option value="Peça de Reposição">Peça de Reposição (Tela/Bat)</option>
                <option value="Outros">Outros</option>
              </Select>
            </FormGroup>

            <div style={{display:'grid', gridTemplateColumns: isAdmin ? '1fr 1fr' : '1fr', gap:'15px'}}>
              {isAdmin && (
                <FormGroup>
                  <Label>Custo Unitário</Label>
                  <Input name="precoCusto" placeholder="R$ 0,00" value={form.precoCusto} onChange={handleInputChange} />
                </FormGroup>
              )}
              <FormGroup>
                <Label>Preço de Venda</Label>
                <Input name="precoVenda" placeholder="R$ 0,00" value={form.precoVenda} onChange={handleInputChange} />
              </FormGroup>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
              <FormGroup>
                <Label>Qtd em Estoque</Label>
                <Input name="quantidade" type="number" placeholder="Ex: 50" value={form.quantidade} onChange={handleInputChange} />
              </FormGroup>
              <FormGroup>
                <Label>Mínimo (Alerta)</Label>
                <Input name="estoqueMinimo" type="number" placeholder="Ex: 5" value={form.estoqueMinimo} onChange={handleInputChange} />
              </FormGroup>
            </div>

            <button onClick={handleSalvar} style={{width:'100%', padding:'15px', background:'#ffffff', border:'none', borderRadius:'6px', color: '#000', fontWeight:'bold', cursor:'pointer', marginTop:'10px'}}>Salvar no Estoque</button>
            <button onClick={() => setIsModalOpen(false)} style={{width:'100%', background:'transparent', border:'none', color:'#666', marginTop:'10px', cursor:'pointer'}}>Cancelar</button>
          </ModalBox>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default EstoqueAcessorios;
