import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useEstoque } from '../contexts/EstoqueContext';
import { FiShoppingCart, FiBox, FiDollarSign, FiGrid, FiUsers } from 'react-icons/fi';

const BottomBar = styled.nav`
  display: none; /* Escondido no PC */
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 70px;
  background-color: #121212;
  border-top: 1px solid #222;
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom); /* Respeita a barra do iPhone */

  @media (max-width: 768px) {
    display: flex;
    justify-content: space-around;
    align-items: center;
  }
`;

const NavItem = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: ${props => props.active === "true" ? '#ffffff' : '#666'};
  width: 100%;
  height: 100%;
  transition: 0.2s;

  svg {
    font-size: 22px;
    margin-bottom: 4px;
    transition: transform 0.2s;
    transform: ${props => props.active === "true" ? 'translateY(-2px)' : 'none'};
  }

  span {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
  }
`;

const MenuMobile = () => {
  const location = useLocation();
  const { userLogado, isAdmin } = useEstoque();

  if (!userLogado) return null;

  return (
    <BottomBar>
      <NavItem to="/pdv" active={(location.pathname === "/pdv").toString()}>
        <FiShoppingCart />
        <span>Vender</span>
      </NavItem>

      <NavItem to="/estoque" active={(location.pathname === "/estoque" || location.pathname === "/estoque-acessorios").toString()}>
        <FiBox />
        <span>Estoque</span>
      </NavItem>

      {isAdmin && (
        <NavItem to="/dashboard" active={(location.pathname === "/dashboard").toString()}>
          <FiGrid />
          <span>Visão</span>
        </NavItem>
      )}

      {isAdmin && (
        <NavItem to="/despesas" active={(location.pathname === "/despesas").toString()}>
          <FiDollarSign />
          <span>Caixa</span>
        </NavItem>
      )}

      {/* Se não for admin, mostra clientes no lugar do Dashboard/Caixa */}
      {!isAdmin && (
        <NavItem to="/clientes" active={(location.pathname === "/clientes").toString()}>
          <FiUsers />
          <span>Clientes</span>
        </NavItem>
      )}
    </BottomBar>
  );
};

export default MenuMobile;
