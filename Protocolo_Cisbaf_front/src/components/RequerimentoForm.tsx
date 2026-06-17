'use client';

import { FormValues, sexos, assuntos, cores, beneficios, prioridade, unidades } from '@/components/types';
import { toaster } from "@/components/ui/toaster";
import {
  Badge, Box, Button, Card, Center, Container, Field, Flex, Heading, Input, Separator,
  SimpleGrid, Spinner, Text, Textarea, VStack, Select, HStack, Portal,
} from '@chakra-ui/react';

import {
  Calendar, CreditCard, Info, Mail, MapPin, Send,
  Smartphone, Upload, User, Scale, Copy, Check, ClipboardCheck
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import Header from './Header';
import { inputStyle, labelStyle, COLORS } from '@/components/ui/formStyles';


// ─── Sub-componente: cabeçalho de seção ──────────────────────────────────────
function SectionHeader({ step, title, badgeBg, badgeColor, }: {
  step: string; title: string; badgeBg: any; badgeColor: any;
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
        bg={badgeBg}
        color={badgeColor}
      >
        {step}
      </Badge>
      <Heading size="xl" fontWeight="800" color={COLORS.headingDark}>
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
    getValues,
    control,
    setError,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    defaultValues: { prioridade: "" },
  });


  useEffect(() => {
    if (submittedId) {
      const copyToClipboard = async (text: string) => {
        // Tenta usar a API moderna primeiro (funciona em HTTPS e localhost)
        if (navigator?.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback para HTTP (ex: acessando pelo IP da rede local)
          const textArea = document.createElement("textarea");
          textArea.value = text;

          // Esconde o textarea para não piscar na tela
          textArea.style.position = "absolute";
          textArea.style.left = "-999999px";

          document.body.prepend(textArea);
          textArea.select();

          try {
            document.execCommand('copy');
          } catch (error) {
            console.error("Falha no fallback de cópia:", error);
          } finally {
            textArea.remove();
          }
        }
      };

      // Executa a função e muda o estado do botão
      copyToClipboard(submittedId)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
        })
        .catch((err) => console.error("Erro ao copiar automaticamente:", err));
    }
  }, [submittedId]);

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
          cpf: data.cpf.trim(),
          nome: data.nome.trim(),
          sobrenome: data.sobrenome.trim(),
          rg: data.rg.trim(),
          dataNascimento: dataNascimentoFormatada,
          sexo: data.sexo,
          email: data.email.trim(),
          telefone: data.telefone,
          celular: data.celular,
          emailAlt: data.emailAlt,
          matricula: data.matricula.trim(),
          cargo: data.cargo.trim(),
          cor: data.cor,
          endereco: {
            cep: data.cep,
            endereco: data.logradouro.trim(),
            numero: data.numero,
            complemento: data.complemento,
            bairro: data.bairro.trim(),
            cidade: data.localidade.trim(),
            estado: data.uf.trim(),
          },
        },
        assunto: data.assunto.trim(),
        beneficio: data.beneficio,
        descricao: data.descricao.trim(),
        unidade: data.unidade,

        prioridade: data.prioridade_tramitacao_tipo || "",
      };

      const formData = new FormData();
      formData.append('formulario', JSON.stringify(payload));
      if (data.arquivo && data.arquivo.length > 0) {
        formData.append('arquivo', data.arquivo[0]);
      } else {
        formData.append('arquivo', new Blob([]), '');
      }

      console.log("Data:", Object.fromEntries(formData));

      const res = await fetch('/api/requerimentos', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json();
        throw errData;
      }

      const result = await res.json();

      setSubmittedId(result.id);
      reset();
      setResetKey((prev) => prev + 1);

    } catch (error: any) {

      // Tenta achar o array de erros, seja ele a própria resposta ou dentro de error.error
      const listaDeErros = Array.isArray(error)
        ? error
        : (error && Array.isArray(error.error) ? error.error : null);

      // 1. Se encontrou a lista de erros de validação
      if (listaDeErros) {
        listaDeErros.forEach((e: any) => {
          if (e.campo && e.mensagem) {
            // O react-hook-form liga o "e.campo" direto com o seu <Field.Root invalid={...}>
            setError(e.campo as keyof FormValues, {
              type: 'server',
              message: e.mensagem
            });
          }
        });

        toaster.create({
          title: 'Dados inválidos',
          description: 'Verifique as marcações em vermelho no formulário.',
          type: 'error',
        });

        return; // Para aqui e não mostra o erro 500 genérico
      }

      // 2. Fallback: Erros gerais (500, servidor fora, etc)
      let errorMessage = 'Ocorreu um erro ao enviar.';

      if (error && typeof error === 'object') {
        if (error.message) {
          errorMessage = error.message;
        } else if (error.error && typeof error.error === 'string') {
          errorMessage = error.error;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      toaster.create({
        title: 'Erro no servidor',
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

      setValue('logradouro', json.logradouro ?? '', { shouldValidate: true });
      setValue('complemento', json.complemento ?? '');
      setValue('bairro', json.bairro ?? '', { shouldValidate: true });
      setValue('localidade', json.localidade ?? '', { shouldValidate: true });
      setValue('uf', json.uf ?? '', { shouldValidate: true });
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
  const fetchUsuario = async (cpf: string, nome: string, sobrenome: string) => {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11) return;

    setIsFetchingUser(true);
    try {
      const res = await fetch(`/api/usuarios/${cpf}?nome=${encodeURIComponent(nome)}&sobrenome=${encodeURIComponent(sobrenome)}`);
      if (!res.ok) {
        return;
      }

      const user = await res.json();

      // Validar se o nome e o sobrenome batem com o banco
      if (
        (user.nome || '').trim().toLowerCase() !== nome.toLowerCase() ||
        (user.sobrenome || '').trim().toLowerCase() !== sobrenome.toLowerCase()
      ) {
        return;
      }

      if (user.dataNascimento) {
        if (user.dataNascimento.includes('/')) {
          const [day, month, year] = user.dataNascimento.split('/');
          setValue('dataNascimento', `${year}-${month}-${day}`, { shouldValidate: true });
        } else {
          setValue('dataNascimento', user.dataNascimento, { shouldValidate: true });
        }
      }

      if (user.nome) setValue('nome', user.nome, { shouldValidate: true });
      if (user.sobrenome) setValue('sobrenome', user.sobrenome, { shouldValidate: true })
      if (user.rg) setValue('rg', user.rg, { shouldValidate: true });
      if (user.sexo) setValue('sexo', user.sexo, { shouldValidate: true });
      if (user.email) setValue('email', user.email, { shouldValidate: true });
      if (user.telefone) setValue('telefone', user.telefone);
      if (user.celular) setValue('celular', user.celular);
      if (user.emailAlt) setValue('emailAlt', user.emailAlt);
      if (user.matricula) setValue('matricula', user.matricula, { shouldValidate: true });
      if (user.cargo) setValue('cargo', user.cargo, { shouldValidate: true });
      if (user.cor) setValue('cor', user.cor, { shouldValidate: true });
      if (user.unidade) setValue('unidade', user.unidade, { shouldValidate: true });

      if (user.endereco) {
        const e = user.endereco;
        if (e.cep) setValue('cep', e.cep, { shouldValidate: true });
        if (e.endereco) setValue('logradouro', e.endereco, { shouldValidate: true });
        if (e.numero) setValue('numero', e.numero, { shouldValidate: true });
        if (e.complemento) setValue('complemento', e.complemento);
        if (e.bairro) setValue('bairro', e.bairro, { shouldValidate: true });
        if (e.cidade) setValue('localidade', e.cidade, { shouldValidate: true });
        if (e.estado) setValue('uf', e.estado, { shouldValidate: true });
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

  const triggerFetchUsuario = async () => {
    const values = getValues();
    const cpf = (values.cpf || '').replace(/\D/g, '');
    const nome = (values.nome || '').trim();
    const sobrenome = (values.sobrenome || '').trim();

    if (cpf.length === 11 && nome.length > 0 && sobrenome.length > 0) {
      await fetchUsuario(cpf, nome, sobrenome);
    }
  };
  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <Header />

      <Box minH="100vh" py={{ base: 6, md: 16 }} bg={COLORS.bodyBg}>
        <Container maxW="container.xl" px={{ base: 3, md: 8 }}>
          <Card.Root variant="elevated" boxShadow="2xl" borderRadius={{ base: 'xl', md: '3xl' }}
            overflow="hidden" border="1.5px solid" borderColor="gray.200" bg={COLORS.cardBg}
          >
            {/* ── Cabeçalho ── */}
            <Card.Header
              pt={{ base: 10, md: 14 }}
              pb={{ base: 8, md: 12 }}
              px={{ base: 4, md: 8 }}
              textAlign="center"
              bg={{ base: "slate.900", _dark: "slate.700" }}
            >
              <Center>
                <VStack gap={3} maxW="2xl">
                  <Heading
                    size={{ base: '2xl', md: '4xl' }}
                    fontWeight="900"
                    letterSpacing="tight"
                    color='#F8FAFC'
                  >
                    Central de Requerimentos
                  </Heading>
                  <Text
                    fontSize={{ base: 'md', md: 'lg' }}
                    fontWeight="500"
                    color={COLORS.subtext}
                  >
                    Preencha os campos abaixo para solicitar um requerimento
                  </Text>
                  <Text fontSize="xs" color={COLORS.subtext} alignSelf={'center'}>
                    Campos com * são obrigatórios.
                  </Text>

                </VStack>
              </Center>
            </Card.Header>

            <Separator borderColor={COLORS.border} />

            <Card.Body p={{ base: 5, md: 14 }} bg={COLORS.cardBg}>
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
                      {/* CPF */}
                      <Field.Root required invalid={!!errors.cpf}>
                        <Field.Label {...labelStyle}>
                          <Box color="currentColor"><CreditCard size={14} /></Box> CPF*
                          {isFetchingUser && (
                            <Spinner size="xs" color={COLORS.btnBg} ml={1} />
                          )}
                        </Field.Label>
                        <Input
                          {...register('cpf', {
                            required: 'O campo CPF é obrigatório',
                            onChange: (e) => {
                              e.target.value = e.target.value.replace(/\D/g, '');
                            },
                            onBlur: () => triggerFetchUsuario(),
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
                          <Box color="currentColor"><User size={14} /></Box> PRIMEIRO NOME*
                        </Field.Label>
                        <Input
                          {...register('nome', {
                            required: 'O campo Primeiro Nome é obrigatório',
                            onBlur: () => triggerFetchUsuario(),
                          })}
                          {...inputStyle}
                          placeholder="Seu primeiro nome"
                          maxLength={70}
                        />
                        <Field.ErrorText style={{ color: '#DC2626', fontSize: '12px' }}>
                          {errors.nome?.message}
                        </Field.ErrorText>
                      </Field.Root>

                      {/* Sobrenome Nome */}
                      <Field.Root required invalid={!!errors.sobrenome}>
                        <Field.Label {...labelStyle}>
                          <Box color="currentColor"><User size={14} /></Box> SOBRENOME*
                        </Field.Label>
                        <Input
                          {...register('sobrenome', {
                            required: 'O campo Sobrenome é obrigatório',
                            onBlur: () => triggerFetchUsuario(),
                          })}
                          {...inputStyle}
                          placeholder="Seu sobrenome"
                          maxLength={70}
                        />
                        <Field.ErrorText style={{ color: '#DC2626', fontSize: '12px' }}>
                          {errors.sobrenome?.message}
                        </Field.ErrorText>
                      </Field.Root>


                      {/* RG */}
                      <Field.Root required invalid={!!errors.rg}>
                        <Field.Label {...labelStyle}>DOCUMENTO RG*</Field.Label>
                        <Input
                          {...register('rg', {
                            required: 'O campo Documento RG é obrigatório',
                            onChange: (e) => {
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
                      <Field.Root required invalid={!!errors.dataNascimento}>
                        <Field.Label {...labelStyle}>
                          <Box color="currentColor"><Calendar size={14} /></Box> DATA DE NASCIMENTO*
                        </Field.Label>
                        <Input
                          type="date"
                          {...register('dataNascimento', { required: 'O campo Data de Nascimento é obrigatório' })}
                          {...inputStyle}
                        />
                        <Field.ErrorText style={{ color: '#DC2626', fontSize: '12px' }}>
                          {errors.dataNascimento?.message}
                        </Field.ErrorText>
                      </Field.Root>

                      {/* Sexo */}
                      <Field.Root required invalid={!!errors.sexo}>
                        <Field.Label {...labelStyle}>SEXO*</Field.Label>
                        <Controller control={control} name="sexo"
                          rules={{ required: "Selecione o sexo" }}
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
                              <Portal>
                                <Select.Positioner>
                                  <Select.Content color={COLORS.headingDark}>
                                    {sexos.items.map((item) => (
                                      <Select.Item key={item.value} item={item}>
                                        {item.label}
                                      </Select.Item>
                                    ))}

                                  </Select.Content>
                                </Select.Positioner>
                              </Portal>
                            </Select.Root>
                          )}
                        />
                        <Field.ErrorText style={{ color: '#DC2626', fontSize: '12px' }}>
                          {errors.sexo?.message}
                        </Field.ErrorText>
                      </Field.Root>

                      {/* Cor */}
                      <Field.Root required invalid={!!errors.cor}>
                        <Field.Label {...labelStyle}>COR / ETNIA*</Field.Label>
                        <Controller
                          control={control}
                          name="cor"
                          rules={{ required: "Selecione a cor/etnia" }}
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
                              <Portal>
                                <Select.Positioner>
                                  <Select.Content color={COLORS.headingDark}>
                                    {cores.items.map((item) => (
                                      <Select.Item key={item.value} item={item}>
                                        {item.label}
                                      </Select.Item>
                                    ))}

                                  </Select.Content>
                                </Select.Positioner>
                              </Portal>
                            </Select.Root>
                          )}
                        />
                        <Field.ErrorText style={{ color: '#DC2626', fontSize: '12px' }}>
                          {errors.cor?.message}
                        </Field.ErrorText>
                      </Field.Root>
                    </SimpleGrid>
                  </VStack>

                  <Separator borderColor={COLORS.border} />

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
                          <Box color="currentColor"><Mail size={14} /></Box> E-MAIL PRINCIPAL*
                        </Field.Label>
                        <Input
                          type="email"
                          {...register('email', { required: 'O campo E-mail Principal é obrigatório' })}
                          {...inputStyle}
                          placeholder="seu@email.com"
                          maxLength={70}
                        />
                        <Field.ErrorText style={{ color: '#DC2626', fontSize: '12px' }}>
                          {errors.email?.message}
                        </Field.ErrorText>
                      </Field.Root>

                      {/* E-mail Alternativo */}
                      <Field.Root invalid={!!errors.emailAlt}>
                        <Field.Label {...labelStyle}>E-MAIL SECUNDÁRIO</Field.Label>
                        <Input
                          type="email"
                          {...register('emailAlt')}
                          {...inputStyle}
                          placeholder="outro@email.com"
                          maxLength={70}
                        />
                        <Field.ErrorText style={{ color: '#DC2626', fontSize: '12px' }}>
                          {errors.emailAlt?.message}
                        </Field.ErrorText>
                      </Field.Root>

                      {/* Celular */}
                      <Field.Root invalid={!!errors.celular}>
                        <Field.Label {...labelStyle}>
                          <Box color="currentColor"><Smartphone size={14} /></Box> CELULAR*
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
                        <Field.ErrorText style={{ color: '#DC2626', fontSize: '12px' }}>
                          {errors.celular?.message}
                        </Field.ErrorText>
                      </Field.Root>

                      {/* Telefone */}
                      <Field.Root invalid={!!errors.telefone}>
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
                        <Field.ErrorText style={{ color: '#DC2626', fontSize: '12px' }}>
                          {errors.telefone?.message}
                        </Field.ErrorText>
                      </Field.Root>
                    </SimpleGrid>

                    {/* Endereço */}
                    <Box
                      p={6}
                      borderRadius="2xl"
                      border="1.5px solid"
                      borderColor="gray.200"
                      bg={{ base: '#F8FAFC', _dark: 'slate.900' }}
                    >
                      <Flex align="center" gap={2} mb={5} color={COLORS.step2Text}>
                        <MapPin size={16} />
                        <Text
                          fontSize="sm"
                          fontWeight="700"
                          letterSpacing="wider"
                          color={COLORS.labelGray}
                        >
                          ENDEREÇO
                        </Text>
                      </Flex>

                      <SimpleGrid columns={{ base: 1, md: 4 }} gap={5}>
                        {/* CEP */}
                        <Field.Root required invalid={!!errors.cep}>
                          <Field.Label {...labelStyle}>
                            CEP*
                            {isFetchingCep && (
                              <Spinner size="xs" color={COLORS.btnBg} ml={1} />
                            )}
                          </Field.Label>
                          <Input
                            {...register('cep', {
                              required: 'O campo CEP é obrigatório',
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
                          <Field.ErrorText style={{ color: '#DC2626', fontSize: '12px' }}>
                            {errors.cep?.message}
                          </Field.ErrorText>
                        </Field.Root>

                        {/* Logradouro */}
                        <Box gridColumn={{ md: 'span 2' }}>
                          <Field.Root required invalid={!!errors.logradouro}>
                            <Field.Label {...labelStyle}>LOGRADOURO*</Field.Label>
                            <Input
                              {...register('logradouro', { required: 'O campo Logradouro é obrigatório' })}
                              {...inputStyle}
                              h="50px"
                              maxLength={50}
                            />
                            <Field.ErrorText style={{ color: '#DC2626', fontSize: '12px' }}>
                              {errors.logradouro?.message}
                            </Field.ErrorText>
                          </Field.Root>
                        </Box>

                        {/* Número */}
                        <Field.Root required invalid={!!errors.numero}>
                          <Field.Label {...labelStyle}>NÚMERO*</Field.Label>
                          <Input
                            {...register('numero', {
                              required: 'O campo Número é obrigatório',
                              onChange: (e) => {
                                e.target.value = e.target.value.replace(/\D/g, '');
                              }
                            })}
                            {...inputStyle}
                            h="50px"
                            maxLength={8}
                          />
                          <Field.ErrorText style={{ color: '#DC2626', fontSize: '12px' }}>
                            {errors.numero?.message}
                          </Field.ErrorText>
                        </Field.Root>

                        {/* Complemento */}
                        <Field.Root invalid={!!errors.complemento}>
                          <Field.Label {...labelStyle}>COMPLEMENTO</Field.Label>
                          <Input
                            {...register('complemento')}
                            {...inputStyle}
                            h="50px"
                            placeholder="Apto, Bloco…"
                            maxLength={30}
                          />
                          <Field.ErrorText style={{ color: '#DC2626', fontSize: '12px' }}>
                            {errors.complemento?.message}
                          </Field.ErrorText>
                        </Field.Root>

                        {/* Bairro */}
                        <Field.Root required invalid={!!errors.bairro}>
                          <Field.Label {...labelStyle}>BAIRRO*</Field.Label>
                          <Input
                            {...register('bairro', { required: 'O campo Bairro é obrigatório' })}
                            {...inputStyle}
                            h="50px"
                            maxLength={30}
                          />
                          <Field.ErrorText style={{ color: '#DC2626', fontSize: '12px' }}>
                            {errors.bairro?.message}
                          </Field.ErrorText>
                        </Field.Root>

                        {/* Cidade */}
                        <Field.Root required invalid={!!errors.localidade}>
                          <Field.Label {...labelStyle}>CIDADE*</Field.Label>
                          <Input
                            {...register('localidade', { required: 'O campo Cidade é obrigatório' })}
                            {...inputStyle}
                            h="50px"
                            maxLength={30}
                          />
                          <Field.ErrorText style={{ color: '#DC2626', fontSize: '12px' }}>
                            {errors.localidade?.message}
                          </Field.ErrorText>
                        </Field.Root>

                        {/* UF */}
                        <Field.Root required invalid={!!errors.uf}>
                          <Field.Label {...labelStyle}>UF*</Field.Label>
                          <Input
                            {...register('uf', {
                              required: 'O campo UF é obrigatório',
                              onChange: (e) => {
                                e.target.value = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase();
                              }
                            })}
                            {...inputStyle}
                            h="50px"
                            maxLength={2}
                            placeholder="RJ"
                          />
                          <Field.ErrorText style={{ color: '#DC2626', fontSize: '12px' }}>
                            {errors.uf?.message}
                          </Field.ErrorText>
                        </Field.Root>
                      </SimpleGrid>
                    </Box>
                  </VStack>

                  <Separator borderColor={COLORS.border} />

                  {/* ══ PASSO 03 – Dados do Requerimento ══ */}
                  <VStack gap={8} align="stretch">
                    <SectionHeader
                      step="PASSO 03"
                      title="Dados do Requerimento"
                      badgeBg={COLORS.step3Bg}
                      badgeColor={COLORS.step3Text}
                    />

                    <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
                      {/* MATRÍCULA */}
                      <Field.Root required invalid={!!errors.matricula}>
                        <Field.Label {...labelStyle}>MATRÍCULA*</Field.Label>
                        <Input
                          {...register('matricula', {
                            required: 'O campo Matrícula é obrigatório',
                            onChange: (e) => {
                              e.target.value = e.target.value.replace(/\D/g, '');
                            }
                          })}
                          maxLength={15}
                          {...inputStyle}
                          placeholder="Apenas números"
                        />
                        <Field.ErrorText style={{ color: '#DC2626', fontSize: '12px' }}>
                          {errors.matricula?.message}
                        </Field.ErrorText>
                      </Field.Root>

                      {/* Cargo */}
                      <Field.Root required invalid={!!errors.cargo}>
                        <Field.Label {...labelStyle}>CARGO*</Field.Label>
                        <Input
                          {...register('cargo', { required: 'O campo Cargo é obrigatório' })}
                          {...inputStyle}
                          placeholder="Seu cargo"
                          maxLength={50}
                        />
                        <Field.ErrorText style={{ color: '#DC2626', fontSize: '12px' }}>
                          {errors.cargo?.message}
                        </Field.ErrorText>
                      </Field.Root>

                      {/* Unidade */}
                      <Field.Root required invalid={!!errors.unidade}>
                        <Field.Label {...labelStyle}>UNIDADE*</Field.Label>
                        <Controller control={control} name="unidade"
                          rules={{ required: "Selecione a unidade" }}
                          render={({ field }) => (
                            <Select.Root collection={unidades} value={field.value ? [field.value] : []} onValueChange={(change) => field.onChange(change.value[0])}>
                              <Select.Trigger {...inputStyle}>
                                <Select.ValueText placeholder='Selecione uma unidade...' />
                                <Select.Indicator />
                              </Select.Trigger>
                              <Portal>
                                <Select.Positioner>
                                  <Select.Content color={COLORS.headingDark}>
                                    {unidades.items.map((item) => (
                                      <Select.Item key={item.value} item={item}>
                                        {item.label}
                                      </Select.Item>
                                    ))}

                                  </Select.Content>
                                </Select.Positioner>
                              </Portal>
                            </Select.Root>
                          )}>
                        </Controller>
                        <Field.ErrorText style={{ color: '#DC2626', fontSize: '12px' }}>
                          {errors.unidade?.message}
                        </Field.ErrorText>
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
                      bg={COLORS.reqAreaBg}
                    >
                      {/* Assunto */}
                      <Field.Root required invalid={!!errors.assunto}>
                        <Field.Label
                          fontWeight="700"
                          fontSize="sm"
                          display="flex"
                          alignItems="center"
                          gap={2}
                          color={COLORS.headingDark}
                        >
                          <Info size={18} color={COLORS.btnBg} /> ASSUNTO DO REQUERIMENTO*
                        </Field.Label>
                        <Controller control={control} name="assunto"
                          rules={{ required: "Selecione o assunto" }}
                          render={({ field }) => (
                            <Select.Root
                              collection={assuntos}
                              value={field.value ? [field.value] : []}
                              onValueChange={(details) =>
                                setValue('assunto', details.value[0], { shouldValidate: true })
                              }
                            >
                              <Select.Trigger {...inputStyle} >
                                <Select.ValueText placeholder="Selecione um assunto" />
                                <Select.Indicator />
                              </Select.Trigger>
                              <Portal>
                                <Select.Positioner>
                                  <Select.Content color={COLORS.headingDark}>
                                    {assuntos.items.map((item) => (
                                      <Select.Item key={item.value} item={item}>
                                        {item.label}
                                      </Select.Item>
                                    ))}

                                  </Select.Content>
                                </Select.Positioner>
                              </Portal>
                            </Select.Root>)} />
                        <Field.ErrorText style={{ color: '#DC2626', fontSize: '12px' }}>
                          {errors.assunto?.message}
                        </Field.ErrorText>
                      </Field.Root>

                      {/* Benefício */}
                      {watchAssunto === 'Benefício' && (
                        <Field.Root required invalid={!!errors.beneficio}>
                          <Field.Label
                            fontWeight="700"
                            fontSize="sm"
                            display="flex"
                            alignItems="center"
                            gap={2}
                            color={COLORS.headingDark}
                          >
                            <CreditCard size={18} color={COLORS.btnBg} /> TIPO DE BENEFÍCIO*
                          </Field.Label>
                          <Controller control={control} name="beneficio"
                            rules={{ required: "Selecione o tipo de benefício" }}
                            render={({ field }) => (
                              <Select.Root
                                collection={beneficios}
                                value={field.value ? [field.value] : []}
                                onValueChange={(details) =>
                                  setValue('beneficio', details.value[0], { shouldValidate: true })
                                }
                              >
                                <Select.Trigger {...inputStyle}>
                                  <Select.ValueText placeholder="Selecione o benefício" />
                                  <Select.Indicator />
                                </Select.Trigger>
                                <Portal>
                                  <Select.Positioner>
                                    <Select.Content color={COLORS.headingDark}>
                                      {beneficios.items.map((item) => (
                                        <Select.Item key={item.value} item={item}>
                                          {item.label}
                                        </Select.Item>
                                      ))}

                                    </Select.Content>
                                  </Select.Positioner>
                                </Portal>
                              </Select.Root>)} />
                          <Field.ErrorText style={{ color: '#DC2626', fontSize: '12px' }}>
                            {errors.beneficio?.message}
                          </Field.ErrorText>
                        </Field.Root>
                      )}

                      {/* Descrição */}
                      <Field.Root required invalid={!!errors.descricao}>
                        <Field.Label
                          fontWeight="700"
                          fontSize="sm"
                          color={COLORS.headingDark}
                        >
                          DESCRIÇÃO DETALHADA*
                        </Field.Label>
                        <Textarea
                          {...register('descricao', { required: 'O campo Descrição Detalhada é obrigatório' })}
                          {...inputStyle}
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
                          {errors.descricao?.message}
                        </Field.ErrorText>
                      </Field.Root>

                      {/* Arquivo */}
                      <Field.Root invalid={!!errors.arquivo} >
                        <Field.Label
                          fontWeight="700"
                          fontSize="sm"
                          display="flex"
                          alignItems="center"
                          gap={2}
                          color={COLORS.headingDark}
                        >
                          <Upload size={16} color={COLORS.btnBg} /> ANEXAR DOCUMENTAÇÃO (PDF / JPG)
                        </Field.Label>
                        <Flex
                          align="center"
                          p={3}
                          {...inputStyle}
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
                            color={COLORS.labelGray}
                          />
                        </Flex>
                        <Field.ErrorText style={{ color: '#DC2626', fontSize: '12px' }}>
                          {errors.arquivo?.message as string}
                        </Field.ErrorText>
                      </Field.Root>

                      {/* Prioridade */}
                      <Box p={5} bg={{ base: 'white', _dark: '#0F172A' }} borderRadius="xl" border="2px solid" borderColor="blue.100" >
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
                              <Select.Root collection={prioridade} value={field.value ? [field.value] : []} onValueChange={(change) => field.onChange(change.value[0])}>
                                <Select.Trigger {...inputStyle}>
                                  <Select.ValueText placeholder='- Não me enquadro / Nenhuma das opções -' />
                                  <Select.Indicator />
                                </Select.Trigger>
                                <Portal>
                                  <Select.Positioner>
                                    <Select.Content color={COLORS.headingDark}>
                                      {prioridade.items.map((item) => (
                                        <Select.Item key={item.value} item={item}>
                                          {item.label}
                                        </Select.Item>
                                      ))}
                                    </Select.Content>
                                  </Select.Positioner>
                                </Portal>
                              </Select.Root>
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
                  <Text fontSize="xs" color="black.600" alignSelf={'center'}>
                    O número do protocolo será enviado por e-mail. Recomendamos anotar ou copiar os números exibidos na tela para sua referência.
                  </Text>
                </VStack>
              </form>
            </Card.Body>
          </Card.Root>
        </Container >
      </Box >

      {/* ── Overlay de Sucesso ── */}
      {
        submittedId && (
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
        )
      }
    </>
  );
}