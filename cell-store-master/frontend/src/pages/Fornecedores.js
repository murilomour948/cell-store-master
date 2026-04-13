import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useDialog } from '../contexts/DialogContext';
import { useEstoque } from '../contexts/EstoqueContext';

const PageContainer = styled.div`padding: 40px; color: #fff; min-height: 100vh; @media (max-width: 768px) { padding: 16px; }`;
const Header = styled.div`margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; flex-wrap: wrap; @media (max-width: 768px) { margin-bottom: 20px; }`;
const Title = styled.h1`font-weight: 300; color: #ffffff; letter-spacing: 1px; margin: 0 0 5px 0;`;
const Subtitle = styled.p`color: #a0a0a0; margin: 0; font-size: 14px;`;

const TopBar = styled.div`display: flex; gap: 20px; margin-bottom: 30px; background: #121212; padding: 20px; border-radius: 12px; border: 1px solid #222; flex-wrap: wrap; @media (max-width: 768px) { padding: 16px; gap: 12px; }`;
const InputGroup = styled.div`flex: ${(props) => props.flex || 1}; display: flex; flex-direction: column; gap: 8px;`;
const Label = styled.label`font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px;`;
const Input = styled.input`padding: 12px; background: #0a0a0a; border: 1px solid #333; color: #fff; border-radius: 8px; outline: none; &:focus { border-color: #ffffff; }`;
const Select = styled.select`padding: 12px; background: #0a0a0a; border: 1px solid #333; color: #fff; border-radius: 8px; outline: none; &:focus { border-color: #ffffff; }`;

const AddButton = styled.button`
  background: #ffffff; color: #000; border: none; padding: 0 25px; border-radius: 8px;
  font-weight: bold; cursor: pointer; height: 43px; margin-top: auto; transition: all 0.2s;
  &:hover { background: #f0f0f0; transform: translateY(-2px); }
  &:disabled { background: #333; color: #666; cursor: not-allowed; transform: none; }
  @media (max-width: 768px) { width: 100%; }
`;

const SearchBar = styled.input`
  width: 100%; padding: 15px; background: #121212; border: 1px solid #333; color: #fff;
  border-radius: 12px; margin-bottom: 20px; outline: none; font-size: 15px;
  &:focus { border-color: #ffffff; }
`;

const TableContainer = styled.div`background: #121212; border-radius: 12px; border: 1px solid #222; overflow: hidden; @media (max-width: 768px) { overflow-x: auto; }`;
const Table = styled.table`width: 100%; border-collapse: collapse; text-align: left;`;
const Th = styled.th`padding: 15px; background: #1a1a1a; color: #888; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #333;`;
const Td = styled.td`padding: 15px; border-bottom: 1px solid #222; font-size: 13px;`;

const ZapButton = styled.a`
  display: inline-flex; align-items: center; gap: 8px; background: rgba(37, 211, 102, 0.1);
  color: #25D366; padding: 8px 15px; border-radius: 6px; text-decoration: none;
  font-weight: bold; font-size: 12px; border: 1px solid rgba(37, 211, 102, 0.3); transition: all 0.2s;
  &:hover { background: #25D366; color: #000; }
`;

