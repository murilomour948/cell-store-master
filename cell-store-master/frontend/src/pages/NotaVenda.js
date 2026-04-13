import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import logoImg from '../assets/GD3.png'; 

// --- PADRÃO DE IMPRESSÃO GD CELL STORE ---
const GlobalPrintStyle = createGlobalStyle`
  @media print {
    body * { visibility: hidden !important; }
    #area-venda, #area-venda * { visibility: visible !important; }
    #area-venda {
      position: absolute !important;
      left: 0 !important; top: 0 !important;
      width: 100% !important; margin: 0 !important;
      padding: 0 !important; box-shadow: none !important;
    }
  }
`;

const ContainerA4 = styled.div`
  background-color: #f4f4f4; min-height: 100vh; padding: 40px; display: flex; flex-direction: column; align-items: center;
  @media print { background-color: white; padding: 0; .no-print { display: none !important; } }
`;

const Folha = styled.div`
  background: white; width: 210mm; min-height: 297mm; padding: 15mm 20mm; box-shadow: 0 0 10px rgba(0,0,0,0.1); color: #000; font-family: 'Segoe UI', Arial, sans-serif;
  @media print { width: 100%; height: auto; padding: 10mm; box-shadow: none; }
`;

const HeaderPrint = styled.div`
  display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 25px;
  .loja-brand { display: flex; align-items: center; gap: 15px; }
  .logo-circular { width: 70px; height: 70px; border-radius: 50%; border: 1px solid #000; object-fit: cover; }
  h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; }
  .venda-badge { text-align: right; h2 { margin: 0; color: #000; font-size: 18px; } p { margin: 0; font-weight: bold; font-size: 12px; } }
`;

const Section = styled.div`
  margin-bottom: 25px;
  h3 { font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 12px; color: #000; letter-spacing: 1px; }
  .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
  strong { color: #333; text-transform: uppercase; font-size: 11px; }
`;

const ItensTable = styled.table`
  width: 100%; border-collapse: collapse; margin: 20px 0;
  th { text-align: left; padding: 10px; background: #fafafa; border-bottom: 2px solid #eee; font-size: 11px; text-transform: uppercase; color: #666; }
  td { padding: 12px 10px; border-bottom: 1px solid #eee; font-size: 13px; }
  .total-row { background: #fdfdfd; font-weight: bold; font-size: 16px; }
`;

const PagamentoBox = styled.div`
  background: #f9f9f9; padding: 15px; border-radius: 6px; border: 1px solid #eee; margin-top: 10px;
  display: flex; justify-content: space-between; align-items: center;
  span { font-size: 12px; color: #666; text-transform: uppercase; font-weight: bold; }
  strong { font-size: 15px; color: #000; }
`;

const Assinaturas = styled.div`
  display: flex; justify-content: space-between; margin-top: 80px;
  div { width: 45%; border-top: 1px solid #000; text-align: center; font-size: 10px; padding-top: 8px; font-weight: bold; text-transform: uppercase; }
`;

