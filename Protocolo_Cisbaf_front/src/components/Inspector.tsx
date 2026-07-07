'use client';

import { Formulario } from '@/components/types';
import { toaster } from '@/components/ui/toaster';
import { Badge, Box, Button, Card, Center, Container, HStack, Heading, SimpleGrid, Spinner, Table, Text, VStack } from '@chakra-ui/react';
import { AlertCircle, Archive, ArchiveRestore, ArrowUpDown, BarChartIcon, CheckCircle, Eye, RefreshCw, Search, Trash, Undo2, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from './Header';
import ReqDetailsModal from './modal/ReqDetailsModal';
import StatsModal from './modal/StatsModal';

export default function Inspector() {
  const router = useRouter();
  const [requerimentos, setRequerimentos] = useState<Formulario[]>([]);
  const [loading, setLoading] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [baseFilter, setBaseFilter] = useState("all");
  const [assuntoFilter, setAssuntoFilter] = useState("all");

  const [statusFilter, setStatusFilter] = useState<"all" | "em_analise" | "finalizado" | "arquivado" | "terminado">("all");
  const [isArchiveMode, setIsArchiveMode] = useState(false);

  const [selectedReq, setSelectedReq] = useState<Formulario | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  const bases = Array.from(new Set(requerimentos.map(r => r.unidade).filter(Boolean) as string[]));
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

  const updateStatus = async (id: string, novoStatus: 'FINALIZADO' | 'ARQUIVADO' | 'EM_ANALISE' | 'TERMINADO') => {
    if (novoStatus === 'FINALIZADO') {
      if (!window.confirm("Tem certeza que deseja finalizar este requerimento?")) return;
    } else if (novoStatus === 'ARQUIVADO') {
      if (!window.confirm("Tem certeza que deseja arquivar este requerimento?")) return;
    }

    try {
      setUpdatingId(id);

      const res = await fetch(`/api/requerimentos/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finalizarArquivar: novoStatus,
        })
      });

      if (!res.ok) {
        throw new Error("Erro ao atualizar status");
      }

      toaster.create({ title: 'Sucesso', type: 'success' });

      setRequerimentos(prev =>
        prev.map(req => req.id === id ? { ...req, finalizarArquivar: novoStatus } : req)
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
    // 1. Lógica do Modo Arquivo: engloba ARQUIVADO e TERMINADO
    const isArchived = r.finalizarArquivar === 'ARQUIVADO' || r.finalizarArquivar === 'TERMINADO';
    if (isArchiveMode && !isArchived) return false;
    if (!isArchiveMode && isArchived) return false;

    // 2. Filtros de Texto e Base
    const matchesName = nameFilter === "" ||
      r.usuario?.nome.toLowerCase().includes(nameFilter.toLowerCase()) ||
      r.usuario?.cpf.includes(nameFilter) ||
      r.usuario?.matricula?.includes(nameFilter) ||
      r.usuario?.sobrenome.toLowerCase().includes(nameFilter);

    const matchesBase = baseFilter === "all" || r.unidade === baseFilter;
    const matchesAssunto = assuntoFilter === "all" || r.assunto === assuntoFilter;

    // 3. Filtro de Status
    const isEmAnalise = !r.finalizarArquivar || r.finalizarArquivar === 'EM_ANALISE';
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "em_analise" && isEmAnalise) ||
      (statusFilter === "finalizado" && r.finalizarArquivar === 'FINALIZADO') ||
      (statusFilter === "arquivado" && r.finalizarArquivar === 'ARQUIVADO' && isArchiveMode) ||
      (statusFilter === "terminado" && r.finalizarArquivar === "TERMINADO" && isArchiveMode);

    return matchesName && matchesBase && matchesAssunto && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aPending = !a.finalizarArquivar || a.finalizarArquivar === 'EM_ANALISE';
    const bPending = !b.finalizarArquivar || b.finalizarArquivar === 'EM_ANALISE';



    if (aPending && !bPending) return -1;
    if (!aPending && bPending) return 1;

    return 0;
  });

  const renderStatus = (status?: 'FINALIZADO' | 'ARQUIVADO' | 'EM_ANALISE' | 'TERMINADO') => {
    if (status === 'FINALIZADO') return <Badge bg="green.100" color="green.700" borderRadius="full" px={3} py={1} fontWeight="black" display="flex" alignItems="center" gap={1}><CheckCircle size={12} /> FINALIZADO</Badge>;
    if (status === 'ARQUIVADO') return <Badge bg="red.100" color="red.700" borderRadius="full" px={3} py={1} fontWeight="black" display="flex" alignItems="center" gap={1}><Archive size={12} /> ARQUIVADO</Badge>;
    if (status === 'TERMINADO') return <Badge bg="black" color="white" borderRadius="full" px={3} py={1} fontWeight="black" display="flex" alignItems="center" gap={1}><CheckCircle size={12} /> TERMINADO</Badge>;
    return <Badge bg="orange.100" color="orange.700" borderRadius="full" px={3} py={1} fontWeight="black" display="flex" alignItems="center" gap={1}><AlertCircle size={12} /> EM ANÁLISE</Badge>;
  };

  const isPending = (status?: 'FINALIZADO' | 'ARQUIVADO' | 'EM_ANALISE' | 'TERMINADO') => !status || status === 'EM_ANALISE';

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
            borderColor={isArchiveMode ? "orange.400" : { base: "gray.300", _dark: "slate.700" }}
            bg={{ base: "white", _dark: "slate.900" }}
          >
            <Card.Header
              pt={{ base: 8, md: 12 }}
              pb={{ base: 12, md: 20 }}
              px={{ base: 4, md: 8 }}
              textAlign="center"
              bg={isArchiveMode ? "orange.600" : { base: "slate.900", _dark: "slate.700" }}
              color="white"
              transition="background 0.3s ease"
            >
              <Center>
                <VStack gap={4} maxW="3xl">
                  <Badge bg={isArchiveMode ? "orange.800" : "blue.500"} color="white" px={4} py={1} borderRadius="full" fontWeight="black" fontSize="xs" letterSpacing="widest">
                    PAINEL ADMIN
                  </Badge>
                  <Heading size={{ base: "xl", md: "4xl" }} fontWeight="black" letterSpacing="tight">
                    {isArchiveMode ? "Arquivados e Terminados" : "Gestão de Requerimentos"}
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
                      bg="green.500"
                      color="white"
                      _hover={{ bg: "green.600" }}
                      onClick={() => setIsStatsModalOpen(true)}
                      borderRadius="full"
                      fontWeight="bold"
                    >
                      <BarChartIcon size={16} style={{ marginRight: '6px' }} /> Relatórios
                    </Button>
                    <Button
                      size={{ base: "md", md: "sm" }}
                      bg={isArchiveMode ? "white" : "slate.600"}
                      color={isArchiveMode ? "orange.700" : "white"}
                      _hover={{ bg: isArchiveMode ? "gray.100" : "slate.700" }}
                      onClick={() => setIsArchiveMode(!isArchiveMode)}
                      borderRadius="full"
                      fontWeight="bold"
                    >
                      {isArchiveMode ? <ArchiveRestore size={16} style={{ marginRight: '6px' }} /> : <Archive size={16} style={{ marginRight: '6px' }} />}
                      {isArchiveMode ? "Voltar ao Painel" : "Ver Arquivados"}
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
                      {isArchiveMode ? (
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
                          <option value="all">Todos Ativos</option>
                          <option value="terminado">Terminado</option>
                          <option value="arquivado">Arquivado</option>
                        </Box>
                      ) : (
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
                          <option value="all">Todos Ativos</option>
                          <option value="em_analise">Em Análise</option>
                          <option value="finalizado">Finalizados</option>
                        </Box>
                      )}
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
                          borderColor={(isPending(r.finalizarArquivar)) ? { base: "red.200", _dark: "red.800" } : { base: "gray.200", _dark: "slate.700" }}
                          bg={(isPending(r.finalizarArquivar)) ? { base: "red.50", _dark: "red.900/20" } : { base: "white", _dark: "slate.900" }}
                          shadow="sm"
                        >
                          <HStack justify="space-between" mb={3}>
                            <Text fontWeight="black" color={{ base: "blue.600", _dark: "blue.400" }} fontSize="xs">ID: {r.id}</Text>
                            {renderStatus(r.finalizarArquivar as any)}
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

                            </HStack>
                            <Text fontSize="sm" color="gray.500" lineClamp={2}>
                              {r.descricao}
                            </Text>
                          </VStack>

                          <HStack gap={2} pt={4} borderTop="1px solid" borderColor="gray.100" justify="space-between">
                            <Button size="sm" colorPalette="blue" borderRadius="lg" onClick={() => setSelectedReq(r)} disabled={updatingId === r.id} flex={1}>
                              <Eye size={18} />
                            </Button>

                            <Button size="sm" colorPalette="green" borderRadius="lg" onClick={() => r.id && updateStatus(r.id, 'FINALIZADO')} disabled={r.finalizarArquivar === 'FINALIZADO'
                              || r.finalizarArquivar === 'TERMINADO' || updatingId === r.id} loading={updatingId === r.id ? true : undefined} flex={1}>
                              <CheckCircle size={18} />
                            </Button>

                            <Button size="sm" colorPalette="red" borderRadius="lg" onClick={() => r.id && updateStatus(r.id, 'ARQUIVADO')} disabled={r.finalizarArquivar === 'ARQUIVADO'
                              || updatingId === r.id} loading={updatingId === r.id ? true : undefined} flex={1}>
                              <Archive size={18} />
                            </Button>

                            <Button size="sm" colorPalette="gray" borderRadius="lg" onClick={() => r.id && deleteForm(r.id)} disabled={updatingId !== null && updatingId !== r.id}
                              loading={updatingId === r.id} flex={1}>
                              <Trash size={18} />
                            </Button>

                            <Button size="sm" colorPalette="blue" borderRadius="lg" onClick={() => r.id && updateStatus(r.id, 'EM_ANALISE')} disabled={r.finalizarArquivar === 'EM_ANALISE'
                              || updatingId === r.id} loading={updatingId === r.id ? true : undefined} flex={1}>
                              <Undo2 size={18} />
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
                            <Table.ColumnHeader fontWeight="black" color={{ base: "slate.900", _dark: "slate.200" }}>STATUS</Table.ColumnHeader>
                            <Table.ColumnHeader fontWeight="black" color={{ base: "slate.900", _dark: "slate.200" }} textAlign="right" px={6}>AÇÕES</Table.ColumnHeader>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {sorted.map((r) => (
                            <Table.Row key={r.id} _hover={{ bg: { base: "blue.50", _dark: "blue.900/20" } }} transition="all 0.2s" bg={(isPending(r.finalizarArquivar)) ? { base: "red.50", _dark: "red.900/20" } : undefined}>
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
                                    {r.usuario?.cargo !== null && r.usuario?.matricula !== null && (
                                      <HStack gap={2}>
                                        <Text fontSize="xs" fontWeight="bold" color={{ base: "gray.500", _dark: "slate.400" }}>{r.usuario?.cargo?.toUpperCase()}</Text>
                                        <Badge size="sm" variant="subtle">{r.usuario?.matricula}</Badge>
                                      </HStack>
                                    )}

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
                                {renderStatus(r.finalizarArquivar as any)}
                              </Table.Cell>
                              <Table.Cell textAlign="right" px={6}>
                                <HStack gap={2} justify="flex-end">
                                  <Button size="sm" colorPalette="blue" borderRadius="lg" onClick={() => setSelectedReq(r)} disabled={!!updatingId}><Eye size={18} /></Button>
                                  <Button size="sm" colorPalette="green" borderRadius="lg" onClick={() => r.id && updateStatus(r.id, 'FINALIZADO')} disabled={r.finalizarArquivar === 'FINALIZADO' || r.finalizarArquivar === 'TERMINADO' || !!updatingId} loading={updatingId === r.id} shadow="sm"><CheckCircle size={18} /></Button>
                                  <Button size="sm" colorPalette="red" borderRadius="lg" onClick={() => r.id && updateStatus(r.id, 'ARQUIVADO')} disabled={r.finalizarArquivar === 'ARQUIVADO' || !!updatingId} loading={updatingId === r.id} shadow="sm"><Archive size={18} /></Button>
                                  <Button size="sm" colorPalette="gray" borderRadius="lg" onClick={() => r.id && deleteForm(r.id)} disabled={!!updatingId && updatingId !== r.id} loading={updatingId === r.id} shadow="sm"><Trash size={18} /></Button>
                                  <Button size="sm" colorPalette="blue" borderRadius="lg" onClick={() => r.id && updateStatus(r.id, 'EM_ANALISE')} disabled={r.finalizarArquivar === 'EM_ANALISE' || !!updatingId} loading={updatingId === r.id} shadow="sm"><Undo2 size={18} /></Button>
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
        renderStatus={renderStatus as any}
        onApprove={(id) => {
          updateStatus(id, 'FINALIZADO');
          setSelectedReq(null);
        }}
        onArchive={(id) => {
          updateStatus(id, 'ARQUIVADO');
          setSelectedReq(null);
        }}
        onDownload={handleDownloadArquivo}
      />

      {/* ── Modal de Estatísticas e Gráficos ── */}
      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        bases={bases}
      />
    </>
  );
}