const DelButton = styled.button`
  background: none; border: none; color: #ff4d4d; cursor: pointer; font-size: 16px; margin-left: 15px;
  opacity: 0.5; transition: opacity 0.2s; &:hover { opacity: 1; }
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

const formatarTelefone = (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');

const Fornecedores = () => {
  const { fornecedores, salvarFornecedor, importarFornecedores, removerFornecedor } = useEstoque();
  const [busca, setBusca] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [migracaoIniciada, setMigracaoIniciada] = useState(false);
  const [migracaoConcluida, setMigracaoConcluida] = useState(false);
  const itemsPerPage = 10;
  const { showConfirm } = useDialog();

  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('Aparelhos');
  const [telefone, setTelefone] = useState('');

  useEffect(() => {
    if (migracaoConcluida || migracaoIniciada) return;

    setMigracaoIniciada(true);
    const salvos = localStorage.getItem('@MRImports:fornecedores');
    if (!salvos) {
      setMigracaoConcluida(true);
      return;
    }

    let antigos = [];
    try {
      antigos = JSON.parse(salvos);
    } catch (error) {
      console.error('Falha ao ler fornecedores legados do navegador:', error);
      localStorage.removeItem('@MRImports:fornecedores');
      setMigracaoConcluida(true);
      return;
    }

    if (!Array.isArray(antigos) || antigos.length === 0) {
      localStorage.removeItem('@MRImports:fornecedores');
      setMigracaoConcluida(true);
      return;
    }

    let ativo = true;
    const migrar = async () => {
      try {
        await importarFornecedores(antigos);
        localStorage.removeItem('@MRImports:fornecedores');
      } catch (error) {
        console.error('Falha ao migrar fornecedores legados:', error);
      } finally {
        if (ativo) setMigracaoConcluida(true);
      }
    };

    migrar();
    return () => {
      ativo = false;
    };
  }, [importarFornecedores, migracaoConcluida, migracaoIniciada]);

  const handleSalvarFornecedor = async () => {
    if (!nome || !telefone) return;

    const novo = {
      id: Date.now(),
      nome: nome.toUpperCase(),
      categoria,
      telefone
    };

    const fornecedorSalvo = await salvarFornecedor(novo);
    if (!fornecedorSalvo) return;

    setNome('');
    setTelefone('');
  };

  const handleRemoverFornecedor = async (id) => {
    if (await showConfirm('Deseja excluir este fornecedor permanentemente de sua lista de contatos?', 'Remover Fornecedor', 'Excluir', '#ff4d4d')) {
      await removerFornecedor(id);
    }
  };

  const fornecedoresFiltrados = useMemo(() => {
    const termo = busca.toUpperCase();
    return fornecedores
      .filter((f) => f.nome.includes(termo) || f.categoria.toUpperCase().includes(termo))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [fornecedores, busca]);

  const totalPages = Math.ceil(fornecedoresFiltrados.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return fornecedoresFiltrados.slice(indexOfFirstItem, indexOfLastItem);
  }, [fornecedoresFiltrados, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [busca]);

  const formValido = nome.trim().length > 2 && telefone.length >= 14;

  return (
    <PageContainer>
      <Header>
        <div>
          <Title>Fornecedores e Parceiros</Title>
          <Subtitle>Gerencie os contatos de atacado para reposição de estoque.</Subtitle>
        </div>
      </Header>

      <TopBar>
        <InputGroup flex={2}>
          <Label>Nome do Fornecedor ou Empresa</Label>
          <Input placeholder="Ex: Mega Eletrônicos SP" value={nome} onChange={(e) => setNome(e.target.value)} />
        </InputGroup>

        <InputGroup flex={1}>
          <Label>Especialidade</Label>
          <Select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="Aparelhos">iPhones / Aparelhos</option>
            <option value="Pecas">Peças (Telas, Baterias)</option>
            <option value="Acessorios">Acessórios (Capas, Cabos)</option>
            <option value="Servicos">Terceirização de Placa</option>
          </Select>
        </InputGroup>

        <InputGroup flex={1}>
          <Label>WhatsApp</Label>
          <Input placeholder="(00) 00000-0000" value={telefone} onChange={(e) => setTelefone(formatarTelefone(e.target.value))} maxLength={15} />
        </InputGroup>

        <AddButton onClick={handleSalvarFornecedor} disabled={!formValido}>
          + Salvar Contato
        </AddButton>
      </TopBar>

      <SearchBar
        placeholder="Buscar contato por nome ou especialidade..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <TableContainer>
        <Table>
          <thead>
            <tr>
              <Th>Empresa / Contato</Th>
              <Th>Especialidade</Th>
              <Th>WhatsApp</Th>
              <Th style={{ textAlign: 'right' }}>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <Td colSpan="4" style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                  Nenhum fornecedor encontrado.
                </Td>
              </tr>
            ) : (
              currentItems.map((forn) => {
                const numeroLimpo = forn.telefone.replace(/\D/g, '');
                const linkZap = `https://wa.me/55${numeroLimpo}`;

                return (
                  <tr key={forn.id}>
                    <Td><strong>{forn.nome}</strong></Td>
                    <Td><span style={{ color: '#ffffff' }}>{forn.categoria}</span></Td>
                    <Td>{forn.telefone}</Td>
                    <Td style={{ textAlign: 'right' }}>
                      <ZapButton href={linkZap} target="_blank" rel="noopener noreferrer">
                        Chamar
                      </ZapButton>
                      <DelButton onClick={() => handleRemoverFornecedor(forn.id)}>x</DelButton>
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </TableContainer>

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
    </PageContainer>
  );
};

export default Fornecedores;