const NotaVenda = ({ venda, onVoltar }) => {
  // Proteção extra: se faltar dados, não quebra a tela
  const clienteNome = venda?.cliente?.nome || 'Consumidor Final';
  const clienteCpf = venda?.cliente?.cpf || 'Não informado';
  const clienteTel = venda?.cliente?.telefone || 'Não informado';
  const itens = venda?.carrinho || [];
  
  return (
    <ContainerA4>
      <GlobalPrintStyle />

      <div className="no-print" style={{ marginBottom: '20px' }}>
        <button onClick={onVoltar} style={{ padding: '10px 20px', cursor: 'pointer', marginRight: '10px', borderRadius: '6px', border: 'none', background: '#333', color: '#fff', fontWeight: 'bold' }}>⬅️ Voltar ao Sistema</button>
        <button onClick={() => window.print()} style={{ background: '#000', border: 'none', color: '#fff', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '6px' }}>🖨️ Imprimir Recibo de Venda</button>
      </div>

      <Folha id="area-venda">
        <HeaderPrint>
          <div className="loja-brand">
            <img src={logoImg} alt="GD CELL STORE" className="logo-circular" />
            <div>
              <h1>GD CELL STORE</h1>  
              <p style={{fontSize: '10px', color: '#666', margin: 0}}>RECIBO DE VENDA E ENTREGA</p>
            </div>
          </div>
          <div className="venda-badge">
            <h2>VENDA # {venda?.id || '0000'}</h2>
            <p>DATA: {venda?.data || new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </HeaderPrint>

        <Section>
          <h3>1. Dados do Cliente</h3>
          <div className="info-row"><span><strong>Nome:</strong> {clienteNome}</span></div>
          <div className="info-row">
            <span><strong>CPF:</strong> {clienteCpf}</span>
            <span><strong>Contato:</strong> {clienteTel}</span>
          </div>
        </Section>

        <Section>
          <h3>2. Descrição dos Itens</h3>
          <ItensTable>
            <thead>
              <tr>
                <th>Qtd</th>
                <th>Descrição do Produto / Modelo</th>
                <th style={{textAlign: 'right'}}>Preço Unit.</th>
                <th style={{textAlign: 'right'}}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item, index) => (
                <tr key={index}>
                  <td style={{width: '50px'}}>{item.quantidade}x</td>
                  <td>
                    <strong>{item.nome}</strong>
                    {/* 🛡️ BLINDAGEM: Exibe o IMEI na nota se for um aparelho */}
                    {item.imei && item.imei !== 'N/A' && (
                      <div style={{fontSize: '10px', color: '#555', marginTop: '4px'}}>
                        IMEI/SÉRIE: {item.imei}
                      </div>
                    )}
                  </td>
                  <td style={{textAlign: 'right'}}>R$ {(item.preco || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                  <td style={{textAlign: 'right'}}>R$ {((item.quantidade || 1) * (item.preco || 0)).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                </tr>
              ))}
              {venda?.desconto > 0 && (
                <>
                  <tr style={{background: '#fafafa', fontSize: '12px', borderBottom: '1px solid #eee'}}>
                    <td colSpan="3" style={{textAlign: 'right', padding: '10px'}}>SUBTOTAL BRUTO:</td>
                    <td style={{textAlign: 'right', color: '#666'}}>R$ {(venda?.subtotal || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                  </tr>
                  <tr style={{background: '#fafafa', fontSize: '12px', borderBottom: '1px solid #eee'}}>
                    <td colSpan="3" style={{textAlign: 'right', padding: '10px'}}>DESCONTO:</td>
                    <td style={{textAlign: 'right', color: '#ff4d4d'}}>- R$ {Number(venda.desconto).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                  </tr>
                </>
              )}
              <tr className="total-row">
                <td colSpan="3" style={{textAlign: 'right', padding: '20px 10px'}}>TOTAL DA VENDA:</td>
                <td style={{textAlign: 'right', color: '#000'}}>R$ {(venda?.total || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
              </tr>
            </tbody>
          </ItensTable>
        </Section>

        <Section>
          <h3>3. Forma de Pagamento</h3>
          <PagamentoBox>
            <span>Método utilizado:</span>
            <strong>{venda?.formaPagamento || 'Não especificado'}</strong>
          </PagamentoBox>
        </Section>

        {itens.some(i => String(i?.tipo || i?.tipoOriginal || '').toUpperCase() === 'IPHONE') && (
          <Section style={{marginTop: '40px'}}>
            <p style={{fontSize: '11px', color: '#777', textAlign: 'justify'}}>
              <strong>Garantia de Produtos:</strong> Aparelhos novos possuem 1 ano de garantia Apple. Aparelhos seminovos possuem 90 dias de garantia técnica GD CELL STORE para defeitos de fabricação (hardware). A garantia não cobre danos por queda, mau uso, contato com líquidos ou selo de garantia rompido.
            </p>
          </Section>
        )}

        <Assinaturas>
          <div>Assinatura do Comprador</div>
          <div>GD CELL STORE - Vendedor</div>
        </Assinaturas>

        <div style={{marginTop: '50px', textAlign: 'center', color: '#ccc', fontSize: '9px'}}>
          GD CELL STORE ERP - Documento gerado em {new Date().toLocaleString('pt-BR')}
        </div>
      </Folha>
    </ContainerA4>
  );
};

export default NotaVenda;
