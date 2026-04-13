import React, { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { useEstoque } from '../contexts/EstoqueContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- ESTILOS LUXURY ---
const PageContainer = styled.div`padding: 40px; color: #fff; background-color: #0d0d0d; min-height: 100vh; @media (max-width: 768px) { padding: 16px; }`;
const Header = styled.div`margin-bottom: 40px; border-bottom: 1px solid #222; padding-bottom: 20px;`;
const Title = styled.h1`font-weight: 300; color: #ffffff; letter-spacing: 2px; text-transform: uppercase;`;

const TabNav = styled.div`display: flex; gap: 30px; margin-bottom: 30px;`;
const Tab = styled.button`
  background: none; border: none; color: ${props => props.active ? '#ffffff' : '#555'};
  font-weight: bold; cursor: pointer; padding: 10px 0; font-size: 14px;
  border-bottom: 2px solid ${props => props.active ? '#ffffff' : 'transparent'};
  transition: 0.3s; text-transform: uppercase; letter-spacing: 1px;
`;

const GridRelatorios = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;`;

const ReportCard = styled.div`
  background: #111; border: 1px solid #222; padding: 35px; border-radius: 20px; text-align: center;
  transition: 0.3s; &:hover { border-color: #ffffff; transform: translateY(-5px); }
  h2 { font-size: 18px; margin-bottom: 15px; color: #fff; font-weight: 400; }
  p { color: #666; font-size: 13px; margin-bottom: 25px; line-height: 1.6; }
`;

const Select = styled.select`
  width: 100%; padding: 12px; background: #000; border: 1px solid #333; color: #fff;
  border-radius: 8px; margin-bottom: 20px; outline: none; &:focus { border-color: #ffffff; }
`;

const DownloadBtn = styled.button`
  width: 100%; padding: 15px; background: linear-gradient(90deg, #ffffff, #f0f0f0);
  color: #000; border: none; border-radius: 10px; font-weight: bold; 
  text-transform: uppercase; cursor: pointer; transition: 0.2s;
  &:hover { box-shadow: 0 0 20px rgba(255, 255, 255, 0.2); }
`;

const LogTable = styled.table`
  width: 100%; border-collapse: collapse; background: #111; border-radius: 12px; overflow: hidden;
  th { text-align: left; padding: 15px; color: #ffffff; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #222; }
  td { padding: 15px; border-bottom: 1px solid #1a1a1a; font-size: 13px; color: #ccc; }
`;

const LogType = styled.span`
  font-size: 9px; font-weight: bold; padding: 3px 6px; border-radius: 4px;
  background: ${props => props.type === 'SALE' ? '#4caf5022' : props.type === 'DELETE' ? '#ff4d4d22' : '#2196f322'};
  color: ${props => props.type === 'SALE' ? '#4caf50' : props.type === 'DELETE' ? '#ff4d4d' : '#2196f3'};
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

const Relatorios = () => {
  const { vendas, despesas, logs, produtos, scooters, acessorios } = useEstoque();
  const [abaAtiva, setAbaAtiva] = useState('pdf');
  const [periodo, setPeriodo] = useState('MES');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const currentLogs = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return logs.slice(indexOfFirstItem, indexOfLastItem);
  }, [logs, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [abaAtiva]);

  const parseValue = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const valStr = String(val);
    if (valStr.includes('R$') || valStr.includes(',')) {
      const clean = valStr.replace(/[R$\s.]/g, "").replace(",", ".");
      return Number(clean) || 0;
    }
    const numericVal = Number(valStr);
    if (!isNaN(numericVal)) return numericVal;
    const cleanString = valStr.replace(/\D/g, "");
    return cleanString === "" ? 0 : Number(cleanString);
  };

  const gerarFechamentoGeral = () => {
    const doc = new jsPDF();
    const agora = new Date();
    const startOfToday = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const dataInicio = periodo === 'MES' ? new Date(agora.getFullYear(), agora.getMonth(), 1) : startOfToday;

    const vFiltradas = vendas.filter(v => new Date(v.dataVenda) >= dataInicio && (v.tipo || v.tipoOriginal) !== 'SCOOTER');
    const dFiltradas = despesas.filter(d => new Date(d.data) >= dataInicio);

    let totalVendas = 0, lucroOperacional = 0, totalTaxas = 0;

    vFiltradas.forEach(v => {
      const valB = parseValue(v.precoVenda || v.preco || v.valorCobrado);
      const cust = parseValue(v.precoCusto || v.custoPeca || v.custo);
      let txPerc = 0;
      const fPag = (v.formaPagamento || '').toUpperCase();
      if (fPag.includes('CRÉDITO') || fPag.includes('CREDITO')) txPerc = fPag.includes('10X') || fPag.includes('12X') ? 0.12 : 0.049;
      else if (fPag.includes('DÉBITO') || fPag.includes('DEBITO')) txPerc = 0.015;

      const tx = valB * txPerc;
      const lucV = valB - cust - tx;

      totalVendas += valB;
      totalTaxas += tx;
      lucroOperacional += lucV;
    });

    const totalDespesas = dFiltradas.reduce((acc, d) => acc + Number(d.valor), 0);
    const lucroLiquido = lucroOperacional - totalDespesas;

    doc.setFillColor(15, 15, 15); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text('GD CELL STORE', 15, 25);
    doc.setFontSize(10); doc.setTextColor(150); doc.text(`PERÍODO: ${periodo} | GERADO EM: ${agora.toLocaleString()}`, 15, 34);

    autoTable(doc, {
      startY: 50,
      head: [['INDICADOR', 'RESULTADO']],
      body: [
        ['FATURAMENTO BRUTO', `R$ ${totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['TOTAL DE TAXAS (MÁQUINA)', `R$ ${totalTaxas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['DESPESAS OPERACIONAIS P/ P.', `R$ ${totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['LUCRO LÍQUIDO FINAL', `R$ ${lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ],
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
      styles: { fontSize: 12, cellPadding: 8 }
    });

    doc.save(`Fechamento_GD_${periodo}_${agora.toLocaleDateString().replace(/\//g, '-')}.pdf`);
  };

  const gerarInventarioPDF = () => {
    const doc = new jsPDF();
    const agoraStr = new Date().toLocaleDateString().replace(/\//g, '-');
    doc.text('GD CELL STORE - INVENTÁRIO DE ESTOQUE ATIVO', 15, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${agoraStr}`, 15, 26);

    let somaPrecoUnitario = 0;
    let somaValorVendaTotal = 0;
    let totalUnidadesFisicas = 0;

    const bodyIphones = produtos.map(p => {
      const uP = parseValue(p.precoVenda || p.preco);
      somaPrecoUnitario += uP;
      somaValorVendaTotal += uP;
      totalUnidadesFisicas += 1;
      return ['IPHONE', p.modelo, '1', `R$ ${uP.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, `R$ ${uP.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`];
    });

    const bodyScooters = (scooters || []).filter(s => s.quantidade > 0).map(s => {
      const uP = parseValue(s.precoVenda);
      const qtd = Number(s.quantidade) || 0;
      const tP = uP * qtd;
      somaPrecoUnitario += uP;
      somaValorVendaTotal += tP;
      totalUnidadesFisicas += qtd;
      return ['SCOOTER', `${s.marca} ${s.modelo}`, String(qtd), `R$ ${uP.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, `R$ ${tP.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`];
    });

    const bodyAcessorios = (acessorios || [])
      .filter(a => Number(a.quantidade) > 0)
      .map(a => {
        const uP = parseValue(a.precoVenda || a.preco);
        const qtd = Number(a.quantidade) || 0;
        const tP = uP * qtd;
        somaPrecoUnitario += uP;
        somaValorVendaTotal += tP;
        totalUnidadesFisicas += qtd;
        const desc = a.categoria ? `${a.nome} (${a.categoria})` : a.nome;
        return ['ACESSÓRIO', desc, String(qtd), `R$ ${uP.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, `R$ ${tP.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`];
      });

    let body = [...bodyIphones, ...bodyScooters, ...bodyAcessorios];

    if (body.length === 0) {
      body.push(['-', 'Nenhum item em estoque', '0', '-', '-']);
    } else {
      body.push([
        'TOTAIS',
        '-',
        String(totalUnidadesFisicas),
        `R$ ${somaPrecoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${somaValorVendaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ]);
    }

    autoTable(doc, {
      startY: 32,
      head: [['CATEGORIA', 'MODELO / DESCRIÇÃO', 'QTD', 'VALOR UNITÁRIO', 'TOTAL DE VENDA']],
      body: body,
      headStyles: { fillColor: [50, 50, 50] },
      didParseCell: function (data) {
        if (data.row.raw[0] === 'TOTAIS') {
          data.cell.styles.fillColor = [20, 20, 20];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    doc.save(`Inventario_Estoque_GD_${agoraStr}.pdf`);
  };

  return (
    <PageContainer>
      <Header>
        <Title>Relatórios & Auditoria</Title>
        <p style={{ color: '#666', marginTop: '5px' }}>Exportação de dados fiscais e trilha de segurança.</p>
      </Header>

      <TabNav>
        <Tab active={abaAtiva === 'pdf'} onClick={() => setAbaAtiva('pdf')}>Documentos PDF</Tab>
        <Tab active={abaAtiva === 'logs'} onClick={() => setAbaAtiva('logs')}>Trilha de Auditoria (Logs)</Tab>
      </TabNav>

      {abaAtiva === 'pdf' ? (
        <GridRelatorios>
          <ReportCard>
            <div style={{ fontSize: '30px', marginBottom: '15px' }}>💰</div>
            <h2>Fechamento de Período</h2>
            <p>Relatório simplificado focado em faturamento líquido e despesas pagas.</p>
            <Select value={periodo} onChange={e => setPeriodo(e.target.value)}>
              <option value="MES">Mês Atual</option>
              <option value="HOJE">Movimentação de Hoje</option>
            </Select>
            <DownloadBtn onClick={gerarFechamentoGeral}>Baixar Fechamento</DownloadBtn>
          </ReportCard>

          <ReportCard>
            <div style={{ fontSize: '30px', marginBottom: '15px' }}>📦</div>
            <h2>Inventário de Ativos Gerais</h2>
            <p>Lista completa de todos os iPhones, Scooters e Acessórios/Peças disponíveis em estoque físico.</p>
            <DownloadBtn style={{ marginTop: '55px' }} onClick={gerarInventarioPDF}>Baixar Inventário</DownloadBtn>
          </ReportCard>
        </GridRelatorios>
      ) : (
        <div style={{ marginTop: '10px' }}>
          <LogTable>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Tipo</th>
                <th>Ação Executada</th>
              </tr>
            </thead>
            <tbody>
              {currentLogs.length > 0 ? currentLogs.map(log => (
                <tr key={log.id}>
                  <td style={{ color: '#666' }}>{log.data}</td>
                  <td><LogType type={log.type}>{log.type}</LogType></td>
                  <td>{log.mensagem}</td>
                </tr>
              )) : (
                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: '#444' }}>Nenhuma atividade registrada ainda.</td></tr>
              )}
            </tbody>
          </LogTable>

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
        </div>
      )}
    </PageContainer>
  );
};

export default Relatorios;
