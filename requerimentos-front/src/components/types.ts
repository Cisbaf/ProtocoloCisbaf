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
  unidade: string;
  endereco: Endereco;
}

// ─── Formulário (@Entity Formulario) ─────────────────────────────────────────
export interface Formulario {
  id?: string;            // gerado pelo @PrePersist, não enviado pelo form
  assunto: string;
  beneficio?: string;     // só obrigatório quando assunto === 'beneficios'
  descricao: string;
  prioridade: string;
  confirmacao?: boolean | null; // @Builder.Default = null (preenchido pelo RH)
  motivo?: string;        // preenchido pelo RH na recusa
  arquivoPath?: string;   // preenchido pelo backend após upload
  usuario: Usuario;
}

// ─── Payload do submit ────────────────────────────────────────────────────────
// O que o frontend monta e envia via FormData para /api/requerimentos
export interface RequerimentoPayload {
  usuario: Usuario;
  assunto: string;
  beneficio?: string;
  descricao: string;
  prioridade: string;
}

// ─── Valores do formulário (react-hook-form) ──────────────────────────────────
// Campos "achatados" para facilitar o bind dos inputs.
// O mapper toRequerimentoPayload() converte isso para RequerimentoPayload.
export interface FormValues {
  // Identificação
  cpf: string;
  nome: string;
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
