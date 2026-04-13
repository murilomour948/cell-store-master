import React from 'react';
import styled from 'styled-components';

const ContainerA4 = styled.div`
  background-color: #f4f4f4; min-height: 100vh; padding: 40px; display: flex; flex-direction: column; align-items: center;
  @media print { background-color: white; padding: 0; .no-print { display: none !important; } }
`;

const Folha = styled.div`
  background: white; width: 210mm; min-height: 297mm; padding: 20mm; box-shadow: 0 0 10px rgba(0,0,0,0.1); color: #000; font-family: Arial, sans-serif;
  @media print { box-shadow: none; margin: 0; padding: 10mm; width: 100%; }
`;

const HeaderPrint = styled.div`
  display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px;
  h1 { margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px; }
  h2 { margin: 0; color: #000; font-size: 20px; text-align: right; }
`;

const Section = styled.div`
  margin-bottom: 20px;
  h3 { font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px; color: #555; }
  p { font-size: 13px; margin: 6px 0; line-height: 1.5; }
`;

const ChecklistGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #fafafa; padding: 15px; border: 1px dashed #ccc; border-radius: 4px;
  div { font-size: 12px; font-weight: bold; }
`;

const TermosLegais = styled.div`
  background: #fafafa; padding: 15px; border: 1px solid #eee; margin-top: 20px; border-radius: 4px;
  p { font-size: 11px; text-align: justify; margin-bottom: 8px; color: #444; }
`;

const BotoesContainer = styled.div`display: flex; gap: 15px; margin-bottom: 20px;`;
const BotaoAcao = styled.button`
  background: ${props => props.primary ? '#000' : '#333'}; color: #fff;
  border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; text-transform: uppercase;
`;

const formatarData = (d) => d ? d.split('-').reverse().join('/') : '--/--/----';

const TermoGarantia = ({ servico, tipo, onVoltar }) => {
  const isEntrada = tipo === 'entrada';
  const check = servico.checklist || {};

  return (
    <ContainerA4>
      <BotoesContainer className="no-print">
        <BotaoAcao onClick={onVoltar}>⬅️ Voltar para o Sistema</BotaoAcao>
        <BotaoAcao primary onClick={() => window.print()}>🖨️ Imprimir / Salvar PDF</BotaoAcao>
      </BotoesContainer>

      <Folha>
        <HeaderPrint>
          <div><h1>GD CELL STORE</h1><p>Apple Specialists & High Tech Service</p></div>
          <div>
            <h2>{isEntrada ? 'ORDEM DE ENTRADA' : 'TERMO DE GARANTIA'}</h2>
            <p style={{textAlign:'right'}}><strong>OS:</strong> {servico.os}</p>
          </div>
        </HeaderPrint>

        <Section>
          <h3>1. Dados do Cliente e Aparelho</h3>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
            <div>
              <p><strong>Cliente:</strong> {servico.cliente}</p>
              <p><strong>Modelo:</strong> {servico.aparelho}</p>
              <p><strong>IMEI/Série:</strong> {servico.imei || 'Não Informado'}</p>
            </div>
            <div>
              <p><strong>Data de Entrada:</strong> {formatarData(servico.dataEntrada)}</p>
              {isEntrada ? (
                <p><strong>Prazo Estimado:</strong> {formatarData(servico.prazoEntrega)}</p>
              ) : (
                <p><strong>Data de Entrega:</strong> {new Date().toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </Section>

        {isEntrada && (
          <Section>
            <h3>2. Checklist Físico de Entrada</h3>
            <ChecklistGrid>
              <div><span style={{color: check.telaRiscada ? '#d9534f' : '#5cb85c'}}>{check.telaRiscada ? '❌ SIM' : '✅ NÃO'}</span> - Tela Riscada / Trincada</div>
              <div><span style={{color: check.carcacaAmassada ? '#d9534f' : '#5cb85c'}}>{check.carcacaAmassada ? '❌ SIM' : '✅ NÃO'}</span> - Carcaça Amassada</div>
              <div><span style={{color: check.faceIdRuim ? '#d9534f' : '#5cb85c'}}>{check.faceIdRuim ? '❌ SIM' : '✅ NÃO'}</span> - Face ID / Touch ID Defeito</div>
              <div><span style={{color: check.cameraMancha ? '#d9534f' : '#5cb85c'}}>{check.cameraMancha ? '❌ SIM' : '✅ NÃO'}</span> - Câmera com Mancha / Tremor</div>
            </ChecklistGrid>
          </Section>
        )}

        <Section>
          <h3>{isEntrada ? '3. Defeito Relatado e Observações' : '2. Descrição do Serviço e Cobertura'}</h3>
          <p><strong>{isEntrada ? 'Relato do Cliente:' : 'Serviço Realizado:'}</strong> {servico.defeito}</p>
          <p><strong>Observações Adicionais:</strong> {servico.observacoes || 'Nenhuma'}</p>
          <p><strong>Valor Total:</strong> {servico.preco}</p>
          {!isEntrada && (
            <p><strong>Validade da Garantia:</strong> {servico.diasGarantia} dias (Até {new Date(servico.dataGarantia).toLocaleDateString()})</p>
          )}
        </Section>

        <TermosLegais>
          <h3 style={{border:'none', fontSize:'12px', marginBottom:'5px'}}>Termos de Serviço e Condições Gerais</h3>
          {isEntrada ? (
            <p>1. Autorizo a abertura para análise técnica. 2. A GD CELL STORE não se responsabiliza por perda de dados (faça backup). 3. Aparelhos não retirados em 90 dias após conclusão serão descartados para custeio de despesas.</p>
          ) : (
            <p>1. Garantia legal de 90 dias exclusiva para a peça trocada/serviço feito. 2. A garantia é anulada em caso de queda, contato com líquido, umidade ou violação dos selos GD CELL STORE. 3. O cliente atesta que testou o aparelho na entrega.</p>
          )}
        </TermosLegais>

        <div style={{display:'flex', justifyContent:'space-between', marginTop: '60px'}}>
          <div style={{width:'40%', borderTop:'1px solid #000', textAlign:'center', fontSize:'11px', paddingTop:'8px'}}>Responsável GD CELL STORE</div>
          <div style={{width:'40%', borderTop:'1px solid #000', textAlign:'center', fontSize:'11px', paddingTop:'8px'}}>Assinatura do Cliente</div>
        </div>
      </Folha>
    </ContainerA4>
  );
};

export default TermoGarantia;