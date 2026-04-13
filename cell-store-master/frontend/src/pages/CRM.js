import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useEstoque } from '../contexts/EstoqueContext';
import { FaBirthdayCake, FaWhatsapp, FaHeadset } from 'react-icons/fa';

// --- ESTILOS ---
const PageContainer = styled.div`padding: 40px; color: #fff; background-color: #0d0d0d; min-height: 100vh; font-family: 'Segoe UI', sans-serif; @media (max-width: 768px) { padding: 16px; }`;
const Header = styled.div`margin-bottom: 40px; border-bottom: 1px solid #222; padding-bottom: 20px; @media (max-width: 768px) { margin-bottom: 20px; }`;
const Title = styled.h1`font-weight: 300; color: #ffffff; letter-spacing: 1px; margin: 0;`;
const Subtitle = styled.p`color: #e0e0e0; margin-top: 5px; font-size: 15px;`;

const CrmCard = styled.div`
  background: #111; border: 1px solid #333; border-radius: 12px; padding: 25px;
  display: flex; justify-content: space-between; align-items: center;
  transition: 0.3s;
  border-left: 4px solid ${props => props.color || '#ffffff'};
  &:hover { background: #1a1a1a; box-shadow: 0 5px 15px rgba(0,0,0,0.5); transform: translateY(-3px); border-color: ${props => props.color}; }
  @media (max-width: 768px) { flex-direction: column; align-items: flex-start; gap: 14px; }
`;

const CrmAcaoBtn = styled.a`
  background: ${props => props.color || '#25d366'}; color: #fff; padding: 10px 20px; 
  border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 13px;
  display: flex; align-items: center; gap: 8px; transition: 0.3s;
  &:hover { filter: brightness(1.2); transform: scale(1.05); }
  @media (max-width: 768px) { width: 100%; justify-content: center; }
`;

const NoData = styled.div`
  background: #111; border: 1px dashed #333; border-radius: 12px; padding: 60px; text-align: center;
  p { color: #888; font-size: 14px; margin-top: 10px; }
  h3 { color: #fff; font-weight: 400; margin-top: 20px;}
  font-size: 50px;
`;

const PaginationContainer = styled.div`
  display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 40px; width: 100%; grid-column: 1 / -1;
`;
const PageButton = styled.button`
  background: #1a1a1a; border: 1px solid #333; color: #fff; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.3s;
  &:hover:not(:disabled) { border-color: #ffffff; color: #ffffff; transform: translateY(-2px); }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`;
const PageInfo = styled.span`color: #888; font-size: 14px; letter-spacing: 1px;`;

const CRM = () => {
  const { clientes, vendas } = useEstoque();

  const acoesCRM = useMemo(() => {
    const hoje = new Date();
    const mapM = hoje.getMonth();
    const mapD = hoje.getDate();

    const aniversariantes = (clientes || []).filter(c => {
      if (!c.dataNascimento) return false;
      const dNasc = new Date(c.dataNascimento+'T00:00:00');
      return dNasc.getMonth() === mapM && dNasc.getDate() === mapD;
    });

    const mapPosVendas = new Map();
    (vendas || []).forEach(v => {
      if (v.cliente === 'CONSUMIDOR') return;
      const dv = new Date(v.dataVenda);
      const diasPassados = Math.floor((hoje - dv) / 86400000);
      if (diasPassados >= 30 && diasPassados <= 31) {
        if (!mapPosVendas.has(v.cliente)) {
          mapPosVendas.set(v.cliente, v);
        }
      }
    });

    return {
      aniversariantes,
      posVendas: Array.from(mapPosVendas.values())
    };
  }, [clientes, vendas]);

  const todosItens = useMemo(() => {
    const list = [];
    acoesCRM.aniversariantes.forEach(c => list.push({ tipo: 'ANIVERSARIO', id: c.id, item: c }));
    acoesCRM.posVendas.forEach(v => list.push({ tipo: 'POS_VENDA', id: v.id, item: v }));
    return list;
  }, [acoesCRM]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(todosItens.length / itemsPerPage);

  const currentItems = useMemo(() => {
    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    return todosItens.slice(indexOfFirst, indexOfLast);
  }, [todosItens, currentPage]);

  return (
    <PageContainer>
      <Header>
        <Title>Central de Ações CRM 🤖</Title>
        <Subtitle>Máquina automática de relacionamento ativo com os clientes e fidelização.</Subtitle>
      </Header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        {todosItens.length === 0 && (
          <NoData style={{ gridColumn: '1 / -1' }}>
            <span>✨</span>
            <h3>Tudo limpo por aqui!</h3>
            <p>Nenhuma ação de CRM pendente para o dia de hoje. Excelente trabalho!</p>
          </NoData>
        )}

        {currentItems.map((obj, i) => {
          if (obj.tipo === 'ANIVERSARIO') {
            const c = obj.item;
            return (
              <CrmCard key={`aniv-${c.id}-${i}`} color="#e91e63">
                <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                   <div style={{background: 'rgba(233, 30, 99, 0.1)', padding:'15px', borderRadius:'50%'}}>
                     <FaBirthdayCake size={24} color="#e91e63" />
                   </div>
                   <div>
                      <h4 style={{margin:0, color:'#fff'}}>{c.nome}</h4>
                      <p style={{margin:0, color:'#888', fontSize:'12px'}}>Aniversariante (Hoje)</p>
                   </div>
                </div>
                {c.telefone && (
                   <CrmAcaoBtn 
                      href={`https://wa.me/55${c.telefone.replace(/\D/g, '')}?text=Parabéns, ${c.nome.split(' ')[0]}! Feliz aniversário! 🎂 Desejamos muita paz, saúde e sucesso. Aproveite muito o seu dia! - Equipe GD CELL STORE`} 
                      target="_blank"
                   >
                      <FaWhatsapp size={16} /> Parabenizar
                   </CrmAcaoBtn>
                )}
              </CrmCard>
            );
          } else {
            const v = obj.item;
            return (
              <CrmCard key={`pos-${v.id}-${i}`} color="#2196f3">
                <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                   <div style={{background: 'rgba(33, 150, 243, 0.1)', padding:'15px', borderRadius:'50%'}}>
                     <FaHeadset size={24} color="#2196f3" />
                   </div>
                   <div>
                      <h4 style={{margin:0, color:'#fff'}}>{v.cliente}</h4>
                      <p style={{margin:0, color:'#888', fontSize:'12px'}}>Pós-Venda: {v.modelo || v.nome} (30 dias)</p>
                   </div>
                </div>
                {v.telefone && (
                   <CrmAcaoBtn 
                      color="#2196f3"
                      href={`https://wa.me/55${v.telefone.replace(/\D/g, '')}?text=Olá, ${v.cliente.split(' ')[0]}! Tudo bem? Fazem 30 dias que comprou seu ${v.modelo || v.nome} conosco. Como está sendo a experiência? Está tudo perfeito? Qualquer dúvida estamos por aqui!`} 
                      target="_blank"
                   >
                      <FaWhatsapp size={16} /> Acompanhar
                   </CrmAcaoBtn>
                )}
              </CrmCard>
            );
          }
        })}
        
        {totalPages > 1 && (
          <PaginationContainer>
            <PageButton disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>
              ANTERIOR
            </PageButton>
            <PageInfo>Página {currentPage} de {totalPages}</PageInfo>
            <PageButton disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>
              PRÓXIMA
            </PageButton>
          </PaginationContainer>
        )}
      </div>
    </PageContainer>
  );
};

export default CRM;
