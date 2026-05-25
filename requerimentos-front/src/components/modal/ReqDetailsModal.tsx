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

    return (
        <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blackAlpha.700"
            zIndex={2000}
            display="flex"
            justifyContent="center"
            alignItems="center"
            backdropFilter="blur(8px)"
            p={4}
            onClick={onClose}
        >
            <Box
                bg="white"
                w="full"
                maxW="4xl"
                maxH="90vh"
                borderRadius="3xl"
                shadow="dark-lg"
                overflow="hidden"
                onClick={(e) => e.stopPropagation()}
                display="flex"
                flexDir="column"
            >
                <Box p={6} bg="slate.900" color="white" display="flex" justifyContent="space-between" alignItems="center">
                    <VStack align="start" gap={0}>
                        <HStack gap={2}>
                            <Badge colorPalette="blue" variant="solid">REQ</Badge>
                            <Text fontWeight="black" fontSize="lg">{req.id}</Text>
                        </HStack>
                        <Text fontSize="xs" opacity={0.7}>Detalhes completos da solicitação</Text>
                    </VStack>
                    <Button size="sm" variant="ghost" color="white" onClick={onClose} borderRadius="full">
                        <X size={24} />
                    </Button>
                </Box>

                <Box p={8} overflowY="auto" flex={1}>
                    <VStack gap={8} align="stretch">
                        {/* Status Section */}
                        <HStack justify="space-between" p={4} bg="gray.50" borderRadius="2xl" border="1px solid" borderColor="gray.200">
                            <VStack align="start" gap={1}>
                                <Text fontSize="xs" fontWeight="black" color="gray.500">STATUS ATUAL</Text>
                                {renderStatus(req.confirmacao)}
                            </VStack>
                            <VStack align="end" gap={1}>
                                <Text fontSize="xs" fontWeight="black" color="gray.500">PRIORIDADE</Text>
                                {req.prioridade ? (
                                    <Badge colorPalette="red" variant="solid">ALTA</Badge>
                                ) : (
                                    <Badge colorPalette="gray" variant="subtle">NORMAL</Badge>
                                )}
                            </VStack>
                        </HStack>

                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={8}>
                            {/* Colaborador Info */}
                            <VStack align="stretch" gap={4}>
                                <Heading size="md" display="flex" alignItems="center" gap={2} color="slate.800">
                                    <User size={20} color="#3B82F6" /> Identificação
                                </Heading>
                                <DetailItem label="Nome Completo" value={req.usuario?.nome} />
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
                                <Heading size="md" display="flex" alignItems="center" gap={2} color="slate.800">
                                    <Mail size={20} color="#3B82F6" /> Contato
                                </Heading>
                                <DetailItem label="E-mail" value={req.usuario?.email} icon={<Mail size={14} />} />
                                {req.usuario.emailAlt ? (
                                    <DetailItem label="E-mail Alternativo" value={req.usuario.emailAlt} icon={<MailPlus size={14} />} />
                                ) : null}
                                <DetailItem label="Celular" value={req.usuario?.celular} icon={<Smartphone size={14} />} />
                                {req.usuario.telefone ? (
                                    <DetailItem label="Telefone" value={req.usuario?.telefone} icon={<Phone size={14} />} />

                                ) : (null)}

                                <Heading size="md" display="flex" alignItems="center" gap={2} mt={3} color="slate.800">
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
                            <Heading size="md" display="flex" alignItems="center" gap={2} color="slate.800">
                                <FileText size={20} color="#3B82F6" /> Solicitação
                            </Heading>
                            <HStack gap={4}>
                                <VStack align="start" gap={1} flex={1}>
                                    <Text fontSize="xs" fontWeight="black" color="gray.400">ASSUNTO</Text>
                                    <Badge size="lg" colorPalette="blue">{req.assunto}</Badge>
                                </VStack>
                                {req.beneficio && (
                                    <VStack align="start" gap={1} flex={1}>
                                        <Text fontSize="xs" fontWeight="black" color="gray.400">BENEFÍCIO</Text>
                                        <Badge size="lg" colorPalette="purple">{req.beneficio}</Badge>
                                    </VStack>
                                )}
                            </HStack>
                            <VStack align="start" gap={1}>
                                <Text fontSize="xs" fontWeight="black" color="gray.400">DESCRIÇÃO</Text>
                                <Box p={4} bg="gray.50" borderRadius="xl" w="full" border="1px solid" borderColor="gray.100">
                                    <Text color="slate.700" whiteSpace="pre-wrap">{req.descricao}</Text>
                                </Box>
                            </VStack>
                            {req.confirmacao === false && req.motivo && (
                                <VStack align="start" gap={1}>
                                    <Text fontSize="xs" fontWeight="black" color="red.400">MOTIVO DA RECUSA</Text>
                                    <Box p={4} bg="red.50" borderRadius="xl" w="full" border="1px solid" borderColor="red.100">
                                        <Text color="red.700">{req.motivo}</Text>
                                    </Box>
                                </VStack>
                            )}
                        </VStack>
                    </VStack>
                    {req.arquivoPath && (
                        <VStack align="start" gap={1} mt={2}>
                            <Text fontSize="xs" fontWeight="black" color="gray.400">ARQUIVO ANEXADO</Text>
                            <Button
                                variant="outline"
                                colorPalette="blue"
                                borderRadius="lg"
                                onClick={() => onDownload(req.arquivoPath!)}
                            >
                                <Download size={18} style={{ marginRight: '8px' }} />
                                Baixar Anexo
                            </Button>
                        </VStack>
                    )}
                </Box>


                <Box p={6} borderTop="1px solid" borderColor="gray.100" display="flex" gap={4}>
                    <Button flex={1} colorPalette="green" borderRadius="xl" size="lg" onClick={() => onApprove(req.id!)} disabled={req.confirmacao === true}>
                        <CheckCircle size={20} style={{ marginRight: '8px' }} /> APROVAR
                    </Button>
                    <Button flex={1} colorPalette="red" variant="outline" borderRadius="xl" size="lg" onClick={() => onReject(req.id!)} disabled={req.confirmacao === false}>
                        <XCircle size={20} style={{ marginRight: '8px' }} /> REPROVAR
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}

// O DetailItem fica isolado aqui para ser usado apenas pelo modal
function DetailItem({ label, value, icon }: { label: string; value: string | number | undefined; icon?: React.ReactNode }) {
    return (
        <VStack align="start" gap={0}>
            <Text fontSize="xs" fontWeight="black" color="gray.400" textTransform="uppercase">{label}</Text>
            <HStack gap={2}>
                {icon && <Box color="blue.500">{icon}</Box>}
                <Text fontWeight="bold" color="slate.700">{value || '—'}</Text>
            </HStack>
        </VStack>
    );
}