import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { useEstoque } from '../contexts/EstoqueContext';
import { useDialog } from '../contexts/DialogContext';
import NotaVenda from './NotaVenda';

// --- FUNÇÕES DE FORMATAÇÃO ---
const parseNum = (v) => Number(String(v).replace(/\D/g, "")) || 0;
const formatMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseNum(v) / 100);
const formatarCPF = (v) => String(v || '').replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
const formatarTelefone = (v) => String(v || '').replace(/\D/g, '').slice(0, 11).replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');
const normalizarCPF = (v) => String(v || '').replace(/\D/g, '').slice(0, 11);

const TAXAS_PAGAMENTO = {
  'PIX': 0,
  'Dinheiro': 0,
  'Débito': 0,
  'Crédito 1x': 3.04,
  'Crédito 2x': 4.32,
  'Crédito 3x': 5.12,
  'Crédito 4x': 5.90,
  'Crédito 5x': 6.67,
  'Crédito 6x': 7.44,
  'Crédito 7x': 8.29,
  'Crédito 8x': 9.04,
  'Crédito 9x': 9.78,
  'Crédito 10x': 10.52,
  'Crédito 11x': 11.24,
  'Crédito 12x': 11.96
};

// --- ESTILOS MODERNOS ---
const PageContainer = styled.div`
  padding: 40px; 
  color: #fff;
  min-height: 100vh;
  @media (max-width: 768px) { padding: 16px; }
`;

const Header = styled.div`
  display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px;
  @media(max-width: 768px) { flex-direction: column; gap: 15px; }
`;
const Title = styled.h1`font-weight: 300; color: #ffffff; letter-spacing: 2px; margin: 0; font-size: 28px; text-transform: uppercase;`;
const Subtitle = styled.p`color: #888; font-size: 14px; margin-top: 8px; letter-spacing: 0.5px;`;

// --- DASHBOARD TABS ---
const TabsContainer = styled.div`
  display: flex; gap: 10px; margin-bottom: 20px;
  background: #151515; padding: 5px; border-radius: 12px; width: fit-content;
`;
const TabBtn = styled.button`
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  color: ${props => props.active ? '#fff' : '#888'};
  border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 12px; cursor: pointer; transition: 0.3s;
  &:hover { color: #fff; }
`;

