import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import logoImg from '../assets/GD3.png'; 

// --- MÁGICA DE IMPRESSÃO (IGUAL À ENTRADA PARA MANTER O PADRÃO) ---
const GlobalPrintStyle = createGlobalStyle`
  @media print {
    body * { visibility: hidden !important; }
    #area-garantia, #area-garantia * { visibility: visible !important; }
    #area-garantia {
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
  @media print { width: 100%; height: auto; padding: 10mm; }
`;

const HeaderPrint = styled.div`
  display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 25px;
  .loja-brand { display: flex; align-items: center; gap: 15px; }
  .logo-circular { width: 70px; height: 70px; border-radius: 50%; border: 1px solid #000; object-fit: cover; }
  h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; }
  .os-badge { background: #000; color: #fff; padding: 5px 15px; border-radius: 4px; font-weight: bold; font-size: 14px; }
`;

const Section = styled.div`
  margin-bottom: 25px;
  h3 { font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 12px; color: #000; letter-spacing: 1px; }
  p { font-size: 14px; margin: 6px 0; line-height: 1.5; }
  strong { color: #333; text-transform: uppercase; font-size: 11px; margin-right: 5px; }
  .destaque-data { font-size: 20px; font-weight: bold; color: #000; margin-top: 10px; border: 1px dashed #000; padding: 10px; display: inline-block; border-radius: 6px; }
`;

const TermosBox = styled.div`
  background: #fdfdfd; border: 1px solid #eee; padding: 15px; border-radius: 6px; margin-top: 20px;
  h4 { font-size: 11px; margin: 0 0 10px 0; text-transform: uppercase; color: #444; border-bottom: 1px solid #eee; padding-bottom: 5px; }
  ul { padding-left: 18px; margin: 0; }
  li { font-size: 10px; color: #555; margin-bottom: 6px; line-height: 1.4; text-align: justify; }
`;

const Assinaturas = styled.div`
  display: flex; justify-content: space-between; margin-top: 80px;
  div { width: 45%; border-top: 1px solid #000; text-align: center; font-size: 10px; padding-top: 8px; font-weight: bold; text-transform: uppercase; }
`;

const formatarData = (d) => {
  if (!d) return '--/--/----';
  const data = new Date(d);
  return data.toLocaleDateString('pt-BR');
};

const TermoGarantiaFinal = ({ servico, onVoltar }) => {
  return (
    <ContainerA4>
      <GlobalPrintStyle />

      <div className="no-print" style={{ marginBottom: '20px' }}>
        <button onClick={onVoltar} style={{ padding: '10px 20px', cursor: 'pointer', marginRight: '10px', borderRadius: '6px', border: 'none', background: '#333', color: '#fff', fontWeight: 'bold' }}>⬅️ Voltar ao Sistema</button>
        <button onClick={() => window.print()} style={{ background: '#000', border: 'none', color: '#fff', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '6px' }}>🖨️ Imprimir Certificado de Garantia</button>
      </div>

      <Folha id="area-garantia">
        <HeaderPrint>
          <div className="loja-brand">
            <img src={logoImg} alt="GD CELL STORE" className="logo-circular" />
            <div>
              <h1>GD CELL STORE</h1>
              <p style={{fontSize: '10px', color: '#666', margin: 0}}>CERTIFICADO DE ENTREGA E GARANTIA</p>
            </div>
          </div>
          <div className="os-badge">OS: {servico.os}</div>
        </HeaderPrint>

        <Section>
          <p>Confirmamos a entrega do aparelho abaixo relacionado, devidamente revisado e com os serviços técnicos concluídos conforme solicitação do cliente.</p>
        </Section>

        <Section>
          <h3>1. Detalhes do Dispositivo e Serviço</h3>
          <p><strong>Cliente:</strong> {servico.cliente}</p>
          <p><strong>Aparelho:</strong> {servico.aparelho}</p>
          <p><strong>IMEI/SÉRIE:</strong> {servico.imei || 'N/A'}</p>
          <p><strong>Serviço Realizado:</strong> {servico.defeito}</p>
          <p><strong>Valor Pago:</strong> {servico.preco}</p>
        </Section>

        <Section>
          <h3>2. Validade da Garantia</h3>
          <p>O serviço acima descrito possui garantia técnica válida até:</p>
          <div className="destaque-data">{formatarData(servico.dataGarantia)}</div>
        </Section>

        <TermosBox>
          <h4>🛡️ Condições de Uso da Garantia</h4>
          <ul>
            <li>A garantia cobre exclusivamente o componente substituído ou o reparo específico efetuado pela GD CELL STORE.</li>
            <li><strong>PERDA DE GARANTIA:</strong> Ocorrerá de forma imediata em casos de danos físicos (quebras, trincas), pressão excessiva na tela, contato com líquidos (independente da certificação de resistência do aparelho) ou tentativa de reparo por terceiros.</li>
            <li>A violação ou remoção do selo de garantia interno invalidará este certificado permanentemente.</li>
            <li>Esta garantia não cobre falhas decorrentes de atualizações de software ou problemas em componentes não manuseados durante este serviço.</li>
          </ul>
        </TermosBox>

        <Section style={{marginTop: '30px'}}>
          <p style={{fontSize: '11px', textAlign: 'center'}}>
            "Qualidade e transparência na palma da sua mão."
          </p>
        </Section>

        <Assinaturas>
          <div>Assinatura do Cliente</div>
          <div>GD CELL STORE</div>
        </Assinaturas>

        <div style={{marginTop: '50px', textAlign: 'center', color: '#ccc', fontSize: '9px'}}>
          Documento emitido em {new Date().toLocaleString('pt-BR')} via GD CELL STORE ERP.
        </div>
      </Folha>
    </ContainerA4>
  );
};

export default TermoGarantiaFinal;