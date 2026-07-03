'use client';

import {
    Box,
    Button,
    Card,
    Center,
    Container,
    Flex,
    Heading,
    Input,
    Separator,
    SimpleGrid,
    Spinner,
    Text,
    VStack,
    Badge,
    Field,
    HStack,
} from "@chakra-ui/react";
import {
    Search,
    CheckCircle,
    Hash,
    User,
    Briefcase,
    FileText,
    AlertCircle,
    MapPin,
    AlignLeft,
    Gift,
    Download,
    MessageCircle,
    ChevronDown,
} from "lucide-react";
import { useState } from "react";
import Header from "./Header";
import { toaster } from "@/components/ui/toaster";
import { Formulario } from '@/components/types';
import ChatPanel from '@/components/modal/ChatPanel';

export default function BuscaForm() {
    const [codigo, setCodigo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState<Formulario | null>(null);
    const [chatAberto, setChatAberto] = useState(false);

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
    };

    const handleSearch = async () => {
        if (!codigo) return setError("Digite um código de requerimento válido.");
        setError('');
        setLoading(true);
        setData(null);

        try {
            const res = await fetch(`/api/requerimentos/${codigo}`);
            if (!res.ok) throw new Error('Requerimento não encontrado');
            const json = await res.json();
            setData(json);
            console.log(json)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro interno');
        } finally {
            setLoading(false);
        }
    };

    // confirmacao: null = aguardando RH | true = aceito | false = recusado
    function renderStatusBadge(finalizarArquivar: "FINALIZADO" | "ARQUIVADO" | "EM_ANALISE" | "TERMINADO" | undefined) {

        if (finalizarArquivar === "FINALIZADO" || finalizarArquivar === "TERMINADO") return (
            <Badge bg="green.600" color="white" px={3} py={1} borderRadius="full" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                <CheckCircle size={14} /> CONCLUIDO
            </Badge>
        );
        if (finalizarArquivar === "ARQUIVADO" || finalizarArquivar === "EM_ANALISE") return (
            <Badge bg="orange.500" color="white" px={3} py={1} borderRadius="full" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                <AlertCircle size={14} /> EM ANÁLISE
            </Badge>
        );

    }

    return (
        <>
            <Header />

            <Box bg={{ base: "gray.100", _dark: "slate.950" }} minH="100vh" py={{ base: 4, md: 16 }}>
                <Container maxW="container.md" px={{ base: 2, md: 8 }}>
                    <Card.Root
                        variant="elevated"
                        boxShadow="2xl"
                        borderRadius={{ base: "xl", md: "3xl" }}
                        overflow="hidden"
                        border="2px solid"
                        borderColor={{ base: "gray.300", _dark: "slate.700" }}
                        bg={{ base: "white", _dark: "slate.900" }}
                    >
                        {/* ── Cabeçalho ── */}
                        <Card.Header
                            pt={{ base: 8, md: 12 }}
                            pb={{ base: 10, md: 16 }}
                            px={{ base: 4, md: 8 }}
                            textAlign="center"
                        >
                            <Center>
                                <VStack gap={4} maxW="lg">
                                    <Heading
                                        size={{ base: "2xl", md: "4xl" }}
                                        fontWeight="black"
                                        letterSpacing="tight"
                                    >
                                        Rastrear Solicitação
                                    </Heading>
                                    <Text color={{ base: "gray.600", _dark: "slate.400" }} fontSize={{ base: "md", md: "lg" }}>
                                        Informe o código único da sua solicitação para consultar o status atual do processamento.
                                    </Text>

                                    <Box w="full" mt={4}>
                                        <VStack gap={4}>
                                            <Field.Root required>
                                                <Field.Label fontWeight="bold" color={{ base: "blue.800", _dark: "blue.400" }}>
                                                    CÓDIGO DA SOLICITAÇÃO
                                                </Field.Label>
                                                <Input
                                                    value={codigo}
                                                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').toUpperCase())}
                                                    placeholder="0000000000000000000"
                                                    size="lg"
                                                    borderRadius="full"
                                                    bg={{ base: "gray.50", _dark: "slate.800" }}
                                                    border="2px solid"
                                                    borderColor={{ base: "gray.200", _dark: "slate.700" }}
                                                    textAlign="center"
                                                    fontWeight="medium"
                                                    _focus={{ borderColor: { base: "blue.500", _dark: "blue.400" }, bg: { base: "white", _dark: "slate.900" } }}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                    maxLength={30}
                                                />
                                            </Field.Root>
                                            <Button
                                                onClick={handleSearch}
                                                colorPalette="blue"
                                                size="lg"
                                                borderRadius="full"
                                                w="full"
                                                loading={loading}
                                                fontWeight="black"
                                                boxShadow="lg"
                                            >
                                                <Search size={20} style={{ marginRight: '8px' }} /> BUSCAR AGORA
                                            </Button>
                                        </VStack>
                                    </Box>
                                </VStack>
                            </Center>
                        </Card.Header>

                        <Card.Body p={{ base: 4, md: 10 }} mt={-10} bg={{ base: "white", _dark: "slate.900" }} borderRadius={{ base: "2xl", md: "4xl" }}>
                            {/* ── Loading ── */}
                            {loading ? (
                                <Center py={20}>
                                    <VStack gap={4}>
                                        <Spinner size="xl" color={{ base: "blue.800", _dark: "blue.400" }} />
                                        <Text fontWeight="bold" color={{ base: "blue.800", _dark: "blue.400" }}>Buscando informações...</Text>
                                    </VStack>
                                </Center>

                            ) : error ? (
                                <Box
                                    bg={{ base: "red.50", _dark: "red.900/20" }}
                                    p={5}
                                    borderRadius="2xl"
                                    border="1.5px solid"
                                    borderColor={{ base: "red.100", _dark: "red.900/50" }}
                                    textAlign="center"
                                >
                                    <Text color={{ base: "red.600", _dark: "red.400" }} fontWeight="bold">{error}</Text>
                                </Box>

                            ) : data ? (
                                <VStack align="stretch" gap={8}>
                                    {/* ── Cabeçalho do resultado ── */}
                                    <Flex
                                        flexDir={{ base: "column", md: "row" }}
                                        justifyContent={{ base: "space-between" }}
                                        gap={4}
                                        p={6}
                                        bg={{ base: "gray.50", _dark: "slate.800" }}
                                        borderRadius="2xl"
                                        border="2px solid"
                                        borderColor={{ base: "gray.100", _dark: "slate.700" }}
                                    >
                                        <VStack align="start" gap={0} >
                                            <Text fontSize="xs" fontWeight="black" color={{ base: "blue.800", _dark: "blue.400" }} textTransform="uppercase">
                                                Código da Solicitação
                                            </Text>
                                            <Heading size="md" fontWeight="black" display="flex" alignItems="center" gap={2}>
                                                <Hash size={20} /> {data.id}
                                            </Heading>
                                        </VStack>
                                        <VStack align="start" gap={0}>
                                            <Text fontSize="xs" fontWeight="black" color={{ base: "blue.800", _dark: "blue.400" }} textTransform="uppercase">
                                                Status da Solicitação
                                            </Text>
                                            <Heading size="md" fontWeight="black" display="flex" alignItems="center" gap={2}>
                                                {renderStatusBadge(data.finalizarArquivar)}
                                            </Heading>
                                        </VStack>

                                    </Flex>


                                    {/* ── Chat com o RH (colapsável) ── */}
                                    <Separator />
                                    <Box
                                        border="1px solid"
                                        borderColor={{ base: 'gray.200', _dark: 'slate.700' }}
                                        borderRadius="2xl"
                                        overflow="hidden"
                                    >
                                        {/* Cabeçalho clicável */}
                                        <Flex
                                            as="button"
                                            w="full"
                                            px={4}
                                            py={3}
                                            align="center"
                                            gap={2}
                                            bg={{ base: 'slate.800', _dark: 'slate.950' }}
                                            cursor="pointer"
                                            onClick={() => setChatAberto((v) => !v)}
                                            _hover={{ bg: { base: 'slate.700', _dark: 'slate.900' } }}
                                            transition="background 0.2s"
                                        >
                                            <MessageCircle size={18} color="#60a5fa" />
                                            <Text fontWeight="bold" color="white" fontSize="sm" flex={1} textAlign="left">
                                                Conversa com o RH
                                            </Text>
                                            <Box
                                                color="white"
                                                transition="transform 0.25s"
                                                style={{ transform: chatAberto ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                            >
                                                <ChevronDown size={18} />
                                            </Box>
                                        </Flex>

                                        {/* Conteúdo colapsável */}
                                        {chatAberto && (
                                            <ChatPanel
                                                formularioId={data.id!}
                                                remetente="SOLICITANTE"
                                                nomeRemetente={`${data.usuario?.nome} ${data.usuario?.sobrenome}`}
                                            />
                                        )}
                                    </Box>

                                    {/* ── Cards de detalhe ── */}
                                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                                        <DetailCard icon={<User size={20} />} label="NOME" value={data.usuario?.nome + " " + data.usuario?.sobrenome} />
                                        <DetailCard icon={<Hash size={20} />} label="MATRÍCULA" value={data.usuario?.matricula} />
                                        <DetailCard icon={<MapPin size={20} />} label="UNIDADE" value={data.unidade} />
                                        <DetailCard icon={<Briefcase size={20} />} label="CARGO" value={data.usuario?.cargo} />
                                        <DetailCard icon={<FileText size={20} />} label="ASSUNTO" value={data.assunto} />
                                        {data.beneficio && (
                                            <DetailCard icon={<Gift size={20} />} label="BENEFÍCIO" value={data.beneficio} />
                                        )}

                                    </SimpleGrid>

                                    {/* ── Descrição ── */}
                                    {data.descricao && (
                                        <>
                                            <Separator />
                                            <Box p={5} bg={{ base: "gray.50", _dark: "slate.800" }} borderRadius="2xl" border="1.5px solid" borderColor={{ base: "gray.100", _dark: "slate.700" }}>
                                                <Flex align="center" gap={2} mb={3}>
                                                    <AlignLeft size={16} color="gray" />
                                                    <Text fontSize="xs" fontWeight="black" color={{ base: "gray.500", _dark: "slate.400" }} textTransform="uppercase">
                                                        Descrição
                                                    </Text>
                                                </Flex>
                                                <Text fontSize="md" color={{ base: "gray.700", _dark: "slate.300" }} whiteSpace="pre-wrap" >{data.descricao}</Text>
                                            </Box>
                                        </>
                                    )}

                                    {/* ── Arquivo Anexado ── */}
                                    {data.arquivoPath && (
                                        <>
                                            <Separator />
                                            <HStack gap={2} flexWrap="wrap">
                                                {data.arquivoPath.split(';').map((path, idx) => (
                                                    <Box key={idx} p={5} bg={{ base: "blue.50", _dark: "blue.900/20" }} borderRadius="2xl" border="1.5px solid" borderColor={{ base: "blue.100", _dark: "blue.900/50" }}>
                                                        <Flex align="center" justify="space-between" flexDir={{ base: "column", sm: "row" }} gap={4}>
                                                            <Flex align="center" gap={3}>
                                                                <Center boxSize="40px" bg={{ base: "blue.100", _dark: "blue.900/50" }} borderRadius="lg" color={{ base: "blue.800", _dark: "blue.400" }}>
                                                                    <Download size={20} />
                                                                </Center>
                                                                <VStack align="start" gap={0}>
                                                                    <Text fontSize="xs" fontWeight="black" color={{ base: "blue.500", _dark: "blue.400" }} textTransform="uppercase">
                                                                        Documento Anexo {idx + 1}
                                                                    </Text>
                                                                    <Text fontWeight="bold" color={{ base: "slate.800", _dark: "slate.200" }} maxW={{ base: "200px", sm: "300px" }} truncate title={decodeURIComponent(path)}>
                                                                        {decodeURIComponent(path.split('/').pop() || path)}
                                                                    </Text>
                                                                </VStack>
                                                            </Flex>
                                                            <Button
                                                                size="sm"
                                                                colorPalette="blue"
                                                                borderRadius="xl"
                                                                onClick={() => handleDownloadArquivo(path)}
                                                            >
                                                                Baixar Arquivo
                                                            </Button>
                                                        </Flex>
                                                    </Box>
                                                ))}
                                            </HStack>
                                        </>
                                    )}

                                </VStack>

                            ) : (
                                /* ── Empty state ── */
                                <Center py={20} flexDir="column" gap={4}>
                                    <Search size={48} color="gray" opacity={0.5} />
                                    <Text fontSize="xl" fontWeight="bold" color={{ base: "gray.500", _dark: "slate.400" }}>Aguardando busca...</Text>
                                    <Text color={{ base: "gray.400", _dark: "slate.500" }} textAlign="center">
                                        Insira o código da solicitação acima para visualizar os detalhes
                                    </Text>
                                </Center>
                            )}
                        </Card.Body>
                    </Card.Root>
                </Container>
            </Box>
        </>
    );
}

// ── Sub-componente de card de detalhe ──────────────────────────────────────────
function DetailCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <Flex
            bg={{ base: "white", _dark: "slate.900" }}
            p={4}
            borderRadius="xl"
            border="1px solid"
            borderColor={{ base: "gray.100", _dark: "slate.800" }}
            boxShadow="sm"
            align="center"
            gap={3}
        >
            <Center boxSize="40px" bg={{ base: "blue.50", _dark: "blue.900/20" }} borderRadius="lg" color={{ base: "blue.800", _dark: "blue.400" }} flexShrink={0}>
                {icon}
            </Center>
            <VStack align="start" gap={0}>
                <Text fontSize="sm" fontWeight="bold" color={{ base: "gray.800", _dark: "slate.300" }}>{label}</Text>
                <Text fontWeight="black" color={{ _dark: "slate.100" }}>{value ?? '—'}</Text>
            </VStack>
        </Flex>
    );
}