'use client';

import { Formulario } from '@/components/types';
import { toaster } from '@/components/ui/toaster';
import { Badge, Box, Button, Card, Center, Container, HStack, Heading, SimpleGrid, Spinner, Table, Text, VStack } from '@chakra-ui/react';
import { AlertCircle, ArrowUpDown, BarChartIcon, CheckCircle, Eye, RefreshCw, Search, Trash, User, XCircle, } from 'lucide-react';
import { useEffect, useState } from 'react';
import Header from './Header';
import ReqDetailsModal from './modal/ReqDetailsModal';
import { useRouter } from 'next/navigation';
import StatsModal from './modal/StatsModal';

export default function Inspector() {
  const router = useRouter();
  const [requerimentos, setRequerimentos] = useState<Formulario[]>([]);
  const [loading, setLoading] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [baseFilter, setBaseFilter] = useState("all");
  const [assuntoFilter, setAssuntoFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selectedReq, setSelectedReq] = useState<Formulario | null>(null);
  const [refusalReason, setRefusalReason] = useState("");
  const [reqToRefuseId, setReqToRefuseId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [isRefuseModalOpen, setIsRefuseModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  const bases = Array.from(new Set(requerimentos.map(r => r.unidade).filter(Boolean)));
  const assuntosUnicos = Array.from(new Set(requerimentos.map(r => r.assunto).filter(Boolean)));

  const fetchRequerimentos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/requerimentos');
      if (!res.ok) throw new Error("Erro ao buscar dados");
      const data = await res.json();
      setRequerimentos(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro interno';
      toaster.create({ title: 'Erro', description: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchRequerimentos(); }, []);

  const updateStatus = async (id: string, approved: boolean, motivo?: string) => {
    if (approved) {
      if (!window.confirm("Tem certeza que deseja aprovar este requerimento?")) {
        return;
      }
    }

    try {
      setUpdatingId(id);

      const res = await fetch(`/api/requerimentos/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmacao: approved,
          motivo: motivo
        })
      });

      if (!res.ok) {
        throw new Error("Erro ao atualizar status");
      }

      toaster.create({ title: 'Sucesso', type: 'success' });

      setRequerimentos(prev =>
        prev.map(req => req.id === id ? { ...req, confirmacao: approved } : req)
      );

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro interno';
      toaster.create({ title: 'Erro', description: errorMessage, type: 'error' });
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteForm = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja apagar este requerimento? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      setUpdatingId(id);

      const res = await fetch(`/api/requerimentos/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error("Erro ao deletar o requerimento");
      }

      toaster.create({
        title: 'Requerimento excluído com sucesso!',
        type: 'success'
      });

      setRequerimentos(prev => prev.filter(req => req.id !== id));

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro interno';
      toaster.create({
        title: 'Erro',
        description: errorMessage,
        type: 'error'
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDownloadArquivo = async (arquivoPath: string) => {
    try {
      const res = await fetch(`/api/download/${arquivoPath}`);
      if (!res.ok) throw new Error("Erro ao baixar arquivo");
      const blob = await res.blob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      link.download = decodeURIComponent(arquivoPath);

      document.body.appendChild(link);
      link.click();

      link.remove();
      URL.revokeObjectURL(url);

      toaster.create({ title: 'Sucesso', description: 'Arquivo baixado com sucesso', type: 'success' });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro interno';
      toaster.create({ title: 'Erro', description: errorMessage, type: 'error' });
    }
  }

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (!res.ok) throw new Error("Erro ao desconectar");
      toaster.create({ title: 'Desconectado com sucesso', type: 'success' });
      router.push('/login');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro interno';
      toaster.create({ title: 'Erro ao sair', description: errorMessage, type: 'error' });
    }
  };

  const filtered = requerimentos.filter(r => {
    const matchesName = nameFilter === "" ||
      r.usuario?.nome.toLowerCase().includes(nameFilter.toLowerCase()) ||
      r.usuario?.cpf.includes(nameFilter) ||
      r.usuario?.matricula.includes(nameFilter) ||
      r.usuario?.sobrenome.toLowerCase().includes(nameFilter);

    const matchesBase = baseFilter === "all" || r.unidade === baseFilter;
    const matchesAssunto = assuntoFilter === "all" || r.assunto === assuntoFilter;

    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "pending" && r.confirmacao === null) ||
      (statusFilter === "approved" && r.confirmacao === true) ||
      (statusFilter === "rejected" && r.confirmacao === false);

    return matchesName && matchesBase && matchesAssunto && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aUrgent = a.prioridade && a.prioridade !== "" && a.prioridade !== "false" && a.confirmacao === null;
    const bUrgent = b.prioridade && b.prioridade !== "" && b.prioridade !== "false" && b.confirmacao === null;
    if (aUrgent && !bUrgent) return -1;
    if (!aUrgent && bUrgent) return 1;

    const aPending = a.confirmacao === null;
    const bPending = b.confirmacao === null;
    if (aPending && !bPending) return -1;
    if (!aPending && bPending) return 1;

    return 0;
  });

  const renderStatus = (confirmacao: boolean | null | undefined) => {
    if (confirmacao === true) return <Badge bg="green.100" color="green.700" borderRadius="full" px={3} py={1} fontWeight="black" display="flex" alignItems="center" gap={1}><CheckCircle size={12} /> APROVADO</Badge>;
    if (confirmacao === false) return <Badge bg="red.100" color="red.700" borderRadius="full" px={3} py={1} fontWeight="black" display="flex" alignItems="center" gap={1}><XCircle size={12} /> RECUSADO</Badge>;
    return <Badge bg="orange.100" color="orange.700" borderRadius="full" px={3} py={1} fontWeight="black" display="flex" alignItems="center" gap={1}><AlertCircle size={12} /> PENDENTE</Badge>;
  };

  return (
    <>
      <Header />
      <Box bg={{ base: "gray.100", _dark: "slate.950" }} minH="100vh" py={{ base: 4, md: 12 }}>
        <Container maxW="container.xl" px={{ base: 2, md: 8 }}>
          <Card.Root
            variant="elevated"
            boxShadow="2xl"
            borderRadius={{ base: "xl", md: "3xl" }}
            overflow="hidden"
            border="2px solid"
            borderColor={{ base: "gray.300", _dark: "slate.700" }}
            bg={{ base: "white", _dark: "slate.900" }}
          >
            <Card.Header
              pt={{ base: 8, md: 12 }}
              pb={{ base: 12, md: 20 }}
              px={{ base: 4, md: 8 }}
              textAlign="center"
              bg={{ base: "slate.900", _dark: "slate.700" }}
              color="white"
            >
              <Center>
                <VStack gap={4} maxW="3xl">
                  <Badge bg="blue.500" color="white" px={4} py={1} borderRadius="full" fontWeight="black" fontSize="xs" letterSpacing="widest">
                    PAINEL ADMIN
                  </Badge>
                  <Heading size={{ base: "xl", md: "4xl" }} fontWeight="black" letterSpacing="tight">
                    Gestão de Requerimentos
                  </Heading>
                  <HStack gap={4} mt={4} flexWrap="wrap" justify="center">
                    <Button
                      size={{ base: "md", md: "sm" }}
                      bg="white"
                      color="slate.900"
                      onClick={fetchRequerimentos}
                      loading={loading}
                      borderRadius="full"
                      fontWeight="bold"
                    >
                      <RefreshCw size={16} style={{ marginRight: '6px' }} /> Sincronizar
                    </Button>
                    <Button
                      size={{ base: "md", md: "sm" }}
                      bg="red.500"
                      color="white"
                      _hover={{ bg: "red.600" }}
                      onClick={handleLogout}
                      borderRadius="full"
                      fontWeight="bold"
                    >
                      Sair
                    </Button>
                    <Button
                      size={{ base: "md", md: "sm" }}
                      bg="green.500"
                      color="white"
                      _hover={{ bg: "green.600" }}
                      onClick={() => setIsStatsModalOpen(true)}
                      borderRadius="full"
                      fontWeight="bold"
                    >
                      <BarChartIcon size={16} style={{ marginRight: '6px' }} /> Relatórios
                    </Button>
                  </HStack>
                </VStack>
              </Center>
            </Card.Header>

            <Card.Body p={{ base: 4, md: 10 }} mt={{ base: -8, md: -12 }} bg={{ base: "white", _dark: "slate.900" }} borderRadius={{ base: "2xl", md: "4xl" }} shadow="2xl">
              <VStack gap={6} align="stretch">
                <Box bg={{ base: "gray.50", _dark: "slate.800" }} p={{ base: 4, md: 6 }} borderRadius="2xl" border="1px solid" borderColor={{ base: "gray.200", _dark: "slate.700" }}>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: bases.length > 1 ? 4 : 3 }} gap={4}>
                    <VStack align="start" gap={1}>
                      <Text fontSize="xs" fontWeight="black" color={{ base: "gray.500", _dark: "slate.400" }}>NOME OU CPF</Text>
                      <Box position="relative" w="full">
                        <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={10} color={{ base: "gray.400", _dark: "slate.500" }}>
                          <Search size={16} />
                        </Box>
                        <Box
                          as="input"
                          {...({
                            placeholder: "Buscar...",
                            value: nameFilter,
                            onChange: (e: any) => setNameFilter(e.target.value)
                          } as any)}
                          w="full"
                          p="10px 10px 10px 36px"
                          borderRadius="12px"
                          border="1px solid"
                          borderColor={{ base: "gray.200", _dark: "slate.600" }}
                          fontSize="14px"
                          fontWeight="600"
                          outline="none"
                          bg={{ base: "white", _dark: "slate.900" }}
                          color={{ base: "black", _dark: "white" }}
                        />
                      </Box>
                    </VStack>

                    {bases.length > 1 && (
                      <VStack align="start" gap={1}>
                        <Text fontSize="xs" fontWeight="black" color={{ base: "gray.500", _dark: "slate.400" }}>BASE / UNIDADE</Text>
                        <Box
                          as="select"
                          {...({
                            value: baseFilter,
                            onChange: (e: any) => setBaseFilter(e.target.value)
                          } as any)}
                          w="full"
                          p="10px"
                          borderRadius="12px"
                          border="1px solid"
                          borderColor={{ base: "gray.200", _dark: "slate.600" }}
                          fontSize="14px"
                          fontWeight="600"
                          outline="none"
                          bg={{ base: "white", _dark: "slate.900" }}
                          color={{ base: "black", _dark: "white" }}
                        >
                          <option value="all">Todas as Bases</option>
                          {bases.map(b => <option key={b} value={b}>{b}</option>)}
                        </Box>
                      </VStack>
                    )}

                    <VStack align="start" gap={1}>
                      <Text fontSize="xs" fontWeight="black" color={{ base: "gray.500", _dark: "slate.400" }}>ASSUNTO</Text>
                      <Box
                        as="select"
                        {...({
                          value: assuntoFilter,
                          onChange: (e: any) => setAssuntoFilter(e.target.value)
                        } as any)}
                        w="full"
                        p="10px"
                        borderRadius="12px"
                        border="1px solid"
                        borderColor={{ base: "gray.200", _dark: "slate.600" }}
                        fontSize="14px"
                        fontWeight="600"
                        outline="none"
                        bg={{ base: "white", _dark: "slate.900" }}
                        color={{ base: "black", _dark: "white" }}
                      >
                        <option value="all">Todos os Assuntos</option>
                        {assuntosUnicos.map(a => <option key={a} value={a}>{a}</option>)}
                      </Box>
                    </VStack>

                    <VStack align="start" gap={1}>
                      <Text fontSize="xs" fontWeight="black" color={{ base: "gray.500", _dark: "slate.400" }}>STATUS</Text>
                      <Box
                        as="select"
                        {...({
                          value: statusFilter,
                          onChange: (e: any) => setStatusFilter(e.target.value)
                        } as any)}
                        w="full"
                        p="10px"
                        borderRadius="12px"
                        border="1px solid"
                        borderColor={{ base: "gray.200", _dark: "slate.600" }}
                        fontSize="14px"
                        fontWeight="600"
                        outline="none"
                        bg={{ base: "white", _dark: "slate.900" }}
                        color={{ base: "black", _dark: "white" }}
                      >
                        <option value="all">Todos os Status</option>
                        <option value="pending">Pendentes</option>
                        <option value="approved">Aprovados</option>
                        <option value="rejected">Recusados</option>
                      </Box>
                    </VStack>
                  </SimpleGrid>
                </Box>

                {loading ? (
                  <Center py={20} flexDir="column" gap={4}>
                    <Spinner size="xl" color="blue.600" />
                    <Text fontWeight="black" color="slate.600">CARREGANDO DADOS...</Text>
                  </Center>
                ) : filtered.length === 0 ? (
                  <Center py={20} flexDir="column" gap={4}>
                    <Search size={48} color="gray.200" />
                    <Text fontSize="xl" fontWeight="black" color="gray.400">NADA ENCONTRADO</Text>
                  </Center>
                ) : (
                  <>
                    {/* ── VISUALIZAÇÃO MOBILE (CARDS) ── */}
                    <VStack display={{ base: "flex", md: "none" }} gap={4} align="stretch">
                      {sorted.map((r) => (
                        <Box
                          key={r.id}
                          p={4}
                          borderRadius="xl"
                          border="1px solid"
                          borderColor={(r.prioridade && r.prioridade !== "" && r.prioridade !== "false" && r.confirmacao === null) ? { base: "red.200", _dark: "red.800" } : { base: "gray.200", _dark: "slate.700" }}
                          bg={(r.prioridade && r.prioridade !== "" && r.prioridade !== "false" && r.confirmacao === null) ? { base: "red.50", _dark: "red.900/20" } : { base: "white", _dark: "slate.900" }}
                          shadow="sm"
                        >
                          <HStack justify="space-between" mb={3}>
                            <Text fontWeight="black" color={{ base: "blue.600", _dark: "blue.400" }} fontSize="xs">ID: {r.id}</Text>
                            {renderStatus(r.confirmacao)}
                          </HStack>

                          <HStack gap={3} mb={3}>
                            <Box bg={{ base: "slate.100", _dark: "slate.800" }} p={2} borderRadius="xl" color={{ base: "slate.600", _dark: "slate.400" }}>
                              <User size={20} />
                            </Box>
                            <VStack align="start" gap={0}>
                              <Text fontWeight="black" color={{ base: "slate.800", _dark: "slate.200" }} fontSize="md">{r.usuario?.nome + " " + r.usuario?.sobrenome}</Text>
                              <HStack gap={2} flexWrap="wrap">
                                <Text fontSize="xs" fontWeight="bold" color={{ base: "gray.500", _dark: "slate.400" }}>{r.usuario?.cargo?.toUpperCase()}</Text>
                                <Badge size="sm" variant="subtle">{r.usuario?.matricula}</Badge>
                              </HStack>
                            </VStack>
                          </HStack>

                          <VStack align="start" gap={2} mb={4}>
                            <HStack flexWrap="wrap" gap={2}>
                              <Badge size="sm" colorPalette="blue">{r.assunto}</Badge>
                              {r.beneficio && <Badge size="sm" colorPalette="purple">{r.beneficio}</Badge>}
                              {r.prioridade && r.prioridade !== "" && r.prioridade !== "false" && (
                                <Badge colorPalette="red" variant="solid" borderRadius="full">
                                  {r.prioridade === "true" ? "ALTA" : r.prioridade.toUpperCase().replace("_", " ")}
                                </Badge>
                              )}
                            </HStack>
                            <Text fontSize="sm" color="gray.500" lineClamp={2}>
                              {r.descricao}
                            </Text>
                          </VStack>

                          <HStack gap={2} pt={4} borderTop="1px solid" borderColor="gray.100" justify="space-between">
                            <Button size="sm" colorPalette="blue" borderRadius="lg" onClick={() => setSelectedReq(r)} disabled={updatingId === r.id} flex={1}>
                              <Eye size={18} />
                            </Button>
                            <Button size="sm" colorPalette="green" borderRadius="lg" onClick={() => r.id && updateStatus(r.id, true)} disabled={r.confirmacao === true || updatingId === r.id} loading={updatingId === r.id ? true : undefined} flex={1}>
                              <CheckCircle size={18} />
                            </Button>
                            <Button size="sm" colorPalette="red" borderRadius="lg" onClick={() => { setReqToRefuseId(r.id || null); setIsRefuseModalOpen(true); }} disabled={r.confirmacao === false || updatingId === r.id} flex={1}>
                              <XCircle size={18} />
                            </Button>
                            <Button size="sm" colorPalette="gray" borderRadius="lg" onClick={() => r.id && deleteForm(r.id)} disabled={updatingId !== null && updatingId !== r.id} loading={updatingId === r.id} flex={1}>
                              <Trash size={18} />
                            </Button>
                          </HStack>
                        </Box>
                      ))}
                    </VStack>

                    {/* ── VISUALIZAÇÃO DESKTOP (TABELA) ── */}
                    <Box display={{ base: "none", md: "block" }} overflowX="auto" borderRadius="2xl" border="1px solid" borderColor={{ base: "gray.100", _dark: "slate.700" }}>
                      <Table.Root variant="line" size="lg">
                        <Table.Header bg={{ base: "gray.50", _dark: "slate.800" }}>
                          <Table.Row>
                            <Table.ColumnHeader fontWeight="black" color={{ base: "slate.900", _dark: "slate.200" }} py={6} px={6}>ID <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: '4px' }} /></Table.ColumnHeader>
                            <Table.ColumnHeader fontWeight="black" color={{ base: "slate.900", _dark: "slate.200" }}>COLABORADOR</Table.ColumnHeader>
                            <Table.ColumnHeader fontWeight="black" color={{ base: "slate.900", _dark: "slate.200" }}>ASSUNTO</Table.ColumnHeader>
                            <Table.ColumnHeader fontWeight="black" color={{ base: "slate.900", _dark: "slate.200" }}>PRIORIDADE</Table.ColumnHeader>
                            <Table.ColumnHeader fontWeight="black" color={{ base: "slate.900", _dark: "slate.200" }}>STATUS</Table.ColumnHeader>
                            <Table.ColumnHeader fontWeight="black" color={{ base: "slate.900", _dark: "slate.200" }} textAlign="right" px={6}>AÇÕES</Table.ColumnHeader>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {sorted.map((r) => (
                            <Table.Row key={r.id} _hover={{ bg: { base: "blue.50", _dark: "blue.900/20" } }} transition="all 0.2s" bg={(r.prioridade && r.prioridade !== "" && r.prioridade !== "false" && r.confirmacao === null) ? { base: "red.50", _dark: "red.900/20" } : undefined}>
                              <Table.Cell px={6}>
                                <Text fontWeight="black" color={{ base: "blue.600", _dark: "blue.400" }} fontSize="sm">{r.id}</Text>
                              </Table.Cell>
                              <Table.Cell>
                                <HStack gap={3}>
                                  <Box bg={{ base: "slate.100", _dark: "slate.800" }} p={2} borderRadius="xl" color={{ base: "slate.600", _dark: "slate.400" }}>
                                    <User size={20} />
                                  </Box>
                                  <VStack align="start" gap={0}>
                                    <Text fontWeight="black" color={{ base: "slate.800", _dark: "slate.200" }}>{r.usuario?.nome + " " + r.usuario?.sobrenome}</Text>
                                    <HStack gap={2}>
                                      <Text fontSize="xs" fontWeight="bold" color={{ base: "gray.500", _dark: "slate.400" }}>{r.usuario?.cargo?.toUpperCase()}</Text>
                                      <Badge size="sm" variant="subtle">{r.usuario?.matricula}</Badge>
                                    </HStack>
                                    <Text fontSize="xs" color={{ base: "gray.400", _dark: "slate.500" }}>{r.unidade}</Text>
                                  </VStack>
                                </HStack>
                              </Table.Cell>
                              <Table.Cell>
                                <VStack align="start" gap={1}>
                                  <Badge size="sm" colorPalette="blue">{r.assunto}</Badge>
                                  {r.beneficio && <Badge size="sm" colorPalette="purple">{r.beneficio}</Badge>}
                                  <Text fontSize="xs" color="gray.500" lineClamp={2} title={r.descricao}>
                                    {r.descricao}
                                  </Text>
                                </VStack>
                              </Table.Cell>
                              <Table.Cell>
                                {r.prioridade && r.prioridade !== "" && r.prioridade !== "false" ? (
                                  <Badge colorPalette="red" variant="solid" borderRadius="full">
                                    {r.prioridade === "true" ? "ALTA" : r.prioridade.toUpperCase().replace("_", " ")}
                                  </Badge>
                                ) : (
                                  <Badge colorPalette="gray" variant="subtle" borderRadius="full">NORMAL</Badge>
                                )}
                              </Table.Cell>
                              <Table.Cell>
                                {renderStatus(r.confirmacao)}
                              </Table.Cell>
                              <Table.Cell textAlign="right" px={6}>
                                <HStack gap={2} justify="flex-end">
                                  <Button size="sm" colorPalette="blue" borderRadius="lg" onClick={() => setSelectedReq(r)} disabled={!!updatingId}><Eye size={18} /></Button>
                                  <Button size="sm" colorPalette="green" borderRadius="lg" onClick={() => r.id && updateStatus(r.id, true)} disabled={r.confirmacao === true || !!updatingId} loading={updatingId === r.id} shadow="sm"><CheckCircle size={18} /></Button>
                                  <Button size="sm" colorPalette="red" borderRadius="lg" onClick={() => { setReqToRefuseId(r.id || null); setIsRefuseModalOpen(true); }} disabled={r.confirmacao === false || !!updatingId} loading={updatingId === r.id} shadow="sm"><XCircle size={18} /></Button>
                                  <Button size="sm" colorPalette="gray" borderRadius="lg" onClick={() => r.id && deleteForm(r.id)} disabled={!!updatingId && updatingId !== r.id} loading={updatingId === r.id} shadow="sm">
                                    <Trash size={18} />
                                  </Button>
                                </HStack>
                              </Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Root>
                    </Box>
                  </>
                )}
              </VStack>
            </Card.Body>
          </Card.Root>
        </Container>
      </Box>

      {/* ── Detalhes do Requerimento Overlay ── */}
      <ReqDetailsModal
        req={selectedReq}
        onClose={() => setSelectedReq(null)}
        renderStatus={renderStatus}
        onApprove={(id) => {
          updateStatus(id, true);
          setSelectedReq(null);
        }}
        onReject={(id) => {
          setReqToRefuseId(id);
          setIsRefuseModalOpen(true);
        }}
        onDownload={handleDownloadArquivo}
      />


      {/* ── Modal de Motivo da Recusa ── */}
      {isRefuseModalOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.800"
          zIndex={3000}
          display="flex"
          justifyContent="center"
          alignItems="center"
          backdropFilter="blur(10px)"
          p={4}
        >
          <Box
            bg={{ base: "white", _dark: "slate.900" }}
            w="full"
            maxW={{ base: "95%", md: "md" }}
            borderRadius="2xl"
            shadow="2xl"
            p={6}
            onClick={(e) => e.stopPropagation()}
          >
            <VStack align="stretch" gap={4}>
              <Heading size="md" color={{ base: "red.600", _dark: "red.400" }} display="flex" alignItems="center" gap={2}>
                <AlertCircle size={20} /> Motivo da Recusa
              </Heading>
              <Text fontSize="sm" color={{ base: "gray.600", _dark: "slate.400" }}>
                Por favor, descreva o motivo pelo qual este requerimento está sendo indeferido.
              </Text>
              {/* @ts-ignore */}
              <Box
                as="textarea"
                {...({
                  placeholder: "Ex: Documentação incompleta...",
                  value: refusalReason,
                  onChange: (e: any) => setRefusalReason(e.target.value)
                } as any)}
                w="full"
                minH="120px"
                p="12px"
                borderRadius="12px"
                border="2px solid"
                borderColor={{ base: "red.100", _dark: "red.900/50" }}
                bg={{ base: "white", _dark: "slate.800" }}
                color={{ base: "black", _dark: "white" }}
                fontSize="14px"
                outline="none"
                style={{ resize: 'vertical' }}
              />
              <HStack gap={3} mt={2} flexDir={{ base: "column", sm: "row" }}>
                <Button w={{ base: "full", sm: "auto" }} flex={1} variant="ghost" onClick={() => { setIsRefuseModalOpen(false); setRefusalReason(""); }}>
                  CANCELAR
                </Button>
                <Button
                  w={{ base: "full", sm: "auto" }}
                  flex={2}
                  colorPalette="red"
                  disabled={!refusalReason.trim()}
                  onClick={() => {
                    if (reqToRefuseId) {
                      updateStatus(reqToRefuseId, false, refusalReason);
                      setIsRefuseModalOpen(false);
                      setRefusalReason("");
                      setSelectedReq(null);
                    }
                  }}
                >
                  CONFIRMAR RECUSA
                </Button>
              </HStack>

            </VStack>
          </Box>
        </Box>
      )}
      {/* ── Modal de Estatísticas e Gráficos ── */}
      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        bases={bases}
      />
    </>
  );
}