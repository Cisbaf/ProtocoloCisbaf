'use client';

import { FormValues, assuntos, beneficios, unidades } from '@/components/types';
import { toaster } from "@/components/ui/toaster";
import {
  Badge, Box, Button, Card, Center, Container, Field, Flex,
  HStack,
  Heading, Input,
  Portal,
  Select,
  Separator,
  SimpleGrid, Spinner, Text, Textarea, VStack,
} from '@chakra-ui/react';

import { COLORS, inputStyle, labelStyle } from '@/components/ui/formStyles';
import {
  Check, ClipboardCheck,
  Copy,
  CreditCard, Info, Mail, Send,
  Smartphone, Upload, User
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import Header from './Header';


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

      const payload = {
        usuario: {
          cpf: data.cpf.trim(),
          nome: data.nome.trim(),
          sobrenome: data.sobrenome.trim(),
          email: data.email.trim(),
          telefone: data.telefone,
          celular: data.celular,
          emailAlt: data.emailAlt,
          matricula: data.matricula.trim(),
          cargo: data.cargo.trim(),

        },
        assunto: data.assunto.trim(),
        beneficio: data.beneficio,
        descricao: data.descricao.trim(),
        unidade: data.unidade,

      };

      const formData = new FormData();
      formData.append('formulario', JSON.stringify(payload));
      if (data.arquivo && data.arquivo.length > 0) {
        for (let i = 0; i < data.arquivo.length; i++) {
          formData.append('arquivos', data.arquivo[i]);
        }
      } else {
        formData.append('arquivos', new Blob([]), '');
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


      if (user.nome) setValue('nome', user.nome, { shouldValidate: true });
      if (user.sobrenome) setValue('sobrenome', user.sobrenome, { shouldValidate: true })
      if (user.email) setValue('email', user.email, { shouldValidate: true });
      if (user.telefone) setValue('telefone', user.telefone);
      if (user.celular) setValue('celular', user.celular);
      if (user.emailAlt) setValue('emailAlt', user.emailAlt);
      if (user.matricula) setValue('matricula', user.matricula, { shouldValidate: true });
      if (user.cargo) setValue('cargo', user.cargo, { shouldValidate: true });
      if (user.unidade) setValue('unidade', user.unidade, { shouldValidate: true });

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
                    </SimpleGrid>
                  </VStack>

                  <Separator borderColor={COLORS.border} />

                  {/* ══ PASSO 02 – Contato e Endereço ══ */}
                  <VStack gap={8} align="stretch">
                    <SectionHeader
                      step="PASSO 02"
                      title="Informações de Contato"
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
                          <Upload size={16} color={COLORS.btnBg} /> ANEXAR DOCUMENTAÇÃO
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
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png"
                            {...register('arquivo', {
                              validate: (files) => !files || files.length <= 3 || 'No máximo 3 arquivos permitidos'
                            })}
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