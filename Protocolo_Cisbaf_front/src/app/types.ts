export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  localidade: string;
  uf: string;
}

export interface Usuarios {
  cpf: string;
  nome: string;
  rg: string;
  dataNascimento: string;
  sexo?: string;
  email: string;
  telefone?: string;
  celular?: string;
  emailAlt: string;
  matricula: string;
  cargo: string;
  cor?: string;
  unidade: string;
  endereco: Endereco;
}

export interface Formulario {
  id?: string;
  assunto: string;
  beneficio?: string;
  descricao: string;
  prioridade: boolean;
  confirmacao?: boolean | null;
  motivo?: string;
  arquivoPath?: string;
  usuario: Usuarios;
}

export interface FormValues extends Omit<Usuarios, 'endereco'>, Endereco {
  assunto: string;
  beneficio?: string;
  descricao: string;
  prioridade: boolean;
  arquivo?: FileList | null;
}
