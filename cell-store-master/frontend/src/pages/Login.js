import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { useEstoque } from '../contexts/EstoqueContext';
import logoImg from '../assets/GD.png';

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const LoginContainer = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at center, #1a1a1a 0%, #050505 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    background: url('https://www.transparenttextures.com/patterns/carbon-fibre.png');
    opacity: 0.15;
  }
`;

const LuxuryBox = styled.div`
  background: rgba(18, 18, 18, 0.7);
  backdrop-filter: blur(20px);
  padding: 60px 50px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  text-align: center;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.6);
  animation: ${fadeInUp} 1s ease-out;
  z-index: 1;

  @media (max-width: 480px) {
    padding: 28px 18px;
    border-radius: 18px;
  }
`;

const WhiteFrame = styled.div`
  width: 140px;
  height: 140px;
  margin: 0 auto 30px;
  border-radius: 50%;
  padding: 4px;
  background: linear-gradient(145deg, #ffffff, #f0f0f0, #ffffff, #e0e0e0, #ffffff);

  @media (max-width: 480px) {
    width: 110px;
    height: 110px;
    margin-bottom: 20px;
  }
`;

const LogoImage = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #121212;
`;

const BrandName = styled.h1`
  color: #fff;
  font-weight: 300;
  letter-spacing: 6px;
  margin-bottom: 5px;
  font-size: 26px;
  text-transform: uppercase;

  @media (max-width: 480px) {
    font-size: 20px;
    letter-spacing: 4px;
  }
`;

const Subtitle = styled.p`
  color: #ffffff;
  font-size: 10px;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 40px;
  opacity: 0.8;

  @media (max-width: 480px) {
    margin-bottom: 24px;
  }
`;

const InputWrapper = styled.div`
  margin-bottom: 20px;
  text-align: left;
`;

const Label = styled.label`
  font-size: 10px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-left: 5px;
  margin-bottom: 8px;
  display: block;
`;

const Input = styled.input`
  width: 100%;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid #333;
  color: #fff;
  border-radius: 12px;
  outline: none;
  font-size: 16px;
  transition: all 0.3s ease;
  letter-spacing: 2px;

  &:focus {
    border-color: #ffffff;
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.15);
  }
`;

const PremiumButton = styled.button`
  width: 100%;
  padding: 18px;
  background: linear-gradient(90deg, #ffffff, #f0f0f0, #ffffff);
  background-size: 200% auto;
  color: #000;
  border: none;
  border-radius: 12px;
  font-weight: 800;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 2px;
  transition: 0.5s;
  margin-top: 10px;

  &:hover {
    background-position: right center;
    box-shadow: 0 10px 20px rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
`;

const Toast = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: ${(props) => (props.type === 'error' ? '#ff4d4d' : '#ff9800')};
  color: #fff;
  padding: 15px 25px;
  border-radius: 12px;
  box-shadow: 0 10px 30px ${(props) => (props.type === 'error' ? 'rgba(255, 77, 77, 0.3)' : 'rgba(255, 152, 0, 0.3)')};
  z-index: 2000;
  font-weight: bold;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: slideIn 0.3s ease-out;
  max-width: calc(100vw - 40px);

  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;

const Login = () => {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

  const navigate = useNavigate();
  const { realizarLogin } = useEstoque();

  const handleLogin = async (e) => {
    e.preventDefault();

    const res = await realizarLogin(usuario, senha);

    if (res.sucesso) {
      if (res.user?.role === 'ADMIN') {
        navigate('/dashboard');
      } else {
        navigate('/pdv');
      }
    } else {
      let msg = 'Credenciais inválidas! Verifique usuário e senha.';
      let type = 'error';

      if (res.erro === 'ACCOUNT_DISABLED' || res.erro === 'ACCOUNT_BLOCKED') {
        msg = 'Favor contatar o administrador, usuário bloqueado.';
      } else if (res.erro === 'INVALID_CREDENTIALS' && res.tentativas === 2) {
        msg = 'Você só tem mais 3 tentativas de acesso. Se errar novamente, seu usuário será bloqueado.';
        type = 'warning';
      } else if (res.erro === 'SERVER_ERROR') {
        msg = 'Erro de conexão com o servidor.';
      }

      setToast({ show: true, message: msg, type });
      setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 5000);
      setSenha('');
    }
  };

  return (
    <LoginContainer>
      {toast.show && <Toast type={toast.type}>{toast.message}</Toast>}
      <LuxuryBox>
        <WhiteFrame>
          <LogoImage src={logoImg} alt="GD CELL STORE" />
        </WhiteFrame>
        <BrandName>GD CELL STORE</BrandName>
        <Subtitle>Private Management</Subtitle>

        <form onSubmit={handleLogin}>
          <InputWrapper>
            <Label>Usuário</Label>
            <Input
              type="text"
              placeholder="Nome de usuário"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />
          </InputWrapper>
          <InputWrapper>
            <Label>Chave de Segurança</Label>
            <Input
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </InputWrapper>
          <PremiumButton type="submit">Autenticar</PremiumButton>
        </form>

        <p style={{ marginTop: '40px', fontSize: '9px', color: '#444', letterSpacing: '1px' }}>
          GD CELL STORE 2026 &bull; CELL STORE &bull; Secure Access
        </p>
      </LuxuryBox>
    </LoginContainer>
  );
};

export default Login;
