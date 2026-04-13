import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import NotaVenda from './NotaVenda';
import { useEstoque } from '../contexts/EstoqueContext';
import { useDialog } from '../contexts/DialogContext';

const CREDIT_KEYS = [
  'Cr?dito 1x',
  'Cr?dito 2x',
  'Cr?dito 3x',
  'Cr?dito 4x',
  'Cr?dito 5x',
  'Cr?dito 6x',
  'Cr?dito 7x',
  'Cr?dito 8x',
  'Cr?dito 9x',
  'Cr?dito 10x',
  'Cr?dito 11x',
  'Cr?dito 12x',
];

const TAXAS_PADRAO = {
  'PIX': 0,
  'Dinheiro': 0,
  'D?bito': 1.5,
  'Cr?dito 1x': 3.04,
  'Cr?dito 2x': 4.32,
  'Cr?dito 3x': 5.12,
  'Cr?dito 4x': 5.90,
  'Cr?dito 5x': 6.67,
  'Cr?dito 6x': 7.44,
  'Cr?dito 7x': 8.29,
  'Cr?dito 8x': 9.04,
  'Cr?dito 9x': 9.78,
  'Cr?dito 10x': 10.52,
  'Cr?dito 11x': 11.24,
  'Cr?dito 12x': 11.96,
};

// --- ESTILOS REVISADOS ---
const PageContainer = styled.div`
  padding: 40px;
  color: #fff;
  display: flex;
  gap: 30px;
  @media (max-width: 768px) {
    padding: 16px;
    flex-direction: column;
    gap: 16px;
  }
`;
const LeftPanel = styled.div`
  flex: 2;
  @media (max-width: 768px) {
    flex: unset;
  }
`;
const RightPanel = styled.div`
  flex: 1;
  background: #121212;
  padding: 25px;
  border-radius: 12px;
  border: 1px solid #333;
  height: fit-content;
  position: sticky;
  top: 20px;
  @media (max-width: 768px) {
    flex: unset;
    width: 100%;
    position: static;
    top: auto;
    padding: 16px;
  }
`;
const Input = styled.input`width: 100%; padding: 12px; background: #0a0a0a; border: 1px solid ${props => props.$erro ? '#ff4d4d' : '#333'}; border-radius: 6px; color: #fff; margin-bottom: 5px; outline: none; &:focus { border-color: ${props => props.$erro ? '#ff4d4d' : '#ffffff'}; } transition: all 0.2s;`;

// ? REINTEGRADO: Texto de ajuda para erros
const HelperText = styled.div`font-size: 10px; color: #ff4d4d; margin-bottom: 10px; height: 12px;`;

const SugestaoBox = styled.div`background: #1a1a1a; border: 1px solid #333; border-radius: 8px; position: absolute; width: 100%; z-index: 10; max-height: 250px; overflow-y: auto; box-shadow: 0 10px 20px rgba(0,0,0,0.5);`;
const SugestaoItem = styled.div`padding: 12px; cursor: pointer; border-bottom: 1px solid #222; display: flex; justify-content: space-between; align-items: center; &:hover { background: #ffffff; color: #000; } small { font-size: 10px; opacity: 0.7; }`;

// ? REINTEGRADO: Bot?es de quantidade
const QtdBtn = styled.button`background: #333; color: #fff; border: none; width: 25px; height: 25px; border-radius: 4px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; &:hover { background: #ffffff; color: #000; }`;

const ModalOverlay = styled.div`position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.85); display: flex; justify-content: center; align-items: center; z-index: 2000;`;
const ModalBox = styled.div`background: #151515; padding: 35px; border-radius: 16px; width: 100%; max-width: 400px; border: 1px solid #333; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.8);`;
const ModalBtn = styled.button`width: 100%; padding: 15px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px; border: none; margin-bottom: 10px; transition: transform 0.1s; &:active { transform: scale(0.98); }`;
const NoPrintArea = styled.div`@media print { display: none !important; }`;
const PrintArea = styled.div`display: none; @media print { display: block !important; }`;

const ProductPreviewCard = styled.div`
  background: radial-gradient(circle at top left, rgba(255,255,255,0.10), rgba(255,255,255,0.03));
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 18px;
`;

const PreviewTitle = styled.div`
  font-weight: 900;
  color: #fff;
  font-size: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
`;

