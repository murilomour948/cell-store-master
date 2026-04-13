import React, { useState, useMemo, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useEstoque } from '../contexts/EstoqueContext'; 
import { useDialog } from '../contexts/DialogContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FaPencilAlt, FaCheck, FaTimes, FaTrophy, FaUndo } from 'react-icons/fa';
import confetti from 'canvas-confetti';
// --- CONFIGURA??ES E CORES ---
const CORES_MR_IMPORTS = ['#ffffff', '#e0e0e0', '#cccccc', '#aaaaaa', '#888888'];

// --- ESTILOS PREMIUM ---
const PageContainer = styled.div`padding: 40px; color: #fff; background-color: #0a0a0a; min-height: 100vh; font-family: 'Segoe UI', sans-serif; @media (max-width: 768px) { padding: 16px; }`;
const Header = styled.div`margin-bottom: 40px; display: flex; justify-content: space-between; align-items: center; gap: 15px; flex-wrap: wrap; @media (max-width: 768px) { margin-bottom: 20px; }`;
const Title = styled.h1`font-weight: 300; color: #ffffff; letter-spacing: 1px; margin: 0;`;
const Subtitle = styled.p`color: #e0e0e0; margin-top: 5px; font-size: 15px;`;

const FilterSelect = styled.select`
  background: #1a1a1a; border: 1px solid #ffffff; color: #fff; padding: 10px 15px; 
  border-radius: 8px; outline: none; cursor: pointer; margin-right: 15px;
  @media (max-width: 768px) { width: 100%; margin-right: 0; }
`;

const EditMetaInput = styled.input`
  background: #222; border: 1px solid #444; color: #fff; padding: 5px 10px;
  border-radius: 6px; outline: none; width: 120px; font-size: 16px; font-weight: bold;
  &:focus { border-color: #ffffff; }
`;

const IconButton = styled.button`
  background: transparent; border: none; color: ${props => props.color || '#888'};
  cursor: pointer; transition: 0.2s; padding: 5px; display: inline-flex; align-items: center; justify-content: center;
  &:hover { color: #fff; transform: scale(1.1); }
`;

