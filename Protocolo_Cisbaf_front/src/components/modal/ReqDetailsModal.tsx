'use client';

import { Formulario } from '@/components/types';
import {
    Badge,
    Box,
    Button,
    Flex,
    HStack,
    Heading,
    Separator,
    SimpleGrid,
    Stack,
    Text,
    VStack
} from '@chakra-ui/react';
import {
    Archive,
    Briefcase,
    Building,
    Calendar,
    CheckCircle,
    ChevronDown,
    CreditCard,
    Download,
    FileText,
    Fingerprint,
    IdCard,
    IdCardLanyard,
    Mail,
    MailPlus,
    MapPin,
    MessageCircle,
    Phone,
    Smartphone,
    User,
    X,
    XCircle,
    Printer // <-- 1. Adicionei o ícone da impressora/PDF
} from 'lucide-react';
import ChatPanel from './ChatPanel';
import { useMemo, useState } from 'react';

// 2. Importe o jsPDF e o autoTable
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReqDetailsModalProps {
    req: Formulario | null;
    onClose: () => void;
    onApprove: (id: string) => void;
    renderStatus: (finalizarArquivar: 'FINALIZADO' | 'ARQUIVADO' | 'EM_ANALISE' | 'TERMINADO') => React.ReactNode;
    onDownload: (arquivoPath: string) => void;
}

