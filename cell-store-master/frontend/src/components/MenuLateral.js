import React from 'react'; // <-- Tirei o useState daqui
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useEstoque } from '../contexts/EstoqueContext';
import { useDialog } from '../contexts/DialogContext';
import logoImg from '../assets/GD3.png'; 
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

// --- ESTILOS REFINADOS PARA ANIMAÇÃO ---
const Sidebar = styled.nav`
  width: ${props => (props.isOpen ? '260px' : '80px')};
  height: 100vh;
  background-color: #121212;
  border-right: 1px solid #222;
  display: flex;
  flex-direction: column;
  padding: ${props => (props.isOpen ? '30px 20px' : '30px 10px')};
  position: fixed; 
  top: 0;
  left: 0;
  z-index: 100;
  transition: width 0.4s cubic-bezier(0.25, 1, 0.5, 1), padding 0.4s;
  overflow-x: hidden;
  @media (max-width: 768px) {
    width: 260px;
    padding: 30px 20px;
    transform: ${props => (props.isOpen ? 'translateX(0)' : 'translateX(-105%)')};
    transition: transform 0.25s ease;
    box-shadow: 0 10px 30px rgba(0,0,0,0.7);
    z-index: 1250;
  }
`;

const ToggleBtn = styled.button`
  background: linear-gradient(145deg, #ffffff, #f0f0f0);
  color: #000;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  position: absolute;
  right: -15px;
  top: 30px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 10px rgba(255, 255, 255, 0.2);
  transition: 0.3s;
  z-index: 101;
  &:hover { transform: scale(1.1); }
  @media (max-width: 768px) {
    display: none;
  }
`;

const LogoContainer = styled.div`
  text-align: center;
  margin-bottom: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const LogoImage = styled.img`
  width: ${props => (props.isOpen ? '90px' : '45px')};
  height: ${props => (props.isOpen ? '90px' : '45px')};
  border-radius: 50%;
  border: 1px solid #ffffff;
  margin-bottom: 15px;
  object-fit: cover;
  box-shadow: 0 4px 10px rgba(0,0,0,0.5);
  transition: width 0.4s, height 0.4s;
`;

const BrandName = styled.h2`
  color: #ffffff;
  font-weight: 300;
  letter-spacing: 3px;
  margin: 0;
  font-size: 18px;
  text-transform: uppercase;
  opacity: ${props => (props.isOpen ? '1' : '0')};
  height: ${props => (props.isOpen ? 'auto' : '0')};
  transition: opacity 0.3s;
  white-space: nowrap;
