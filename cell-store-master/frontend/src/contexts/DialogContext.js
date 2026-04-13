import React, { createContext, useContext, useState, useCallback } from 'react';
import styled from 'styled-components';
import { FaExclamationTriangle, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';

const DialogContext = createContext();

// --- ESTILOS DO MODAL GLOBAL ---
const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.85); display: flex; justify-content: center; align-items: center; z-index: 99999;
  backdrop-filter: blur(5px);
`;

const ModalBox = styled.div`
  background: #111; padding: 40px; border-radius: 20px; width: 100%; max-width: 450px;
  border: 1px solid #333; text-align: center; box-shadow: 0 15px 40px rgba(0,0,0,0.8);
  animation: modalScale 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  @keyframes modalScale { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
`;

const IconWrapper = styled.div`
  font-size: 50px; margin-bottom: 20px;
  color: ${props => props.tipo === 'confirm' ? '#ffc107' : props.tipo === 'success' ? '#4caf50' : '#4caf50'};
`;

const ModalTitle = styled.h2`color: #fff; margin-bottom: 15px; font-weight: 400; font-size: 24px; letter-spacing: 1px;`;
const ModalText = styled.p`color: #ccc; margin-bottom: 35px; line-height: 1.6; font-size: 15px;`;
const ModalBtnGroup = styled.div`display: flex; gap: 15px; justify-content: center;`;

const BaseBtn = styled.button`
  border: none; padding: 12px 30px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; font-size: 14px;
`;

const BtnConfirmar = styled(BaseBtn)`
  background: ${props => props.color || '#4caf50'}; color: #fff;
  &:hover { filter: brightness(1.2); transform: translateY(-3px); box-shadow: 0 5px 15px rgba(0,0,0,0.5); }
`;

const BtnCancelar = styled(BaseBtn)`
  background: #222; color: #fff; border: 1px solid #444;
  &:hover { background: #333; transform: translateY(-3px); }
`;

export const DialogProvider = ({ children }) => {
  const [dialogConfig, setDialogConfig] = useState(null);

  const showAlert = useCallback((mensagem, tipo = 'info', titulo = 'Aviso') => {
    return new Promise((resolve) => {
      setDialogConfig({
        type: 'alert',
        mensagem,
        titulo,
        tipoIcone: tipo,
        onConfirm: () => {
          setDialogConfig(null);
          resolve(true);
        }
      });
    });
  }, []);

  const showConfirm = useCallback((mensagem, titulo = 'Confirmação Necessária', btnText = 'Confirmar', color = '#4caf50') => {
    return new Promise((resolve) => {
      setDialogConfig({
        type: 'confirm',
        mensagem,
        titulo,
        tipoIcone: 'confirm',
        color,
        btnText,
        onConfirm: () => {
          setDialogConfig(null);
          resolve(true);
        },
        onCancel: () => {
          setDialogConfig(null);
          resolve(false);
        }
      });
    });
  }, []);

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {dialogConfig && (
        <ModalOverlay>
          <ModalBox>
            <IconWrapper tipo={dialogConfig.tipoIcone}>
              {dialogConfig.tipoIcone === 'confirm' && <FaExclamationTriangle />}
              {dialogConfig.tipoIcone === 'success' && <FaCheckCircle />}
              {(dialogConfig.tipoIcone === 'info' || dialogConfig.tipoIcone === 'error') && (
                <FaInfoCircle color={dialogConfig.tipoIcone === 'error' ? '#ff4d4d' : '#2196f3'} />
              )}
            </IconWrapper>
            <ModalTitle>{dialogConfig.titulo}</ModalTitle>
            <ModalText dangerouslySetInnerHTML={{ __html: dialogConfig.mensagem.replace(/\n/g, '<br/>') }} />
            
            <ModalBtnGroup>
              {dialogConfig.type === 'confirm' && (
                <BtnCancelar onClick={dialogConfig.onCancel}>Cancelar</BtnCancelar>
              )}
              <BtnConfirmar color={dialogConfig.color} onClick={dialogConfig.onConfirm}>
                {dialogConfig.type === 'confirm' ? dialogConfig.btnText : 'OK'}
              </BtnConfirmar>
            </ModalBtnGroup>
          </ModalBox>
        </ModalOverlay>
      )}
    </DialogContext.Provider>
  );
};

export const useDialog = () => useContext(DialogContext);
