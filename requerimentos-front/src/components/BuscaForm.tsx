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
    XCircle,
    MapPin,
    AlignLeft,
    Gift,
    Download,
} from "lucide-react";
import { useState } from "react";
import Header from "./Header";
import { toaster } from "@/components/ui/toaster";
import { Formulario } from '@/components/types';

export default function BuscaForm() {
    const [codigo, setCodigo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState<Formulario | null>(null);

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
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro interno');
        } finally {
            setLoading(false);
        }
    };

    // confirmacao: null = aguardando RH | true = aceito | false = recusado
    function renderStatusBadge(confirmacao: boolean | null) {
        if (confirmacao === true) return (
            <Badge bg="green.600" color="white" px={3} py={1} borderRadius="full" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                <CheckCircle size={14} /> ACEITO
            </Badge>
        );
        if (confirmacao === false) return (
            <Badge bg="red.600" color="white" px={3} py={1} borderRadius="full" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                <XCircle size={14} /> RECUSADO
            </Badge>
        );
        return (
            <Badge bg="orange.500" color="white" px={3} py={1} borderRadius="full" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                <AlertCircle size={14} /> PENDENTE
            </Badge>
        );
    }

    return (
        <>
            <Header />

            <Box bg="gray.100" minH="100vh" py={{ base: 4, md: 16 }}>
                <Container maxW="container.md" px={{ base: 2, md: 8 }}>
                    <Card.Root
                        variant="elevated"
                        boxShadow="2xl"
                        borderRadius={{ base: "xl", md: "3xl" }}
                        overflow="hidden"
                        border="2px solid"
                        borderColor="gray.300"
                        bg="white"
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
                                    <Text color="gray.600" fontSize={{ base: "md", md: "lg" }}>
                                        Informe o código único da sua solicitação para consultar o status atual do processamento.
                                    </Text>

                                    <Box w="full" mt={4}>
                                        <VStack gap={4}>
                                            <Field.Root required>
                                                <Field.Label fontWeight="bold" color="blue.800">
                                                    CÓDIGO DA SOLICITAÇÃO
                                                </Field.Label>
                                                <Input
                                                    value={codigo}
                                                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                                                    placeholder="Ex: 2000000000000000"
                                                    size="lg"
                                                    borderRadius="full"
                                                    bg="gray.50"
                                                    border="2px solid"
                                                    borderColor="gray.200"
                                                    textAlign="center"
                                                    fontWeight="medium"
                                                    _focus={{ borderColor: "blue.500", bg: "white" }}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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

                        <Card.Body p={{ base: 4, md: 10 }} mt={-10} bg="white" borderRadius={{ base: "2xl", md: "4xl" }}>
                            {/* ── Loading ── */}
                            {loading ? (
                                <Center py={20}>
                                    <VStack gap={4}>
                                        <Spinner size="xl" color="blue.800" />
                                        <Text fontWeight="bold" color="blue.800">Buscando informações...</Text>
                                    </VStack>
                                </Center>

                            ) : error ? (
                                <Box
                                    bg="red.50"
                                    p={5}
                                    borderRadius="2xl"
                                    border="1.5px solid"
                                    borderColor="red.100"
                                    textAlign="center"
                                >
                                    <Text color="red.600" fontWeight="bold">{error}</Text>
                                </Box>

                            ) : data ? (
                                <VStack align="stretch" gap={8}>
                                    {/* ── Cabeçalho do resultado ── */}
                                    <Flex
                                        flexDir={{ base: "column", md: "row" }}
                                        align={{ base: "start", md: "center" }}
                                        gap={4}
                                        p={6}
                                        bg="gray.50"
                                        borderRadius="2xl"
                                        border="2px solid"
                                        borderColor="gray.100"
                                    >
                                        <VStack align="start" gap={0}>
                                            <Text fontSize="xs" fontWeight="black" color="blue.800" textTransform="uppercase">
                                                Código da Solicitação
                                            </Text>
                                            <Heading size="md" fontWeight="black" display="flex" alignItems="center" gap={2}>
                                                <Hash size={20} /> {data.id}
                                            </Heading>
                                        </VStack>
                                        {/* ── Motivo da recusa ── */}

                                        <HStack ml={{ md: "auto" }} gap={2}>
                                            {data.prioridade && data.prioridade !== "" && data.prioridade !== "false" && (
                                                <Badge colorPalette="red" variant="solid" px={3} py={1} borderRadius="full" fontWeight="bold">
                                                    {data.prioridade === "true" ? "ALTA" : data.prioridade.toUpperCase().replace("_", " ")}
                                                </Badge>
                                            )}
                                            {renderStatusBadge(data.confirmacao || null)}
                                        </HStack>
                                    </Flex>
                                    {data.confirmacao === false && data.motivo && (
                                        <>
                                            <Box p={5} bg="red.50" borderRadius="2xl" border="1.5px solid" borderColor="red.100">
                                                <Flex align="center" gap={2} mb={3}>
                                                    <XCircle size={16} color="red" />
                                                    <Text fontSize="xs" fontWeight="black" color="red.500" textTransform="uppercase">
                                                        Motivo da Recusa
                                                    </Text>
                                                </Flex>
                                                <Text fontSize="sm" color="red.700">{data.motivo}</Text>
                                            </Box>
                                        </>
                                    )}

                                    {/* ── Cards de detalhe ── */}
                                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                                        <DetailCard icon={<User size={20} />} label="NOME" value={data.usuario?.nome} />
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
                                            <Box p={5} bg="gray.50" borderRadius="2xl" border="1.5px solid" borderColor="gray.100">
                                                <Flex align="center" gap={2} mb={3}>
                                                    <AlignLeft size={16} color="gray" />
                                                    <Text fontSize="xs" fontWeight="black" color="gray.500" textTransform="uppercase">
                                                        Descrição
                                                    </Text>
                                                </Flex>
                                                <Text fontSize="md" color="gray.700">{data.descricao}</Text>
                                            </Box>
                                        </>
                                    )}

                                    {/* ── Arquivo Anexado ── */}
                                    {data.arquivoPath && (
                                        <>
                                            <Separator />
                                            <Box p={5} bg="blue.50" borderRadius="2xl" border="1.5px solid" borderColor="blue.100">
                                                <Flex align="center" justify="space-between" flexDir={{ base: "column", sm: "row" }} gap={4}>
                                                    <Flex align="center" gap={3}>
                                                        <Center boxSize="40px" bg="blue.100" borderRadius="lg" color="blue.800">
                                                            <Download size={20} />
                                                        </Center>
                                                        <VStack align="start" gap={0}>
                                                            <Text fontSize="xs" fontWeight="black" color="blue.500" textTransform="uppercase">
                                                                Documento Anexo
                                                            </Text>
                                                            <Text fontWeight="bold" color="slate.800" maxW={{ base: "200px", sm: "300px" }} truncate title={decodeURIComponent(data.arquivoPath)}>
                                                                {decodeURIComponent(data.arquivoPath.split('/').pop() || data.arquivoPath)}
                                                            </Text>
                                                        </VStack>
                                                    </Flex>
                                                    <Button
                                                        size="sm"
                                                        colorPalette="blue"
                                                        borderRadius="xl"
                                                        onClick={() => handleDownloadArquivo(data.arquivoPath || '')}
                                                    >
                                                        Baixar Arquivo
                                                    </Button>
                                                </Flex>
                                            </Box>
                                        </>
                                    )}


                                </VStack>

                            ) : (
                                /* ── Empty state ── */
                                <Center py={20} flexDir="column" gap={4}>
                                    <Search size={48} color="gray.400" />
                                    <Text fontSize="xl" fontWeight="bold" color="gray.500">Aguardando busca...</Text>
                                    <Text color="gray.400" textAlign="center">
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
            bg="white"
            p={4}
            borderRadius="xl"
            border="1px solid"
            borderColor="gray.100"
            boxShadow="sm"
            align="center"
            gap={3}
        >
            <Center boxSize="40px" bg="blue.50" borderRadius="lg" color="blue.800" flexShrink={0}>
                {icon}
            </Center>
            <VStack align="start" gap={0}>
                <Text fontSize="sm" fontWeight="bold" color="gray.800">{label}</Text>
                <Text fontWeight="black">{value ?? '—'}</Text>
            </VStack>
        </Flex>
    );
}