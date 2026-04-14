import React, { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { useEstoque } from '../contexts/EstoqueContext';
import { useDialog } from '../contexts/DialogContext';

// --- FUNÇÕES AUXILIARES ---
const parseDigitsToCents = (v) => Number(String(v).replace(/\D/g, "")) || 0;
const parseMoneyToReais = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const raw = String(value).trim();
  if (!raw) return 0;

  if (raw.includes('R$') || raw.includes(',')) {
    const normalized = raw.replace(/[R$\s.]/g, "").replace(",", ".");
    return Number(normalized) || 0;
  }

  if (/^\d+(\.\d+)?$/.test(raw)) {
    return Number(raw) || 0;
  }

  const digits = raw.replace(/\D/g, "");
  if (!digits) return 0;
  return (Number(digits) || 0) / 100;
};
const formatMoney = (v) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
}).format(parseDigitsToCents(v) / 100);

// --- ESTILOS PREMIUM ---
const PageContainer = styled.div`padding: 40px; color: #fff; background-color: #0d0d0d; min-height: 100vh; @media (max-width: 768px) { padding: 16px; } @media print { background: #fff; color: #000; padding: 0; }`;
const Header = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; @media print { display: none; }`;
const Title = styled.h1`font-weight: 300; color: #ffffff; letter-spacing: 2px; text-transform: uppercase;`;

