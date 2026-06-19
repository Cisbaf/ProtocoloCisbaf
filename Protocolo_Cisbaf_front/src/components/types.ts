import { createListCollection } from "@chakra-ui/react";

// ─── Endereço (@Embeddable) ───────────────────────────────────────────────────
export interface Endereco {
  cep: string;
  endereco: string;       // logradouro — campo "endereco" na entidade
  numero: number;
  complemento?: string;
  bairro: string;
  cidade: string;         // campo "localidade" no form → "cidade" na entidade
  estado: string;         // campo "uf" no form → "estado" na entidade
}

// ─── Usuário (@Entity Usuarios) ──────────────────────────────────────────────
export interface Usuario {
  cpf: string;
  nome: string;
  sobrenome: string;
  rg: string;
  dataNascimento: string; // yyyy-MM-dd (@JsonFormat)
  sexo?: string;
  email: string;
  telefone?: string;
  celular?: string;
  emailAlt?: string;
  matricula: string;
  cargo: string;
  cor?: string;
  endereco: Endereco;
}

// ─── Mensagem de Chat ─────────────────────────────────────────────────────────
export interface Mensagem {
  id: number;
  conteudo: string;
  remetente: 'ADMIN' | 'SOLICITANTE';
  nomeRemetente: string;
  dataEnvio: string; // LocalDateTime serializado como ISO string
}

// ─── Formulário (@Entity Formulario) ─────────────────────────────────────────
export interface Formulario {
  id?: string;            // gerado pelo @PrePersist, não enviado pelo form
  assunto: string;
  beneficio?: string;     // só obrigatório quando assunto === 'beneficios'
  descricao: string;
  prioridade: string;
  finalizarArquivar?: 'FINALIZADO' | 'ARQUIVADO' | 'EM_ANALISE' | 'TERMINADO';
  motivo?: string;        // preenchido pelo RH na recusa
  arquivoPath?: string;   // preenchido pelo backend após upload
  unidade: string;
  dataCriacao: string;
  usuario: Usuario;
}

// ─── Payload do submit ────────────────────────────────────────────────────────
export interface RequerimentoPayload {
  usuario: Usuario;
  assunto: string;
  beneficio?: string;
  descricao: string;
  prioridade: string;
}

// ─── Valores do formulário (react-hook-form) ──────────────────────────────────
export interface FormValues {
  // Identificação
  cpf: string;
  nome: string;
  sobrenome: string
  rg: string;
  dataNascimento: string;
  sexo?: string;
  cor?: string;

  // Contato
  email: string;
  telefone?: string;
  celular?: string;
  emailAlt?: string;

  // Dados funcionais
  matricula: string;
  cargo: string;
  unidade: string;

  // Endereço (nomes do form — difere da entidade)
  cep: string;
  logradouro: string;     // → Endereco.endereco
  numero: number;
  complemento?: string;
  bairro: string;
  localidade: string;     // → Endereco.cidade
  uf: string;             // → Endereco.estado

  // Requerimento
  assunto: string;
  beneficio?: string;
  descricao: string;
  prioridade: string;
  prioridade_tramitacao_tipo?: string;
  arquivo?: FileList;
}

export const assuntos = createListCollection({
  items: [
    { label: 'Atestado', value: 'Atestado' },
    { label: 'Desligamento', value: 'Desligamento' },
    { label: 'Folha de Pagamento', value: 'Folha de Pagamento' },
    { label: 'Benefícios (Refeição e Transporte)', value: 'Benefício' },
    { label: 'Outros Assuntos (Administrativos)', value: 'Assuntos Administrativos' },
  ],
});

export const sexos = createListCollection({
  items: [
    { label: 'Masculino', value: 'MASCULINO' },
    { label: 'Feminino', value: 'FEMININO' },
    { label: 'Não-binário', value: 'NAO_BINARIO' },
    { label: 'Prefiro não responder', value: 'NAO_INFORMADO' },
  ],
});

export const cores = createListCollection({
  items: [
    { label: 'Branca', value: 'BRANCA' },
    { label: 'Preta', value: 'PRETA' },
    { label: 'Parda', value: 'PARDA' },
    { label: 'Amarela', value: 'AMARELA' },
    { label: 'Indígena', value: 'INDIGENA' },
    { label: 'Prefiro não informar', value: 'NAO_INFORMADO' },
  ],
});

export const beneficios = createListCollection({
  items: [
    { label: 'Refeição', value: 'Refeição' },
    { label: 'Transporte', value: 'Transporte' },
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

export const prioridade = createListCollection({
  items: [
    { label: '- Não me enquadro / Nenhuma das opções -', value: '' },
    { label: 'Sou pessoa com deficiência (PcD)', value: 'pcd' },
    { label: 'Sou pessoa com autismo (TEA)', value: 'tea' },
    { label: 'Sou idoso(a) (60 anos ou mais)', value: 'idoso_60' },
    { label: 'Sou idoso(a) (80 anos ou mais)', value: 'idoso_80' },
    { label: 'Sou gestante', value: 'gestante' },
    { label: 'Sou pessoa obesa', value: 'obeso' },
    { label: 'Possuo mobilidade reduzida', value: 'mobilidade_reduzida' },
    { label: 'Sou doador(a) de sangue', value: 'doador_sangue' }
  ]
})