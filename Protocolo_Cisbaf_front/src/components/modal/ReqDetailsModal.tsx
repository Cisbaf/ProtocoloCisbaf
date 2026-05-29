'use client';

import { Formulario } from '@/components/types';
import {
    Badge,
    Box,
    Button,
    HStack,
    Heading,
    Separator,
    SimpleGrid,
    Stack,
    Text,
    VStack
} from '@chakra-ui/react';
import {
    Briefcase,
    Building,
    Calendar,
    CheckCircle,
    CreditCard,
    Download,
    FileText,
    Fingerprint,
    IdCard,
    IdCardLanyard,
    Mail,
    MailPlus,
    MapPin,
    Phone,
    Smartphone,
    User,
    X,
    XCircle
} from 'lucide-react';
import React from 'react';

interface ReqDetailsModalProps {
    req: Formulario | null;
    onClose: () => void;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    renderStatus: (confirmacao: boolean | null | undefined) => React.ReactNode;
    onDownload: (arquivoPath: string) => void;
}

export default function ReqDetailsModal({
    req,
    onClose,
    onApprove,
    onReject,
    renderStatus,
    onDownload
}: ReqDetailsModalProps) {
    if (!req) return null;

    function formDataCriacao() {
        const dataOriginal = req?.dataCriacao;

        if (!dataOriginal) return "—";

        try {
            const dataObj = new Date(dataOriginal);

            if (isNaN(dataObj.getTime())) return dataOriginal;

            const dataFormatada = dataObj.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            const horaFormatada = dataObj.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });

            return `${dataFormatada} às ${horaFormatada}`;
        } catch (e) {
            return dataOriginal;
        }
    }

    return (
        <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg={{ base: "blackAlpha.700", _dark: "blackAlpha.800" }}
            zIndex={2000}
            display="flex"
            justifyContent="center"
            alignItems="center"
            backdropFilter="blur(8px)"
            p={{ base: 4, md: 6 }} // Aumentei o padding base para não grudar na borda
            onClick={onClose}
        >
            <Box
                bg={{ base: "white", _dark: "slate.900" }}
                w="100%"
                maxW="4xl"
                // Reduzi o maxH no mobile (85vh) para evitar que o teclado ou a barra do navegador cortem o topo do modal
                maxH={{ base: "85vh", md: "90vh" }}
                borderRadius={{ base: "xl", md: "3xl" }} // Borda um pouco menor no mobile para ganhar espaço útil
                shadow="dark-lg"
                overflow="hidden"
                onClick={(e) => e.stopPropagation()}
                display="flex"
                flexDir="column"
            >
                {/* ── CABEÇALHO DO MODAL ── */}
                <Box p={{ base: 4, md: 6 }} bg={{ base: "slate.900", _dark: "slate.950" }} color="white" display="flex" justifyContent="space-between" alignItems="center">
                    <VStack align="start" gap={0}>
                        <HStack gap={2}>
                            <Badge colorPalette="blue" variant="solid">REQ</Badge>
                            <Text fontWeight="black" fontSize={{ base: "md", md: "lg" }} wordBreak="break-all">
                                {req.id}
                            </Text>
                        </HStack>
                        <Text fontSize="xs" opacity={0.7}>Detalhes completos da solicitação</Text>
                    </VStack>
                    <Button size="sm" variant="ghost" color="white" onClick={onClose} borderRadius="full">
                        <X size={24} />
                    </Button>
                </Box>

                {/* ── CORPO DO MODAL ── */}
                <Box p={{ base: 4, md: 8 }} overflowY="auto" flex={1}>
                    <VStack gap={{ base: 6, md: 8 }} align="stretch">

                        {/* Status Section - Trocado HStack por Stack responsivo */}
                        <Stack
                            direction={{ base: "column", sm: "row" }}
                            justify="space-between"
                            p={4}
                            bg={{ base: "gray.50", _dark: "slate.800" }}
                            borderRadius="2xl"
                            border="1px solid"
                            borderColor={{ base: "gray.200", _dark: "slate.700" }}
                            gap={4}
                        >
                            <VStack align="start" gap={1}>
                                <Text fontSize="xs" fontWeight="black" color={{ base: "gray.500", _dark: "slate.400" }}>STATUS ATUAL</Text>
                                {renderStatus(req.confirmacao)}
                            </VStack>
                            <VStack align="start" gap={1}>
                                <Text fontSize="xs" fontWeight="black" color={{ base: "gray.500", _dark: "slate.400" }}>DATA DE CRIAÇÃO</Text>
                                <Text fontWeight="bold" color={{ base: "slate.700", _dark: "slate.200" }} fontSize="sm">{formDataCriacao()}</Text>
                            </VStack>
                            <VStack align="start" gap={1}>
                                <Text fontSize="xs" fontWeight="black" color={{ base: "gray.500", _dark: "slate.400" }}>PRIORIDADE</Text>
                                {req.prioridade ? (
                                    <Badge colorPalette="red" variant="solid">ALTA</Badge>
                                ) : (
                                    <Badge colorPalette="gray" variant="subtle">NORMAL</Badge>
                                )}
                            </VStack>
                        </Stack>
                        {req.confirmacao === false && req.motivo && (
                            <VStack align="start" gap={1}>
                                <Text fontSize="xs" fontWeight="black" color={{ base: "red.400", _dark: "red.300" }}>MOTIVO DA RECUSA</Text>
                                <Box p={4} bg={{ base: "red.50", _dark: "red.900/20" }} borderRadius="xl" w="full" border="1px solid" borderColor={{ base: "red.100", _dark: "red.900/50" }}>
                                    <Text color={{ base: "red.700", _dark: "red.200" }} fontSize={{ base: "sm", md: "md" }}>{req.motivo}</Text>
                                </Box>
                            </VStack>
                        )}

                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={{ base: 6, md: 8 }}>
                            {/* Colaborador Info */}
                            <VStack align="stretch" gap={4}>
                                <Heading size="md" display="flex" alignItems="center" gap={2} color={{ base: "slate.800", _dark: "slate.100" }}>
                                    <User size={20} color="#3B82F6" /> Identificação
                                </Heading>
                                <DetailItem label="Nome Completo" value={req.usuario?.nome + " " + req.usuario?.sobrenome} />
                                <DetailItem label="Data Nascimento" value={req.usuario?.dataNascimento} icon={<Calendar size={14} />} />
                                <DetailItem label="CPF" value={req.usuario?.cpf} icon={<CreditCard size={14} />} />
                                <DetailItem label="RG" value={req.usuario?.rg} icon={<IdCard size={14} />} />
                                <DetailItem label="Matrícula" value={req.usuario?.matricula} icon={<IdCardLanyard size={14} />} />
                                <DetailItem label="Cargo" value={req.usuario?.cargo} icon={<Briefcase size={14} />} />
                                <DetailItem label="Unidade" value={req.unidade} icon={<Building size={14} />} />
                                <DetailItem label="Sexo/Cor" value={`${req.usuario?.sexo} - ${req.usuario?.cor}`} icon={<Fingerprint size={14} />} />
                            </VStack>

                            {/* Contact & Address */}
                            <VStack align="stretch" gap={4}>
                                <Heading size="md" display="flex" alignItems="center" gap={2} color={{ base: "slate.800", _dark: "slate.100" }}>
                                    <Mail size={20} color="#3B82F6" /> Contato
                                </Heading>
                                <DetailItem label="E-mail" value={req.usuario?.email} icon={<Mail size={14} />} />
                                {req.usuario.emailAlt && (
                                    <DetailItem label="E-mail Alternativo" value={req.usuario.emailAlt} icon={<MailPlus size={14} />} />
                                )}
                                <DetailItem label="Celular" value={req.usuario?.celular} icon={<Smartphone size={14} />} />
                                {req.usuario.telefone && (
                                    <DetailItem label="Telefone" value={req.usuario?.telefone} icon={<Phone size={14} />} />
                                )}

                                <Heading size="md" display="flex" alignItems="center" gap={2} mt={{ base: 2, md: 3 }} color={{ base: "slate.800", _dark: "slate.100" }}>
                                    <MapPin size={20} color="#3B82F6" /> Endereço
                                </Heading>
                                <DetailItem label="CEP" value={req.usuario?.endereco?.cep} />
                                <DetailItem
                                    label="Endereço"
                                    value={`${req.usuario?.endereco?.endereco}, ${req.usuario?.endereco?.numero}`}
                                />
                                <DetailItem label="Bairro" value={req.usuario?.endereco?.bairro} />
                                <DetailItem label="Cidade/UF" value={`${req.usuario?.endereco?.cidade} - ${req.usuario?.endereco?.estado}`} />
                            </VStack>
                        </SimpleGrid>

                        <Separator />

                        {/* Requirement Data */}
                        <VStack align="stretch" gap={4}>
                            <Heading size="md" display="flex" alignItems="center" gap={2} color={{ base: "slate.800", _dark: "slate.100" }}>
                                <FileText size={20} color="#3B82F6" /> Solicitação
                            </Heading>
                            <Stack direction={{ base: "column", sm: "row" }} gap={4}>
                                <VStack align="start" gap={1} flex={1}>
                                    <Text fontSize="xs" fontWeight="black" color={{ base: "gray.400", _dark: "slate.500" }}>ASSUNTO</Text>
                                    <Badge size="lg" colorPalette="blue">{req.assunto}</Badge>
                                </VStack>
                                {req.beneficio && (
                                    <VStack align="start" gap={1} flex={1}>
                                        <Text fontSize="xs" fontWeight="black" color={{ base: "gray.400", _dark: "slate.500" }}>BENEFÍCIO</Text>
                                        <Badge size="lg" colorPalette="purple">{req.beneficio}</Badge>
                                    </VStack>
                                )}
                            </Stack>
                            <VStack align="start" gap={1}>
                                <Text fontSize="xs" fontWeight="black" color={{ base: "gray.400", _dark: "slate.500" }}>DESCRIÇÃO</Text>
                                <Box p={4} bg={{ base: "gray.50", _dark: "slate.800" }} borderRadius="xl" w="full" border="1px solid" borderColor={{ base: "gray.100", _dark: "slate.700" }}>
                                    <Text color={{ base: "slate.700", _dark: "slate.300" }} whiteSpace="pre-wrap" fontSize={{ base: "sm", md: "md" }}>{req.descricao}</Text>
                                </Box>
                            </VStack>

                        </VStack>
                    </VStack>

                    {req.arquivoPath && (
                        <VStack align="start" gap={1} mt={6}>
                            <Text fontSize="xs" fontWeight="black" color={{ base: "gray.400", _dark: "slate.500" }}>ARQUIVO ANEXADO</Text>
                            <Button
                                variant="outline"
                                colorPalette="blue"
                                borderRadius="lg"
                                w={{ base: "full", sm: "auto" }}
                                onClick={() => onDownload(req.arquivoPath!)}
                            >
                                <Download size={18} style={{ marginRight: '8px' }} />
                                Baixar Anexo
                            </Button>
                        </VStack>
                    )}
                </Box>

                {/* ── BOTÕES DE AÇÃO ── */}
                <Box
                    p={{ base: 4, md: 6 }}
                    borderTop="1px solid"
                    borderColor={{ base: "gray.100", _dark: "slate.800" }}
                    display="flex"
                    flexDir={{ base: "column", sm: "row" }}
                    gap={4}
                >
                    <Button
                        flex={1}
                        w={{ base: "full", sm: "auto" }}
                        colorPalette="green"
                        borderRadius="xl"
                        size="lg"
                        onClick={() => onApprove(req.id!)}
                        disabled={req.confirmacao === true}
                    >
                        <CheckCircle size={20} style={{ marginRight: '8px' }} /> APROVAR
                    </Button>
                    <Button
                        flex={1}
                        w={{ base: "full", sm: "auto" }}
                        colorPalette="red"
                        variant="outline"
                        borderRadius="xl"
                        size="lg"
                        onClick={() => onReject(req.id!)}
                        disabled={req.confirmacao === false}
                    >
                        <XCircle size={20} style={{ marginRight: '8px' }} /> REPROVAR
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}

function DetailItem({ label, value, icon }: { label: string; value: string | number | undefined; icon?: React.ReactNode }) {
    return (
        <VStack align="start" gap={0}>
            <Text fontSize="xs" fontWeight="black" color={{ base: "gray.400", _dark: "slate.400" }} textTransform="uppercase">{label}</Text>
            <HStack gap={2}>
                {icon && <Box color={{ base: "blue.500", _dark: "blue.400" }}>{icon}</Box>}
                <Text fontWeight="bold" color={{ base: "slate.700", _dark: "slate.200" }} fontSize={{ base: "sm", md: "md" }} wordBreak="break-word">
                    {value || '—'}
                </Text>
            </HStack>
        </VStack>
    );
}