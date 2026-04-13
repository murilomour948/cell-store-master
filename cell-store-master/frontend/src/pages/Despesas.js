import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { useEstoque } from '../contexts/EstoqueContext';
import { useDialog } from '../contexts/DialogContext';
import { FiDollarSign, FiTrash2, FiPlus, FiCalendar } from 'react-icons/fi';

// --- ESTILOS MANTIDOS E REFINADOS ---
const PageContainer = styled.div`padding: 40px; color: #fff; background-color: #0d0d0d; min-height: 100vh; @media (max-width: 768px) { padding: 16px; }`;
const Header = styled.div`margin-bottom: 40px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; @media (max-width: 768px) { margin-bottom: 20px; }`;
const Title = styled.h1`font-weight: 300; color: #ffffff; letter-spacing: 2px; text-transform: uppercase; font-size: 24px;`;

const SummaryGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px;`;
const StatCard = styled.div`
  background: #111; border: 1px solid #222; padding: 25px; border-radius: 12px; border-left: 4px solid ${props => props.c || '#ffffff'};
  small { color: #888; font-size: 10px; text-transform: uppercase; font-weight: bold; display: flex; align-items: center; gap: 5px; }
  h2 { font-size: 24px; margin-top: 8px; color: #fff; }
`;

const ContentGrid = styled.div`display: grid; grid-template-columns: 1fr 2fr; gap: 30px; @media (max-width: 900px) { grid-template-columns: 1fr; }`;

const FormCard = styled.div`
  background: #121212; padding: 30px; border-radius: 15px; border: 1px solid #333; height: fit-content; position: sticky; top: 20px;
  h3 { color: #ffffff; margin-bottom: 20px; font-weight: 400; font-size: 16px; text-transform: uppercase; }
  @media (max-width: 900px) { position: static; top: auto; padding: 16px; }
`;

const Input = styled.input`
  width: 100%; padding: 12px; background: #000; border: 1px solid #333; color: #fff;
  border-radius: 8px; margin-bottom: 15px; outline: none; transition: 0.3s;
  &:focus { border-color: #ffffff; box-shadow: 0 0 10px rgba(255, 255, 255, 0.1); }
`;

const Select = styled.select`
  width: 100%; padding: 12px; background: #000; border: 1px solid #333; color: #fff;
  border-radius: 8px; margin-bottom: 15px; outline: none; &:focus { border-color: #ffffff; }
`;

const BtnSalvar = styled.button`
  width: 100%; padding: 15px; background: linear-gradient(90deg, #ffffff, #f0f0f0); color: #000; border: none; border-radius: 8px;
  font-weight: bold; cursor: pointer; text-transform: uppercase; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px;
  &:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(255, 255, 255, 0.2); }
`;

const TabelaGastos = styled.div`
  background: #121212; border-radius: 15px; border: 1px solid #222; padding: 10px; overflow-x: auto;
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 15px; color: #666; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #222; }
  td { padding: 15px; border-bottom: 1px solid #1a1a1a; font-size: 14px; }
`;

const CategoriaBadge = styled.span`
  padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;
  background: rgba(255, 255, 255, 0.05); color: #aaa; border: 1px solid #333; text-transform: uppercase;
`;

const BtnDelete = styled.button`
  background: none; border: none; color: #444; cursor: pointer; transition: 0.3s;
  &:hover { color: #ff4d4d; transform: scale(1.2); }
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

const Despesas = () => {
  const { despesas, adicionarDespesa, removerDespesa } = useEstoque();
  const { showAlert, showConfirm } = useDialog();
  const [form, setForm] = useState({ descricao: '', valor: '', categoria: 'Fixo', data: new Date().toISOString().slice(0, 10) });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const listaOrdenada = useMemo(() => {
    return [...despesas].sort((a, b) => new Date(b.data) - new Date(a.data));
  }, [despesas]);

  const totalPages = Math.ceil(listaOrdenada.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return listaOrdenada.slice(indexOfFirstItem, indexOfLastItem);
  }, [listaOrdenada, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const totalMensal = useMemo(() => {
    const agora = new Date();
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();

    return despesas
      .filter(d => {
        const dataD = new Date(d.data);
        return dataD.getMonth() === mesAtual && dataD.getFullYear() === anoAtual;
      })
      .reduce((acc, d) => acc + (Number(d.valor) || 0), 0);
  }, [despesas]);

  const handleSalvar = async () => {
    if (!form.descricao || !form.valor) {
      await showAlert("Por favor, preencha a descrição e o valor da despesa.", "error", "Campos Incompletos");
      return;
    }
    adicionarDespesa(form);
    setForm({ descricao: '', valor: '', categoria: 'Fixo', data: new Date().toISOString().slice(0, 10) });
  };

  return (
    <PageContainer>
      <Header>
        <Title>Fluxo de Saídas</Title>
      </Header>

      <SummaryGrid>
        <StatCard c="#ff4d4d">
          <small><FiDollarSign /> Total Despesas (Mês)</small>
          <h2>R$ {totalMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
        </StatCard>
        <StatCard c="#ffffff">
          <small><FiCalendar /> Registros</small>
          <h2>{despesas.length} Lançamentos</h2>
        </StatCard>
      </SummaryGrid>

      <ContentGrid>
        <FormCard>
          <h3>Novo Lançamento</h3>
          <label style={{fontSize: '10px', color: '#888'}}>DESCRIÇÃO</label>
          <Input 
            placeholder="Ex: ALUGUEL DA LOJA" 
            value={form.descricao} 
            onChange={e => setForm({...form, descricao: e.target.value.toUpperCase()})} 
          />
          
          <label style={{fontSize: '10px', color: '#888'}}>VALOR (R$)</label>
          <Input 
            type="number" 
            placeholder="0.00" 
            value={form.valor} 
            onChange={e => setForm({...form, valor: e.target.value})} 
          />
          
          <label style={{fontSize: '10px', color: '#888'}}>CATEGORIA</label>
          <Select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}>
            <option value="Fixo">📌 Custo Fixo (Aluguel, Luz)</option>
            <option value="Variavel">💸 Custo Variável (Marketing)</option>
            <option value="Pessoal">👤 Pessoal (Comissões)</option>
            <option value="SalarioVendedor">👔 Salário do Vendedor</option>
            <option value="Estoque">📱 Reposição de Peças</option>
            <option value="Outros">Outros</option>
          </Select>

          <label style={{fontSize: '10px', color: '#888'}}>DATA DO PAGAMENTO</label>
          <Input type="date" value={form.data} onChange={e => setForm({...form, data: e.target.value})} />

          <BtnSalvar onClick={handleSalvar}><FiPlus /> Registrar Gasto</BtnSalvar>
        </FormCard>

        <TabelaGastos>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Valor</th>
                <th style={{textAlign: 'center'}}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(d => (
                <tr key={d.id}>
                  <td style={{color: '#666', fontSize: '12px'}}>{new Date(d.data + "T12:00:00").toLocaleDateString()}</td>
                  <td><strong>{d.descricao}</strong></td>
                  <td><CategoriaBadge>{d.categoria}</CategoriaBadge></td>
                  <td style={{color: '#ff4d4d', fontWeight: 'bold'}}>R$ {Number(d.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td style={{textAlign: 'center'}}>
                    <BtnDelete onClick={async () => {
                      if (await showConfirm("Excluir este lançamento financeiro permanentemente?", "Remover Despesa", "Excluir Gasto", "#ff4d4d")) {
                        removerDespesa(d.id);
                      }
                    }}>
                      <FiTrash2 size={18} />
                    </BtnDelete>
                  </td>
                </tr>
              ))}
              {despesas.length === 0 && (
                <tr>
                  <td colSpan="5" style={{textAlign:'center', padding: '60px', color: '#444'}}>
                    Nenhuma despesa lançada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

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
        </TabelaGastos>
      </ContentGrid>
    </PageContainer>
  );
};

export default Despesas;
