'use client';

import { FormValues } from '@/components/types';
import { toaster } from "@/components/ui/toaster";
import {
  Badge,
  Box,
  Button,
  Card,
  Center,
  Container,
  createListCollection,
  Field,
  Flex,
  Heading,
  Input,
  Separator,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  VStack,
  Select,
  HStack,
} from '@chakra-ui/react';

import {
  Calendar,
  CreditCard,
  Info,
  Mail,
  MapPin,
  Send,
  Smartphone,
  Upload,
  User,
  Scale,
  Copy,
  Check,
  ClipboardCheck
} from 'lucide-react';
import { useState } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import Header from './Header';
import { inputStyle, labelStyle, COLORS } from '@/components/formStyles';

// ─── Sub-componente: cabeçalho de seção ──────────────────────────────────────
function SectionHeader({
  step,
  title,
  badgeBg,
  badgeColor,
}: {
  step: string;
  title: string;
  badgeBg: string;
  badgeColor: string;
}) {
  return (
    <Center flexDir="column" gap={2}>
      <Badge
        px={5}
        py={1.5}
        borderRadius="full"
        fontSize="10px"
        fontWeight="800"
        letterSpacing="widest"
        style={{ background: badgeBg, color: badgeColor }}
      >
        {step}
      </Badge>
      <Heading size="xl" fontWeight="800" style={{ color: COLORS.headingDark }}>
        {title}
      </Heading>
    </Center>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function RequerimentoForm() {
  const [, setResetKey] = useState(0);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    handleSubmit,
    register,
    reset,
    setValue,
    control,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    defaultValues: { prioridade: "" },
  });

  const watchAssunto = useWatch({ control, name: 'assunto' });

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data: FormValues) => {
    try {

      let dataNascimentoFormatada = data.dataNascimento;
      if (dataNascimentoFormatada && dataNascimentoFormatada.includes('-')) {
        const [year, month, day] = dataNascimentoFormatada.split('-');
        dataNascimentoFormatada = `${day}/${month}/${year}`;
      }

      const payload = {
        usuario: {
          cpf: data.cpf,
          nome: data.nome,
          rg: data.rg,
          dataNascimento: dataNascimentoFormatada,
          sexo: data.sexo,
          email: data.email,
          telefone: data.telefone,
          celular: data.celular,
          emailAlt: data.emailAlt,
          matricula: data.matricula,
          cargo: data.cargo,
          cor: data.cor,
          unidade: data.unidade,
          endereco: {
            cep: data.cep,
            endereco: data.logradouro,
            numero: data.numero,
            complemento: data.complemento,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf,
          },
        },
        assunto: data.assunto,
        beneficio: data.beneficio,
        descricao: data.descricao,
        prioridade: data.prioridade_tramitacao_tipo || "",
      };

      const formData = new FormData();
      formData.append('formulario', JSON.stringify(payload));
      if (data.arquivo && data.arquivo.length > 0) {
        formData.append('arquivo', data.arquivo[0]);
      } else {
        formData.append('arquivo', new Blob([]), '');
      }

      const res = await fetch('/api/requerimentos', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Erro ao enviar requerimento');

      const result = await res.json();

      setSubmittedId(result.id);
      reset();
      setResetKey((prev) => prev + 1);

      setTimeout(() => {
        setSubmittedId(null);
      }, 15000);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro ao enviar.';
      toaster.create({
        title: 'Erro',
        description: errorMessage,
        type: 'error',
      });
    }
  };

  // ── Busca de CEP via backend (/form/cep/:cep) ────────────────────────────
  const fetchCep = async (cep: string) => {
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) return;

    setIsFetchingCep(true);
    try {
      const res = await fetch(`/api/form/${clean}`);
      if (!res.ok) throw new Error('CEP não encontrado');

      const json: {
        cep: string;
        logradouro: string;
        complemento: string;
        bairro: string;
        localidade: string;
        uf: string;
        estado: string;
      } = await res.json();

      setValue('logradouro', json.logradouro ?? '');
      setValue('complemento', json.complemento ?? '');
      setValue('bairro', json.bairro ?? '');
      setValue('localidade', json.localidade ?? '');
      setValue('uf', json.uf ?? '');
    } catch {
      toaster.create({
        title: 'CEP inválido',
        description: 'Não foi possível localizar o endereço. Preencha manualmente.',
        type: 'warning',
      });
    } finally {
      setIsFetchingCep(false);
    }
  };

  // ── Busca de usuário por CPF ──────────────────────────────────────────────
  const fetchUsuario = async (cpf: string) => {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11) return;

    setIsFetchingUser(true);
    try {
      const res = await fetch(`/api/usuarios/${cpf}`);
      if (!res.ok) {
        return;
      }

      const user = await res.json();
      if (user.dataNascimento) {

        if (user.dataNascimento.includes('/')) {
          const [day, month, year] = user.dataNascimento.split('/');
          setValue('dataNascimento', `${year}-${month}-${day}`);
        } else {
          setValue('dataNascimento', user.dataNascimento);
        }
      }

      if (user.nome) setValue('nome', user.nome);
      if (user.rg) setValue('rg', user.rg);
      if (user.sexo) setValue('sexo', user.sexo);
      if (user.email) setValue('email', user.email);
      if (user.telefone) setValue('telefone', user.telefone);
      if (user.celular) setValue('celular', user.celular);
      if (user.emailAlt) setValue('emailAlt', user.emailAlt);
      if (user.matricula) setValue('matricula', user.matricula);
      if (user.cargo) setValue('cargo', user.cargo);
      if (user.cor) setValue('cor', user.cor);
      if (user.unidade) setValue('unidade', user.unidade);

      if (user.endereco) {
        const e = user.endereco;
        if (e.cep) setValue('cep', e.cep);
        if (e.endereco) setValue('logradouro', e.endereco);
        if (e.numero) setValue('numero', e.numero);
        if (e.complemento) setValue('complemento', e.complemento);
        if (e.bairro) setValue('bairro', e.bairro);
        if (e.cidade) setValue('localidade', e.cidade);
        if (e.estado) setValue('uf', e.estado);
      }

      toaster.create({
        title: 'Dados carregados',
        description: `Campos preenchidos automaticamente para ${user.nome}.`,
        type: 'info',
      });
    } catch (err: unknown) {
      console.error(err);
      toaster.create({
        title: 'Aviso',
        description: 'Não foi possível carregar os dados automaticamente.',
        type: 'warning',
      });
    } finally {
      setIsFetchingUser(false);
    }
  };

  // ── Collections de select ─────────────────────────────────────────────────
  const assuntos = createListCollection({
    items: [
      { label: 'Benefícios (Refeição e Transporte)', value: 'beneficios' },
      { label: 'Desligamento', value: 'desligamento' },
      { label: 'Folha de Pagamento', value: 'folha' },
      { label: 'Outros Assuntos (Administrativos)', value: 'outros' },
    ],
  });

  const sexos = createListCollection({
    items: [
      { label: 'Masculino', value: 'MASCULINO' },
      { label: 'Feminino', value: 'FEMININO' },
      { label: 'Não-binário', value: 'NAO_BINARIO' },
      { label: 'Prefiro não responder', value: 'NAO_INFORMADO' },
    ],
  });

  const cores = createListCollection({
    items: [
      { label: 'Branca', value: 'BRANCA' },
      { label: 'Preta', value: 'PRETA' },
      { label: 'Parda', value: 'PARDA' },
      { label: 'Amarela', value: 'AMARELA' },
      { label: 'Indígena', value: 'INDIGENA' },
      { label: 'Prefiro não informar', value: 'NAO_INFORMADO' },
    ],
  });

  const beneficios = createListCollection({
    items: [
      { label: 'Refeição', value: 'refeição' },
      { label: 'Transporte', value: 'transporte' },
    ],
  });

  const unidades = createListCollection({
    items: [
      { label: 'Unidade I - Sede CISBAF', value: 'CISBAF' },
      { label: 'Unidade II - CRUR/BF', value: 'CRUR' },
      { label: 'Unidade III - Base SAMU Queimados', value: 'QUEIMADOS' },
      { label: 'Unidade IV - Base SAMU Nilópolis', value: 'NILOPOLIS' },
      { label: 'Unidade V - UPA Jardim Íris', value: 'IRIS' },
    ]
  })

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <Header />

      <Box minH="100vh" py={{ base: 6, md: 16 }} style={{ background: COLORS.bodyBg }}>
        <Container maxW="container.xl" px={{ base: 3, md: 8 }}>
          <Card.Root
            variant="elevated"
            boxShadow="2xl"
            borderRadius={{ base: 'xl', md: '3xl' }}
            overflow="hidden"
            border="1.5px solid"
            borderColor="gray.200"
            style={{ background: COLORS.cardBg }}
          >
            {/* ── Cabeçalho ── */}
            <Card.Header
              pt={{ base: 10, md: 14 }}
              pb={{ base: 8, md: 12 }}
              px={{ base: 4, md: 8 }}
              textAlign="center"
              style={{ background: COLORS.cardBg }}
            >
              <Center>
                <VStack gap={3} maxW="2xl">
                  <Heading
                    size={{ base: '2xl', md: '4xl' }}
                    fontWeight="900"
                    letterSpacing="tight"
                    style={{ color: COLORS.headingDark }}
                  >
                    Central de Requerimentos
                  </Heading>
                  <Text
                    fontSize={{ base: 'md', md: 'lg' }}
                    fontWeight="500"
                    style={{ color: COLORS.subtext }}
                  >
                    Preencha os campos abaixo para solicitar um requerimento
                  </Text>
                </VStack>
              </Center>
            </Card.Header>

            <Separator style={{ borderColor: COLORS.border }} />

            <Card.Body p={{ base: 5, md: 14 }} style={{ background: COLORS.cardBg }}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <VStack gap={{ base: 12, md: 18 }} align="stretch">

                  {/* ══ PASSO 01 – Identificação ══ */}
                  <VStack gap={8} align="stretch">
                    <SectionHeader
                      step="PASSO 01"
                      title="Identificação Pessoal"
                      badgeBg={COLORS.step1Bg}
                      badgeColor={COLORS.step1Text}
                    />

                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
                      {/* CPF (Apenas números, máximo 11) */}
                      <Field.Root required invalid={!!errors.cpf}>
                        <Field.Label {...labelStyle}>
                          <CreditCard size={14} /> CPF
                          {isFetchingUser && (
                            <Spinner size="xs" color={COLORS.btnBg} ml={1} />
                          )}
                        </Field.Label>
                        <Input
                          {...register('cpf', {
                            required: 'CPF obrigatório',
                            onChange: (e) => {
                              // Arranca qualquer coisa que não seja número
                              e.target.value = e.target.value.replace(/\D/g, '');
                            },
                            onBlur: (e) => fetchUsuario(e.target.value),
                          })}
                          maxLength={11}
                          {...inputStyle}
                          placeholder="Números do CPF"
                        />
                        <Field.ErrorText style={{ color: '#DC2626', fontSize: '12px' }}>
                          {errors.cpf?.message}
                        </Field.ErrorText>
                      </Field.Root>

                      {/* Nome */}
                      <Field.Root required invalid={!!errors.nome}>
                        <Field.Label {...labelStyle}>
                          <User size={14} /> NOME COMPLETO
                        </Field.Label>
                        <Input
                          {...register('nome', { required: 'Nome obrigatório' })}
                          {...inputStyle}
                          placeholder="Seu nome completo"
                          maxLength={70}
                        />
                        <Field.ErrorText style={{ color: '#DC2626', fontSize: '12px' }}>
                          {errors.nome?.message}
                        </Field.ErrorText>
                      </Field.Root>

                      {/* RG */}
                      <Field.Root required invalid={!!errors.rg}>
                        <Field.Label {...labelStyle}>DOCUMENTO RG</Field.Label>
                        <Input
                          {...register('rg', {
                            required: 'RG obrigatório',
                            onChange: (e) => {
                              // Arranca qualquer coisa que não seja número
                              e.target.value = e.target.value.replace(/\D/g, '');
                            },
                          })}
                          {...inputStyle}
                          maxLength={10}
                          placeholder="Número do RG"
                        />
                        <Field.ErrorText style={{ color: '#DC2626', fontSize: '12px' }}>
                          {errors.rg?.message}
                        </Field.ErrorText>
                      </Field.Root>

                      {/* Data de Nascimento */}
                      <Field.Root required>
                        <Field.Label {...labelStyle}>
                          <Calendar size={14} /> DATA DE NASCIMENTO
                        </Field.Label>
                        <Input
                          type="date"
                          {...register('dataNascimento', { required: true })}
                          {...inputStyle}
                        />
                      </Field.Root>

                      {/* Sexo */}
                      <Field.Root>
                        <Field.Label {...labelStyle}>SEXO</Field.Label>
                        <Controller
                          control={control}
                          name="sexo"
                          render={({ field }) => (
                            <Select.Root
                              collection={sexos}
                              value={field.value ? [field.value] : []}
                              onValueChange={(details) => field.onChange(details.value[0])}
                            >
                              <Select.Trigger {...inputStyle}>
                                <Select.ValueText placeholder="Selecione..." />
                                <Select.Indicator />
                              </Select.Trigger>
                              <Select.Content>
                                {sexos.items.map((item) => (
                                  <Select.Item key={item.value} item={item}>
                                    {item.label}
                                  </Select.Item>
                                ))}
                              </Select.Content>
                            </Select.Root>
                          )}
                        />
                      </Field.Root>

                      {/* Cor */}
                      <Field.Root>
                        <Field.Label {...labelStyle}>COR / ETNIA</Field.Label>
                        <Controller
                          control={control}
                          name="cor"
                          render={({ field }) => (
                            <Select.Root
                              collection={cores}
                              value={field.value ? [field.value] : []}
                              onValueChange={(details) => field.onChange(details.value[0])}
                            >
                              <Select.Trigger {...inputStyle}>
                                <Select.ValueText placeholder="Selecione..." />
                                <Select.Indicator />
                              </Select.Trigger>
                              <Select.Content>
                                {cores.items.map((item) => (
                                  <Select.Item key={item.value} item={item}>
                                    {item.label}
                                  </Select.Item>
                                ))}
                              </Select.Content>
                            </Select.Root>
                          )}
                        />
                      </Field.Root>
                    </SimpleGrid>
                  </VStack>

                  <Separator style={{ borderColor: COLORS.border }} />

                  {/* ══ PASSO 02 – Contato e Endereço ══ */}
                  <VStack gap={8} align="stretch">
                    <SectionHeader
                      step="PASSO 02"
                      title="Localização e Contato"
                      badgeBg={COLORS.step2Bg}
                      badgeColor={COLORS.step2Text}
                    />

                    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6}>
                      {/* E-mail */}
                      <Field.Root required invalid={!!errors.email}>
                        <Field.Label {...labelStyle}>
                          <Mail size={14} /> E-MAIL PRINCIPAL
                        </Field.Label>
                        <Input
                          type="email"
                          {...register('email', { required: true })}
                          {...inputStyle}
                          placeholder="seu@email.com"
                          maxLength={30}
                        />
                      </Field.Root>

                      {/* E-mail Alternativo */}
                      <Field.Root>
                        <Field.Label {...labelStyle}>E-MAIL SECUNDÁRIO</Field.Label>
                        <Input
                          type="email"
                          {...register('emailAlt')}
                          {...inputStyle}
                          placeholder="outro@email.com"
                          maxLength={30}
                        />
                      </Field.Root>

                      {/* Celular (Apenas números, máximo 11) */}
                      <Field.Root>
                        <Field.Label {...labelStyle}>
                          <Smartphone size={14} /> CELULAR
                        </Field.Label>
                        <Input
                          {...register('celular', {
                            onChange: (e) => {
                              e.target.value = e.target.value.replace(/\D/g, '');
                            }
                          })}
                          maxLength={11}
                          {...inputStyle}
                          placeholder="Apenas números"
                        />
                      </Field.Root>

                      {/* Telefone (Apenas números, máximo 10) */}
                      <Field.Root>
                        <Field.Label {...labelStyle}>TELEFONE FIXO</Field.Label>
                        <Input
                          {...register('telefone', {
                            onChange: (e) => {
                              e.target.value = e.target.value.replace(/\D/g, '');
                            }
                          })}
                          maxLength={10}
                          {...inputStyle}
                          placeholder="Apenas números"
                        />
                      </Field.Root>
                    </SimpleGrid>

                    {/* Endereço */}
                    <Box
                      p={6}
                      borderRadius="2xl"
                      border="1.5px solid"
                      borderColor="gray.200"
                      style={{ background: '#F8FAFC' }}
                    >
                      <Flex align="center" gap={2} mb={5}>
                        <MapPin size={16} color={COLORS.step2Text} />
                        <Text
                          fontSize="sm"
                          fontWeight="700"
                          letterSpacing="wider"
                          style={{ color: COLORS.labelGray }}
                        >
                          ENDEREÇO
                        </Text>
                      </Flex>

                      <SimpleGrid columns={{ base: 1, md: 4 }} gap={5}>
                        {/* CEP (Apenas números, máximo 8) */}
                        <Field.Root required>
                          <Field.Label {...labelStyle}>
                            CEP
                            {isFetchingCep && (
                              <Spinner size="xs" color={COLORS.btnBg} ml={1} />
                            )}
                          </Field.Label>
                          <Input
                            {...register('cep', {
                              required: true,
                              onChange: (e) => {
                                e.target.value = e.target.value.replace(/\D/g, '');
                              },
                              onBlur: (e) => fetchCep(e.target.value),
                            })}
                            maxLength={8}
                            {...inputStyle}
                            h="50px"
                            placeholder="Apenas números"
                          />
                        </Field.Root>

                        {/* Logradouro */}
                        <Box gridColumn={{ md: 'span 2' }}>
                          <Field.Root required>
                            <Field.Label {...labelStyle}>LOGRADOURO</Field.Label>
                            <Input
                              {...register('logradouro', { required: true })}
                              {...inputStyle}
                              h="50px"
                              maxLength={50}

                            />

                          </Field.Root>
                        </Box>

                        {/* Número */}
                        <Field.Root required>
                          <Field.Label {...labelStyle}>NÚMERO</Field.Label>
                          <Input
                            {...register('numero', {
                              required: true,
                              onChange: (e) => {
                                e.target.value = e.target.value.replace(/\D/g, '');
                              }
                            })}
                            {...inputStyle}
                            h="50px"
                            maxLength={8}
                          />
                        </Field.Root>

                        {/* Complemento */}
                        <Field.Root>
                          <Field.Label {...labelStyle}>COMPLEMENTO</Field.Label>
                          <Input
                            {...register('complemento')}
                            {...inputStyle}
                            h="50px"
                            placeholder="Apto, Bloco…"
                            maxLength={30}
                          />
                        </Field.Root>

                        {/* Bairro */}
                        <Field.Root required>
                          <Field.Label {...labelStyle}>BAIRRO</Field.Label>
                          <Input
                            {...register('bairro', { required: true })}
                            {...inputStyle}
                            h="50px"
                            maxLength={30}

                          />
                        </Field.Root>

                        {/* Cidade */}
                        <Field.Root required>
                          <Field.Label {...labelStyle}>CIDADE</Field.Label>
                          <Input
                            {...register('localidade', { required: true })}
                            {...inputStyle}
                            h="50px"
                            maxLength={30}

                          />
                        </Field.Root>

                        {/* UF (Apenas Letras, máximo 2, Maiúsculo) */}
                        <Field.Root required>
                          <Field.Label {...labelStyle}>UF</Field.Label>
                          <Input
                            {...register('uf', {
                              required: true,
                              onChange: (e) => {
                                e.target.value = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase();
                              }
                            })}
                            {...inputStyle}
                            h="50px"
                            maxLength={2}
                            placeholder="RJ"
                          />
                        </Field.Root>
                      </SimpleGrid>
                    </Box>
                  </VStack>

                  <Separator style={{ borderColor: COLORS.border }} />

                  {/* ══ PASSO 03 – Dados do Requerimento ══ */}
                  <VStack gap={8} align="stretch">
                    <SectionHeader
                      step="PASSO 03"
                      title="Dados do Requerimento"
                      badgeBg={COLORS.step3Bg}
                      badgeColor={COLORS.step3Text}
                    />

                    <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
                      {/* MATRÍCULA (Apenas números, limite arbitrário de 10) */}
                      <Field.Root required invalid={!!errors.matricula}>
                        <Field.Label {...labelStyle}>MATRÍCULA</Field.Label>
                        <Input
                          {...register('matricula', {
                            required: true,
                            onChange: (e) => {
                              e.target.value = e.target.value.replace(/\D/g, '');
                            }
                          })}
                          maxLength={15}
                          {...inputStyle}
                          placeholder="Apenas números"
                        />
                      </Field.Root>

                      <Field.Root required invalid={!!errors.cargo}>
                        <Field.Label {...labelStyle}>CARGO</Field.Label>
                        <Input
                          {...register('cargo', { required: true })}
                          {...inputStyle}
                          placeholder="Seu cargo"
                          maxLength={50}

                        />
                      </Field.Root>

                      <Field.Root required invalid={!!errors.unidade}>
                        <Field.Label {...labelStyle}>UNIDADE</Field.Label>
                        <Controller control={control} name="unidade"
                          render={({ field }) => (
                            <Select.Root collection={unidades} value={field.value ? [field.value] : []} onValueChange={(change) => field.onChange(change.value[0])}>
                              <Select.Trigger {...inputStyle}>
                                <Select.ValueText placeholder='Selecione uma unidade...' />
                                <Select.Indicator />
                              </Select.Trigger>
                              <Select.Content>
                                {unidades.items.map((item) => (
                                  <Select.Item key={item.value} item={item}>
                                    {item.label}
                                  </Select.Item>
                                ))}
                              </Select.Content>
                            </Select.Root>
                          )}>
                        </Controller>
                      </Field.Root>
                    </SimpleGrid>

                    {/* Área do requerimento */}
                    <VStack
                      gap={7}
                      align="stretch"
                      p={{ base: 5, md: 8 }}
                      borderRadius="2xl"
                      border="2px dashed"
                      borderColor="blue.200"
                      style={{ background: COLORS.reqAreaBg }}
                    >
                      {/* Assunto */}
                      <Field.Root required invalid={!!errors.assunto}>
                        <Field.Label
                          fontWeight="700"
                          fontSize="sm"
                          display="flex"
                          alignItems="center"
                          gap={2}
                          style={{ color: COLORS.headingDark }}
                        >
                          <Info size={18} color={COLORS.btnBg} /> ASSUNTO DO REQUERIMENTO
                        </Field.Label>
                        <Select.Root
                          collection={assuntos}
                          onValueChange={(details) =>
                            setValue('assunto', details.value[0], { shouldValidate: true })
                          }
                          w={450}
                        >
                          <Select.Trigger {...inputStyle} >
                            <Select.ValueText placeholder="Selecione um assunto" />
                            <Select.Indicator />
                          </Select.Trigger>
                          <Select.Content>
                            {assuntos.items.map((item) => (
                              <Select.Item key={item.value} item={item}>
                                {item.label}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Root>
                        <Field.ErrorText style={{ color: '#DC2626', fontSize: '12px' }}>
                          Campo obrigatório
                        </Field.ErrorText>
                      </Field.Root>

                      {/* Benefício – exibido apenas quando assunto === 'beneficios' (valor do select) */}
                      {watchAssunto === 'beneficios' && (
                        <Field.Root required invalid={!!errors.beneficio}>
                          <Field.Label
                            fontWeight="700"
                            fontSize="sm"
                            display="flex"
                            alignItems="center"
                            gap={2}
                            style={{ color: COLORS.headingDark }}
                          >
                            <CreditCard size={18} color={COLORS.btnBg} /> TIPO DE BENEFÍCIO
                          </Field.Label>
                          <Select.Root
                            collection={beneficios}
                            onValueChange={(details) =>
                              setValue('beneficio', details.value[0], { shouldValidate: true })
                            }
                            w={450}
                          >
                            <Select.Trigger {...inputStyle}>
                              <Select.ValueText placeholder="Selecione o benefício" />
                              <Select.Indicator />
                            </Select.Trigger>
                            <Select.Content>
                              {beneficios.items.map((item) => (
                                <Select.Item key={item.value} item={item}>
                                  {item.label}
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Root>
                          <Field.ErrorText style={{ color: '#DC2626', fontSize: '12px' }}>
                            Campo obrigatório
                          </Field.ErrorText>
                        </Field.Root>
                      )}

                      {/* Descrição */}
                      <Field.Root invalid={!!errors.descricao} required>
                        <Field.Label
                          fontWeight="700"
                          fontSize="sm"
                          style={{ color: COLORS.headingDark }}
                        >
                          DESCRIÇÃO DETALHADA
                        </Field.Label>
                        <Textarea
                          {...register('descricao', { required: true })}
                          bg="white"
                          borderRadius="xl"
                          border="2px solid"
                          borderColor={COLORS.reqBorder}
                          fontSize="md"
                          fontWeight="500"
                          color={COLORS.headingDark}
                          p={4}
                          minH="160px"
                          resize="vertical"
                          placeholder="Descreva sua solicitação com o máximo de detalhes possível…"
                          _placeholder={{ color: '#9CA3AF', fontWeight: '400' }}
                          _focus={{
                            borderColor: COLORS.inputFocus,
                            boxShadow: `0 0 0 3px ${COLORS.inputFocus}22`,
                            outline: 'none',
                          }}
                        />
                        <Field.ErrorText style={{ color: '#DC2626', fontSize: '12px' }}>
                          Campo obrigatório
                        </Field.ErrorText>
                      </Field.Root>

                      {/* Arquivo */}
                      <Field.Root>
                        <Field.Label
                          fontWeight="700"
                          fontSize="sm"
                          display="flex"
                          alignItems="center"
                          gap={2}
                          style={{ color: COLORS.headingDark }}
                        >
                          <Upload size={16} color={COLORS.btnBg} /> ANEXAR DOCUMENTAÇÃO (PDF / JPG)
                        </Field.Label>
                        <Flex
                          align="center"
                          p={3}
                          bg="white"
                          borderRadius="xl"
                          border="2px solid"
                          borderColor={COLORS.reqBorder}
                        >
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            {...register('arquivo')}
                            border="none"
                            p={1}
                            cursor="pointer"
                            style={{ color: COLORS.labelGray }}
                          />
                        </Flex>
                      </Field.Root>

                      {/* Prioridade */}
                      <Box p={5} bg="blue.50" borderRadius="xl" border="2px solid" borderColor="blue.100">
                        <VStack align="stretch" gap={4}>
                          <HStack gap={3} align="flex-start">
                            <Box bg="blue.600" p={2} borderRadius="xl" color="white" mt={0.5}>
                              <Scale size={18} />
                            </Box>
                            <VStack align="start" gap={0}>
                              <Text fontSize="sm" fontWeight="800" color="blue.700" textTransform="uppercase">
                                Prioridade de Tramitação Legal
                              </Text>
                              <Text fontSize="xs" color="blue.600">
                                Caso possua direito a atendimento prioritário, selecione sua condição abaixo para acelerar o processo.
                              </Text>
                            </VStack>
                          </HStack>

                          <Controller
                            name="prioridade_tramitacao_tipo"
                            control={control}
                            render={({ field }) => (
                              <select
                                id="prioridade_tramitacao_tipo"
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '14px 16px',
                                  borderRadius: '14px',
                                  border: '2px solid #E2E8F0',
                                  backgroundColor: 'white',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  color: '#1E293B',
                                  outline: 'none',
                                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                                onFocus={(e) => (e.target.style.borderColor = '#3182CE')}
                                onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
                              >
                                <option value="">- Não me enquadro / Nenhuma das opções -</option>
                                <option value="pcd">Sou pessoa com deficiência (PcD)</option>
                                <option value="tea">Sou pessoa com autismo (TEA)</option>
                                <option value="idoso_60">Sou idoso(a) (60 anos ou mais)</option>
                                <option value="idoso_80">Sou idoso(a) (80 anos ou mais)</option>
                                <option value="gestante">Sou gestante</option>
                                <option value="obeso">Sou pessoa obesa</option>
                                <option value="mobilidade_reduzida">Possuo mobilidade reduzida</option>
                                <option value="doador_sangue">Sou doador(a) de sangue</option>
                              </select>
                            )}
                          />
                        </VStack>
                      </Box>
                    </VStack>
                  </VStack>

                  {/* ── Botão de envio ── */}
                  <Center mt={6}>
                    <Button
                      type="submit"
                      size="xl"
                      px={16}
                      h="72px"
                      borderRadius="2xl"
                      fontSize="xl"
                      fontWeight="800"
                      loading={isSubmitting}
                      style={{
                        background: COLORS.btnBg,
                        color: '#FFFFFF',
                        letterSpacing: '0.05em',
                      }}
                      boxShadow="0 8px 24px rgba(37,99,235,0.35)"
                      _hover={{
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 32px rgba(37,99,235,0.45)',
                      }}
                      _active={{ transform: 'translateY(0)' }}
                      transition="all 0.2s ease"
                    >
                      <Send size={22} style={{ marginRight: '12px' }} />
                      ENVIAR REQUERIMENTO
                    </Button>
                  </Center>

                </VStack>
              </form>
            </Card.Body>
          </Card.Root>
        </Container>
      </Box>

      {/* ── Overlay de Sucesso ── */}
      {submittedId && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="green.600"
          zIndex={5000}
          display="flex"
          justifyContent="center"
          alignItems="center"
          p={4}
          textAlign="center"
          color="white"
          animation="fade-in 0.5s ease-out"
        >
          <VStack gap={8} maxW="2xl">
            <Box bg="white" color="green.600" p={6} borderRadius="full" shadow="2xl">
              <ClipboardCheck size={80} />
            </Box>

            <VStack gap={2}>
              <Heading size="4xl" fontWeight="900" letterSpacing="tighter">
                ENVIADO COM SUCESSO!
              </Heading>
              <Text fontSize="xl" fontWeight="600" opacity={0.9}>
                Sua solicitação foi registrada no sistema.
              </Text>
            </VStack>

            <Box
              bg="blackAlpha.300"
              p={10}
              borderRadius="3xl"
              border="2px dashed"
              borderColor="whiteAlpha.400"
              w="full"
              position="relative"
            >
              <Text fontSize="xs" fontWeight="black" mb={2} letterSpacing="widest" opacity={0.8}>
                NÚMERO DO PROTOCOLO (ANOTE ESTE CÓDIGO)
              </Text>
              <Heading size="3xl" fontWeight="black" letterSpacing="wider" mb={6}>
                {submittedId}
              </Heading>

              <Button
                size="xl"
                bg="white"
                color="green.600"
                px={10}
                h="60px"
                borderRadius="2xl"
                fontWeight="black"
                onClick={() => {
                  if (submittedId) {
                    navigator.clipboard.writeText(submittedId);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                _hover={{ transform: "scale(1.05)", bg: "gray.50" }}
              >
                {copied ? (
                  <HStack gap={2}><Check size={20} /> COPIADO!</HStack>
                ) : (
                  <HStack gap={2}><Copy size={20} /> COPIAR PROTOCOLO</HStack>
                )}
              </Button>
            </Box>

            <VStack gap={4}>
              <Text fontSize="sm" fontWeight="bold" fontStyle="italic" color="green.100">
                Esta tela se fechará automaticamente em instantes...
              </Text>
              <Button
                variant="ghost"
                color="white"
                borderRadius="full"
                onClick={() => setSubmittedId(null)}
                _hover={{ bg: "whiteAlpha.200" }}
              >
                FECHAR AGORA
              </Button>
            </VStack>
          </VStack>

          <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes fade-in {
              from { opacity: 0; transform: scale(1.1); }
              to { opacity: 1; transform: scale(1); }
            }
          `}} />
        </Box>
      )}
    </>
  );
}