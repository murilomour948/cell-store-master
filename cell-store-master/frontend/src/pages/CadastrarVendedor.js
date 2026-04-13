import React, { useState } from 'react';
import styled from 'styled-components';
import { useEstoque } from '../contexts/EstoqueContext';
import { useDialog } from '../contexts/DialogContext';

const PageContainer = styled.div`
  padding: 40px;
  color: #fff;
  background-color: #0d0d0d;
  min-height: 100vh;
  @media (max-width: 768px) { padding: 16px; }
`;

const Header = styled.div`
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-weight: 300;
  color: #ffffff;
  letter-spacing: 1px;
  margin: 0;
`;

const Subtitle = styled.p`
  color: #a0a0a0;
  margin-top: 5px;
  font-size: 14px;
`;

const FormContainer = styled.div`
  background: #121212;
  border: 1px solid #222;
  border-radius: 15px;
  padding: 30px;
  max-width: 600px;
  margin-bottom: 40px;
  @media (max-width: 768px) { padding: 16px; max-width: 100%; }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 11px;
  color: #ffffff;
  text-transform: uppercase;
  margin-bottom: 8px;
  font-weight: bold;
  letter-spacing: 1px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 15px;
  background: #0a0a0a;
  border: 1px solid #333;
  border-radius: 8px;
  color: #fff;
  outline: none;
  transition: border-color 0.3s;
  &:focus { border-color: #ffffff; }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 15px;
  background: #0a0a0a;
  border: 1px solid #333;
  border-radius: 8px;
  color: #fff;
  outline: none;
  &:focus { border-color: #ffffff; }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 15px;
  background: linear-gradient(145deg, #ffffff, #f0f0f0);
  color: #000;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: 0.3s;
  &:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(255, 255, 255, 0.2); }
  &:disabled { background: #333; color: #666; cursor: not-allowed; transform: none; }
`;

const UsersTableContainer = styled.div`
  background: #121212;
  border: 1px solid #222;
  border-radius: 15px;
  overflow: hidden;
  @media (max-width: 768px) { overflow-x: auto; }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
`;

const Th = styled.th`
  padding: 15px 20px;
  background: #1a1a1a;
  color: #888;
  font-size: 11px;
  text-transform: uppercase;
  border-bottom: 1px solid #333;
`;

const Td = styled.td`
  padding: 15px 20px;
  color: #ccc;
  font-size: 14px;
  border-bottom: 1px solid #222;
`;

