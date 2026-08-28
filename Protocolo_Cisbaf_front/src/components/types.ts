import { createListCollection } from "@chakra-ui/react";

// ─── Usuário (@Entity Usuarios) ──────────────────────────────────────────────
export interface Usuario {
  cpf: string;
  nome: string;
  sobrenome: string;
  email: string;
  telefone?: string;
  celular?: string;
  emailAlt?: string;
  matricula?: string;
  cargo?: string;
}

// ─── Mensagem de Chat ─────────────────────────────────────────────────────────
export interface Mensagem {
  id: number;
  conteudo?: string | null;
  remetente: 'ADMIN' | 'SOLICITANTE';
  nomeRemetente: string;
  dataEnvio: string; // LocalDateTime serializado como ISO string
  arquivoPath?: string;
}

export interface AssinaturaProcesso {
  acao: 'FINALIZADO' | 'REABRIU' | 'ARQUIVOU';
  nome: string;
  data: string;
}

// ─── Formulário (@Entity Formulario) ─────────────────────────────────────────
export interface Formulario {
  id?: string;            // gerado pelo @PrePersist, não enviado pelo form
  assunto: string;
  beneficio?: string;     // só obrigatório quando assunto === 'beneficios'
  descricao: string;
  finalizarArquivar?: 'FINALIZADO' | 'ARQUIVADO' | 'EM_ANALISE' | 'TERMINADO';
  motivo?: string;        // preenchido pelo RH na recusa
  historicoAssinaturas?: AssinaturaProcesso[];
  arquivoPath?: string;   // preenchido pelo backend após upload
  unidade?: string;
  dataCriacao: string;
  usuario: Usuario;
}

// ─── Payload do submit ────────────────────────────────────────────────────────
export interface RequerimentoPayload {
  usuario: Usuario;
  assunto: string;
  beneficio?: string;
  descricao: string;
}

// ─── Valores do formulário (react-hook-form) ──────────────────────────────────
export interface FormValues {
  // Identificação
  cpf: string;
  nome: string;
  sobrenome: string;

  // Contato
  email: string;
  telefone?: string;
  celular?: string;
  emailAlt?: string;

  // Dados funcionais
  matricula?: string;
  cargo?: string;
  unidade?: string;

  // Requerimento
  assunto: string;
  beneficio?: string;
  descricao: string;
  arquivo?: FileList;
}

export const assuntos = createListCollection({
  items: [
    { label: 'Atestado', value: 'Atestado' },
    { label: 'Benefícios (Refeição e Transporte)', value: 'Benefício' },
    { label: 'Desligamento', value: 'Desligamento' },
    { label: 'Folha de Pagamento', value: 'Folha de Pagamento' },
    { label: 'Ouvidoria', value: 'Ouvidoria' },
    { label: 'Responsáveis Técnicos', value: 'Responsáveis Técnicos' },
    { label: 'Outros Assuntos (Administrativos)', value: 'Assuntos Administrativos' },
  ],
});


export const beneficios = createListCollection({
  items: [
    { label: 'Refeição', value: 'Refeição' },
    { label: 'Transporte', value: 'Transporte' },
  ],
});
export const responsaveis_tec = createListCollection({
  items: [
    { label: 'NEP', value: 'NEP' },
    { label: 'Assuntos Administrativos', value: 'Assuntos Administrativos' },
    { label: 'Fechamento Benefícios', value: 'Fechamento Benefícios' },
    { label: 'OFÍCIO DE DESLIGAMENTO', value: 'OFÍCIO DE DESLIGAMENTO' },
    { label: 'Ofício de Fechamento da Folha', value: 'Ofício de Fechamento da Folha' },
    { label: 'Ofício Férias', value: 'Ofício Férias' },
    { label: 'Ofício Plantão Extra', value: 'Ofício Plantão Extra' },
    { label: 'Ofício Troca de Plantão/Escala', value: 'Ofício Troca de Plantão/Escala' },
  ],
});

export const unidades = createListCollection({
  items: [
    { label: 'Unidade I - Sede CISBAF', value: 'CISBAF' },
    { label: 'Unidade II - CRUR/BF', value: 'CRUR' },
    { label: 'Unidade III - Base SAMU Queimados', value: 'QUEIMADOS' },
    { label: 'Unidade IV - Base SAMU Nilópolis', value: 'NILOPOLIS' },
    { label: 'Unidade V - UPA Jardim Íris', value: 'IRIS' },
  ]
});
