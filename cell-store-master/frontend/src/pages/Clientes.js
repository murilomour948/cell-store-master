import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { useEstoque } from '../contexts/EstoqueContext';
import { FaTrash } from 'react-icons/fa';

const PageContainer = styled.div`padding: 40px; color: #fff; font-family: 'Segoe UI', sans-serif; background-color: #0d0d0d; min-height: 100vh; @media (max-width: 768px) { padding: 16px; }`;
const Header = styled.div`margin-bottom: 40px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;`;
const Title = styled.h1`font-weight: 300; color: #ffffff; letter-spacing: 1px; margin: 0;`;
const Subtitle = styled.p`color: #e0e0e0; margin-top: 5px; font-size: 15px;`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 220px;
  max-width: 420px;
  padding: 12px 20px;
  background: #121212;
  border: 1px solid #333;
  border-radius: 8px;
  color: #fff;
  outline: none;
  transition: all 0.3s;
  &:focus { border-color: #ffffff; box-shadow: 0 0 10px rgba(255, 255, 255, 0.1); }
`;

const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

const SelectFilter = styled.select`
  padding: 12px 20px;
  background: #121212;
  border: 1px solid #333;
  border-radius: 8px;
  color: #fff;
  outline: none;
  cursor: pointer;
  min-width: 190px;
  transition: all 0.3s;
  &:focus { border-color: #ffffff; box-shadow: 0 0 10px rgba(255, 255, 255, 0.1); }
`;

const TabelaContainer = styled.div`
  background: #121212; border-radius: 12px; border: 1px solid #222; overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  @media (max-width: 768px) { overflow-x: auto; }
`;

const Tabela = styled.table`
  width: 100%; border-collapse: collapse; text-align: left;
  th { background: #1a1a1a; padding: 18px 15px; color: #ffffff; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 2px solid #222; }
  td { padding: 18px 15px; border-bottom: 1px solid #222; color: #e0e0e0; font-size: 14px; }
  tr:hover { background: #181818; }
`;

const BadgeVip = styled.span`
  padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: bold; margin-left: 10px;
  background: linear-gradient(145deg, #ffffff, #f0f0f0); color: #000;
  text-transform: uppercase; box-shadow: 0 2px 5px rgba(255, 255, 255, 0.2);
`;

const ZapButton = styled.a`
  background: #25d366; color: #fff; padding: 8px 16px; border-radius: 6px; text-decoration: none;
  font-size: 12px; font-weight: bold; display: inline-flex; align-items: center; gap: 8px;
  transition: all 0.2s;
  &:hover { background: #128c7e; transform: scale(1.05); }
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

const NoData = styled.div`
  text-align: center; padding: 60px; color: #666;
  span { display: block; font-size: 40px; margin-bottom: 10px; }
`;

const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.85); display: flex; justify-content: center; align-items: center; z-index: 2000;
  backdrop-filter: blur(4px);
`;

const ModalBox = styled.div`
  background: #151515; padding: 35px; border-radius: 16px; width: 100%; max-width: 400px;
  border: 1px solid #333; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.8);
  animation: modalEnter 0.3s ease-out;
  @keyframes modalEnter { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
`;

const ModalTitle = styled.h2`color: #ff4d4d; margin-bottom: 15px; font-weight: 300; font-size: 22px; letter-spacing: 1px;`;
const ModalText = styled.p`color: #aaa; margin-bottom: 30px; line-height: 1.5; font-size: 14px;`;
const ModalBtnGroup = styled.div`display: flex; gap: 15px; justify-content: center;`;

const BtnConfirmar = styled.button`
  background: #ff4d4d; color: #fff; border: none; padding: 12px 25px; border-radius: 8px;
  font-weight: bold; cursor: pointer; transition: 0.2s;
  &:hover { background: #ff1a1a; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(255, 77, 77, 0.3); }
`;

const BtnCancelar = styled.button`
  background: #333; color: #fff; border: 1px solid #444; padding: 12px 25px; border-radius: 8px;
  font-weight: bold; cursor: pointer; transition: 0.2s;
  &:hover { background: #444; transform: translateY(-2px); border-color: #666; }
`;

const Clientes = () => {
  const { clientes, removerCliente, isAdmin } = useEstoque();
  const [busca, setBusca] = useState('');
  const [filtroValor, setFiltroValor] = useState('TODOS');
  const [filtroVip, setFiltroVip] = useState('TODOS');
  const [currentPage, setCurrentPage] = useState(1);
  const [clienteDeletar, setClienteDeletar] = useState(null);
  const itemsPerPage = 10;

  const formatMoeda = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const clientesFiltrados = useMemo(() => {
    const vipMin = 10000;
    return (clientes || [])
      .filter((c) => {
        const termo = busca.toLowerCase();
        const cpfBusca = busca.replace(/\D/g, '');
        const matchBusca =
          c.nome.toLowerCase().includes(termo) ||
          (c.telefone && c.telefone.includes(busca)) ||
          (c.cpf && (c.cpf.includes(busca) || (cpfBusca && c.cpf.replace(/\D/g, '').includes(cpfBusca))));

        const minGasto = filtroValor === 'TODOS' ? 0 : Number(filtroValor) || 0;
        const matchValor = (c.totalGasto || 0) >= minGasto;

        const isVipCliente = (c.totalGasto || 0) > vipMin;
        const matchVip =
          filtroVip === 'TODOS' ||
          (filtroVip === 'VIP' && isVipCliente) ||
          (filtroVip === 'NORMAL' && !isVipCliente);

        return matchBusca && matchValor && matchVip;
      })
      .sort((a, b) => b.totalGasto - a.totalGasto);
  }, [clientes, busca, filtroValor, filtroVip]);

  const totalPages = Math.ceil(clientesFiltrados.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return clientesFiltrados.slice(indexOfFirstItem, indexOfLastItem);
  }, [clientesFiltrados, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const confirmarDelecao = () => {
    if (clienteDeletar) {
      removerCliente(clienteDeletar.id, clienteDeletar.nome);
      setClienteDeletar(null);
    }
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [busca, filtroValor, filtroVip]);

  return (
    <PageContainer>
      <Header>
        <div>
          <Title>Base de Clientes (CRM)</Title>
          <Subtitle>Gestao de fidelidade e historico de faturamento por cliente.</Subtitle>
        </div>
        <FilterBar>
          <SearchInput
            placeholder="Buscar por nome, telefone ou CPF..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <SelectFilter value={filtroValor} onChange={(e) => setFiltroValor(e.target.value)}>
            <option value="TODOS">Todos os valores</option>
            <option value="1000">R$ 1.000+</option>
            <option value="5000">R$ 5.000+</option>
            <option value="10000">R$ 10.000+</option>
            <option value="20000">R$ 20.000+</option>
          </SelectFilter>
          <SelectFilter value={filtroVip} onChange={(e) => setFiltroVip(e.target.value)}>
            <option value="TODOS">Todos (VIP + Normal)</option>
            <option value="VIP">Apenas VIP</option>
            <option value="NORMAL">Apenas Normal</option>
          </SelectFilter>
        </FilterBar>
      </Header>

      <TabelaContainer>
        <Tabela>
          <thead>
            <tr>
              <th>Cliente / Origem</th>
              <th>WhatsApp</th>
              <th>Compras</th>
              <th>Total Gasto</th>
              <th>Nascimento</th>
              <th>Ultima Visita</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '15px' }}>{c.nome}</div>
                    <small style={{ color: '#888', fontSize: '11px' }}>
                      {c.origem || 'Balcão'}
                      {c.cpf ? ' - CPF ' + c.cpf : ''}
                    </small>
                    {c.totalGasto > 10000 && <BadgeVip>VIP</BadgeVip>}
                  </td>
                  <td>{c.telefone || <span style={{ color: '#444' }}>---</span>}</td>
                  <td>{c.qtdCompras} un.</td>
                  <td style={{ color: '#4caf50', fontWeight: 'bold' }}>{formatMoeda(c.totalGasto)}</td>
                  <td>{c.dataNascimento ? new Date(c.dataNascimento + 'T00:00:00').toLocaleDateString('pt-BR') : <span style={{ color: '#444' }}>---</span>}</td>
                  <td>{c.ultimaCompra ? new Date(c.ultimaCompra).toLocaleDateString('pt-BR') : '---'}</td>
                  <td style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {c.telefone && (
                      <ZapButton
                        href={`https://wa.me/55${c.telefone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        WhatsApp
                      </ZapButton>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => setClienteDeletar(c)}
                        style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center', transition: '0.2s' }}
                        title="Remover Cliente"
                        onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        <FaTrash size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">
                  <NoData>
                    <span>CRM</span>
                    <p>Nenhum cliente registrado. Realize uma venda no PDV para cadastrar automaticamente.</p>
                  </NoData>
                </td>
              </tr>
            )}
          </tbody>
        </Tabela>
      </TabelaContainer>

      {totalPages > 1 && (
        <PaginationContainer>
          <PageButton disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>
            ANTERIOR
          </PageButton>
          <PageInfo>Página {currentPage} de {totalPages}</PageInfo>
          <PageButton disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>
            PRÓXIMA
          </PageButton>
        </PaginationContainer>
      )}

      {clienteDeletar && (
        <ModalOverlay>
          <ModalBox>
            <div style={{ fontSize: '40px', marginBottom: '15px' }}>!</div>
            <ModalTitle>Atenção!</ModalTitle>
            <ModalText>
              Tem certeza que deseja apagar o cliente <strong style={{ color: '#fff' }}>{clienteDeletar.nome}</strong> da sua base do CRM? Esta ação é permanente e não poderá ser desfeita.
            </ModalText>
            <ModalBtnGroup>
              <BtnCancelar onClick={() => setClienteDeletar(null)}>Cancelar</BtnCancelar>
              <BtnConfirmar onClick={confirmarDelecao}>Sim, Excluir</BtnConfirmar>
            </ModalBtnGroup>
          </ModalBox>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default Clientes;