const Badge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  background: ${props => props.active === '0' ? 'rgba(255, 77, 77, 0.1)' : (props.role === 'ADMIN' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(33, 150, 243, 0.1)')};
  color: ${props => props.active === '0' ? '#ff4d4d' : (props.role === 'ADMIN' ? '#ffffff' : '#2196f3')};
  border: 1px solid ${props => props.active === '0' ? '#ff4d4d44' : (props.role === 'ADMIN' ? '#ffffff44' : '#2196f344')};
  opacity: ${props => props.active === '0' ? '0.7' : '1'};
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  background: transparent;
  border: 1px solid ${props => props.color || '#ff4d4d'};
  color: ${props => props.color || '#ff4d4d'};
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: 0.2s;
  &:hover { background: ${props => props.color || '#ff4d4d'}; color: #fff; }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`;

const FilterBar = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  background: #121212;
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #222;
  flex-wrap: wrap;
`;

const SearchInput = styled.input`
  flex: 2;
  padding: 10px 15px;
  background: #0a0a0a;
  border: 1px solid #333;
  border-radius: 6px;
  color: #fff;
  outline: none;
  &:focus { border-color: #ffffff; }
`;

const FilterSelect = styled.select`
  flex: 1;
  padding: 10px 15px;
  background: #0a0a0a;
  border: 1px solid #333;
  border-radius: 6px;
  color: #fff;
  outline: none;
  &:focus { border-color: #ffffff; }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
  padding: 15px;
`;

const PageButton = styled.button`
  background: #1a1a1a;
  border: 1px solid #333;
  color: #fff;
  padding: 8px 15px;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.2s;
  &:hover:not(:disabled) { border-color: #ffffff; color: #ffffff; }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`;

const PageInfo = styled.span`
  color: #888;
  font-size: 13px;
`;

// --- NOVOS ESTILOS PARA MODAIS MODERNOS ---
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(5px);
  padding: 10px;
`;

const ModalContent = styled.div`
  background: #151515;
  padding: 30px;
  border-radius: 15px;
  width: 100%;
  max-width: 400px;
  border: 1px solid #333;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);
  animation: fadeIn 0.3s ease-out;
  @media (max-width: 768px) { padding: 16px; }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const ModalTitle = styled.h3`
  color: #ffffff;
  margin-bottom: 15px;
  font-weight: 400;
  letter-spacing: 1px;
`;

const ModalText = styled.p`
  color: #ccc;
  margin-bottom: 25px;
  font-size: 14px;
  line-height: 1.5;
`;

const ModalButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

const ConfirmButton = styled.button`
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  background: ${props => props.danger ? '#ff4d4d' : '#ffffff'};
  color: #000;
  font-weight: bold;
  cursor: pointer;
  transition: 0.2s;
  &:hover { opacity: 0.8; transform: translateY(-1px); }
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  border-radius: 6px;
  border: 1px solid #333;
  background: transparent;
  color: #888;
  cursor: pointer;
  transition: 0.2s;
  &:hover { background: #222; color: #fff; }
`;

const CadastrarVendedor = () => {
  const { usuarios, userLogado } = useEstoque();
  const { showAlert } = useDialog();
  const configuredApiUrl = (process.env.REACT_APP_API_URL || '').trim();
  const API_URL = configuredApiUrl || (() => {
    const port = window.location.port;
    if (port === '3000') return `${window.location.protocol}//${window.location.hostname}:5000/api`;
    return `${window.location.origin}/api`;
  })();
  const authToken = sessionStorage.getItem('@MRImports:authToken') || '';
  const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};
  
  const [form, setForm] = useState({ user: '', pass: '', role: 'VENDEDOR' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para Filtros e Paginação
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('TODOS');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Estados para controle de modais customizados
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: '', // 'status', 'senha', 'excluir'
    title: '',
    text: '',
    confirmText: '',
    danger: false,
    onConfirm: () => {},
    inputValue: ''
  });

  // Lógica de Filtro
  const filteredUsers = usuarios.filter(u => {
    const matchName = u.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === 'TODOS' || u.role === filterRole;
    return matchName && matchRole;
  });

  // Lógica de Paginação
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const closeCustomModal = () => setModalConfig({ ...modalConfig, isOpen: false });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCadastrar = async (e) => {
    e.preventDefault();
    if (!form.user || !form.pass) {
      await showAlert("Preencha todos os dados de login e senha!", "error", "Campos Pendentes");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const novoUsuario = {
        ...form,
        id: Date.now().toString(),
        ativo: 1
      };

      const res = await fetch(`${API_URL}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(novoUsuario)
      });

      if (res.ok) {
        await showAlert("Usuário cadastrado com sucesso e liberado para operar o sistema.", "success", "Operação Concluída");
        setForm({ user: '', pass: '', role: 'VENDEDOR' });
        window.location.reload();
      } else {
        await showAlert("Erro ao validar ou salvar o usuário.", "error", "Falha no Cadastro");
      }
    } catch (err) {
      console.error(err);
      await showAlert("Houve um erro de conexão com o banco de dados.", "error", "Erro de Rede");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openStatusModal = async (id, currentStatus, username) => {
    if (username === 'admin') { await showAlert("Você não tem permissão para desativar o acesso principal de ADMIN.", "error", "Operação Bloqueada"); return; }
    if (username === userLogado.user) { await showAlert("Não é possível desativar sua própria sessão logada.", "error", "Operação Inválida"); return; }

    const novoStatus = currentStatus === 1 ? 0 : 1;
    const acao = novoStatus === 1 ? 'ATIVAR' : 'DESATIVAR';

    setModalConfig({
      isOpen: true,
      type: 'status',
      title: `${acao} ACESSO`,
      text: `Deseja realmente ${acao.toLowerCase()} o acesso do usuário ${username.toUpperCase()}?`,
      confirmText: acao,
      danger: novoStatus === 0,
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_URL}/usuarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify({ ativo: novoStatus })
          });
          if (res.ok) window.location.reload();
        } catch (err) { console.error(err); }
      }
    });
  };

  const openSenhaModal = (id, username) => {
    setModalConfig({
      isOpen: true,
      type: 'senha',
      title: 'ALTERAR SENHA',
      text: `Digite a nova senha para o usuário ${username.toUpperCase()}:`,
      confirmText: 'ATUALIZAR',
      danger: false,
      inputValue: '',
      onConfirm: async (novaSenha) => {
        if (!novaSenha || novaSenha.trim() === '') {
          await showAlert("A nova senha informada está vazia.", "error"); return;
        }
        try {
          const res = await fetch(`${API_URL}/usuarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify({ pass: novaSenha })
          });
          if (res.ok) {
            await showAlert("A senha foi alterada com sucesso.", "success", "Senha Atualizada");
            window.location.reload();
          }
        } catch (err) { console.error(err); }
      }
    });
  };

  const openUnlockModal = (id, username) => {
    setModalConfig({
      isOpen: true,
      type: 'unlock',
      title: 'DESBLOQUEAR USUÁRIO',
      text: `O usuário ${username.toUpperCase()} foi bloqueado por excesso de tentativas. Deseja desbloquear o acesso agora?`,
      confirmText: 'DESBLOQUEAR',
      danger: false,
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_URL}/usuarios/${id}/desbloquear`, {
            method: 'POST',
            headers: { ...authHeaders }
          });
          if (res.ok) {
            await showAlert("Usuário desbloqueado. As tentativas de login incorretas foram resetadas.", "success", "Desbloqueio Confirmado");
            window.location.reload();
          }
        } catch (err) { console.error(err); }
      }
    });
  };

  const openExcluirModal = async (id, username) => {
    if (username === 'admin') { await showAlert("O superusuário primário administrativo não pode ser excluído do painel.", "error", "Segurança Ativa"); return; }
    if (username === userLogado.user) { await showAlert("Impossível deletar o usuário no qual você está atualmente autenticado.", "error", "Segurança Ativa"); return; }

    setModalConfig({
      isOpen: true,
      type: 'excluir',
      title: 'REMOVER ACESSO',
      text: `ATENÇÃO: Deseja remover PERMANENTEMENTE o acesso de ${username.toUpperCase()}? Esta ação não pode ser desfeita.`,
      confirmText: 'REMOVER AGORA',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_URL}/usuarios/${id}`, {
            method: 'DELETE',
            headers: { ...authHeaders }
          });
          if (res.ok) window.location.reload();
        } catch (err) { console.error(err); }
      }
    });
  };

  return (
    <PageContainer>
      <Header>
        <Title>Gestão de Equipe</Title>
        <Subtitle>Cadastre novos vendedores e gerencie permissões de acesso.</Subtitle>
      </Header>

      <FormContainer>
        <form onSubmit={handleCadastrar}>
          <FormGroup>
            <Label>Nome de Usuário (Login)</Label>
            <Input 
              name="user" 
              placeholder="Ex: joao.vendas" 
              value={form.user} 
              onChange={handleInputChange} 
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Senha de Acesso</Label>
            <Input 
              name="pass" 
              type="password"
              placeholder="Digite a senha" 
              value={form.pass} 
              onChange={handleInputChange} 
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Nível de Permissão</Label>
            <Select name="role" value={form.role} onChange={handleInputChange}>
              <option value="VENDEDOR">Vendedor (Acesso limitado)</option>
              <option value="ADMIN">Gestor (Acesso total)</option>
            </Select>
          </FormGroup>

          <SubmitButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Cadastrando...' : 'Criar Novo Acesso'}
          </SubmitButton>
        </form>
      </FormContainer>

      <Header>
        <Title>Usuários Ativos</Title>
      </Header>

      <FilterBar>
        <SearchInput 
          placeholder="Buscar por nome de usuário..." 
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Volta para primeira página ao buscar
          }}
        />
        <FilterSelect 
          value={filterRole}
          onChange={(e) => {
            setFilterRole(e.target.value);
            setCurrentPage(1); // Volta para primeira página ao filtrar
          }}
        >
          <option value="TODOS">Todos os Níveis</option>
          <option value="ADMIN">Administradores</option>
          <option value="VENDEDOR">Vendedores</option>
        </FilterSelect>
      </FilterBar>

      <UsersTableContainer>
        <Table>
          <thead>
            <tr>
              <Th>Usuário</Th>
              <Th>Nível</Th>
              <Th>Status</Th>
              <Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <Td colSpan="4" style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                  Nenhum usuário encontrado com os filtros aplicados.
                </Td>
              </tr>
            ) : (
              currentItems.map(u => (
                <tr key={u.id} style={{ opacity: u.ativo === 0 ? 0.6 : 1 }}>
                  <Td><strong>{u.user.toUpperCase()}</strong></Td>
                  <Td><Badge role={u.role}>{u.role}</Badge></Td>
                  <Td>
                    <Badge active={String(u.ativo)}>{u.ativo === 0 ? (u.tentativas >= 5 ? 'Bloqueado (Tentativas)' : 'Desativado') : 'Ativo'}</Badge>
                  </Td>
                  <Td>
                    <ActionGroup>
                      <ActionButton 
                        color="#ffffff" 
                        onClick={() => openSenhaModal(u.id, u.user)}
                      >
                        Senha
                      </ActionButton>
                      
                      {u.user !== 'admin' && u.user !== userLogado.user && (
                        <>
                          {u.tentativas >= 5 ? (
                            <ActionButton 
                              color="#4caf50" 
                              onClick={() => openUnlockModal(u.id, u.user)}
                            >
                              Desbloquear
                            </ActionButton>
                          ) : (
                            <ActionButton 
                              color={u.ativo === 0 ? '#4caf50' : '#ff9800'} 
                              onClick={() => openStatusModal(u.id, u.ativo, u.user)}
                            >
                              {u.ativo === 0 ? 'Ativar' : 'Desativar'}
                            </ActionButton>
                          )}
                          
                          <ActionButton 
                            onClick={() => openExcluirModal(u.id, u.user)}
                          >
                            Excluir
                          </ActionButton>
                        </>
                      )}
                    </ActionGroup>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </UsersTableContainer>

      {totalPages > 1 && (
        <PaginationContainer>
          <PageButton 
            disabled={currentPage === 1} 
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Anterior
          </PageButton>
          <PageInfo>Página {currentPage} de {totalPages}</PageInfo>
          <PageButton 
            disabled={currentPage === totalPages} 
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Próxima
          </PageButton>
        </PaginationContainer>
      )}

      {/* --- MODAL CUSTOMIZADO E MODERNO --- */}
      {modalConfig.isOpen && (
        <ModalOverlay onClick={closeCustomModal}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalTitle>{modalConfig.title}</ModalTitle>
            <ModalText>{modalConfig.text}</ModalText>
            
            {modalConfig.type === 'senha' && (
              <FormGroup style={{marginBottom: '20px'}}>
                <Input 
                  autoFocus
                  type="text" 
                  placeholder="Digite a nova senha..." 
                  value={modalConfig.inputValue}
                  onChange={e => setModalConfig({...modalConfig, inputValue: e.target.value})}
                  style={{textAlign: 'center'}}
                />
              </FormGroup>
            )}

            <ModalButtonGroup>
              <CancelButton onClick={closeCustomModal}>CANCELAR</CancelButton>
              <ConfirmButton 
                danger={modalConfig.danger}
                onClick={() => modalConfig.onConfirm(modalConfig.inputValue)}
              >
                {modalConfig.confirmText}
              </ConfirmButton>
            </ModalButtonGroup>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default CadastrarVendedor;
