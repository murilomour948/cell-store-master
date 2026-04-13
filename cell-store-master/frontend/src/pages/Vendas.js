import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { useEstoque } from '../contexts/EstoqueContext'; 
import NotaVenda from './NotaVenda';
import { gerarRecibo } from '../utils/gerarReciboPDF';
import { useDialog } from '../contexts/DialogContext';

// --- ESTILOS ---
const PageContainer = styled.div`padding: 40px; color: #fff; font-family: 'Segoe UI', sans-serif; @media (max-width: 768px) { padding: 16px; }`;
const Header = styled.div`margin-bottom: 40px;`;
const Title = styled.h1`font-weight: 300; color: #ffffff; letter-spacing: 1px; margin: 0;`;
const Subtitle = styled.p`color: #e0e0e0; margin-top: 5px;`;

const SearchInput = styled.input`
  width: 100%; max-width: 500px; padding: 12px 20px; background: #121212; border: 1px solid #333; 
  border-radius: 8px; color: #fff; margin-bottom: 30px; outline: none;
  &:focus { border-color: #ffffff; }
`;

const GridCards = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;
`;

const ProdutoCard = styled.div`
  background: #121212; border: 1px solid #222; border-radius: 12px; padding: 20px;
  transition: transform 0.2s ease, border-color 0.2s ease;
  &:hover { transform: translateY(-5px); border-color: #ffffff; }
`;

const CardTitle = styled.h3`color: #fff; margin-bottom: 15px; font-weight: 500; font-size: 16px;`;
const InfoText = styled.p`color: #888; font-size: 13px; margin-bottom: 4px; strong { color: #bbb; }`;
const PrecoTag = styled.div`color: #ffffff; font-size: 20px; font-weight: bold; margin: 15px 0;`;

const SellButton = styled.button`
  width: 100%; background: #ffffff; color: #000; border: none; padding: 12px;
  border-radius: 8px; font-weight: bold; cursor: pointer; text-transform: uppercase;
  &:hover { background: #f0f0f0; }
`;

// --- MODAL DE CHECKOUT ---
const Overlay = styled.div`position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 10px;`;
const Modal = styled.div`background: #151515; padding: 20px; border-radius: 15px; border: 1px solid #333; width: 450px; max-width: 100%; max-height: 90vh; overflow-y: auto;`;
const InputModal = styled.input`width: 100%; padding: 12px; background: #000; border: 1px solid #333; color: #fff; border-radius: 6px; margin-bottom: 15px; outline: none; &:focus { border-color: #ffffff; }`;
const SelectModal = styled.select`width: 100%; padding: 12px; background: #000; border: 1px solid #333; color: #fff; border-radius: 6px; margin-bottom: 15px; outline: none; &:focus { border-color: #ffffff; }`;

const Label = styled.label`display: block; font-size: 10px; color: #999; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 1px; font-weight: bold;`;

const Vendas = () => {
  const { produtos, venderProduto, isAdmin } = useEstoque();
  const { showAlert } = useDialog();
  const [busca, setBusca] = useState('');
  const [vendaAtiva, setVendaAtiva] = useState(null);
  const [reciboFinal, setReciboFinal] = useState(null);

  const [cliente, setCliente] = useState('');
  const [telefone, setTelefone] = useState(''); 
  const [pagamento, setPagamento] = useState('PIX');
  const [precoFinal, setPrecoFinal] = useState('');
  const [origem, setOrigem] = useState('Instagram');

  const mascaraTelefone = (valor) => {
    if (!valor) return "";
    valor = valor.replace(/\D/g, ''); 
    if (valor.length > 11) valor = valor.slice(0, 11); 
    valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2'); 
    valor = valor.replace(/(\d)(\d{4})$/, '$1-$2');    
    return valor;
  };

  const acessorios = useMemo(() => {
    const salvos = localStorage.getItem('@MRImports:estoque_acessorios');
    return salvos ? JSON.parse(salvos) : [];
  }, []);

  const filtrados = useMemo(() => {
    const buscaLC = busca.toLowerCase();
    
    const phones = produtos.map(p => ({ ...p, tipoOriginal: 'IPHONE' }));
    const aces = acessorios.map(a => ({ 
      ...a, 
      tipoOriginal: 'ACESSORIO', 
      modelo: a.nome, 
      preco: a.precoVenda, 
      capacidade: a.cor 
    }));

    return [...phones, ...aces].filter(item => 
      item.modelo.toLowerCase().includes(buscaLC) || 
      (item.imei && item.imei.includes(busca))
    );
  }, [produtos, acessorios, busca]);

  const abrirModalVenda = (prod) => {
    setVendaAtiva(prod);
    setPrecoFinal(prod.preco); 
    setCliente('');
    setTelefone(''); 
    setOrigem('Instagram'); 
  };

  const handleFinalizar = async () => {
    if (!cliente) {
      await showAlert("Por favor, informe o nome do cliente para prosseguir com o pagamento.", "error", "Dados Incompletos");
      return;
    }

    const detalhesVenda = {
      cliente: cliente.toUpperCase(),
      telefone: telefone, 
      formaPagamento: pagamento,
      precoVenda: precoFinal,
      origemCliente: origem, 
      tipoOriginal: vendaAtiva.tipoOriginal,
      modelo: vendaAtiva.modelo, // 🚀 Adicionado para o PDF
      imei: vendaAtiva.imei || '', // 🚀 Adicionado para o PDF
      dataVenda: new Date().toISOString()
    };

    if (await venderProduto(vendaAtiva.id, detalhesVenda)) {
      
      // 🚀 GERA O PDF AUTOMATICAMENTE COM OS DADOS DA VENDA
      gerarRecibo(detalhesVenda);

      // (Mantive a geração da Nota Térmica caso você ainda use impressorinha)
      const dadosRecibo = {
        id: Math.floor(Date.now() / 1000).toString().slice(-6),
        data: new Date().toLocaleDateString('pt-BR'),
        cliente: { 
          nome: detalhesVenda.cliente, 
          cpf: '-', 
          telefone: detalhesVenda.telefone || 'Não informado' 
        },
        carrinho: [{ 
          nome: vendaAtiva.modelo, 
          quantidade: 1, 
          preco: (Number(String(precoFinal).replace(/\D/g, "")) / 100),
          imei: vendaAtiva.imei || 'N/A'
        }],
        total: (Number(String(precoFinal).replace(/\D/g, "")) / 100),
        formaPagamento: pagamento
      };

      setReciboFinal(dadosRecibo);
      setVendaAtiva(null);
    } else {
      await showAlert("Ocorreu um erro ao processar a venda. Por favor, recarregue a página e tente novamente.", "error", "Falha Administrativa");
    }
  };

  if (reciboFinal) {
    return <NotaVenda venda={reciboFinal} onVoltar={() => setReciboFinal(null)} />;
  }

  return (
    <PageContainer>
      <Header>
        <Title>Frente de Caixa (PDV)</Title>
        <Subtitle>Selecione o produto para iniciar o checkout.</Subtitle>
      </Header>

      <SearchInput 
        placeholder="Buscar por modelo, capa, película ou IMEI..." 
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <GridCards>
        {filtrados.map((prod, idx) => (
          <ProdutoCard key={prod.id || idx}>
            <div style={{display:'flex', justifyContent:'space-between'}}>
                <CardTitle>{prod.modelo}</CardTitle>
                <small style={{color: '#ffffff', fontSize: '9px', fontWeight: 'bold'}}>{prod.tipoOriginal}</small>
            </div>
            {prod.imei && <InfoText><strong>IMEI:</strong> {prod.imei}</InfoText>}
            <InfoText><strong>Detalhes:</strong> {prod.capacidade} {prod.estado && `· ${prod.estado}`}</InfoText>
            <PrecoTag>{prod.preco}</PrecoTag>
            <SellButton onClick={() => abrirModalVenda(prod)}>Vender Agora</SellButton>
          </ProdutoCard>
        ))}
      </GridCards>

      {vendaAtiva && (
        <Overlay>
          <Modal>
            <h2 style={{color: '#ffffff', marginBottom: '20px', fontWeight: '300'}}>Checkout</h2>
            
            <div style={{background: '#0a0a0a', padding: '15px', borderRadius: '8px', marginBottom: '20px'}}>
               <p style={{fontSize: '12px', color: '#888', margin: 0}}>PRODUTO SELECIONADO</p>
               <p style={{fontWeight: 'bold', fontSize: '16px', margin: '5px 0 0 0'}}>{vendaAtiva.modelo}</p>
            </div>

            <Label>Nome do Cliente *</Label>
            <InputModal 
              placeholder="Ex: João Silva" 
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              autoFocus
            />

            <Label>WhatsApp (Com DDD)</Label>
            <InputModal 
              placeholder="(11) 99999-9999" 
              value={telefone}
              onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
              maxLength="15"
            />

            <Label>Canal de Venda (Origem) 📢</Label>
            <SelectModal value={origem} onChange={(e) => setOrigem(e.target.value)}>
              <option value="Instagram">Instagram (Orgânico/Direct)</option>
              <option value="WhatsApp">WhatsApp (Lista/Contato)</option>
              <option value="Indicação">Indicação de Cliente</option>
              <option value="Passou na Loja">Passou na Loja Física</option>
              <option value="Tráfego Pago">Tráfego Pago (Ads)</option>
              <option value="Facebook/Marketplace">Facebook / Marketplace</option>
              <option value="Outros">Outros</option>
            </SelectModal>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
              <div>
                <Label>Forma de Pagamento</Label>
                <SelectModal value={pagamento} onChange={(e) => setPagamento(e.target.value)}>
                  <option value="PIX">PIX</option>
                  <option value="CARTÃO DE CRÉDITO">CARTÃO DE CRÉDITO</option>
                  <option value="CARTÃO DE DÉBITO">CARTÃO DE DÉBITO</option>
                  <option value="DINHEIRO">DINHEIRO</option>
                </SelectModal>
              </div>
              <div>
                <Label>Preço Final (R$)</Label>
                <InputModal 
                  value={precoFinal}
                  onChange={(e) => setPrecoFinal(e.target.value)}
                />
              </div>
            </div>

            {isAdmin && vendaAtiva.precoCusto && (
              <p style={{fontSize: '11px', color: '#555', marginBottom: '15px'}}>
                Custo do produto: <span style={{color: '#ff4d4d'}}>{vendaAtiva.precoCusto}</span>
              </p>
            )}

            <SellButton onClick={handleFinalizar} style={{marginTop: '10px'}}>Confirmar e Imprimir</SellButton>
            <button 
              onClick={() => setVendaAtiva(null)} 
              style={{width: '100%', background: 'transparent', border: 'none', color: '#666', marginTop: '15px', cursor: 'pointer'}}
            >
              Cancelar Operação
            </button>
          </Modal>
        </Overlay>
      )}
    </PageContainer>
  );
};

export default Vendas;
