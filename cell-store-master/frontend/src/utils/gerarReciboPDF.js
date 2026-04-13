import { jsPDF } from "jspdf";

export const gerarRecibo = (venda) => {
  // Cria um documento A4 padrão
  const doc = new jsPDF();

  // --- CABEÇALHO (Logo e Nome) ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(0, 0, 0); // Preto
  doc.text("MR IMPORTS", 105, 25, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100); // Cinza
  doc.text("Garantia de Qualidade e Procedência", 105, 32, { align: "center" });
  
  // Linha divisória
  doc.setLineWidth(0.5);
  doc.setDrawColor(0, 0, 0);
  doc.line(20, 40, 190, 40);

  // --- TÍTULO ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("RECIBO DE VENDA", 105, 55, { align: "center" });

  // --- DADOS DO CLIENTE E VENDA ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  
  const dataFormatada = new Date(venda.dataVenda).toLocaleDateString('pt-BR');
  
  doc.text(`Data da Compra: ${dataFormatada}`, 20, 75);
  doc.text(`Cliente: ${venda.cliente || 'Consumidor Final'}`, 20, 85);
  if (venda.telefone) doc.text(`Telefone: ${venda.telefone}`, 20, 95);

  // --- CAIXA DE DETALHES DO PRODUTO ---
  doc.setFillColor(250, 250, 250); // Fundo cinza bem claro
  doc.setDrawColor(200, 200, 200);
  doc.rect(20, 105, 170, 50, "FD"); // Retângulo preenchido e com borda

  doc.setFont("helvetica", "bold");
  doc.text("Detalhes do Item:", 25, 115);

  doc.setFont("helvetica", "normal");
  doc.text(`Produto: ${venda.modelo || venda.nome || 'Aparelho/Acessório'}`, 25, 125);
  if (venda.imei) doc.text(`IMEI/Número de Série: ${venda.imei}`, 25, 135);
  doc.text(`Garantia: ${venda.garantia || '90 dias (Padrão Legal)'}`, 25, 145);

  // --- VALOR TOTAL ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  
  // Tenta formatar o valor corretamente (lidando com números ou strings)
  let valorLimpo = venda.precoVenda || venda.valorCobrado || 0;
  if (typeof valorLimpo !== 'number') {
      valorLimpo = Number(String(valorLimpo).replace(/\D/g, "")) / 100;
  }
  
  doc.text(`TOTAL PAGO: R$ ${valorLimpo.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 190, 175, { align: "right" });

  // --- ASSINATURA E RODAPÉ ---
  doc.setLineWidth(0.5);
  doc.setDrawColor(0, 0, 0);
  doc.line(65, 230, 145, 230); // Linha de assinatura
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("MR IMPORTS", 105, 238, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text("Este documento é válido como comprovante de compra e garantia.", 105, 275, { align: "center" });
  doc.text("Obrigado pela preferência!", 105, 282, { align: "center" });

  // --- SALVAR O ARQUIVO ---
  // Gera um nome de arquivo automático (Ex: Recibo_MR_IMPORTS_Joao_Silva.pdf)
  const nomeArquivo = venda.cliente ? venda.cliente.replace(/\s+/g, '_') : 'Avulso';
  doc.save(`Recibo_MR_IMPORTS_${nomeArquivo}.pdf`);
};