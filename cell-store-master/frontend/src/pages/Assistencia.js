import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useEstoque } from '../contexts/EstoqueContext';
import { useDialog } from '../contexts/DialogContext';
import OrdemEntrada from './OrdemEntrada';
import TermoGarantiaFinal from './TermoGarantiaFinal';

// --- FUNÇÕES DE FORMATAÇÃO ---
const parseNum = (v) => Number(String(v).replace(/\D/g, '')) || 0;
const formatMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseNum(v) / 100);

// --- ESTILOS PREMIUM MR IMPORTS ---
const PageContainer = styled.div`padding: 40px; color: #fff; background-color: #0d0d0d; min-height: 100vh; @media (max-width: 768px) { padding: 16px; }`;
const Header = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; gap: 12px; flex-wrap: wrap; @media (max-width: 768px) { margin-bottom: 15px; }`;
const Title = styled.h1`font-weight: 300; color: #ffffff; letter-spacing: 1px;`;
const Subtitle = styled.p`color: #e0e0e0; margin-top: -25px; margin-bottom: 30px; font-size: 14px;`;

const SummaryBar = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;`;
const StatCard = styled.div`
  background: #121212; border: 1px solid #222; padding: 20px; border-radius: 12px;
  border-left: 4px solid ${props => props.c || '#ffffff'};
  h3 { font-size: 24px; margin-top: 5px; color: #fff; }
  small { color: #ccc; text-transform: uppercase; font-size: 10px; font-weight: bold; letter-spacing: 1px; }
`;

const ToolBar = styled.div`margin-bottom: 25px; display: flex; gap: 15px; flex-wrap: wrap;`;
const SearchInput = styled.input`
  flex: 1; padding: 12px 20px; background: #121212; border: 1px solid #333;
  color: #fff; border-radius: 8px; outline: none; transition: border-color 0.3s;
  &:focus { border-color: #ffffff; }
`;

const GridOS = styled.div`display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px;`;
const OSCard = styled.div`
  background: #121212; border: 1px solid #222; border-radius: 15px; padding: 25px; position: relative;
  border-top: 5px solid ${props => props.status === 'pronto' ? '#4caf50' : props.status === 'peca' ? '#ffc107' : '#ffffff'};
  transition: transform 0.2s; &:hover { transform: translateY(-5px); border-color: #444; }
`;

const FinanceBox = styled.div`background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 10px; margin-top: 15px;`;
const WarrantyBox = styled.div`
  margin-top: 10px; padding: 10px; border-radius: 8px; font-size: 11px; text-align: center; font-weight: bold;
  background: ${props => props.expirada ? 'rgba(255, 77, 77, 0.1)' : 'rgba(76, 175, 80, 0.1)'};
  border: 1px solid ${props => props.expirada ? '#ff4d4d33' : '#4caf5033'};
  color: ${props => props.expirada ? '#ff4d4d' : '#4caf50'};
`;

const ObsBadge = styled.span`
  background: rgba(255, 77, 77, 0.1); color: #ff4d4d; border: 1px solid rgba(255, 77, 77, 0.2);
  padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; margin-right: 6px; display: inline-block; margin-bottom: 6px;
`;

const ActionBtn = styled.button`
  background: transparent; border: 1px solid #333; color: ${props => props.c || '#fff'};
  padding: 10px 14px; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer;
  margin-top: 15px; margin-right: 8px; transition: all 0.2s;
  &:hover { background: ${props => props.c || '#fff'}; color: #000; border-color: transparent; }
`;

const VipTag = styled.span`
  background: linear-gradient(145deg, #ffffff, #f0f0f0); color: #000; padding: 2px 6px;
  border-radius: 4px; font-size: 9px; font-weight: bold; margin-left: 8px; vertical-align: middle;
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

const ModalOverlay = styled.div`position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.85); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 10px;`;
const ModalBox = styled.div`background: #151515; padding: 35px; border-radius: 15px; width: 100%; max-width: 650px; border: 1px solid #333; max-height: 90vh; overflow-y: auto; @media (max-width: 768px) { padding: 16px; }`;
const Input = styled.input`width: 100%; padding: 12px; background: #0a0a0a; border: 1px solid #333; border-radius: 8px; color: #fff; margin-bottom: 12px; outline: none; &:focus { border-color: #ffffff; }`;
const Label = styled.label`display: block; font-size: 11px; color: #ccc; text-transform: uppercase; margin-bottom: 6px; font-weight: bold; letter-spacing: 0.5px;`;

const Assistencia = () => {
  const { registrarServico, clientes, assistencias, salvarAssistencia, importarAssistencias, removerAssistencia, isAdmin } = useEstoque();
  const { showAlert, showConfirm } = useDialog();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [docParaImprimir, setDocParaImprimir] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [migracaoIniciada, setMigracaoIniciada] = useState(false);
  const [migracaoConcluida, setMigracaoConcluida] = useState(false);
  const itemsPerPage = 10;

  const [form, setForm] = useState({
    cliente: '', telefone: '', cpf: '', endereco: '', aparelho: '', imei: '', defeito: '', status: 'orcamento', preco: '', custoPeca: '', diasGarantia: '90',
    dataEntrada: new Date().toISOString().slice(0, 10), prazoEntrega: '', observacoes: '',
    checklist: { telaRiscada: false, carcacaAmassada: false, faceIdRuim: false, cameraMancha: false }
  });
  const ordensServico = assistencias;

  useEffect(() => {
    if (migracaoConcluida || migracaoIniciada) return;

    setMigracaoIniciada(true);
    const salvas = localStorage.getItem('@MRImports:assistencia');
    if (!salvas) {
      setMigracaoConcluida(true);
      return;
    }

    let antigas = [];
    try {
      antigas = JSON.parse(salvas);
    } catch (error) {
      console.error('Falha ao ler assistências legadas do navegador:', error);
      localStorage.removeItem('@MRImports:assistencia');
      setMigracaoConcluida(true);
      return;
    }

    if (!Array.isArray(antigas) || antigas.length === 0) {
      localStorage.removeItem('@MRImports:assistencia');
      setMigracaoConcluida(true);
      return;
    }

    let ativo = true;
    const migrar = async () => {
      try {
        await importarAssistencias(antigas);
        localStorage.removeItem('@MRImports:assistencia');
      } catch (error) {
        console.error('Falha ao migrar assistências legadas:', error);
      } finally {
        if (ativo) setMigracaoConcluida(true);
      }
    };

    migrar();
    return () => {
      ativo = false;
    };
  }, [importarAssistencias, migracaoConcluida, migracaoIniciada]);

  const normalizarCPF = (v) => String(v || '').replace(/\D/g, '').slice(0, 11);

  const mascaraTelefone = (v) => {
    v = v.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
    v = v.replace(/(\d)(\d{4})$/, '$1-$2');
    return v;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let val = value;
    if (['preco', 'custoPeca'].includes(name)) val = formatMoney(value);
    if (name === 'telefone') val = mascaraTelefone(value);
    if (['cliente', 'aparelho', 'imei', 'endereco'].includes(name)) val = value.toUpperCase();

    // CRM AUTO-FILL: se digitar o nome ou CPF de um cliente antigo, puxa o WhatsApp.
    if (name === 'cliente' || name === 'cpf') {
      const antigo = clientes?.find(c =>
        c.nome === val.toUpperCase() ||
        (c.cpf && normalizarCPF(c.cpf) === normalizarCPF(val))
      );
      if (antigo) {
        setForm(prev => ({ ...prev, [name]: val, telefone: antigo.telefone, endereco: antigo.endereco || prev.endereco }));
      }
    }

    setForm(prev => ({ ...prev, [name]: val }));
  };

  const listaFiltrada = useMemo(() => ordensServico.filter(os =>
    os.cliente.toLowerCase().includes(search.toLowerCase()) ||
    os.os.toLowerCase().includes(search.toLowerCase()) ||
    os.aparelho.toLowerCase().includes(search.toLowerCase()) ||
    (os.imei && os.imei.toLowerCase().includes(search.toLowerCase())) ||
    (os.telefone && os.telefone.includes(search))
  ), [ordensServico, search]);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const stats = useMemo(() => ({
    lucro: listaFiltrada.reduce((acc, os) => acc + (parseNum(os.preco) - parseNum(os.custoPeca)) / 100, 0),
    pendentes: listaFiltrada.length
  }), [listaFiltrada]);

  const enviarWhatsApp = async (os) => {
    if (!os.telefone) {
      await showAlert('O telefone do cliente não foi cadastrado!', 'error', 'WhatsApp Indisponível');
      return;
    }
    const tel = os.telefone.replace(/\D/g, '');
    const msg = os.status === 'pronto'
      ? `Olá ${os.cliente}! O serviço do seu ${os.aparelho} foi concluído na MR IMPORTS. Valor: ${os.preco}. Pode vir retirar!`
      : `Olá ${os.cliente}! Seu ${os.aparelho} deu entrada na MR IMPORTS (OS: ${os.os}). Avisamos assim que estiver pronto!`;
    window.open(`https://api.whatsapp.com/send?phone=55${tel}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleSalvarEImprimirEntrada = async () => {
    if (!form.cliente || !form.aparelho) {
      await showAlert('Nome do cliente e aparelho são obrigatórios!', 'error', 'Dados Incompletos');
      return;
    }
    const dataBase = new Date(`${form.dataEntrada}T12:00:00`);
    dataBase.setDate(dataBase.getDate() + Number(form.diasGarantia || 90));
    const dataGarantia = dataBase.toISOString();
    let osManipulada;

    if (editId) {
      const original = ordensServico.find(o => o.id === editId);
      osManipulada = { ...form, dataGarantia, id: editId, os: original.os, data: original.data };
      setEditId(null);
    } else {
      osManipulada = { ...form, dataGarantia, id: Date.now(), os: `OS-${Math.floor(Math.random() * 9000) + 1000}`, data: new Date().toLocaleDateString() };
    }
    const assistenciaSalva = await salvarAssistencia(osManipulada, editId || null);
    if (!assistenciaSalva) return;
    setIsModalOpen(false);
    setForm({
      cliente: '', telefone: '', cpf: '', endereco: '', aparelho: '', imei: '', defeito: '', status: 'orcamento', preco: '', custoPeca: '', diasGarantia: '90',
      dataEntrada: new Date().toISOString().slice(0, 10), prazoEntrega: '', observacoes: '',
      checklist: { telaRiscada: false, carcacaAmassada: false, faceIdRuim: false, cameraMancha: false }
    });
    setDocParaImprimir({ os: assistenciaSalva, tipo: 'entrada' });
  };

  const concluirEGerarGarantia = async (os) => {
    if (await showConfirm(`Deseja CONCLUIR E ENTREGAR a OS ${os.os} para o cliente ${os.cliente}?`, 'Conclusão de Serviço', 'Finalizar O.S.', '#4caf50')) {
      const servicoRegistrado = await registrarServico({
        modelo: `OS ${os.os} - ${os.aparelho}`,
        cliente: os.cliente,
        cpf: os.cpf,
        telefone: os.telefone,
        valorCobrado: parseNum(os.preco) / 100,
        custoPeca: parseNum(os.custoPeca) / 100,
        defeito: os.defeito
      });
      if (!servicoRegistrado) return;
      const assistenciaRemovida = await removerAssistencia(os.id);
      if (!assistenciaRemovida) return;
      setDocParaImprimir({ os, tipo: 'garantia' });
    }
  };

  if (docParaImprimir) {
    return docParaImprimir.tipo === 'entrada'
      ? <OrdemEntrada servico={docParaImprimir.os} onVoltar={() => setDocParaImprimir(null)} />
      : <TermoGarantiaFinal servico={docParaImprimir.os} onVoltar={() => setDocParaImprimir(null)} />;
  }

  return (
    <PageContainer>
      <Header>
        <Title>Assistência Técnica</Title>
        <button onClick={() => { setEditId(null); setIsModalOpen(true); }} style={{ background: '#ffffff', border: 'none', padding: '12px 24px', borderRadius: '10px', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>+ Abrir O.S.</button>
      </Header>
      <Subtitle>Gestão de reparos, checklists de entrada e termos de garantia.</Subtitle>

      <SummaryBar>
        <StatCard><small>Aparelhos na Bancada</small><h3>{stats.pendentes}</h3></StatCard>
        {isAdmin && (
          <StatCard c="#4caf50"><small>Lucro Líquido Estimado</small><h3>R$ {stats.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3></StatCard>
        )}
      </SummaryBar>

      <ToolBar><SearchInput placeholder="Buscar por Nome, OS, IMEI ou Telefone..." value={search} onChange={e => setSearch(e.target.value)} /></ToolBar>

      <GridOS>
        {currentItems.map(os => {
          const expirada = new Date() > new Date(os.dataGarantia);
          const dadosCliente = clientes?.find(c => c.nome === os.cliente);
          const isVip = dadosCliente && dadosCliente.totalGasto > 8000;

          return (
            <OSCard key={os.id} status={os.status}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <strong>{os.os}</strong>
                <small style={{ color: '#888' }}>{os.data}</small>
              </div>
              <h3>{os.cliente} {isVip && <VipTag>VIP</VipTag>}</h3>
              <p style={{ fontSize: '14px', color: '#ccc', marginTop: '5px' }}>{os.aparelho}</p>
              <p style={{ fontSize: '11px', color: '#666' }}>IMEI: {os.imei || 'N/A'} {os.telefone ? `| ${os.telefone}` : ''}</p>

              <div style={{ marginTop: '12px' }}>
                {os.checklist?.telaRiscada && <ObsBadge>TELA RISCADA</ObsBadge>}
                {os.checklist?.carcacaAmassada && <ObsBadge>CARCAÇA AMASSADA</ObsBadge>}
                {os.checklist?.faceIdRuim && <ObsBadge>FACE ID OFF</ObsBadge>}
                {os.checklist?.cameraMancha && <ObsBadge>MANCHA CÂMERA</ObsBadge>}
              </div>

              <FinanceBox>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#ffffff', fontWeight: 'bold' }}>VALOR TOTAL:</span>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{os.preco}</span>
                </div>
              </FinanceBox>

              <WarrantyBox expirada={expirada}>Garantia até: {new Date(os.dataGarantia).toLocaleDateString()}</WarrantyBox>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                <ActionBtn c="#ffffff" onClick={() => { setForm(os); setEditId(os.id); setIsModalOpen(true); }}>Editar</ActionBtn>
                <ActionBtn c="#25d366" onClick={() => enviarWhatsApp(os)}>WhatsApp</ActionBtn>
                <ActionBtn onClick={() => setDocParaImprimir({ os, tipo: 'entrada' })}>Entrada</ActionBtn>
                <ActionBtn c="#4caf50" onClick={() => concluirEGerarGarantia(os)}>Finalizar</ActionBtn>
                {isAdmin && <ActionBtn c="#444" onClick={async () => {
                  if (await showConfirm(`Excluir permanentemente a O.S. ${os.os}?`, 'Excluir Ordem de Serviço', 'Excluir', '#ff4d4d')) {
                    await removerAssistencia(os.id);
                  }
                }}>Excluir</ActionBtn>}
              </div>
            </OSCard>
          );
        })}
      </GridOS>

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
        <OverlayModal form={form} setForm={setForm} isAdmin={isAdmin} editId={editId} handleInputChange={handleInputChange} onSave={handleSalvarEImprimirEntrada} onClose={() => setIsModalOpen(false)} />
      )}
    </PageContainer>
  );
};

const OverlayModal = ({ form, setForm, isAdmin, editId, handleInputChange, onSave, onClose }) => (
  <ModalOverlay>
    <ModalBox>
      <h2 style={{ color: '#ffffff', marginBottom: '25px', fontWeight: '300' }}>{editId ? 'Ajustar O.S.' : 'Nova Ordem de Serviço'}</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div><Label>Data Entrada</Label><Input type="date" name="dataEntrada" value={form.dataEntrada} onChange={handleInputChange} /></div>
        <div><Label>Prazo Prometido</Label><Input type="date" name="prazoEntrega" value={form.prazoEntrega} onChange={handleInputChange} /></div>
      </div>

      <Label>Identificação do Cliente</Label>
      <Input name="cliente" placeholder="NOME COMPLETO" value={form.cliente} onChange={handleInputChange} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <Input name="telefone" placeholder="WHATSAPP (DDD + NÚMERO)" value={form.telefone} onChange={handleInputChange} maxLength="15" />
        <Input name="cpf" placeholder="CPF (OPCIONAL)" value={form.cpf} onChange={handleInputChange} />
      </div>

      <Label>Dados do Aparelho</Label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <Input name="aparelho" placeholder="MODELO (Ex: iPhone 14 Pro)" value={form.aparelho} onChange={handleInputChange} />
        <Input name="imei" placeholder="IMEI / SÉRIE" value={form.imei} onChange={handleInputChange} />
      </div>

      <Input name="defeito" placeholder="DEFEITO / RECLAMAÇÃO" value={form.defeito} onChange={handleInputChange} />

      <Label>Checklist de Entrada</Label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#0a0a0a', padding: '15px', borderRadius: '8px', border: '1px solid #333', marginBottom: '15px' }}>
        {Object.keys(form.checklist).map(key => (
          <label key={key} style={{ fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: form.checklist[key] ? '#ffffff' : '#888' }}>
            <input type="checkbox" checked={form.checklist[key]} onChange={() => setForm({ ...form, checklist: { ...form.checklist, [key]: !form.checklist[key] } })} />
            {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
          </label>
        ))}
      </div>

      <Input name="observacoes" placeholder="SENHA DE TELA / OBSERVAÇÕES" value={form.observacoes} onChange={handleInputChange} />

      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 1fr' : '1fr', gap: '10px' }}>
        <div><Label>Valor do Serviço</Label><Input name="preco" value={form.preco} onChange={handleInputChange} /></div>
        {isAdmin && <div><Label>Custo da Peça</Label><Input name="custoPeca" value={form.custoPeca} onChange={handleInputChange} style={{ borderColor: '#444' }} /></div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <select name="status" style={{ height: '45px', background: '#0a0a0a', color: '#fff', border: '1px solid #333', borderRadius: '8px', padding: '0 10px' }} value={form.status} onChange={handleInputChange}>
          <option value="orcamento">Orçamento</option>
          <option value="peca">Aguardando Peça</option>
          <option value="pronto">Pronto</option>
        </select>
        <Input name="diasGarantia" type="number" value={form.diasGarantia} onChange={handleInputChange} placeholder="Garantia (Dias)" />
      </div>

      <button onClick={onSave} style={{ width: '100%', padding: '15px', background: '#ffffff', border: 'none', borderRadius: '10px', color: '#000', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>Salvar e Gerar Recibo</button>
      <button onClick={onClose} style={{ width: '100%', background: 'transparent', border: 'none', color: '#666', marginTop: '10px', cursor: 'pointer' }}>Sair sem salvar</button>
    </ModalBox>
  </ModalOverlay>
);

export default Assistencia;