const SummaryBar = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px;`;
const Card = styled.div`
  background: #121212; border: 1px solid #222; padding: 25px; border-radius: 12px; 
  border-left: 4px solid ${props => props.c || '#ffffff'};
  h3 { font-size: 22px; margin-top: 8px; color: #fff; } 
  small { color: #888; text-transform: uppercase; font-size: 10px; font-weight: bold; letter-spacing: 1px; }
  @media print { border: 1px solid #000; color: #000; h3 { color: #000; } }
`;

const AgingBadge = styled.span`
  padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: bold; text-transform: uppercase;
  background: ${props => props.status === 'critico' ? '#ff4d4d22' : props.status === 'atencao' ? '#ffc10722' : '#4caf5022'};
  color: ${props => props.status === 'critico' ? '#ff4d4d' : props.status === 'atencao' ? '#ffc107' : '#4caf50'};
  border: 1px solid ${props => props.status === 'critico' ? '#ff4d4d44' : props.status === 'atencao' ? '#ffc10744' : '#4caf5044'};
`;

const ToolBar = styled.div`display: flex; gap: 15px; margin-bottom: 30px; flex-wrap: wrap; @media print { display: none; }`;
const InputUI = styled.input`flex: 1; padding: 12px 20px; background: #121212; border: 1px solid #333; color: #fff; border-radius: 8px; outline: none; &:focus { border-color: #ffffff; } transition: 0.3s;`;
const SelectUI = styled.select`padding: 12px; background: #121212; border: 1px solid #333; color: #fff; border-radius: 8px; cursor: pointer; outline: none; &:focus { border-color: #ffffff; }`;

const TableContainer = styled.div`background: #121212; border-radius: 15px; padding: 10px; border: 1px solid #222; @media (max-width: 768px) { overflow-x: auto; }`;
const Table = styled.table`width: 100%; border-collapse: collapse; text-align: left;`;
const Th = styled.th`padding: 18px; border-bottom: 1px solid #222; color: #ffffff; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;`;
const Td = styled.td`padding: 18px; border-bottom: 1px solid #1a1a1a; font-size: 14px; color: #eee;`;

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

const ActionBtn = styled.button`
  background: ${props => props.c === '#ffffff' ? '#ffffff' : 'transparent'}; 
  border: 1px solid ${props => props.c || '#333'}; 
  color: ${props => props.c === '#ffffff' ? '#000' : (props.c || '#fff')}; 
  padding: 8px 15px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; transition: 0.2s;
  &:hover { opacity: 0.8; transform: translateY(-1px); }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`;

const MarginPreview = styled.div`background: rgba(255,255,255,0.08); border: 1px solid #ffffff44; border-radius: 10px; padding: 15px; margin-bottom: 25px; text-align: center; color: #888; span { font-weight: bold; color: #4caf50; font-size: 20px; }`;

const FormGroup = styled.div`margin-bottom: 20px; display: flex; flex-direction: column;`;
const Label = styled.label`font-size: 10px; color: #ffffff; text-transform: uppercase; margin-bottom: 8px; font-weight: bold; letter-spacing: 1px;`;

const ModalOverlay = styled.div`position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 10px;`;
const ModalBox = styled.div`background: #151515; padding: 40px; border-radius: 20px; width: 580px; max-width: 100%; border: 1px solid #333; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,0.5); @media (max-width: 768px) { padding: 16px; width: 100%; }`;

const ImageOverlay = styled.div`position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 3000;`;
const ImageBox = styled.div`background: #111; border: 1px solid #333; border-radius: 16px; width: min(980px, 92vw); height: min(760px, 88vh); display: flex; flex-direction: column; overflow: hidden;`;
const ImageToolbar = styled.div`display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #222; background: rgba(0,0,0,0.35);`;
const ImageStage = styled.div`flex: 1; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #0a0a0a;`;

const GRADE_PRECOS = {
  'IPHONE 15 PRO MAX': { '256GB': '750000', '512GB': '850000', '1TB': '980000' },
  'IPHONE 15 PRO': { '128GB': '620000', '256GB': '690000', '512GB': '790000' },
  'IPHONE 15': { '128GB': '480000', '256GB': '550000' }
};

const Estoque = () => {
  const { produtos, adicionarProduto, removerProduto, editarProduto, isAdmin } = useEstoque();
  const { showConfirm } = useDialog();

  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [fStatus, setFStatus] = useState('Todos');
  const [fLucro, setFLucro] = useState('Todos');
  const [order, setOrder] = useState('recente');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [imageZoom, setImageZoom] = useState(1);
  
  const [form, setForm] = useState({ 
    modelo: '', imei: '', capacidade: '', cor: '', estado: 'Novo', 
    bateria: '', garantia: '', origem: 'Anatel', fornecedor: '', precoCusto: '', preco: '', imagem: '' 
  });

  useEffect(() => {
    if (!editId && form.modelo && form.capacidade) {
      const sugerido = GRADE_PRECOS[form.modelo]?.[form.capacidade];
      if (sugerido) setForm(prev => ({ ...prev, preco: formatMoney(sugerido) }));
    }
  }, [form.modelo, form.capacidade, editId]);

  const handleImageUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, imagem: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const openImageViewer = (img) => {
    if (!img) return;
    setImageZoom(1);
    setFullscreenImage(img);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let val = value;
    if (name === 'imei') val = value.replace(/\D/g, '').slice(0, 15);
    if (name === 'bateria') val = Math.min(100, value.replace(/\D/g, ''));
    if (['modelo', 'cor', 'fornecedor'].includes(name)) val = value.toUpperCase();
    if (['preco', 'precoCusto'].includes(name)) val = formatMoney(value);
    setForm({ ...form, [name]: val });
  };

  const imeiDuplicado = useMemo(() => {
    if (!form.imei || editId) return false;
    return produtos.some(p => p.imei?.trim() === form.imei.trim());
  }, [form.imei, produtos, editId]);

  const currentMargin = useMemo(() => {
    const v = parseMoneyToReais(form.preco);
    const c = parseMoneyToReais(form.precoCusto);
    return c > 0 ? (((v - c) / c) * 100).toFixed(1) : 0;
  }, [form.preco, form.precoCusto]);

  const listaExibida = useMemo(() => {
    return [...produtos]
      .filter(p => p.modelo.toLowerCase().includes(search.toLowerCase()) || p.imei.includes(search))
      .filter(p => fStatus === 'Todos' || p.estado === fStatus)
      .filter(p => {
        if (!isAdmin) return true;
        const lucroR = parseMoneyToReais(p.preco || p.precoVenda) - parseMoneyToReais(p.precoCusto);
        const custo = parseMoneyToReais(p.precoCusto);
        const margemP = custo > 0 ? (lucroR / custo) * 100 : 0;
        if (fLucro === 'alta') return lucroR >= 500;
        if (fLucro === 'baixa_margem') return margemP < 10;
        return true;
      })
      .sort((a, b) => {
        if (order === 'preco') return parseMoneyToReais(b.preco || b.precoVenda) - parseMoneyToReais(a.preco || a.precoVenda);
        if (order === 'parados') return new Date(a.dataEntrada) - new Date(b.dataEntrada);
        return new Date(b.id || 0) - new Date(a.id || 0);
      });
  }, [produtos, search, fStatus, fLucro, order, isAdmin]);

  const totalPages = Math.ceil(listaExibida.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return listaExibida.slice(indexOfFirstItem, indexOfLastItem);
  }, [listaExibida, currentPage, itemsPerPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, fStatus, fLucro, order]);

  const stats = useMemo(() => {
    const totalVenda = listaExibida.reduce((acc, p) => acc + parseMoneyToReais(p.preco || p.precoVenda), 0);
    const totalCusto = listaExibida.reduce((acc, p) => acc + parseMoneyToReais(p.precoCusto), 0);
    return { 
      invest: totalCusto, 
      lucro: (totalVenda - totalCusto), 
      mMedia: totalCusto > 0 ? (((totalVenda - totalCusto) / totalCusto) * 100).toFixed(1) : 0 
    };
  }, [listaExibida]);

  const exportarCsv = () => {
    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const headers = ['Estoque', 'Unidades', 'Investimento', 'Lucro Projetado', 'Margem Média'];
    const row = [
      'iPhones',
      listaExibida.length,
      stats.invest.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      stats.lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      `${stats.mMedia}%`
    ];
    const csv = `${headers.map(escape).join(';')}\n${row.map(escape).join(';')}\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `estoque_iphones_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const salvar = () => {
    const payload = { ...form, estado: form.estado || 'Novo', dataEntrada: editId ? form.dataEntrada : new Date().toISOString() };
    if(editId ? editarProduto(editId, payload) : adicionarProduto(payload)) setModal(false);
  };

  return (
    <PageContainer>
      <Header>
        <Title>Estoque Elite GD CELL STORE</Title>
        <div>
            {isAdmin && (
              <>
                <ActionBtn onClick={() => {
                    exportarCsv();
                }}>Exportar</ActionBtn>
              </>
            )}
            <ActionBtn c="#ffffff" onClick={() => { setEditId(null); setForm({ modelo: '', imei: '', capacidade: '', cor: '', estado: 'Novo', bateria: '', garantia: '', origem: 'Anatel', fornecedor: '', precoCusto: '', preco: '', imagem: '' }); setModal(true); }}>+ NOVO ITEM</ActionBtn>
        </div>
      </Header>

      <SummaryBar>
        <Card><small>Unidades</small><h3>{listaExibida.length}</h3></Card>
        {isAdmin && (
          <>
            <Card><small>Investimento</small><h3>{stats.invest.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></Card>
            <Card c="#4caf50"><small>Lucro Projetado</small><h3>{stats.lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></Card>
            <Card c="#2196f3"><small>Margem Média</small><h3>{stats.mMedia}%</h3></Card>
          </>
        )}
      </SummaryBar>

      <ToolBar>
        <InputUI placeholder="Buscar Modelo ou IMEI..." value={search} onChange={e => setSearch(e.target.value)} />
        {isAdmin && (
          <SelectUI value={fLucro} onChange={e => setFLucro(e.target.value)}>
            <option value="Todos">Filtro Financeiro</option>
            <option value="alta">💎 Lucro Alta (+R$500)</option>
            <option value="baixa_margem">⚠️ Margem Alerta (-10%)</option>
          </SelectUI>
        )}
        <SelectUI value={fStatus} onChange={e => setFStatus(e.target.value)}>
          <option value="Todos">Condição</option>
          <option value="Novo">Novo</option><option value="Seminovo">Semi novo</option>
        </SelectUI>
        <SelectUI value={order} onChange={e => setOrder(e.target.value)}>
          <option value="recente">Mais Recentes</option><option value="parados">Mais Antigos</option><option value="preco">Valor (Maior)</option>
        </SelectUI>
      </ToolBar>

      <TableContainer>
        <Table>
          <thead>
            <tr>
              <Th style={{width: '70px'}}>Img</Th><Th>Aparelho</Th><Th>Giro (Aging)</Th><Th>IMEI</Th><Th>Preço Venda</Th>
              {isAdmin && <Th>Lucro Estimado</Th>}<Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(p => {
              const aging = Math.floor((new Date() - new Date(p.dataEntrada || p.id)) / 86400000);
              const lucroR = parseMoneyToReais(p.preco || p.precoVenda) - parseMoneyToReais(p.precoCusto);
              return (
                <tr key={p.id}>
                  <Td>
                    {p.imagem ? (
                      <img
                        src={p.imagem}
                        alt={p.modelo}
                        style={{width: '46px', height: '46px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #333', cursor: 'pointer'}}
                        onClick={() => openImageViewer(p.imagem)}
                      />
                    ) : (
                      <div style={{width: '46px', height: '46px', borderRadius: '10px', background: '#0a0a0a', border: '1px solid #333'}} />
                    )}
                  </Td>
                  <Td><strong>{p.modelo}</strong><br/><small style={{color:'#666'}}>{p.capacidade} · {p.cor}</small></Td>
                  <Td><AgingBadge status={aging > 30 ? 'critico' : aging > 15 ? 'atencao' : 'giro'}>{aging} Dias</AgingBadge></Td>
                  <Td style={{fontFamily:'monospace', color: '#888'}}>{p.imei}</Td>
                  <Td style={{fontWeight:'bold', color: '#ffffff'}}>{p.preco || p.precoVenda || 'R$ 0,00'}</Td>
                  {isAdmin && <Td style={{color: lucroR >= 500 ? '#4caf50' : '#fff', fontWeight:'bold'}}>{lucroR.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>}
                  <Td>
                    <ActionBtn onClick={() => { setEditId(p.id); setForm(p); setModal(true); }}>Editar</ActionBtn>
                    <ActionBtn c="#ff4d4d" onClick={async () => { 
                      if (await showConfirm(`Remover o ${p.modelo} permanentemente do estoque?`, 'Excluir Produto', 'Remover', '#ff4d4d')) {
                        removerProduto(p.id);
                      }
                    }}>X</ActionBtn>
                  </Td>
                </tr>
              )
            })}
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

      {modal && (
        <ModalOverlay>
          <ModalBox>
            {isAdmin && <MarginPreview>Lucro da Operação: <span>{currentMargin}%</span></MarginPreview>}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
              <FormGroup><Label>Modelo</Label><InputUI name="modelo" placeholder="Ex: IPHONE 15 PRO" value={form.modelo} onChange={handleInputChange}/></FormGroup>
              <FormGroup>
                <Label>IMEI</Label>
                <InputUI name="imei" placeholder="15 dígitos" value={form.imei} onChange={handleInputChange} style={{borderColor: imeiDuplicado ? '#ff4d4d' : '#333'}}/>
                {imeiDuplicado && <small style={{color:'#ff4d4d', marginTop:'5px'}}>IMEI já cadastrado!</small>}
              </FormGroup>
            </div>
            
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px'}}>
              <FormGroup>
                <Label>Capacidade</Label>
                <SelectUI name="capacidade" value={form.capacidade} onChange={handleInputChange}>
                  <option value="">GIGAS</option><option value="128GB">128GB</option><option value="256GB">256GB</option><option value="512GB">512GB</option><option value="1TB">1TB</option>
                </SelectUI>
              </FormGroup>
              <FormGroup><Label>Cor</Label><InputUI name="cor" placeholder="TITÂNIO" value={form.cor} onChange={handleInputChange}/></FormGroup>
              <FormGroup><Label>Bateria</Label><InputUI name="bateria" placeholder="100" value={form.bateria} onChange={handleInputChange}/></FormGroup>
            </div>

            <FormGroup>
              <Label>Condição</Label>
              <SelectUI name="estado" value={form.estado || 'Novo'} onChange={handleInputChange}>
                <option value="Novo">Novo</option>
                <option value="Seminovo">Semi novo</option>
              </SelectUI>
            </FormGroup>

            <FormGroup><Label>Fornecedor</Label><InputUI name="fornecedor" placeholder="Ex: USA IMPORT" value={form.fornecedor} onChange={handleInputChange}/></FormGroup>

            <FormGroup>
              <Label>Foto do iPhone (Opcional)</Label>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                {form.imagem ? (
                  <img src={form.imagem} alt="preview" style={{width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #333'}} />
                ) : (
                  <div style={{width: '64px', height: '64px', borderRadius: '10px', background: '#0a0a0a', border: '1px solid #333'}} />
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{color: '#aaa'}} />
              </div>
            </FormGroup>
            
            <div style={{display:'grid', gridTemplateColumns: isAdmin ? '1fr 1fr' : '1fr', gap:'20px'}}>
              {isAdmin && <FormGroup><Label>Preço de Custo</Label><InputUI name="precoCusto" placeholder="R$ 0,00" value={form.precoCusto} onChange={handleInputChange}/></FormGroup>}
              <FormGroup><Label>Preço de Venda</Label><InputUI name="preco" placeholder="R$ 0,00" value={form.preco} onChange={handleInputChange} style={{borderColor:'#ffffff'}}/></FormGroup>
            </div>

            <ActionBtn c="#ffffff" onClick={salvar} disabled={imeiDuplicado || !form.modelo} style={{width:'100%', padding:'15px', marginTop:'15px'}}>SALVAR DISPOSITIVO</ActionBtn>
            <ActionBtn onClick={() => setModal(false)} style={{width:'100%', border:'none', color:'#666', marginTop:'10px'}}>CANCELAR</ActionBtn>
          </ModalBox>
        </ModalOverlay>
      )}

      {fullscreenImage && (
        <ImageOverlay onClick={() => setFullscreenImage(null)}>
          <ImageBox onClick={(e) => e.stopPropagation()}>
            <ImageToolbar>
              <div style={{display: 'flex', gap: '10px'}}>
                <ActionBtn onClick={() => setImageZoom(z => Math.max(0.8, Number((z - 0.2).toFixed(2))))}>Zoom -</ActionBtn>
                <ActionBtn onClick={() => setImageZoom(z => Math.min(5, Number((z + 0.2).toFixed(2))))}>Zoom +</ActionBtn>
                <ActionBtn onClick={() => setImageZoom(1)}>Reset</ActionBtn>
              </div>
              <ActionBtn c="#ff4d4d" onClick={() => setFullscreenImage(null)}>Fechar</ActionBtn>
            </ImageToolbar>
            <ImageStage>
              <img
                src={fullscreenImage}
                alt="iPhone"
                style={{
                  transform: `scale(${imageZoom})`,
                  transition: 'transform 0.2s',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
            </ImageStage>
          </ImageBox>
        </ImageOverlay>
      )}
    </PageContainer>
  );
};

export default Estoque;