// --- DASHBOARD CARDS ---
const DashboardBoard = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px;
`;
const DashCard = styled.div`
  background: rgba(20, 20, 20, 0.6); 
  backdrop-filter: blur(10px);
  border: 1px solid #333; 
  padding: 25px; 
  border-radius: 16px; 
  border-bottom: 4px solid ${props => props.color || '#fff'};
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  transition: transform 0.3s;
  &:hover { transform: translateY(-5px); }
  h3 { font-size: 32px; margin: 10px 0 0; font-weight: 600; letter-spacing: 1px; color: ${props => props.color || '#fff'}; }
  small { color: #aaa; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; font-weight: bold;}
`;

// --- INVENTORY ---
const Toolbar = styled.div`
  display: flex; justify-content: space-between; gap: 15px; margin-bottom: 20px;
  @media (max-width: 768px) { flex-direction: column; gap: 10px; }
`;
const SearchInput = styled.input`
  flex: 1; padding: 14px 20px; background: #121212; border: 1px solid #333; color: #fff; border-radius: 10px; outline: none; transition: 0.3s;
  &:focus { border-color: #66b2ff; box-shadow: 0 0 10px rgba(102, 178, 255, 0.1); }
`;
const ActionButton = styled.button`
  background: ${props => props.primary ? 'linear-gradient(135deg, #66b2ff, #0059b3)' : '#222'};
  color: #fff; border: ${props => props.primary ? 'none' : '1px solid #444'}; padding: 14px 24px; border-radius: 10px; font-weight: bold; cursor: pointer; transition: 0.3s; box-shadow: ${props => props.primary ? '0 4px 15px rgba(0, 89, 179, 0.4)' : 'none'};
  &:hover { transform: scale(1.02); filter: brightness(1.1); }
`;

const TableContainer = styled.div`background: #151515; border-radius: 16px; border: 1px solid #222; overflow-x: auto;`;
const Table = styled.table`width: 100%; border-collapse: collapse; text-align: left; white-space: nowrap;`;
const Th = styled.th`padding: 16px; background: #1a1a1a; color: #aaa; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #333;`;
const Td = styled.td`padding: 16px; border-bottom: 1px solid #222; font-size: 13px; color: #eee;`;

const MinBtn = styled.button`
  background: ${props => props.bg || '#333'}; color: ${props => props.c || '#fff'}; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; margin-right: 8px; transition: 0.2s;
  &:hover { filter: brightness(1.2); }
`;

const ModalOverlay = styled.div`position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(5px); display: flex; justify-content: center; align-items: center; z-index: 1000;`;
const ModalBox = styled.div`background: #111; padding: 30px; border-radius: 16px; width: 100%; max-width: 700px; border: 1px solid #333; box-shadow: 0 20px 50px rgba(0,0,0,0.8); max-height: 90vh; overflow-y: auto;`;

const CheckoutBox = styled.div`
  width: min(920px, calc(100vw - 20px));
  background: radial-gradient(circle at top left, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 30px 80px rgba(0,0,0,0.75);
`;

const CheckoutHeader = styled.div`
  padding: 18px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  background: rgba(0,0,0,0.35);
  border-bottom: 1px solid rgba(255,255,255,0.10);
`;

const CheckoutTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  strong { color: #fff; letter-spacing: 1px; text-transform: uppercase; font-size: 12px; }
  span { color: #aaa; font-size: 12px; }
`;

const CloseBtn = styled.button`
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.16);
  background: rgba(0,0,0,0.25);
  color: #fff;
  cursor: pointer;
  transition: 0.2s;
  &:hover { background: rgba(255,255,255,0.08); }
`;

const CheckoutBody = styled.div`
  padding: 20px;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 18px;
  @media (max-width: 768px) {
    padding: 16px;
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.div`
  background: rgba(17,17,17,0.7);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 16px;
  padding: 16px;
`;

const PanelTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  margin-bottom: 14px;
  strong { color: #fff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
  span { color: #888; font-size: 11px; }
`;

const ProductHero = styled.div`
  display: grid;
  grid-template-columns: 92px 1fr;
  gap: 14px;
  align-items: center;
  margin-bottom: 14px;
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const ProductImage = styled.div`
  width: 92px;
  height: 92px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.12);
  overflow: hidden;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 10px;
  @media (max-width: 480px) { width: 100%; height: 160px; }
  img { width: 100%; height: 100%; object-fit: cover; }
`;

const ProductMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  .name { font-weight: 900; color: #fff; font-size: 16px; letter-spacing: 0.4px; }
  .sub { color: #aaa; font-size: 12px; }
`;

const PillRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 6px;
`;

const Pill = styled.span`
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(0,0,0,0.25);
  color: #ddd;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
`;

const CheckoutGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const SelectUI = styled.select`
  width: 100%;
  padding: 12px;
  background: #0a0a0a;
  border: 1px solid #333;
  border-radius: 8px;
  color: #fff;
  outline: none;
  transition: 0.3s;
  &:focus { border-color: #66b2ff; }
`;

const SummaryLine = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: #bbb;
  font-size: 12px;
  padding: 8px 0;
  border-bottom: 1px dashed rgba(255,255,255,0.10);
  strong { color: #fff; }
`;

const SummaryTotal = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.10);
  span { color: #aaa; font-weight: 800; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; }
  strong { color: #4caf50; font-size: 22px; }
`;

const CheckoutActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
  @media (max-width: 480px) { flex-direction: column; }
`;

const PaginationContainer = styled.div`
  display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 30px; padding: 20px;
  @media print { display: none; }
`;
const PageButton = styled.button`
  background: #1a1a1a; border: 1px solid #333; color: #fff; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.3s;
  &:hover:not(:disabled) { border-color: #ffffff; color: #ffffff; transform: translateY(-2px); }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`;
const PageInfo = styled.span`color: #888; font-size: 14px; letter-spacing: 1px;`;

const FormGroup = styled.div`margin-bottom: 15px; display: flex; flex-direction: column; text-align: left;`;
const Label = styled.label`font-size: 11px; color: #aaa; text-transform: uppercase; margin-bottom: 6px; font-weight: bold; letter-spacing: 0.5px;`;
const Input = styled.input`width: 100%; padding: 12px; background: #0a0a0a; border: 1px solid #333; border-radius: 8px; color: #fff; outline: none; transition: 0.3s; &:focus { border-color: #66b2ff; }`;
const GridRow = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;`;

const Scooters = () => {
  const { scooters, vendas, clientes, adicionarScooter, editarScooter, removerScooter, venderProduto, isAdmin } = useEstoque();
  const { showAlert, showConfirm } = useDialog();

  const [periodo, setPeriodo] = useState('mes');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVendaModalOpen, setIsVendaModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const initialForm = {
    marca: '', submarca: '', numeroPeca: '', modelo: '', fabricante: '', tipoProduto: 'Scooter Elétrica', potencia: '', precoCusto: '', precoVenda: '', quantidade: 1, imagem: ''
  };
  const [form, setForm] = useState(initialForm);

  // States for Image Viewer
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [reciboAtivo, setReciboAtivo] = useState(null);

  const openImageViewer = (img) => {
    setImageZoom(1);
    setImageRotation(0);
    setFullscreenImage(img);
  };

  // Venda form state
  const [vendaForm, setVendaForm] = useState({ cliente: 'CONSUMIDOR', cpf: '', telefone: '', formaPagamento: 'PIX', descontoPercent: '0', observacao: '', precoVenda: '' });
  const [itemParaVender, setItemParaVender] = useState(null);

  // Manipulação de inputs do formulário principal
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let val = value;
    if (['precoCusto', 'precoVenda'].includes(name)) val = formatMoney(value);
    if (['marca', 'submarca', 'fabricante'].includes(name)) val = value.toUpperCase();
    setForm({ ...form, [name]: val });
  };

  // Manipulação do modal de vendas
  const handleVendaChange = (e) => {
    const { name, value } = e.target;
    let val = value;
    if (name === 'precoVenda') val = formatMoney(value);
    if (name === 'cpf') val = formatarCPF(value);
    if (name === 'telefone') val = formatarTelefone(value);
    if (name === 'cliente') val = value.toUpperCase();

    if (name === 'cpf' || name === 'cliente') {
      const clienteExistente = clientes?.find(c =>
        c.nome === val.toUpperCase() ||
        (c.cpf && normalizarCPF(c.cpf) === normalizarCPF(val))
      );

      if (clienteExistente) {
        setVendaForm(prev => ({
          ...prev,
          [name]: val,
          cliente: name === 'cliente' ? val : (clienteExistente.nome || prev.cliente),
          cpf: name === 'cpf' ? val : (clienteExistente.cpf || prev.cpf),
          telefone: clienteExistente.telefone || prev.telefone
        }));
        return;
      }
    }

    setVendaForm({ ...vendaForm, [name]: val });
  };

  const subtotalCentsCalc = useMemo(() => parseNum(vendaForm.precoVenda), [vendaForm.precoVenda]);
  const descontoPctCalc = useMemo(() => Math.max(0, Math.min(100, Number(String(vendaForm.descontoPercent || '0').replace(',', '.')) || 0)), [vendaForm.descontoPercent]);
  const descontoCentsCalc = useMemo(() => Math.max(0, Math.round(subtotalCentsCalc * (descontoPctCalc / 100))), [subtotalCentsCalc, descontoPctCalc]);
  const liquidoCentsCalc = useMemo(() => Math.max(0, subtotalCentsCalc - descontoCentsCalc), [subtotalCentsCalc, descontoCentsCalc]);
  const taxaPagamentoPct = useMemo(() => Number(TAXAS_PAGAMENTO[vendaForm.formaPagamento] ?? 0) || 0, [vendaForm.formaPagamento]);
  const taxaPagamentoCentsCalc = useMemo(() => Math.max(0, Math.round(liquidoCentsCalc * (taxaPagamentoPct / 100))), [liquidoCentsCalc, taxaPagamentoPct]);
  const totalCentsCalc = useMemo(() => liquidoCentsCalc + taxaPagamentoCentsCalc, [liquidoCentsCalc, taxaPagamentoCentsCalc]);

  // Upload e conversão de imagem para Base64
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, imagem: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // DASHBOARD INTELLIGENCE
  const dashboardStats = useMemo(() => {
    const now = new Date();
    const vendasScooter = vendas.filter(v => v.tipo === 'SCOOTER');
    
    let filteredVendas = vendasScooter;
    if (periodo === 'hoje') {
      filteredVendas = vendasScooter.filter(v => {
        const d = new Date(v.timestamp);
        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (periodo === 'ontem') {
      const ontem = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      filteredVendas = vendasScooter.filter(v => {
        const d = new Date(v.timestamp);
        return d.getDate() === ontem.getDate() && d.getMonth() === ontem.getMonth() && d.getFullYear() === ontem.getFullYear();
      });
    } else if (periodo === '7dias') {
      const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      filteredVendas = vendasScooter.filter(v => new Date(v.timestamp) >= sevenDaysAgo);
    } else if (periodo === 'mes') {
      filteredVendas = vendasScooter.filter(v => {
        const d = new Date(v.timestamp);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (periodo === 'personalizado') {
      if (dataInicial && dataFinal) {
        const start = new Date(`${dataInicial}T00:00:00`);
        const end = new Date(`${dataFinal}T23:59:59`);
        filteredVendas = vendasScooter.filter(v => {
           const d = new Date(v.timestamp);
           return d >= start && d <= end;
        });
      } else {
        filteredVendas = [];
      }
    }

    const qtdVendida = filteredVendas.length;
    const vendaLiquida = filteredVendas.reduce((acc, v) => acc + (parseNum(v.precoVenda)/100), 0);
    const emInventario = scooters.reduce((acc, s) => acc + Number(s.quantidade), 0);

    return { qtdVendida, vendaLiquida, emInventario };
  }, [vendas, scooters, periodo, dataInicial, dataFinal]);

  // FILTRO DO INVENTÁRIO E PAGINAÇÃO
  const listaFiltrada = useMemo(() => {
    return scooters.filter(s => 
      s.modelo.toUpperCase().includes(search.toUpperCase()) || 
      s.marca.toUpperCase().includes(search.toUpperCase()) ||
      String(s.potencia || '').toUpperCase().includes(search.toUpperCase())
    );
  }, [scooters, search]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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

  const handleSalvar = async () => {
    if (!form.modelo || !form.marca || !form.precoVenda) {
      await showAlert("Modelo, Marca e Preço de Venda são obrigatórios.", "error"); return;
    }
    const itemFinal = { ...form };
    
    if (editId) {
      await editarScooter(editId, itemFinal);
      setEditId(null);
    } else {
      await adicionarScooter(itemFinal);
    }
    setIsModalOpen(false);
    setForm(initialForm);
  };

  const excluir = async (id, modelo) => {
    if (await showConfirm(`Excluir ${modelo} permanentemente do sistema?`, "Excluir", "Deletar", "#ff4d4d")) {
      await removerScooter(id);
    }
  };

  const abrirVendaModal = (item) => {
    setItemParaVender(item);
    setVendaForm({ cliente: 'CONSUMIDOR', cpf: '', telefone: '', formaPagamento: 'PIX', descontoPercent: '0', observacao: '', precoVenda: item.precoVenda });
    setIsVendaModalOpen(true);
  };

  const confirmarVenda = async () => {
    if (!vendaForm.cliente || !vendaForm.cliente.trim()) {
      await showAlert("Informe o nome do cliente (ou CONSUMIDOR).", "error"); return;
    }
    if (Number(itemParaVender.quantidade) < 1) {
      await showAlert("Estoque esgotado para esta scooter.", "error"); return;
    }

    const detalhes = {
      tipoOriginal: 'SCOOTER',
      tipo: 'SCOOTER',
      cliente: vendaForm.cliente,
      cpf: vendaForm.cpf,
      telefone: vendaForm.telefone,
      formaPagamento: vendaForm.formaPagamento,
      observacao: vendaForm.observacao,
      descontoPercentual: descontoPctCalc,
      taxaPagamentoPercentual: taxaPagamentoPct,
      subtotal: subtotalCentsCalc / 100,
      desconto: descontoCentsCalc / 100,
      total: totalCentsCalc / 100,
      precoVenda: formatMoney(totalCentsCalc),
      modelo: itemParaVender.modelo
    };

    const suceso = await venderProduto(itemParaVender.id, detalhes);
    if (suceso) {
      setReciboAtivo({
        id: Math.floor(Date.now() / 1000).toString().slice(-6),
        data: new Date().toLocaleDateString('pt-BR'),
        cliente: { nome: vendaForm.cliente || 'CONSUMIDOR', cpf: vendaForm.cpf || '-', telefone: vendaForm.telefone || '-' },
        carrinho: [{ nome: itemParaVender.modelo, quantidade: 1, preco: subtotalCentsCalc / 100, imei: 'N/A', tipo: 'SCOOTER' }],
        subtotal: subtotalCentsCalc / 100,
        desconto: descontoCentsCalc / 100,
        total: totalCentsCalc / 100,
        formaPagamento: vendaForm.formaPagamento || 'N/A'
      });
      setIsVendaModalOpen(false);
      setItemParaVender(null);
    }
  };

  if (reciboAtivo) {
    return <NotaVenda venda={reciboAtivo} onVoltar={() => setReciboAtivo(null)} />;
  }

  return (
    <PageContainer>
      <Header>
        <div>
          <Title>Scooter Elétrica</Title>
          <Subtitle>Inteligência, gestão e rastreamento de veículos elétricos.</Subtitle>
        </div>
      </Header>

      <TabsContainer>
        <TabBtn active={periodo === 'hoje'} onClick={() => setPeriodo('hoje')}>Hoje</TabBtn>
        <TabBtn active={periodo === 'ontem'} onClick={() => setPeriodo('ontem')}>Ontem</TabBtn>
        <TabBtn active={periodo === '7dias'} onClick={() => setPeriodo('7dias')}>7 Dias</TabBtn>
        <TabBtn active={periodo === 'mes'} onClick={() => setPeriodo('mes')}>Este Mês</TabBtn>
        <TabBtn active={periodo === 'tudo'} onClick={() => setPeriodo('tudo')}>Todo Período</TabBtn>
        <TabBtn active={periodo === 'personalizado'} onClick={() => setPeriodo('personalizado')}>Personalizado</TabBtn>
      </TabsContainer>

      {periodo === 'personalizado' && (
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
          <FormGroup style={{ marginBottom: 0 }}>
            <Label>Data Inicial</Label>
            <Input type="date" value={dataInicial} onChange={e => setDataInicial(e.target.value)} style={{ padding: '10px', width: '200px' }} />
          </FormGroup>
          <span style={{ color: '#888', marginTop: '15px', fontWeight: 'bold' }}>até</span>
          <FormGroup style={{ marginBottom: 0 }}>
            <Label>Data Final</Label>
            <Input type="date" value={dataFinal} onChange={e => setDataFinal(e.target.value)} style={{ padding: '10px', width: '200px' }} />
          </FormGroup>
          {(dataInicial || dataFinal) && (
            <ActionButton 
              style={{ marginTop: '15px', padding: '10px 15px', background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', border: '1px solid rgba(255, 77, 77, 0.3)' }} 
              onClick={() => { setDataInicial(''); setDataFinal(''); }}
            >
              Limpar
            </ActionButton>
          )}
        </div>
      )}

      <DashboardBoard>
        {isAdmin && (
          <DashCard color="#66b2ff">
            <small>Unidades Vendidas</small>
            <h3>{dashboardStats.qtdVendida} un.</h3>
          </DashCard>
        )}
        {isAdmin && (
          <DashCard color="#4caf50">
            <small>Venda Líquida ({periodo})</small>
            <h3>{dashboardStats.vendaLiquida.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
          </DashCard>
        )}
        <DashCard color="#ffcc00">
          <small>Vol. em Inventário</small>
          <h3>{dashboardStats.emInventario} un.</h3>
        </DashCard>
      </DashboardBoard>

      <Toolbar>
        <SearchInput placeholder="Buscar por Modelo, Marca ou Potência..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <ActionButton primary onClick={() => { setEditId(null); setForm(initialForm); setIsModalOpen(true); }}>
          + Novo Veículo
        </ActionButton>
      </Toolbar>

      <TableContainer>
        <Table>
          <thead>
            <tr>
              <Th>Img</Th>
              <Th>Marca / Modelo</Th>
              <Th>Fab. / Peça / Potência</Th>
              <Th>Qtd</Th>
              {isAdmin && <Th>Preço Custo</Th>}
              <Th>Preço Venda</Th>
              <Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? <tr><Td colSpan={isAdmin ? 7 : 6} style={{textAlign: 'center'}}>Nenhuma Scooter encontrada.</Td></tr> :
              currentItems.map(item => (
              <tr key={item.id}>
                <Td>
                  {item.imagem ? (
                    <img 
                      src={item.imagem} 
                      alt={item.modelo} 
                      style={{width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #333', cursor: 'pointer', transition: '0.2s', filter: 'brightness(0.9)'}} 
                      onClick={() => openImageViewer(item.imagem)}
                      onMouseOver={(e) => e.target.style.filter = 'brightness(1.2)'}
                      onMouseOut={(e) => e.target.style.filter = 'brightness(0.9)'}
                    />
                  ) : (
                    <div style={{width: '40px', height: '40px', background: '#222', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#555', border: '1px solid #333'}}>S/ IMG</div>
                  )}
                </Td>
                <Td>
                  <strong style={{fontSize: '15px'}}>{item.marca}</strong><br/>
                  <span style={{color: '#888', fontSize: '12px'}}>{item.modelo}</span>
                </Td>
                <Td>
                  {item.fabricante && <div style={{fontSize: '11px', color: '#aaa'}}>FAB: {item.fabricante}</div>}
                  {item.numeroPeca && <div style={{fontSize: '11px', color: '#aaa'}}>PN: {item.numeroPeca}</div>}
                  {item.potencia && <div style={{fontSize: '11px', color: '#66b2ff'}}>POT: {item.potencia}</div>}
                </Td>
                <Td>
                  <span style={{background: item.quantidade > 0 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 77, 77, 0.1)', color: item.quantidade > 0 ? '#4caf50' : '#ff4d4d', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold'}}>
                    {item.quantidade}
                  </span>
                </Td>
                {isAdmin && <Td style={{color: '#ff4d4d'}}>{item.precoCusto || 'R$ 0,00'}</Td>}
                <Td style={{color: '#4caf50', fontWeight: 'bold', fontSize: '15px'}}>{item.precoVenda}</Td>
                <Td>
                  <MinBtn bg="rgba(76, 175, 80, 0.2)" c="#4caf50" onClick={() => abrirVendaModal(item)}>Vender</MinBtn>
                  <MinBtn onClick={() => { setForm({...item}); setEditId(item.id); setIsModalOpen(true); }}>Editar</MinBtn>
                  {isAdmin && <MinBtn bg="rgba(255, 77, 77, 0.1)" c="#ff4d4d" onClick={() => excluir(item.id, item.modelo)}>X</MinBtn>}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>

      {/* CONTROLES DE PAGINAÇÃO */}
      {totalPages > 1 && (
        <PaginationContainer>
          <PageButton onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
            Anterior
          </PageButton>
          <PageInfo>
            Página <strong>{currentPage}</strong> de {totalPages}
          </PageInfo>
          <PageButton onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            Próxima
          </PageButton>
        </PaginationContainer>
      )}

      {/* --- MODAL DE ADIÇÃO/EDIÇÃO --- */}
      {isModalOpen && (
        <ModalOverlay>
          <ModalBox>
            <h2 style={{color: '#fff', marginBottom: '20px'}}>{editId ? 'Editar Scooter' : 'Cadastrar Nova Scooter'}</h2>
            
            <GridRow>
              <FormGroup><Label>Nome da Marca</Label><Input name="marca" value={form.marca} onChange={handleInputChange} placeholder="Ex: XIAOMI" /></FormGroup>
              <FormGroup><Label>Submarca</Label><Input name="submarca" value={form.submarca} onChange={handleInputChange} placeholder="Ex: NINEBOT" /></FormGroup>
            </GridRow>

            <GridRow>
              <FormGroup><Label>Número do Modelo</Label><Input name="modelo" value={form.modelo} onChange={handleInputChange} placeholder="Ex: PRO 2" /></FormGroup>
              <FormGroup><Label>Número da Peça</Label><Input name="numeroPeca" value={form.numeroPeca} onChange={handleInputChange} placeholder="Ex: PN-12345" /></FormGroup>
            </GridRow>

            <GridRow>
              <FormGroup><Label>Fabricante</Label><Input name="fabricante" value={form.fabricante} onChange={handleInputChange} placeholder="Ex: SEGWAY" /></FormGroup>
              <FormGroup><Label>Tipo de Produto</Label><Input name="tipoProduto" value={form.tipoProduto} onChange={handleInputChange} disabled /> {/* Hardcoded para Scooter Elétrica ou padronizado */}</FormGroup>
            </GridRow>

            <GridRow>
              <FormGroup><Label>Potência</Label><Input name="potencia" value={form.potencia} onChange={handleInputChange} placeholder="Ex: 350W" /></FormGroup>
              <FormGroup><Label>Quantidade Inicial</Label><Input name="quantidade" type="number" value={form.quantidade} onChange={handleInputChange} /></FormGroup>
            </GridRow>

            <GridRow>
              {isAdmin && <FormGroup><Label>Preço de Custo</Label><Input name="precoCusto" value={form.precoCusto} onChange={handleInputChange} placeholder="R$ 0,00" /></FormGroup>}
              <FormGroup><Label>Preço de Venda</Label><Input name="precoVenda" value={form.precoVenda} onChange={handleInputChange} placeholder="R$ 0,00" /></FormGroup>
            </GridRow>

            <div style={{display: 'flex', gap: '15px', marginTop: '15px'}}>
              <FormGroup style={{flex: 1}}>
                <Label>Imagem (Opcional)</Label>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                   {form.imagem && <img src={form.imagem} alt="preview" style={{width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #333'}} />}
                   <Input type="file" accept="image/*" onChange={handleImageUpload} style={{padding: '9px'}} />
                </div>
              </FormGroup>
            </div>

            <div style={{display: 'flex', gap: '15px', marginTop: '15px'}}>
              <ActionButton primary style={{flex: 1}} onClick={handleSalvar}>Salvar Veículo</ActionButton>
              <ActionButton style={{flex: 1}} onClick={() => setIsModalOpen(false)}>Cancelar</ActionButton>
            </div>
          </ModalBox>
        </ModalOverlay>
      )}

      {/* --- MODAL DE VENDA --- */}
      {isVendaModalOpen && (
        <ModalOverlay style={{ zIndex: 1600 }}>
          <CheckoutBox>
            <CheckoutHeader>
              <CheckoutTitle>
                <strong>Checkout Inteligente</strong>
                <span>Venda de Scooter Elétrica</span>
              </CheckoutTitle>
              <CloseBtn onClick={() => setIsVendaModalOpen(false)}>✖</CloseBtn>
            </CheckoutHeader>

            <CheckoutBody>
              <Panel>
                <PanelTitle>
                  <strong>Produto</strong>
                  <span>Confirme os dados do item</span>
                </PanelTitle>

                <ProductHero>
                  <ProductImage>
                    {itemParaVender?.imagem ? (
                      <img src={itemParaVender.imagem} alt={itemParaVender?.modelo || 'Scooter'} />
                    ) : (
                      <div>S/ IMG</div>
                    )}
                  </ProductImage>
                  <ProductMeta>
                    <div className="name">{itemParaVender?.marca} {itemParaVender?.modelo}</div>
                    <div className="sub">
                      {itemParaVender?.fabricante ? `FAB: ${itemParaVender.fabricante} • ` : ''}{itemParaVender?.numeroPeca ? `PN: ${itemParaVender.numeroPeca} • ` : ''}{itemParaVender?.potencia ? `POT: ${itemParaVender.potencia}` : ''}
                    </div>
                    <PillRow>
                      <Pill>Estoque: {Number(itemParaVender?.quantidade || 0)} un</Pill>
                      <Pill>Venda: {itemParaVender?.precoVenda || 'R$ 0,00'}</Pill>
                      {isAdmin && <Pill style={{ color: '#ffb3b3', borderColor: 'rgba(255,77,77,0.35)' }}>Custo: {itemParaVender?.precoCusto || 'R$ 0,00'}</Pill>}
                    </PillRow>
                  </ProductMeta>
                </ProductHero>

                <CheckoutGrid>
                  <FormGroup style={{ marginBottom: 0 }}>
                    <Label>Cliente</Label>
                    <Input name="cliente" value={vendaForm.cliente} onChange={handleVendaChange} placeholder="NOME OU CONSUMIDOR" />
                  </FormGroup>
                  <FormGroup style={{ marginBottom: 0 }}>
                    <Label>CPF</Label>
                    <Input name="cpf" value={vendaForm.cpf} onChange={handleVendaChange} placeholder="000.000.000-00" />
                  </FormGroup>
                  <FormGroup style={{ marginBottom: 0 }}>
                    <Label>WhatsApp</Label>
                    <Input name="telefone" value={vendaForm.telefone} onChange={handleVendaChange} placeholder="(00) 00000-0000" />
                  </FormGroup>
                  <FormGroup style={{ marginBottom: 0 }}>
                    <Label>Forma de Pagamento</Label>
                    <SelectUI name="formaPagamento" value={vendaForm.formaPagamento} onChange={handleVendaChange}>
                      <option value="PIX">PIX</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Débito">Débito</option>
                      <option value="Crédito 1x">Crédito 1x</option>
                      <option value="Crédito 2x">Crédito 2x</option>
                      <option value="Crédito 3x">Crédito 3x</option>
                      <option value="Crédito 4x">Crédito 4x</option>
                      <option value="Crédito 5x">Crédito 5x</option>
                      <option value="Crédito 6x">Crédito 6x</option>
                      <option value="Crédito 7x">Crédito 7x</option>
                      <option value="Crédito 8x">Crédito 8x</option>
                      <option value="Crédito 9x">Crédito 9x</option>
                      <option value="Crédito 10x">Crédito 10x</option>
                      <option value="Crédito 11x">Crédito 11x</option>
                      <option value="Crédito 12x">Crédito 12x</option>
                    </SelectUI>
                  </FormGroup>
                </CheckoutGrid>
              </Panel>

              <Panel>
                <PanelTitle>
                  <strong>Resumo</strong>
                  <span>Cálculo em tempo real</span>
                </PanelTitle>

                <FormGroup>
                  <Label>Valor Negociado</Label>
                  <Input name="precoVenda" value={vendaForm.precoVenda} onChange={handleVendaChange} placeholder="R$ 0,00" />
                </FormGroup>

                <CheckoutGrid>
                  <FormGroup style={{ marginBottom: 0 }}>
                    <Label>Desconto (%)</Label>
                    <Input name="descontoPercent" value={vendaForm.descontoPercent} onChange={handleVendaChange} placeholder="0" />
                  </FormGroup>
                  <FormGroup style={{ marginBottom: 0 }}>
                    <Label>Observação (opcional)</Label>
                    <Input name="observacao" value={vendaForm.observacao} onChange={handleVendaChange} placeholder="Ex: entrega amanhã / brinde..." />
                  </FormGroup>
                </CheckoutGrid>

                <div style={{ marginTop: '10px' }}>
                  <SummaryLine>
                    <span>Subtotal</span>
                    <strong>{formatMoney(subtotalCentsCalc)}</strong>
                  </SummaryLine>
                  <SummaryLine>
                    <span>Desconto</span>
                    <strong style={{ color: '#ff4d4d' }}>
                      - {formatMoney(descontoCentsCalc)}
                    </strong>
                  </SummaryLine>
                  <SummaryLine>
                    <span>Taxa ({vendaForm.formaPagamento})</span>
                    <strong style={{ color: taxaPagamentoPct > 0 ? '#ffc107' : '#bbb' }}>
                      {taxaPagamentoPct > 0 ? `+ ${formatMoney(taxaPagamentoCentsCalc)} (${taxaPagamentoPct.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%)` : formatMoney(0)}
                    </strong>
                  </SummaryLine>
                  <SummaryTotal>
                    <span>Total</span>
                    <strong>
                      {formatMoney(totalCentsCalc)}
                    </strong>
                  </SummaryTotal>
                </div>

                <CheckoutActions>
                  <ActionButton
                    primary
                    style={{ flex: 1, background: 'linear-gradient(135deg, #4caf50, #2e7d32)', boxShadow: '0 8px 24px rgba(76, 175, 80, 0.25)' }}
                    onClick={confirmarVenda}
                  >
                    Confirmar Venda
                  </ActionButton>
                  <ActionButton
                    style={{ flex: 1 }}
                    onClick={() => setIsVendaModalOpen(false)}
                  >
                    Voltar
                  </ActionButton>
                </CheckoutActions>
              </Panel>
            </CheckoutBody>
          </CheckoutBox>
        </ModalOverlay>
      )}

      {/* --- IMAGE VIEWER MODAL --- */}
      {fullscreenImage && (
        <ModalOverlay style={{ zIndex: 2000 }}>
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '15px', zIndex: 2010, background: 'rgba(0,0,0,0.6)', padding: '10px 20px', borderRadius: '12px', border: '1px solid #333' }}>
              <ActionButton style={{padding: '8px 16px'}} onClick={() => setImageZoom(z => Math.max(z - 0.5, 0.5))}>Zoom -</ActionButton>
              <ActionButton style={{padding: '8px 16px'}} onClick={() => setImageZoom(z => Math.min(z + 0.5, 5))}>Zoom +</ActionButton>
            </div>
            <ActionButton primary style={{ position: 'absolute', top: '20px', right: '30px', zIndex: 2010 }} onClick={() => setFullscreenImage(null)}>Fechar</ActionButton>
            
            <div style={{ overflow: 'visible', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '90%', height: '80%', marginTop: '50px' }}>
              <img 
                src={fullscreenImage} 
                alt="Fullscreen" 
                style={{ 
                  transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`, 
                  transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
                  maxHeight: '100%',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                  borderRadius: '12px'
                }} 
              />
            </div>
          </div>
        </ModalOverlay>
      )}

    </PageContainer>
  );
};

export default Scooters;