const PreviewList = styled.div`
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const PreviewItem = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0,0,0,0.25);
`;

const PreviewItemLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PreviewItemName = styled.div`
  font-weight: 900;
  color: #fff;
  font-size: 13px;
  line-height: 1.25;
`;

const PreviewItemMeta = styled.div`
  color: rgba(255,255,255,0.65);
  font-size: 11px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
`;

const PreviewItemPrice = styled.div`
  font-weight: 900;
  letter-spacing: 1px;
  color: #ffffff;
  font-size: 14px;
  white-space: nowrap;
`;

const ImageOverlay = styled.div`position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 2500;`;
const ImageBox = styled.div`background: #111; border: 1px solid #333; border-radius: 16px; width: min(980px, 92vw); height: min(760px, 88vh); display: flex; flex-direction: column; overflow: hidden;`;
const ImageToolbar = styled.div`display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #222; background: rgba(0,0,0,0.35);`;
const ImageStage = styled.div`flex: 1; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #0a0a0a;`;

const formatarCPF = (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
const formatarTelefone = (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');
const normalizarCPF = (v) => String(v || '').replace(/\D/g, '').slice(0, 11);
const parseMoney = (v) => {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  const s = String(v);
  if (s.includes('R$') || s.includes(',')) {
    return Number(s.replace(/[R$\s.]/g, "").replace(",", ".")) || 0;
  }
  const digits = s.replace(/\D/g, "");
  return (Number(digits) || 0) / 100;
};

const formatBRL = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const PDV = () => {
  const { produtos: iphones, acessorios, venderProduto, clientes, isAdmin } = useEstoque();
  const { showAlert } = useDialog();
  const [busca, setBusca] = useState('');
  const [carrinho, setCarrinho] = useState([]);
  const [itemPreview, setItemPreview] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [cliente, setCliente] = useState({ nome: '', cpf: '', telefone: '', dataNascimento: '', parcelas: 'PIX' });
  const [descontoStr, setDescontoStr] = useState('');
  const [notaImpressao, setNotaImpressao] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [taxas, setTaxas] = useState(() => {
    try {
      const raw = localStorage.getItem('@MRImports:pdvTaxas');
      if (!raw) return TAXAS_PADRAO;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return TAXAS_PADRAO;
      return { ...TAXAS_PADRAO, ...parsed };
    } catch {
      return TAXAS_PADRAO;
    }
  });
  const [modalTaxas, setModalTaxas] = useState(false);
  const [taxasDraft, setTaxasDraft] = useState({});

  const formatPct = (n) => {
    const num = Number(n);
    if (!Number.isFinite(num)) return '';
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const parsePct = (value) => {
    const raw = String(value ?? '').trim();
    if (!raw) return null;
    const normalized = raw
      .replace('%', '')
      .replace(/\s/g, '')
      .replace(',', '.')
      .replace(/[^0-9.]/g, '');
    if (!normalized) return null;
    const num = Number(normalized);
    if (!Number.isFinite(num)) return null;
    return Math.max(0, Math.min(100, num));
  };

  const subtotal = useMemo(() => carrinho.reduce((acc, i) => acc + (i.preco * i.quantidade), 0), [carrinho]);
  const descontoPercentual = parseMoney(descontoStr); // Se digitou "10,00", ? 10%
  const taxaAtual = taxas[cliente.parcelas] || 0;
  
  const totalFinal = (subtotal * (1 - (descontoPercentual / 100))) * (1 + taxaAtual / 100);

  const isCpfValido = cliente.cpf.replace(/\D/g, '').length === 11;
  const isNomeValido = cliente.nome.trim().split(' ').length >= 2;
  const podeFinalizar = isCpfValido && isNomeValido && carrinho.length > 0 && !isProcessing;

  const sugestoes = useMemo(() => {
    if (busca.length < 2) return [];
    const termo = busca.toUpperCase();
    const list = [
      ...iphones.map(p => ({ 
        ...p, 
        tipo: 'IPHONE', 
        label: `${p.modelo}${p.capacidade ? ` (${p.capacidade})` : ''}`, 
        precoNum: parseMoney(p.precoVenda || p.preco), 
        custoNum: parseMoney(p.precoCusto), 
        estoqueMax: 1 
      })),
      ...acessorios.map(a => ({ 
        ...a, 
        tipo: 'ACESSORIO', 
        label: a.nome, 
        precoNum: parseMoney(a.precoVenda || a.preco), 
        custoNum: parseMoney(a.precoCusto), 
        estoqueMax: Number(a.quantidade) 
      }))
    ];
    return list.filter(item => item.label.toUpperCase().includes(termo) || (item.imei && item.imei.includes(termo)));
  }, [busca, iphones, acessorios]);

  const getItemImage = (item) => item?.imagem || item?.image || null;

  const openImageViewer = (img) => {
    if (!img) return;
    setImageZoom(1);
    setFullscreenImage(img);
  };

  const adicionarAoCarrinho = async (item) => {
    const idx = carrinho.findIndex(c => c.idOrigin === item.id);
    if (idx >= 0) {
      if (item.tipo === 'IPHONE') return await showAlert("Este aparelho j? foi adicionado ao carrinho de compras.", "error", "Item Duplicado");
      const novo = [...carrinho];
      if (novo[idx].quantidade < item.estoqueMax) { novo[idx].quantidade += 1; setCarrinho(novo); }
      setItemPreview(novo[idx]);
    } else {
      const novoItem = { idOrigin: item.id, tipo: item.tipo, nome: item.label, imei: item.imei, cor: item.cor, preco: item.precoNum, precoCusto: item.custoNum, quantidade: 1, estoqueMax: item.estoqueMax, imagem: item.imagem || '' };
      setCarrinho([...carrinho, novoItem]);
      setItemPreview(novoItem);
    }
    setBusca('');
  };

  const alterarQtd = (idx, delta) => {
    const novo = [...carrinho];
    const novaQtd = novo[idx].quantidade + delta;
    if (novaQtd > 0 && novaQtd <= novo[idx].estoqueMax) { novo[idx].quantidade = novaQtd; setCarrinho(novo); }
    else if (novaQtd <= 0) { const f = [...carrinho]; f.splice(idx, 1); setCarrinho(f); }
  };

  const handleCpfChange = (e) => {
    const cpfMasc = formatarCPF(e.target.value);
    setCliente(prev => ({ ...prev, cpf: cpfMasc }));
    if (cpfMasc.length === 14) {
      const antigo = clientes.find(c => normalizarCPF(c.cpf) === normalizarCPF(cpfMasc));
      if (antigo) setCliente(prev => ({ ...prev, nome: antigo.nome, telefone: antigo.telefone || '', dataNascimento: antigo.dataNascimento || '' }));
    }
  };

  const finalizarVenda = () => {
    if (!podeFinalizar) return;
    setIsProcessing(true);
    const fatorDesconto = 1 - (descontoPercentual / 100);
    const fatorTaxa = 1 + (taxaAtual / 100);

    setTimeout(() => {
      (async () => {
        const resultados = await Promise.all(carrinho.map(item => {
          const qtd = Math.max(1, Number(item.quantidade) || 1);
          const subtotalBrutoUnit = item.preco * fatorTaxa;
          const precoFinalUnit = (item.preco * fatorDesconto) * fatorTaxa;
          const descontoEmDinheiroUnit = subtotalBrutoUnit - precoFinalUnit;

          const subtotalBruto = subtotalBrutoUnit * qtd;
          const precoFinal = precoFinalUnit * qtd;
          const descontoEmDinheiroItem = descontoEmDinheiroUnit * qtd;

          return venderProduto(item.idOrigin, { 
            cliente: cliente.nome, 
            cpf: cliente.cpf, 
            telefone: cliente.telefone, 
            dataNascimento: cliente.dataNascimento, 
            quantidade: qtd,
            precoUnitario: precoFinalUnit,
            precoVenda: precoFinal, 
            subtotal: subtotalBruto, 
            desconto: descontoEmDinheiroItem, 
            total: precoFinal, 
            formaPagamento: cliente.parcelas, 
            tipoOriginal: item.tipo 
          });
        }));

        if (resultados.some(r => !r)) {
          setIsProcessing(false);
          return;
        }

        const descontoEmDinheiro = subtotal * (descontoPercentual / 100);
        setNotaImpressao({ id: Math.floor(Math.random() * 90000) + 10000, data: new Date().toLocaleDateString(), cliente, carrinho, subtotal, desconto: descontoEmDinheiro, total: totalFinal, formaPagamento: cliente.parcelas });
        setCarrinho([]); setCliente({ nome: '', cpf: '', telefone: '', dataNascimento: '', parcelas: 'PIX' }); setDescontoStr(''); setIsProcessing(false);
      })();
    }, 600);
  };

  const preview = itemPreview || carrinho[carrinho.length - 1] || null;
  const opcoesPagamento = useMemo(() => {
    const base = ['PIX', 'Dinheiro', 'D?bito', ...CREDIT_KEYS];
    const extras = Object.keys(taxas).filter(k => !base.includes(k));
    return [...base, ...extras].filter(k => Object.prototype.hasOwnProperty.call(taxas, k));
  }, [taxas]);
  const creditKeys = useMemo(() => CREDIT_KEYS.filter(k => Object.prototype.hasOwnProperty.call(taxas, k)), [taxas]);

  return (
    <>
      <NoPrintArea>
        <PageContainer>
          <LeftPanel>
            <h1 style={{ color: '#ffffff', marginBottom: '10px' }}>Caixa GD CELL STORE</h1>
            <div style={{ position: 'relative' }}>
              <Input placeholder="?? Buscar por modelo ou IMEI..." value={busca} onChange={e => setBusca(e.target.value)} />
              {sugestoes.length > 0 && (
                <SugestaoBox>
                  {sugestoes.map(s => (
                    <SugestaoItem key={s.id} onClick={() => adicionarAoCarrinho(s)}>
                      <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                        <div style={{width: '34px', height: '34px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                          {getItemImage(s) ? (
                            <img src={getItemImage(s)} alt={s.label} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                          ) : (
                            <span style={{fontWeight: 900, color: 'rgba(255,255,255,0.75)'}}>{String(s.label || 'I').trim().slice(0, 1).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <strong>{s.label}</strong><br/><small>{s.tipo} {s.imei ? `| IMEI: ${s.imei}` : `| Est: ${s.estoqueMax}`}</small>
                        </div>
                      </div>
                      <span style={{color: '#ffffff'}}>{formatBRL(s.precoNum)}</span>
                    </SugestaoItem>
                  ))}
                </SugestaoBox>
              )}
            </div>
            <div style={{ marginTop: '40px' }}>
              {carrinho.map((item, idx) => (
                <div key={idx} onClick={() => setItemPreview(item)} style={{display:'flex', justifyContent:'space-between', background:'#121212', padding:'15px', borderRadius:'10px', marginBottom:'10px', border: preview?.idOrigin === item.idOrigin ? '1px solid rgba(255,255,255,0.25)' : '1px solid transparent', cursor: 'pointer'}}>
                  <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                    <div style={{width: '46px', height: '46px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}} onClick={(e) => { e.stopPropagation(); if (item.imagem) openImageViewer(item.imagem); }}>
                      {item.imagem ? (
                        <img src={item.imagem} alt={item.nome} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                      ) : (
                        <span style={{fontWeight: 900, color: 'rgba(255,255,255,0.75)'}}>{String(item.nome || 'I').trim().slice(0, 1).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <strong>{item.nome}</strong><br/><small style={{color: '#ffffff'}}>{item.imei || item.cor}</small>
                    </div>
                  </div>
                  <div style={{display:'flex', alignItems: 'center', gap: '15px'}}>
                    {/* ? QtdBtn EM USO: Bot?es de + e - */}
                    {item.tipo === 'ACESSORIO' && (
                      <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                        <QtdBtn onClick={() => alterarQtd(idx, -1)}>-</QtdBtn>
                        <span>{item.quantidade}</span>
                        <QtdBtn onClick={() => alterarQtd(idx, 1)}>+</QtdBtn>
                      </div>
                    )}
                    <span>{formatBRL(item.preco * item.quantidade)}</span>
                    <button onClick={(e) => { e.stopPropagation(); const n = [...carrinho]; n.splice(idx, 1); setCarrinho(n); if (preview?.idOrigin === item.idOrigin) setItemPreview(null); }} style={{background:'none', border:'none', color:'#ff4d4d', cursor:'pointer'}}>?</button>
                  </div>
                </div>
              ))}
            </div>
          </LeftPanel>

          <RightPanel>
            <h3 style={{marginBottom: '20px'}}>Checkout</h3>
            {carrinho.length > 0 && (
              <ProductPreviewCard>
                <PreviewTitle>Itens no Carrinho</PreviewTitle>
                <PreviewList>
                  {carrinho.map((item, idx) => (
                    <PreviewItem key={`${item.idOrigin}-${idx}`} style={preview?.idOrigin === item.idOrigin ? { borderColor: 'rgba(255,255,255,0.25)' } : undefined}>
                      <PreviewItemLeft>
                        <PreviewItemName>{item.nome}</PreviewItemName>
                        <PreviewItemMeta>{item.tipo}{item.imei ? ` ? IMEI ${item.imei}` : ''}{item.quantidade > 1 ? ` ? QTD ${item.quantidade}` : ''}</PreviewItemMeta>
                      </PreviewItemLeft>
                      <PreviewItemPrice>{formatBRL(item.preco * (item.quantidade || 1))}</PreviewItemPrice>
                    </PreviewItem>
                  ))}
                </PreviewList>
              </ProductPreviewCard>
            )}
            <label style={{fontSize: '11px', color: '#888'}}>CPF *</label>
            <Input placeholder="000.000.000-00" value={cliente.cpf} onChange={handleCpfChange} $erro={cliente.cpf.length > 0 && !isCpfValido} maxLength={14} />
            {/* ? HelperText EM USO: Mostra erro de valida??o */}
            <HelperText>{cliente.cpf.length > 0 && !isCpfValido ? 'CPF Inv?lido' : ''}</HelperText>
            
            <label style={{fontSize: '11px', color: '#888'}}>NOME COMPLETO *</label>
            <Input placeholder="Nome Completo" value={cliente.nome} onChange={e => setCliente({...cliente, nome: e.target.value.toUpperCase()})} $erro={cliente.nome.length > 0 && !isNomeValido} />
            <HelperText>{cliente.nome.length > 0 && !isNomeValido ? 'Sobrenome obrigat?rio' : ''}</HelperText>

            <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
              <div style={{flex: 1}}>
                <label style={{fontSize: '11px', color: '#888'}}>WHATSAPP</label>
                <Input placeholder="(00) 00000-0000" value={cliente.telefone} onChange={e => setCliente({...cliente, telefone: formatarTelefone(e.target.value)})} maxLength={15} />
              </div>
              <div style={{flex: 1}}>
                <label style={{fontSize: '11px', color: '#888'}}>NASCIMENTO (OPC.)</label>
                <Input type="date" value={cliente.dataNascimento} onChange={e => setCliente({...cliente, dataNascimento: e.target.value})} style={{ colorScheme: 'dark' }} />
              </div>
            </div>

            <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
              <div style={{flex: 2}}>
                <label style={{fontSize: '11px', color: '#888'}}>PAGAMENTO</label>
                <select style={{width:'100%', padding:'12px', background:'#0a0a0a', color:'#fff', border:'1px solid #333', borderRadius:'6px'}} value={cliente.parcelas} onChange={e => setCliente({...cliente, parcelas: e.target.value})}>
                  {opcoesPagamento.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {isAdmin && (
                  <button
                    onClick={() => {
                      const draft = {};
                      creditKeys.forEach(k => { draft[k] = formatPct(taxas[k] ?? 0); });
                      setTaxasDraft(draft);
                      setModalTaxas(true);
                    }}
                    style={{ width: '100%', padding: '10px', marginTop: '10px', borderRadius: '8px', border: '1px solid #333', background: 'transparent', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Ajustar Taxas do Cr?dito
                  </button>
                )}
              </div>
              <div style={{flex: 1}}>
                <label style={{fontSize: '11px', color: '#ffffff'}}>DESCONTO</label>
                <Input placeholder="0,00" value={descontoStr} onChange={e => { let v = e.target.value.replace(/\D/g, ""); setDescontoStr((Number(v)/100).toLocaleString('pt-BR',{minimumFractionDigits:2})); }} />
              </div>
            </div>
            <h2 style={{color:'#ffffff', textAlign:'center', marginTop: '20px'}}>{formatBRL(totalFinal)}</h2>
            <button onClick={finalizarVenda} disabled={!podeFinalizar} style={{ width:'100%', padding:'18px', background: podeFinalizar ? '#ffffff' : '#333', color: '#000', borderRadius:'8px', fontWeight:'bold', border:'none', marginTop:'20px', cursor:'pointer' }}>
              FINALIZAR
            </button>
          </RightPanel>

          {notaImpressao && (
            <ModalOverlay>
              <ModalBox>
                <h2 style={{color: '#ffffff'}}>Venda Conclu?da!</h2>
                <ModalBtn style={{background: '#ffffff', color: '#000', marginTop:'20px'}} onClick={() => window.print()}>??? Imprimir</ModalBtn>
                <ModalBtn style={{background: 'transparent', color: '#888'}} onClick={() => setNotaImpressao(null)}>Fechar</ModalBtn>
              </ModalBox>
            </ModalOverlay>
          )}
          {modalTaxas && (
            <ModalOverlay>
              <ModalBox style={{ maxWidth: '520px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <h2 style={{ color: '#ffffff', margin: 0 }}>Taxas do Cr?dito</h2>
                  <button onClick={() => setModalTaxas(false)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '18px' }}>?</button>
                </div>

                <div style={{ marginTop: '18px', display: 'grid', gridTemplateColumns: '1fr 120px', gap: '10px', alignItems: 'center' }}>
                  {creditKeys.map(k => (
                    <React.Fragment key={k}>
                      <div style={{ color: '#ccc', fontWeight: 700 }}>{k}</div>
                      <input
                        value={String(taxasDraft[k] ?? '')}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setTaxasDraft(prev => ({ ...prev, [k]: raw }));
                        }}
                        inputMode="decimal"
                        placeholder="Ex: 11,96%"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #333', background: '#0a0a0a', color: '#fff', outline: 'none' }}
                      />
                    </React.Fragment>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    onClick={() => {
                      const atualizadas = {};
                      creditKeys.forEach(k => {
                        const val = parsePct(taxasDraft[k]);
                        if (val === null) return;
                        atualizadas[k] = val;
                      });
                      const novo = { ...taxas, ...atualizadas };
                      setTaxas(novo);
                      localStorage.setItem('@MRImports:pdvTaxas', JSON.stringify(novo));
                      setModalTaxas(false);
                    }}
                    style={{ flex: 1, padding: '14px', borderRadius: '10px', border: 'none', background: '#ffffff', color: '#000', fontWeight: 900, cursor: 'pointer' }}
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setTaxas(TAXAS_PADRAO);
                      localStorage.removeItem('@MRImports:pdvTaxas');
                      setModalTaxas(false);
                    }}
                    style={{ flex: 1, padding: '14px', borderRadius: '10px', border: '1px solid #333', background: 'transparent', color: '#fff', fontWeight: 900, cursor: 'pointer' }}
                  >
                    Restaurar Padr?o
                  </button>
                </div>
              </ModalBox>
            </ModalOverlay>
          )}
        </PageContainer>
      </NoPrintArea>
      {notaImpressao && <PrintArea><NotaVenda venda={notaImpressao} /></PrintArea>}
      {fullscreenImage && (
        <ImageOverlay onClick={() => setFullscreenImage(null)}>
          <ImageBox onClick={(e) => e.stopPropagation()}>
            <ImageToolbar>
              <div style={{display: 'flex', gap: '10px'}}>
                <ModalBtn style={{width: 'auto', marginBottom: 0, padding: '10px 14px', background: '#1a1a1a', color: '#fff'}} onClick={() => setImageZoom(z => Math.max(0.8, Number((z - 0.2).toFixed(2))))}>Zoom -</ModalBtn>
                <ModalBtn style={{width: 'auto', marginBottom: 0, padding: '10px 14px', background: '#1a1a1a', color: '#fff'}} onClick={() => setImageZoom(z => Math.min(5, Number((z + 0.2).toFixed(2))))}>Zoom +</ModalBtn>
                <ModalBtn style={{width: 'auto', marginBottom: 0, padding: '10px 14px', background: '#1a1a1a', color: '#fff'}} onClick={() => setImageZoom(1)}>Reset</ModalBtn>
              </div>
              <ModalBtn style={{width: 'auto', marginBottom: 0, padding: '10px 14px', background: '#ff4d4d', color: '#fff'}} onClick={() => setFullscreenImage(null)}>Fechar</ModalBtn>
            </ImageToolbar>
            <ImageStage>
              <img
                src={fullscreenImage}
                alt="Produto"
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
    </>
  );
};

export default PDV;