const GridStats = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 40px;`;
const StatCard = styled.div`
  background: #111; border: 1px solid #222; border-radius: 12px; padding: 25px; 
  border-top: 3px solid ${props => props.color || '#ffffff'}; transition: 0.2s;
  &:hover { transform: translateY(-5px); border-color: #444; }
`;

const StatTitle = styled.h3`color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;`;
const StatValue = styled.div`color: #fff; font-size: 24px; font-weight: bold; margin-bottom: 5px;`;
const StatTrend = styled.span`color: ${props => props.positive ? '#4caf50' : '#ff4d4d'}; font-size: 12px; font-weight: bold;`; 

const ProgressBarTrack = styled.div`width: 100%; height: 8px; background: #222; border-radius: 4px; overflow: hidden; margin: 15px 0;`;
const ProgressBarFill = styled.div`
  height: 100%; background: linear-gradient(90deg, #ffffff, #e0e0e0);
  width: ${props => props.percent}%; transition: width 1s ease-in-out;
`;

const HealthIndicator = styled.div`
  display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 1px solid #222;
  div { text-align: center; } small { display: block; color: #888; font-size: 10px; text-transform: uppercase; }
  span { font-weight: bold; font-size: 14px; }
`;

const SectionTitle = styled.h2`font-weight: 400; color: #fff; margin-bottom: 20px; font-size: 18px; border-bottom: 1px solid #222; padding-bottom: 10px;`;

const glowAnimation = keyframes`
  0% { box-shadow: 0 0 5px rgba(76, 175, 80, 0.2); border-color: rgba(76, 175, 80, 0.5); }
  100% { box-shadow: 0 0 20px rgba(76, 175, 80, 0.8); border-color: rgba(76, 175, 80, 1); }
`;

const textGlow = keyframes`
  0% { text-shadow: 0 0 5px rgba(200, 255, 200, 0.5); }
  100% { text-shadow: 0 0 20px rgba(255, 255, 255, 1); }
`;

const GlowBadge = styled.div`
  margin-top: 25px;
  padding: 15px 30px;
  background: linear-gradient(90deg, rgba(76, 175, 80, 0.05), rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.05));
  border: 1px solid #4caf50;
  border-radius: 8px;
  color: #c8e6c9;
  font-weight: 900;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  text-transform: uppercase;
  letter-spacing: 2px;
  animation: ${glowAnimation} 1.5s infinite alternate;

  span {
    animation: ${textGlow} 1.5s infinite alternate;
  }
`;

const Dashboard = () => {
  const { produtos, acessorios, vendas, despesas, isAdmin } = useEstoque();
  const { showConfirm, showAlert } = useDialog();
  const [periodo, setPeriodo] = useState('MES'); 

  const [metaMensal, setMetaMensal] = useState(() => Number(localStorage.getItem('@MRImports:metaMensal')) || 150000);
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [novaMeta, setNovaMeta] = useState(metaMensal);

  const [metaMensalScooter, setMetaMensalScooter] = useState(() => Number(localStorage.getItem('@MRImports:metaMensalScooter')) || 50000);
  const [isEditingMetaScooter, setIsEditingMetaScooter] = useState(false);
  const [novaMetaScooter, setNovaMetaScooter] = useState(metaMensalScooter);

  const [metaStartDate, setMetaStartDate] = useState(() => localStorage.getItem('@MRImports:metaStartDate') || null);
  const [metaScooterStartDate, setMetaScooterStartDate] = useState(() => localStorage.getItem('@MRImports:metaScooterStartDate') || null);

  const [fogosDisparados, setFogosDisparados] = useState(false);

  const handleSaveMeta = () => {
    const val = Number(novaMeta) || 150000;
    setMetaMensal(val);
    localStorage.setItem('@MRImports:metaMensal', val);
    setIsEditingMeta(false);
  };

  const handleSaveMetaScooter = () => {
    const val = Number(novaMetaScooter) || 50000;
    setMetaMensalScooter(val);
    localStorage.setItem('@MRImports:metaMensalScooter', val);
    setIsEditingMetaScooter(false);
  };

  const handleResetMetaProgress = async () => {
    if (await showConfirm('Isso vai zerar APENAS o progresso da meta mensal e come?ar? a contar a partir de hoje. O faturamento global do m?s na base de dados continuar? o mesmo. Confirmar?', 'Resetar Progresso', 'Confirmar Reset', '#ff4d4d')) {
      const now = new Date().toISOString();
      setMetaStartDate(now);
      localStorage.setItem('@MRImports:metaStartDate', now);
      showAlert('O progresso da meta global foi reiniciado com sucesso.', 'success');
    }
  };

  const handleResetMetaScooterProgress = async () => {
    if (await showConfirm('Isso vai zerar APENAS o progresso da meta das scooters e come?ar? a contar a partir de hoje. Confirmar?', 'Resetar Scooters', 'Confirmar Reset', '#ff4d4d')) {
      const now = new Date().toISOString();
      setMetaScooterStartDate(now);
      localStorage.setItem('@MRImports:metaScooterStartDate', now);
      showAlert('O progresso da meta das scooters foi reiniciado com sucesso.', 'success');
    }
  };

  const parseValue = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    
    const valStr = String(val);
    
    if (valStr.includes('R$') || valStr.includes(',')) {
      const clean = valStr.replace(/[R$\s.]/g, "").replace(",", ".");
      return Number(clean) || 0;
    }
    
    const numericVal = Number(valStr);
    if (!isNaN(numericVal)) {
      return numericVal;
    }
    
    const cleanString = valStr.replace(/\D/g, "");
    return cleanString === "" ? 0 : Number(cleanString);
  };

  const stats = useMemo(() => {
    if (!isAdmin) return null;

    let capitalInvestido = 0, potencialVenda = 0, saude = { novo: 0, atencao: 0, critico: 0 }, itensAcessorios = 0, alertasAcessorios = [];

    produtos.forEach(p => {
      capitalInvestido += parseValue(p.precoCusto);
      potencialVenda += parseValue(p.precoVenda || p.preco);
      const dataE = p.dataEntrada ? new Date(p.dataEntrada) : new Date();
      const dias = Math.floor((new Date() - dataE) / 86400000);
      if (dias > 30) saude.critico++; else if (dias > 15) saude.atencao++; else saude.novo++;
    });

    const estAces = acessorios || [];
    estAces.forEach(a => {
      const q = Number(a.quantidade) || 0;
      capitalInvestido += (parseValue(a.precoCusto || a.custo) * q);
      potencialVenda += (parseValue(a.precoVenda || a.preco) * q);
      itensAcessorios += q;
      if (q <= (Number(a.estoqueMinimo) || 5)) alertasAcessorios.push(a);
    });

    const agora = new Date();
    const startOfToday = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const startOfYesterday = new Date(startOfToday); startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOf7Days = new Date(startOfToday); startOf7Days.setDate(startOf7Days.getDate() - 7);
    const startOfMonth = new Date(agora.getFullYear(), agora.getMonth(), 1);

    let fatPeriodo = 0, lucroOperacional = 0, taxasPeriodo = 0, vtsQtd = 0, despesasPeriodo = 0;
    let fatMesAtual = 0, fatMesPassado = 0, lucroMesAtual = 0, lucroMesPassado = 0, fatMesAtualScooter = 0;
    let progressoMeta = 0, progressoMetaScooter = 0;
    let qtdIphones = 0, qtdAcessorios = 0, recIp = 0, lucIp = 0, recAc = 0, lucAc = 0, recSv = 0, lucSv = 0;
    const rankingModelos = {}, rankingOrigens = {};

    (vendas || []).forEach(v => {
      const dataV = new Date(v.dataVenda);
      const valB = parseValue(v.precoVenda || v.preco || v.valorCobrado);
      const cust = parseValue(v.precoCusto || v.custoPeca || v.custo);
      let txPerc = 0;
      const fPag = (v.formaPagamento || '').toUpperCase();
      if (fPag.includes('CR?DITO') || fPag.includes('CREDITO')) txPerc = fPag.includes('10X') || fPag.includes('12X') ? 0.12 : 0.049;
      else if (fPag.includes('D?BITO') || fPag.includes('DEBITO')) txPerc = 0.015;
      let tx = valB * txPerc;
      const lucV = valB - cust - tx;

      let itemTipo = (v.tipo || v.tipoOriginal || '').toUpperCase();
      if (!itemTipo) {
         if (v.defeito) itemTipo = 'SERVICO';
         else if (v.imei || v.capacidade || (v.modelo && v.modelo.toUpperCase().includes('IPHONE'))) itemTipo = 'IPHONE';
         else itemTipo = 'ACESSORIO';
      }

      let noP = (periodo === 'HOJE' && dataV >= startOfToday) || (periodo === 'ONTEM' && dataV >= startOfYesterday && dataV < startOfToday) || (periodo === '7DIAS' && dataV >= startOf7Days) || (periodo === 'MES' && dataV >= startOfMonth);

      if (itemTipo !== 'SCOOTER') {
        if (noP) {
          fatPeriodo += valB; lucroOperacional += lucV; taxasPeriodo += tx; vtsQtd++;
          if (itemTipo === 'IPHONE') { qtdIphones++; recIp += (valB-tx); lucIp += lucV; }
          else if (itemTipo === 'ACESSORIO') { qtdAcessorios++; recAc += (valB-tx); lucAc += lucV; }
          else if (itemTipo === 'SERVICO') { recSv += (valB-tx); lucSv += lucV; }
        }
        if (dataV.getMonth() === agora.getMonth() && dataV.getFullYear() === agora.getFullYear()) { 
          fatMesAtual += valB; lucroMesAtual += lucV;
          const isAfterMetaStart = !metaStartDate || dataV >= new Date(metaStartDate);
          if (isAfterMetaStart) progressoMeta += valB;
        }
        else if (dataV.getMonth() === (agora.getMonth() === 0 ? 11 : agora.getMonth() - 1)) { fatMesPassado += valB; lucroMesPassado += lucV; }

        const mod = v.modelo?.split(' ')[0] || 'Outros'; rankingModelos[mod] = (rankingModelos[mod] || 0) + 1;
        const ori = v.origemCliente || 'Balc?o'; rankingOrigens[ori] = (rankingOrigens[ori] || 0) + 1;
      } else {
        if (dataV.getMonth() === agora.getMonth() && dataV.getFullYear() === agora.getFullYear()) { 
          fatMesAtualScooter += valB;
          const isAfterScooterStart = !metaScooterStartDate || dataV >= new Date(metaScooterStartDate);
          if (isAfterScooterStart) progressoMetaScooter += valB;
        }
      }
    });

    (despesas || []).forEach(d => {
      const dataD = new Date(d.data);
      if (dataD >= startOfMonth) despesasPeriodo += Number(d.valor) || 0;
    });

    const diasMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).getDate();
    const diaAt = agora.getDate() || 1;

    return {
      capitalInvestido, potencialVenda, saude, itensAcessorios, alertasAcessorios,
      itensIphone: produtos.length, qtdIphonesVendido: qtdIphones,
      fatPeriodo, lucroLiquidoReal: lucroOperacional - (periodo === 'MES' ? despesasPeriodo : 0), taxasPeriodo, despesasPeriodo, vtsQtd,
      fatMesAtual, projecao: fatMesAtual > 0 ? (fatMesAtual / diaAt) * diasMes : 0, metaPercent: Math.min((progressoMeta / metaMensal) * 100, 100), diaAt, diasMes,
      fatMesAtualScooter, metaPercentScooter: Math.min((progressoMetaScooter / metaMensalScooter) * 100, 100),
      progressoMeta, progressoMetaScooter,
      crescFat: fatMesPassado > 0 ? (((fatMesAtual - fatMesPassado) / fatMesPassado) * 100).toFixed(1) : 0,
      crescLuc: lucroMesPassado > 0 ? (((lucroMesAtual - lucroMesPassado) / lucroMesPassado) * 100).toFixed(1) : 0,
      qtdAcessoriosVendido: qtdAcessorios,
      margens: { ip: recIp > 0 ? ((lucIp / recIp) * 100).toFixed(1) : 0, ac: recAc > 0 ? ((lucAc / recAc) * 100).toFixed(1) : 0, sv: recSv > 0 ? ((lucSv / recSv) * 100).toFixed(1) : 0 },
      chartRanking: Object.entries(rankingModelos).map(([name, total]) => ({ name, total })).sort((a,b)=>b.total-a.total).slice(0,5),
      chartOrigens: Object.entries(rankingOrigens).map(([name, value]) => ({ name, value })),
    };
  }, [produtos, acessorios, vendas, despesas, isAdmin, periodo, metaMensal, metaMensalScooter, metaStartDate, metaScooterStartDate]);

  useEffect(() => {
    if (stats?.metaPercent >= 100 && !fogosDisparados) {
      setFogosDisparados(true);
      
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    } else if (stats?.metaPercent < 100) {
      setFogosDisparados(false); // Reseta se a meta ficar menor que 100% novamente
    }
  }, [stats?.metaPercent, fogosDisparados]);

  const formatBRL = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (!isAdmin) return <PageContainer><h2 style={{textAlign:'center', color:'#ffffff'}}>Acesso Restrito</h2></PageContainer>;

  return (
    <PageContainer>
      <Header>
        <div><Title>Dashboard Estrat?gico</Title><Subtitle>Gest?o de Lucratividade, Mix de Vendas e Sa?de Financeira.</Subtitle></div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FilterSelect value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
            <option value="HOJE">Hoje</option><option value="ONTEM">Ontem</option><option value="7DIAS">7 Dias</option><option value="MES">M?s Atual</option>
          </FilterSelect>
        </div>
      </Header>

      {/* BLOCO 1: META E PROJE??O */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        
        {/* META GERAL */}
        <StatCard style={{ 
          padding: '30px',
          borderColor: stats.metaPercent >= 100 ? '#4caf50' : '#222',
          boxShadow: stats.metaPercent >= 100 ? '0 0 20px rgba(76, 175, 80, 0.15)' : 'none',
          transition: 'all 0.5s ease-in-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <StatTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Meta Mensal Global
                {!isEditingMeta && (
                  <>
                    <IconButton onClick={() => setIsEditingMeta(true)} title="Editar Meta Global">
                      <FaPencilAlt size={12} />
                    </IconButton>
                    <IconButton onClick={handleResetMetaProgress} title="Zerar Progresso desta Meta">
                      <FaUndo size={12} color="#ff4d4d" />
                    </IconButton>
                  </>
                )}
              </StatTitle>
              <div style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {formatBRL(stats.progressoMeta)} 
                <span style={{ fontSize: '14px', color: '#444' }}>/</span>
                
                {isEditingMeta ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <EditMetaInput 
                      type="number" 
                      value={novaMeta} 
                      onChange={e => setNovaMeta(e.target.value)} 
                      autoFocus
                      onKeyDown={(e) => { 
                        if (e.key === 'Enter') handleSaveMeta(); 
                        else if (e.key === 'Escape') { setIsEditingMeta(false); setNovaMeta(metaMensal); } 
                      }}
                    />
                    <IconButton color="#4caf50" onClick={handleSaveMeta} title="Salvar"><FaCheck size={16} /></IconButton>
                    <IconButton color="#ff4d4d" onClick={() => { setIsEditingMeta(false); setNovaMeta(metaMensal); }} title="Cancelar"><FaTimes size={16} /></IconButton>
                  </div>
                ) : (
                  <span style={{ fontSize: '16px', color: '#888' }}>{formatBRL(metaMensal)}</span>
                )}
              </div>
            </div>
          </div>
          <ProgressBarTrack>
            <ProgressBarFill 
              percent={stats.metaPercent} 
              style={{
                 background: stats.metaPercent >= 100 ? 'linear-gradient(90deg, #4caf50, #81c784)' : 'linear-gradient(90deg, #ffffff, #e0e0e0)',
                 boxShadow: stats.metaPercent >= 100 ? '0 0 10px #4caf50' : 'none'
              }}
            />
          </ProgressBarTrack>
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
             <p style={{fontSize:'12px', color:'#888', margin: 0}}>Conclus?o: <strong style={{color: stats.metaPercent >= 100 ? '#4caf50' : '#fff'}}>{stats.metaPercent.toFixed(1)}%</strong></p>
             <p style={{fontSize:'12px', color:'#888', margin: 0}}>Dia {stats.diaAt} de {stats.diasMes}</p>
          </div>
          
          {stats.metaPercent >= 100 && (
            <GlowBadge style={{marginTop: '15px', padding: '10px 15px', fontSize: '12px'}}>
              <FaTrophy color="#ffc107" size={16} />
              <span>Global Batida!</span>
              <FaTrophy color="#ffc107" size={16} />
            </GlowBadge>
          )}
        </StatCard>

        {/* META SCOOTERS */}
        <StatCard style={{ 
          padding: '30px',
          borderColor: stats.metaPercentScooter >= 100 ? '#66b2ff' : '#222',
          boxShadow: stats.metaPercentScooter >= 100 ? '0 0 20px rgba(102, 178, 255, 0.15)' : 'none',
          transition: 'all 0.5s ease-in-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <StatTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Meta Mensal Scooters
                {!isEditingMetaScooter && (
                  <>
                    <IconButton onClick={() => setIsEditingMetaScooter(true)} title="Editar Meta de Scooters">
                      <FaPencilAlt size={12} />
                    </IconButton>
                    <IconButton onClick={handleResetMetaScooterProgress} title="Zerar Progresso desta Meta">
                      <FaUndo size={12} color="#ff4d4d" />
                    </IconButton>
                  </>
                )}
              </StatTitle>
              <div style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {formatBRL(stats.progressoMetaScooter)} 
                <span style={{ fontSize: '14px', color: '#444' }}>/</span>
                
                {isEditingMetaScooter ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <EditMetaInput 
                      type="number" 
                      value={novaMetaScooter} 
                      onChange={e => setNovaMetaScooter(e.target.value)} 
                      autoFocus
                      onKeyDown={(e) => { 
                        if (e.key === 'Enter') handleSaveMetaScooter(); 
                        else if (e.key === 'Escape') { setIsEditingMetaScooter(false); setNovaMetaScooter(metaMensalScooter); } 
                      }}
                    />
                    <IconButton color="#4caf50" onClick={handleSaveMetaScooter} title="Salvar"><FaCheck size={16} /></IconButton>
                    <IconButton color="#ff4d4d" onClick={() => { setIsEditingMetaScooter(false); setNovaMetaScooter(metaMensalScooter); }} title="Cancelar"><FaTimes size={16} /></IconButton>
                  </div>
                ) : (
                  <span style={{ fontSize: '16px', color: '#888' }}>{formatBRL(metaMensalScooter)}</span>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <StatTitle>Progresso</StatTitle>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: stats.metaPercentScooter >= 100 ? '#66b2ff' : '#fff' }}>
                {stats.metaPercentScooter.toFixed(1)}%
              </div>
            </div>
          </div>
          <ProgressBarTrack>
            <ProgressBarFill 
              percent={stats.metaPercentScooter} 
              style={{
                 background: stats.metaPercentScooter >= 100 ? 'linear-gradient(90deg, #66b2ff, #0059b3)' : 'linear-gradient(90deg, #66b2ff, #ccc)',
                 boxShadow: stats.metaPercentScooter >= 100 ? '0 0 10px #66b2ff' : 'none'
              }}
            />
          </ProgressBarTrack>
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
             <p style={{fontSize:'12px', color:'#888', margin: 0}}>Scooters Vendidas neste m?s</p>
          </div>
          
          {stats.metaPercentScooter >= 100 && (
            <GlowBadge style={{marginTop: '15px', padding: '10px 15px', fontSize: '12px', borderColor: '#66b2ff', background: 'rgba(102, 178, 255, 0.1)', color: '#66b2ff'}}>
              <FaTrophy color="#66b2ff" size={16} />
              <span style={{color: '#66b2ff', textShadow: '0 0 10px rgba(102, 178, 255, 0.8)'}}>Meta Eletrizante Batida!</span>
              <FaTrophy color="#66b2ff" size={16} />
            </GlowBadge>
          )}
        </StatCard>

      </div>

      {/* BLOCO 2: CARDS PRINCIPAIS */}
      <GridStats>
        <StatCard color={stats.saude.critico > 0 ? '#ff4d4d' : '#4caf50'}>
          <StatTitle>Sa?de do Invent?rio</StatTitle><StatValue>{produtos.length} un</StatValue>
          <HealthIndicator>
            <div><small>Giro</small><span style={{color:'#4caf50'}}>?? {stats.saude.novo}</span></div>
            <div><small>Lento</small><span style={{color:'#ffc107'}}>?? {stats.saude.atencao}</span></div>
            <div><small>Cr?tico</small><span style={{color:'#ff4d4d'}}>?? {stats.saude.critico}</span></div>
          </HealthIndicator>
        </StatCard>

        <StatCard color="#ffffff"><StatTitle>Faturamento Bruto</StatTitle><StatValue>{formatBRL(stats.fatPeriodo)}</StatValue><StatTrend positive={stats.crescFat >= 0}>{stats.crescFat}% vs M?s Ant.</StatTrend></StatCard>
        <StatCard color="#ff4d4d"><StatTitle>Despesas / Gastos</StatTitle><StatValue style={{color:'#ff4d4d'}}>{formatBRL(stats.despesasPeriodo)}</StatValue><StatTrend positive={false}>Boletos e Fixos</StatTrend></StatCard>
        <StatCard color="#4caf50"><StatTitle>Lucro L?quido Real</StatTitle><StatValue style={{color:'#4caf50'}}>{formatBRL(stats.lucroLiquidoReal)}</StatValue><StatTrend positive={stats.crescLuc >= 0}>{stats.crescLuc}% vs M?s Ant.</StatTrend></StatCard>
      </GridStats>

      {/* BLOCO 3: EFICI?NCIA E CAPITAL */}
      <SectionTitle>Efici?ncia Operacional</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <StatCard>
          <StatTitle>Giro de Estoque</StatTitle>
          
          <div style={{display:'flex', justifyContent:'space-between', marginTop:'15px', paddingBottom:'10px', borderBottom:'1px solid #222'}}>
            <div style={{width: '70px', display: 'flex', alignItems: 'center'}}><small style={{color:'#fff', fontWeight:'bold', fontSize:'12px'}}>iPhones</small></div>
            <div style={{textAlign:'center', flex:1}}>
              <div style={{fontSize:'20px', fontWeight:'bold', color:'#ffffff'}}>{stats.itensIphone}</div>
              <small style={{color:'#888', fontSize:'9px', textTransform: 'uppercase', letterSpacing: '1px'}}>Em Estoque</small>
            </div>
            <div style={{height:'30px', width:'1px', background:'#333'}}></div>
            <div style={{textAlign:'center', flex:1}}>
              <div style={{fontSize:'20px', fontWeight:'bold', color:'#4caf50'}}>{stats.qtdIphonesVendido}</div>
              <small style={{color:'#888', fontSize:'9px', textTransform: 'uppercase', letterSpacing: '1px'}}>Vendidos (Per?odo)</small>
            </div>
          </div>

          <div style={{display:'flex', justifyContent:'space-between', marginTop:'10px'}}>
            <div style={{width: '70px', display: 'flex', alignItems: 'center'}}><small style={{color:'#fff', fontWeight:'bold', fontSize:'12px'}}>Acess?rios</small></div>
            <div style={{textAlign:'center', flex:1}}>
              <div style={{fontSize:'20px', fontWeight:'bold', color:'#ffffff'}}>{stats.itensAcessorios}</div>
              <small style={{color:'#888', fontSize:'9px', textTransform: 'uppercase', letterSpacing: '1px'}}>Em Estoque</small>
            </div>
            <div style={{height:'30px', width:'1px', background:'#333'}}></div>
            <div style={{textAlign:'center', flex:1}}>
              <div style={{fontSize:'20px', fontWeight:'bold', color:'#4caf50'}}>{stats.qtdAcessoriosVendido}</div>
              <small style={{color:'#888', fontSize:'9px', textTransform: 'uppercase', letterSpacing: '1px'}}>Vendidos (Per?odo)</small>
            </div>
          </div>
        </StatCard>
        <StatCard><StatTitle>Capital Imobilizado</StatTitle><div style={{fontSize:'22px', fontWeight:'bold', marginTop:'10px'}}>{formatBRL(stats.capitalInvestido)}</div><StatTrend positive>Bruto: {formatBRL(stats.potencialVenda)}</StatTrend></StatCard>
        <StatCard>
          <StatTitle>Margens L?quidas</StatTitle>
          <div style={{display:'flex', justifyContent:'space-between', marginTop:'15px'}}>
            <div><small>Reparos</small><b style={{color:'#4caf50'}}>{stats.margens.sv}%</b></div>
            <div><small>Aces</small><b style={{color:'#ffffff'}}>{stats.margens.ac}%</b></div>
            <div><small>iPhones</small><b style={{color:'#fff'}}>{stats.margens.ip}%</b></div>
          </div>
        </StatCard>
      </div>

      {/* BLOCO 4: GR?FICOS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <StatCard>
          <StatTitle>Top 5 Modelos Mais Vendidos</StatTitle>
          <div style={{height:'250px', marginTop:'20px'}}>
            <ResponsiveContainer>
              <BarChart data={stats.chartRanking} layout="vertical">
                <XAxis type="number" hide /><YAxis dataKey="name" type="category" stroke="#ccc" fontSize={10} width={100} />
                <Tooltip cursor={{fill:'#111'}} contentStyle={{backgroundColor:'#000', border:'1px solid #ffffff'}} /><Bar dataKey="total" fill="#ffffff" radius={[0, 4, 4, 0]} barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </StatCard>
        <StatCard>
          <StatTitle>Canais de Aquisi??o</StatTitle>
          <div style={{height:'250px', marginTop:'20px'}}>
            <ResponsiveContainer><PieChart>
              <Pie data={stats.chartOrigens} innerRadius={60} outerRadius={80} dataKey="value" stroke="none" paddingAngle={5}>
                {stats.chartOrigens.map((_, i) => <Cell key={i} fill={CORES_MR_IMPORTS[i % 5]} />)}
              </Pie><Tooltip contentStyle={{backgroundColor:'#000', border:'1px solid #ffffff', color: '#fff'}} /><Legend />
            </PieChart></ResponsiveContainer>
          </div>
        </StatCard>
      </div>

      {/* BLOCO 5: ALERTAS E INSIGHTS */}
      <div style={{display:'flex', gap:'20px'}}>
          {stats.alertasAcessorios.length > 0 && (
            <div style={{flex: 1, background:'rgba(255,193,7,0.05)', padding:'20px', borderRadius:'12px', border:'1px solid rgba(255,193,7,0.2)'}}>
              <small style={{color:'#ffc107', fontWeight:'bold'}}>?? REPOSI??O NECESS?RIA</small>
              <ul style={{margin:'10px 0 0 0', paddingLeft:'20px', fontSize:'13px', color:'#ccc'}}>
                {stats.alertasAcessorios.map(a => <li key={a.id}>{a.nome} (Restam {a.quantidade})</li>)}
              </ul>
            </div>
          )}
          <div style={{flex: 1, background:'#111', padding:'20px', borderRadius:'12px', borderLeft:'4px solid #ffffff'}}>
            <small style={{color:'#ffffff', fontWeight:'bold'}}>?? INSIGHT ESTRAT?GICO</small>
            <p style={{fontSize:'13px', color:'#ccc', margin:'10px 0 0 0'}}>As taxas de cart?o somam {formatBRL(stats.taxasPeriodo)}. Considere incentivar o PIX para proteger o lucro l?quido de {formatBRL(stats.lucroLiquidoReal)}.</p>
          </div>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
