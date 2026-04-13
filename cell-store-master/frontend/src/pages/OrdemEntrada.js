import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import logoImg from '../assets/GD3.png'; 

const GlobalPrintStyle = createGlobalStyle`
  @media print {
    body * { visibility: hidden !important; }
    #area-impressao, #area-impressao * { visibility: visible !important; }
    #area-impressao {
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
  .loja-info { font-size: 10px; color: #666; margin-top: 3px; }
  .os-numero { text-align: right; h2 { margin: 0; color: #000; font-size: 18px; } p { margin: 0; font-weight: bold; } }
`;

const Section = styled.div`
  margin-bottom: 20px;
  h3 { font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px; color: #000; letter-spacing: 1px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  p { font-size: 13px; margin: 4px 0; line-height: 1.4; }
  strong { color: #333; text-transform: uppercase; font-size: 11px; margin-right: 5px; }
`;

const ChecklistGrid = styled.div`
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #fafafa; padding: 12px; border: 1px dashed #ccc; border-radius: 4px;
  div { font-size: 11px; display: flex; align-items: center; gap: 5px; font-weight: bold; }
`;

const TermosLegais = styled.div`
  margin-top: 30px; padding: 15px; border: 1px solid #eee; border-radius: 6px;
  h4 { font-size: 11px; margin: 0 0 8px 0; text-transform: uppercase; color: #444; }
  p { font-size: 9px; color: #777; line-height: 1.4; text-align: justify; margin: 0; }
`;

const Assinaturas = styled.div`
  display: flex; justify-content: space-between; margin-top: 60px;
  div { width: 45%; border-top: 1px solid #000; text-align: center; font-size: 10px; padding-top: 8px; font-weight: bold; text-transform: uppercase; }
`;

const formatarData = (d) => d ? d.split('-').reverse().join('/') : '--/--/----';

const OrdemEntrada = ({ servico, onVoltar }) => {
  const check = servico.checklist || {};

  return (
    <ContainerA4>
      <GlobalPrintStyle />

      <div className="no-print" style={{ marginBottom: '20px' }}>
        <button onClick={onVoltar} style={{ padding: '10px 20px', cursor: 'pointer', marginRight: '10px', borderRadius: '6px', border: 'none', background: '#333', color: '#fff', fontWeight: 'bold' }}>⬅️ Voltar</button>
        <button onClick={() => window.print()} style={{ background: '#000', border: 'none', color: '#fff', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '6px' }}>🖨️ Imprimir Ordem de Entrada</button>
      </div>

      <Folha id="area-impressao">
        <HeaderPrint>
          <div className="loja-brand">
            <img src={logoImg} alt="GD CELL STORE" className="logo-circular" />
            <div>
              <h1>GD CELL STORE</h1>
              <div className="loja-info">
                SÃO PAULO - SP | WHATSAPP: (11) 99999-9999<br/>
                ASSISTÊNCIA TÉCNICA ESPECIALIZADA APPLE
              </div>
            </div>
          </div>
          <div className="os-numero">
            <h2>ENTRADA</h2>
            <p>OS: {servico.os}</p>
          </div>
        </HeaderPrint>

        <Section>
          <h3>1. Identificação do Cliente e Aparelho</h3>
          <div className="grid">
            <div>
              <p><strong>Cliente:</strong> {servico.cliente}</p>
              <p><strong>WhatsApp:</strong> {servico.telefone || 'N/A'}</p>
              <p><strong>CPF:</strong> {servico.cpf || 'N/A'}</p>
            </div>
            <div>
              <p><strong>Aparelho:</strong> {servico.aparelho}</p>
              <p><strong>IMEI/SÉRIE:</strong> {servico.imei || 'N/A'}</p>
              <p><strong>Senha:</strong> {servico.observacoes ? 'Sim (Ver Obs)' : 'Não informada'}</p>
            </div>
          </div>
        </Section>

        <Section>
          <h3>2. Prazos e Orçamento</h3>
          <p><strong>Data de Entrada:</strong> {formatarData(servico.dataEntrada)} | <strong>Previsão de Entrega:</strong> {formatarData(servico.prazoEntrega)}</p>
          <p><strong>Orçamento Estimado:</strong> <span style={{fontSize: '16px', fontWeight: 'bold'}}>{servico.preco}</span></p>
        </Section>

        <Section>
          <h3>3. Checklist e Defeito</h3>
          <ChecklistGrid>
            <div>{check.telaRiscada ? '❌' : '✅'} TELA</div>
            <div>{check.carcacaAmassada ? '❌' : '✅'} CARCAÇA</div>
            <div>{check.faceIdRuim ? '❌' : '✅'} BIOMETRIA</div>
            <div>{check.cameraMancha ? '❌' : '✅'} CÂMERAS</div>
          </ChecklistGrid>
          <p style={{marginTop: '10px'}}><strong>Defeito Relatado:</strong> {servico.defeito}</p>
        </Section>

        <Section>
          <h3>4. Observações Extras</h3>
          <p>{servico.observacoes || 'Sem observações adicionais.'}</p>
        </Section>

        <TermosLegais>
          <h4>Termos e Condições</h4>
          <p>
            1. A abertura do aparelho para análise técnica pode acarretar na perda da vedação original de fábrica contra água e poeira. 
            2. A GD CELL STORE não se responsabiliza por perda de dados; recomendamos que o cliente realize backup prévio. 
            3. Aparelhos com histórico de contato com líquidos podem não retornar ao estado funcional após a desmontagem. 
            4. Aparelhos não retirados em até 90 dias após o aviso de conclusão serão considerados abandonados, podendo ser descartados ou vendidos para custeio de peças (Art. 1.275 do Código Civil).
          </p>
        </TermosLegais>

        <Assinaturas>
          <div>Assinatura do Cliente</div>
          <div>GD CELL STORE - Responsável</div>
        </Assinaturas>

        <div style={{marginTop: '40px', textAlign: 'center', color: '#ccc', fontSize: '9px'}}>
          Documento gerado via GD CELL STORE ERP em {new Date().toLocaleString('pt-BR')}
        </div>
      </Folha>
    </ContainerA4>
  );
};

export default OrdemEntrada;