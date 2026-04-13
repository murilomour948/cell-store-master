import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';

// --- CONTEXTOS (O Cérebro do ERP) ---
import { EstoqueProvider } from './contexts/EstoqueContext';
import { DialogProvider } from './contexts/DialogContext';
import { useEstoque } from './contexts/EstoqueContext';

// --- PÁGINAS (Os Módulos) ---
import Login from './pages/Login';
import MenuLateral from './components/MenuLateral';
import Estoque from './pages/Estoque';
import Assistencia from './pages/Assistencia'; 
import Dashboard from './pages/Dashboard';
import Logs from './pages/Logs';
import EstoqueAcessorios from './pages/EstoqueAcessorios';
import Scooters from './pages/Scooters';
import PDV from './pages/PDV'; 
import Fornecedores from './pages/Fornecedores'; 
import Clientes from './pages/Clientes';
import CRM from './pages/CRM';
import Despesas from './pages/Despesas';
import Relatorios from './pages/Relatorios';
import CadastrarVendedor from './pages/CadastrarVendedor';

// --- ESTILO GLOBAL PREMIUM ---
const GlobalStyle = createGlobalStyle`
  * { 
    margin: 0; 
    padding: 0; 
    box-sizing: border-box; 
    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
  }

  body { 
    background-color: #0b0b0b; 
    color: #ffffff; 
    -webkit-font-smoothing: antialiased; 
    overflow-x: hidden;
  }

  /* Custom Scrollbar (Estilo MR IMPORTS) */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #0a0a0a; }
  ::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; border: 1px solid #ffffff33; }
  ::-webkit-scrollbar-thumb:hover { background: #ffffff; }

  img { max-width: 100%; height: auto; }
  @media (max-width: 768px) {
    h1 { font-size: 22px; }
    h2 { font-size: 18px; }
    h3 { font-size: 16px; }
    input, select, button { font-size: 14px; }
    table { display: block; width: 100%; overflow-x: auto; }
    th, td { white-space: nowrap; }
  }
`;

// A margem esquerda agora é dinâmica: 260px (aberto) ou 80px (fechado), e 0px no Login
const ContentArea = styled.div`
  margin-left: ${props => props.showMenu ? (props.menuAberto ? '260px' : '80px') : '0'};
  min-height: 100vh;
  transition: margin-left 0.4s cubic-bezier(0.25, 1, 0.5, 1); /* Mesma curva suave do menu */
  background-color: #0d0d0d;
  @media (max-width: 768px) {
    margin-left: 0;
    padding-top: ${props => props.showMenu ? '64px' : '0'};
  }
`;

const MobileMenuButton = styled.button`
  position: fixed;
  left: 12px;
  top: 12px;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid #333;
  background: rgba(18, 18, 18, 0.92);
  color: #fff;
  z-index: 1300;
  cursor: pointer;
  font-size: 18px;
  display: none;
  align-items: center;
  justify-content: center;
  @media (max-width: 768px) {
    display: flex;
  }
`;

const MobileBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1100;
  @media (min-width: 769px) {
    display: none;
  }
`;

// --- 🛡️ SEGURANÇA DE ACESSO (O Segurança da Porta) ---
const RotaProtegida = ({ children, adminOnly }) => {
  const { userLogado, isAdmin } = useEstoque();

  // 1. Se não está logado, volta pro Login
  if (!userLogado) {
    return <Navigate to="/" replace />;
  }

  // 2. Se a tela exige Admin e o usuário for Vendedor, chuta pro PDV
  if (adminOnly && !isAdmin) {
    return <Navigate to="/pdv" replace />; 
  }

  return children;
};

const LayoutSistema = () => {
  const location = useLocation();
  const showMenu = location.pathname !== '/'; 
  
  // 🚀 NOVO: Controle de estado do Menu aqui no Layout
  const [menuAberto, setMenuAberto] = useState(() => (typeof window !== 'undefined' ? window.innerWidth > 768 : true));
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 768 : false));

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setMenuAberto(false);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) setMenuAberto(false);
  }, [location.pathname, isMobile]);

  return (
    <>
      {showMenu && isMobile && (
        <MobileMenuButton onClick={() => setMenuAberto(v => !v)} aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}>
          ☰
        </MobileMenuButton>
      )}
      {showMenu && isMobile && menuAberto && <MobileBackdrop onClick={() => setMenuAberto(false)} />}
      {showMenu && <MenuLateral isOpen={menuAberto} setIsOpen={setMenuAberto} />}
      <ContentArea showMenu={showMenu} menuAberto={menuAberto}>
        <Routes>
          {/* PORTA DE ENTRADA */}
          <Route path="/" element={<Login />} />
          
          {/* OPERAÇÃO (Acesso Geral) */}
          <Route path="/pdv" element={<RotaProtegida><PDV /></RotaProtegida>} /> 
          <Route path="/assistencia" element={<RotaProtegida><Assistencia /></RotaProtegida>} />
          <Route path="/estoque" element={<RotaProtegida><Estoque /></RotaProtegida>} />
          <Route path="/estoque-acessorios" element={<RotaProtegida><EstoqueAcessorios /></RotaProtegida>} />
          <Route path="/scooters" element={<RotaProtegida><Scooters /></RotaProtegida>} />
          <Route path="/vendas" element={<Navigate to="/pdv" replace />} />
          <Route path="/clientes" element={<RotaProtegida><Clientes /></RotaProtegida>} />
          <Route path="/fornecedores" element={<RotaProtegida adminOnly={true}><Fornecedores /></RotaProtegida>} /> 

          {/* 🔐 FINANCEIRO E GESTÃO (Somente ADMIN) */}
          <Route path="/dashboard" element={
            <RotaProtegida adminOnly={true}><Dashboard /></RotaProtegida>
          } />

          <Route path="/crm" element={
            <RotaProtegida><CRM /></RotaProtegida>
          } />

          <Route path="/despesas" element={
            <RotaProtegida adminOnly={true}><Despesas /></RotaProtegida>
          } />

          <Route path="/relatorios" element={
            <RotaProtegida adminOnly={true}><Relatorios /></RotaProtegida>
          } />
          
          <Route path="/logs" element={
            <RotaProtegida adminOnly={true}><Logs /></RotaProtegida>
          } />

          <Route path="/cadastrar-vendedor" element={
            <RotaProtegida adminOnly={true}><CadastrarVendedor /></RotaProtegida>
          } />

          {/* 404 - REDIRECIONAMENTO DE SEGURANÇA */}
          <Route path="*" element={<Navigate to="/" replace />} />
          
        </Routes>
      </ContentArea>
    </>
  );
};

function App() {
  return (
    <DialogProvider>
      <EstoqueProvider>
        <GlobalStyle />
        <Router>
          <LayoutSistema />
        </Router>
      </EstoqueProvider>
    </DialogProvider>
  );
}

export default App;