`;

const UserInfo = styled.div`
  margin-top: 15px;
  text-align: center;
  border-bottom: 1px solid #222;
  padding-bottom: 20px;
  width: 100%;
  opacity: ${props => (props.isOpen ? '1' : '0')};
  height: ${props => (props.isOpen ? 'auto' : '0')};
  overflow: hidden;
  transition: opacity 0.3s;

  small { display: block; color: #666; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  strong { color: #fff; font-size: 12px; letter-spacing: 1px; }
`;

const RoleBadge = styled.div`
  background: ${props => props.isAdmin ? 'rgba(255, 255, 255, 0.1)' : 'rgba(33, 150, 243, 0.1)'};
  color: ${props => props.isAdmin ? '#ffffff' : '#2196f3'};
  border: 1px solid ${props => props.isAdmin ? '#ffffff44' : '#2196f344'};
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: bold;
  letter-spacing: 1px;
  margin-top: 10px;
  text-transform: uppercase;
  display: inline-block;
`;

const MenuList = styled.div` 
  display: flex; 
  flex-direction: column; 
  gap: 5px; 
  margin-top: 20px;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  &::-webkit-scrollbar { width: 0; }
`;

const MenuItem = styled(Link)`
  text-decoration: none;
  color: ${props => props.active === "true" ? '#ffffff' : '#888'};
  background-color: ${props => props.active === "true" ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  padding: 12px ${props => (props.isOpen ? '15px' : '10px')};
  border-radius: 8px;
  font-size: 13px;
  transition: all 0.2s;
  border-left: 3px solid ${props => props.active === "true" ? '#ffffff' : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: ${props => (props.isOpen ? 'flex-start' : 'center')};
  gap: ${props => (props.isOpen ? '15px' : '0')};
  white-space: nowrap;

  &:hover { color: #ffffff; background: rgba(255, 255, 255, 0.05); }

  .icon-emoji { font-size: 18px; min-width: 25px; text-align: center; flex-shrink: 0; }
  .text { 
    opacity: ${props => (props.isOpen ? '1' : '0')}; 
    width: ${props => (props.isOpen ? 'auto' : '0')};
    overflow: hidden;
    transition: opacity 0.3s, width 0.3s;
  }
`;

const LogoutButton = styled.button`
  margin-top: 20px;
  padding: 14px;
  background: rgba(255, 77, 77, 0.05);
  color: #ff4d4d;
  border: 1px solid rgba(255, 77, 77, 0.1);
  border-radius: 10px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s;
  white-space: nowrap;

  .text { opacity: ${props => (props.isOpen ? '1' : '0')}; width: ${props => (props.isOpen ? 'auto' : '0')}; overflow: hidden; transition: 0.3s; }

  &:hover { background: #ff4d4d; color: #fff; box-shadow: 0 5px 15px rgba(255, 77, 77, 0.2); }
`;

// 🚀 NOVO: Recebendo o isOpen e setIsOpen do App.js aqui
const MenuLateral = ({ isOpen, setIsOpen }) => {
  const location = useLocation(); 
  const navigate = useNavigate();
  
  const { userLogado, logout, isAdmin } = useEstoque();
  const { showConfirm } = useDialog();

  const handleLogout = async () => {
    if (await showConfirm("Deseja realmente encerrar o expediente e sair?", "Confirmação de Saída", "Encerrar Sessão", "#ff4d4d")) {
      navigate('/', { replace: true });
      setTimeout(() => {
        logout();
      }, 10);
    }
  };

  if (!userLogado) return null;

  return (
    <Sidebar isOpen={isOpen}>
      {/* 🚀 NOVO: O botão usa o setIsOpen que veio do App.js */}
      <ToggleBtn onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <FiChevronLeft size={16} /> : <FiChevronRight size={16} />}
      </ToggleBtn>

      <LogoContainer>
        <LogoImage src={logoImg} alt="GD CELL STORE" isOpen={isOpen} />
        <BrandName isOpen={isOpen}>GD CELL STORE</BrandName>
        
        <UserInfo isOpen={isOpen}>
          <small>Operador Atual</small>
          <strong>{userLogado.user.toUpperCase()}</strong>
          <br />
          <RoleBadge isAdmin={isAdmin}>
            {isAdmin ? '👑 MODO GESTOR' : '👤 MODO VENDEDOR'}
          </RoleBadge>
        </UserInfo>
      </LogoContainer>

      <MenuList>
        {isAdmin && (
          <MenuItem to="/dashboard" active={(location.pathname === "/dashboard").toString()} isOpen={isOpen}>
            <span className="icon-emoji">📊</span> <span className="text">Dashboard</span>
          </MenuItem>
        )}
        
        <MenuItem to="/pdv" active={(location.pathname === "/pdv").toString()} isOpen={isOpen}>
          <span className="icon-emoji">🛍️</span> <span className="text">Frente de Caixa</span>
        </MenuItem>
        
        <MenuItem to="/assistencia" active={(location.pathname === "/assistencia").toString()} isOpen={isOpen}>
          <span className="icon-emoji">🛠️</span> <span className="text">Assistência</span>
        </MenuItem>

        <MenuItem to="/estoque" active={(location.pathname === "/estoque").toString()} isOpen={isOpen}>
          <span className="icon-emoji">📱</span> <span className="text">Estoque iPhones</span>
        </MenuItem>
        
        <MenuItem to="/estoque-acessorios" active={(location.pathname === "/estoque-acessorios").toString()} isOpen={isOpen}>
          <span className="icon-emoji">🎧</span> <span className="text">Acessórios/Peças</span>
        </MenuItem>

        <MenuItem to="/scooters" active={(location.pathname === "/scooters").toString()} isOpen={isOpen}>
          <span className="icon-emoji">🛵</span> <span className="text">Scooter Elétrica</span>
        </MenuItem>

        <MenuItem to="/clientes" active={(location.pathname === "/clientes").toString()} isOpen={isOpen}>
          <span className="icon-emoji">👥</span> <span className="text">Clientes (CRM)</span>
        </MenuItem>

        <MenuItem to="/crm" active={(location.pathname === "/crm").toString()} isOpen={isOpen}>
          <span className="icon-emoji">🤖</span> <span className="text">Ações CRM</span>
        </MenuItem>

        {isAdmin && (
          <MenuItem to="/despesas" active={(location.pathname === "/despesas").toString()} isOpen={isOpen}>
            <span className="icon-emoji">💸</span> <span className="text">Gastos / Despesas</span>
          </MenuItem>
        )}

        {isAdmin && (
          <MenuItem to="/logs" active={(location.pathname === "/logs").toString()} isOpen={isOpen}>
            <span className="icon-emoji">📜</span> <span className="text">Histórico de Auditoria</span>
          </MenuItem>
        )}
        
        {isAdmin && (
          <MenuItem to="/fornecedores" active={(location.pathname === "/fornecedores").toString()} isOpen={isOpen}>
            <span className="icon-emoji">🤝</span> <span className="text">Fornecedores</span>
          </MenuItem>
        )}
        
        {isAdmin && (
          <MenuItem to="/relatorios" active={(location.pathname === "/relatorios").toString()} isOpen={isOpen}>
            <span className="icon-emoji">📄</span> <span className="text">Relatórios PDF</span>
          </MenuItem>
        )}

        {isAdmin && (
          <MenuItem to="/cadastrar-vendedor" active={(location.pathname === "/cadastrar-vendedor").toString()} isOpen={isOpen}>
            <span className="icon-emoji">👤</span> <span className="text">Cadastrar Vendedor</span>
          </MenuItem>
        )}
      </MenuList>

      <LogoutButton onClick={handleLogout} isOpen={isOpen}>
        <span className="icon-emoji">🚪</span> <span className="text">Encerrar Sessão</span>
      </LogoutButton>
    </Sidebar>
  );
};

export default MenuLateral;
