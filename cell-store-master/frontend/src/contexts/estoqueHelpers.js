export const AUTH_USER_STORAGE_KEY = '@MRImports:userLogado';
export const AUTH_TOKEN_STORAGE_KEY = '@MRImports:authToken';
const LEGACY_USER_ROLE_STORAGE_KEY = '@MRImports:userRole';

export const API_URL = process.env.REACT_APP_API_URL || (() => {
  const port = window.location.port;
  if (port === '3000') return `${window.location.protocol}//${window.location.hostname}:5000/api`;
  return `${window.location.origin}/api`;
})();

export const clearAuthSession = () => {
  sessionStorage.removeItem(AUTH_USER_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  localStorage.removeItem(LEGACY_USER_ROLE_STORAGE_KEY);
};

export const persistStoredUser = (user) => {
  sessionStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  localStorage.removeItem(LEGACY_USER_ROLE_STORAGE_KEY);
};

export const persistAuthSession = (user, token) => {
  persistStoredUser(user);
  if (token) sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
};

export const hydrateStoredUser = () => {
  const raw = sessionStorage.getItem(AUTH_USER_STORAGE_KEY) || localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && !sessionStorage.getItem(AUTH_USER_STORAGE_KEY)) {
      persistStoredUser(parsed);
    }
    return parsed;
  } catch {
    return null;
  }
};

export const normalizarCpf = (val) => String(val || '').replace(/\D/g, '').slice(0, 11);

export const formatarCpf = (val) => {
  const digits = normalizarCpf(val);
  if (digits.length !== 11) return String(val || '').trim();
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

export const toNum = (val) => {
  if (!val) return 0;
  if (typeof val === 'number') return val;

  const valStr = String(val);

  if (valStr.includes('R$') || valStr.includes(',')) {
    const clean = valStr.replace(/[R$\s.]/g, '').replace(',', '.');
    return Number(clean) || 0;
  }

  const numericVal = Number(valStr);
  if (!Number.isNaN(numericVal)) {
    return numericVal;
  }

  const clean = valStr.replace(/\D/g, '');
  return clean === '' ? 0 : Number(clean);
};

const CHECKLIST_ASSISTENCIA_PADRAO = {
  telaRiscada: false,
  carcacaAmassada: false,
  faceIdRuim: false,
  cameraMancha: false,
};

export const normalizarChecklistAssistencia = (checklist = {}) => ({
  ...CHECKLIST_ASSISTENCIA_PADRAO,
  ...(checklist && typeof checklist === 'object' ? checklist : {}),
});

export const normalizarAssistencia = (item = {}) => ({
  ...item,
  id: item?.id != null ? String(item.id) : '',
  cliente: String(item?.cliente || '').toUpperCase(),
  aparelho: String(item?.aparelho || '').toUpperCase(),
  imei: String(item?.imei || '').toUpperCase(),
  endereco: String(item?.endereco || '').toUpperCase(),
  cpf: formatarCpf(item?.cpf),
  status: item?.status || 'orcamento',
  preco: item?.preco || '',
  custoPeca: item?.custoPeca || '',
  diasGarantia: String(item?.diasGarantia || '90'),
  checklist: normalizarChecklistAssistencia(item?.checklist),
});

export const normalizarFornecedor = (item = {}) => ({
  ...item,
  id: item?.id != null ? String(item.id) : '',
  nome: String(item?.nome || '').toUpperCase(),
  categoria: String(item?.categoria || '').trim(),
  telefone: String(item?.telefone || '').trim(),
});

export const normalizarProduto = (item = {}) => {
  const condicao = item?.condicao ?? item?.estado ?? '';
  const estado = item?.estado ?? item?.condicao ?? 'Novo';
  return { ...item, estado, condicao };
};

export const normalizarVenda = (item = {}) => ({
  ...item,
  cpf: formatarCpf(item?.cpf),
  origemCliente: item?.origemCliente || 'Balcão',
  tipoOriginal: item?.tipoOriginal ?? item?.tipo ?? '',
});

export const normalizarLog = (item = {}) => ({
  ...item,
  usuario: item?.usuario ?? item?.user ?? '',
});

export const normalizarCliente = (item = {}) => ({
  ...item,
  cpf: formatarCpf(item?.cpf),
  origem: item?.origem || '',
});

export const normalizarScooter = (item = {}) => ({
  ...item,
  potencia: item?.potencia ?? item?.asin ?? '',
});

export const sortByTimestampDesc = (items = []) => [...items].sort((a1, b1) => (b1.timestamp || 0) - (a1.timestamp || 0));

export const sortByUpdatedDesc = (items = []) => [...items].sort((a1, b1) => (
  Number(b1.updatedAt || b1.createdAt || 0) - Number(a1.updatedAt || a1.createdAt || 0)
));

export const sortByNomeAsc = (items = []) => [...items].sort((a1, b1) => a1.nome.localeCompare(b1.nome));