export default function ReqDetailsModal({
    req,
    onClose,
    onApprove,
    renderStatus,
    onDownload
}: ReqDetailsModalProps) {
    const [chatAberto, setChatAberto] = useState(false);

    const dataCriacaoFormatada = useMemo(() => {
        if (!req || !req.dataCriacao) return "—";
        try {
            const dataObj = new Date(req.dataCriacao);
            if (isNaN(dataObj.getTime())) return req.dataCriacao;

            const dataFormatada = dataObj.toLocaleDateString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            });
            const horaFormatada = dataObj.toLocaleTimeString('pt-BR', {
                hour: '2-digit', minute: '2-digit'
            });

            return `${dataFormatada} às ${horaFormatada}`;
        } catch (e) {
            return req.dataCriacao;
        }
    }, [req?.dataCriacao]);

    // 3. Função responsável por montar e baixar o PDF
    const handleGerarPDF = () => {
        if (!req) return;

        const doc = new jsPDF();

        // Título e Cabeçalho
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text("Sistema de Requerimentos - CISBAF", 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text(`Protocolo ID: ${req.id}`, 14, 30);
        doc.text(`Data da Solicitação: ${dataCriacaoFormatada}`, 14, 36);

        const statusMap: Record<string, string> = {
            'FINALIZADO': 'Finalizado',
            'ARQUIVADO': 'Arquivado',
            'EM_ANALISE': 'Em Análise',
            'TERMINADO': 'Terminado'
        };

        // Tabela com os dados do Usuário
        autoTable(doc, {
            startY: 45,
            head: [['Dados do Solicitante', '']],
            body: [
                ['Nome Completo', `${req.usuario?.nome || ''} ${req.usuario?.sobrenome || ''}`],
                ['CPF', req.usuario?.cpf || '—'],
                ['Matrícula', req.usuario?.matricula || '—'],
                ['Cargo', req.usuario?.cargo || '—'],
                ['Unidade', req.unidade || '—'],
                ['E-mail', req.usuario?.email || '—'],
                ['Celular', req.usuario?.celular || '—'],
            ],
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] }, // Azul
            columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' } }
        });

        // Tabela com os dados do Requerimento
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 10,
            head: [['Detalhes da Solicitação', '']],
            body: [
                ['Status Atual', statusMap[req.finalizarArquivar || 'EM_ANALISE'] || 'Em Análise'],
                ['Prioridade', req.prioridade.toLocaleUpperCase() || 'NORMAL'],
                ['Assunto', req.assunto || '—'],
                ['Benefício', req.beneficio || '—'],
                ['Descrição', req.descricao || '—'],
            ],
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
            columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' } },
            styles: { cellPadding: 3, overflow: 'linebreak' }
        });

        // Salva o PDF com o ID do protocolo no nome
        doc.save(`Requerimento_${req.id}.pdf`);
    };

    if (!req) return null;

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
            p={{ base: 4, md: 6 }}
            onClick={onClose}
        >
            <Box
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                bg={{ base: "white", _dark: "slate.900" }}
                w="100%"
                maxW="4xl"
                maxH={{ base: "85vh", md: "90vh" }}
                borderRadius={{ base: "xl", md: "3xl" }}
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
                            <Text id="modal-title" fontWeight="black" fontSize={{ base: "md", md: "lg" }} wordBreak="break-all">
                                {req.id}
                            </Text>
                        </HStack>
                        <Text fontSize="xs" opacity={0.7}>Detalhes completos da solicitação</Text>
                    </VStack>

                    {/* 4. Adicionei o botão de Imprimir PDF no cabeçalho */}
                    <HStack gap={2}>
                        <Button size="sm" variant="outline" color="white" _hover={{ bg: 'whiteAlpha.200' }} onClick={handleGerarPDF} borderRadius="full">
                            <Printer size={16} style={{ marginRight: '6px' }} /> PDF
                        </Button>
                        <Button size="sm" variant="ghost" color="white" onClick={onClose} borderRadius="full" aria-label="Fechar">
                            <X size={24} />
                        </Button>
                    </HStack>
                </Box>

                {/* ── CORPO DO MODAL ── */}
                <Box p={{ base: 4, md: 8 }} overflowY="auto" flex={1}>


                    <VStack gap={{ base: 6, md: 8 }} align="stretch">


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
                                {renderStatus(req.finalizarArquivar!)}
                            </VStack>
                            <VStack align="start" gap={1}>
                                <Text fontSize="xs" fontWeight="black" color={{ base: "gray.500", _dark: "slate.400" }}>DATA DE CRIAÇÃO</Text>
                                <Text fontWeight="bold" color={{ base: "slate.700", _dark: "slate.200" }} fontSize="sm">{dataCriacaoFormatada}</Text>
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

                        {/* Chat com o solicitante */}
                        <Box mt={4} pt={6} borderTop="1px solid" borderColor={{ base: "gray.100", _dark: "slate.800" }}>
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
                                        Conversa com o Solicitante
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
                                        formularioId={req.id!}
                                        remetente="ADMIN"
                                        nomeRemetente="Administrador"
                                    />
                                )}

                            </Box>
                        </Box>

                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={{ base: 6, md: 8 }}>
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

                            <VStack align="stretch" gap={4}>
                                <Heading size="md" display="flex" alignItems="center" gap={2} color={{ base: "slate.800", _dark: "slate.100" }}>
                                    <Mail size={20} color="#3B82F6" /> Contato
                                </Heading>
                                <DetailItem label="E-mail" value={req.usuario?.email} icon={<Mail size={14} />} />
                                {req.usuario?.emailAlt && (
                                    <DetailItem label="E-mail Alternativo" value={req.usuario.emailAlt} icon={<MailPlus size={14} />} />
                                )}
                                <DetailItem label="Celular" value={req.usuario?.celular} icon={<Smartphone size={14} />} />
                                {req.usuario?.telefone && (
                                    <DetailItem label="Telefone" value={req.usuario.telefone} icon={<Phone size={14} />} />
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

                {/* ── BOTÕES DE AÇÃO (Fixos no rodapé) ── */}
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
                        disabled={req.finalizarArquivar === 'FINALIZADO'}
                    >
                        <CheckCircle size={20} style={{ marginRight: '8px' }} /> FINALIZAR
                    </Button>
                    <Button
                        flex={1}
                        w={{ base: "full", sm: "auto" }}
                        colorPalette="red"
                        variant="outline"
                        borderRadius="xl"
                        size="lg"

                        disabled={req.finalizarArquivar === 'ARQUIVADO'}
                    >
                        <Archive size={20} style={{ marginRight: '8px' }} /> ARQUIVAR
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