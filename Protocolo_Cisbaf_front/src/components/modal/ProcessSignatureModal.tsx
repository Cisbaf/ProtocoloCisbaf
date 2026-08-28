'use client';

import { Box, Button, HStack, Input, Text, VStack } from '@chakra-ui/react';
import { Archive, CheckCircle, PenLine, RotateCcw, X } from 'lucide-react';
import { FormEvent, useState } from 'react';

const contarLetras = (valor: string) => valor.match(/\p{L}/gu)?.length ?? 0;
const contemApenasLetrasEEspacos = (valor: string) => /^[\p{L} ]*$/u.test(valor);

interface ProcessSignatureModalProps {
    isOpen: boolean;
    action: 'FINALIZAR' | 'REABRIR' | 'ARQUIVAR';
    loading: boolean;
    onCancel: () => void;
    onConfirm: (assinatura: string) => void;
}

export default function ProcessSignatureModal({
    isOpen,
    action,
    loading,
    onCancel,
    onConfirm,
}: ProcessSignatureModalProps) {
    const [assinatura, setAssinatura] = useState('');

    if (!isOpen) return null;

    const reabrindo = action === 'REABRIR';
    const arquivando = action === 'ARQUIVAR';
    const corAcao = reabrindo ? 'blue' : arquivando ? 'red' : 'green';
    const nomeAcao = reabrindo ? 'reabertura' : arquivando ? 'arquivamento' : 'finalização';
    const verboAcao = reabrindo ? 'reabriu' : arquivando ? 'arquivou' : 'finalizou';
    const caracteresValidos = contemApenasLetrasEEspacos(assinatura);
    const assinaturaValida = caracteresValidos && contarLetras(assinatura) >= 3;
    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        const nome = assinatura.trim();
        if (!assinaturaValida) return;
        onConfirm(nome);
    };

    return (
        <Box
            position="fixed"
            inset={0}
            zIndex={2100}
            bg="blackAlpha.700"
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={4}
            backdropFilter="blur(5px)"
        >
            <Box
                as="form"
                onSubmit={handleSubmit}
                w="full"
                maxW="460px"
                bg={{ base: 'white', _dark: 'slate.900' }}
                borderRadius="2xl"
                shadow="2xl"
                borderWidth="1px"
                borderColor={{ base: 'gray.200', _dark: 'slate.700' }}
                overflow="hidden"
            >
                <HStack px={6} py={5} bg={{ base: 'slate.800', _dark: 'slate.950' }} color="white" gap={3}>
                    <Box p={2} bg={`${corAcao}.500`} borderRadius="xl">
                        {reabrindo ? <RotateCcw size={20} /> : arquivando ? <Archive size={20} /> : <PenLine size={20} />}
                    </Box>
                    <Box flex={1}>
                        <Text fontWeight="black" fontSize="lg">
                            Assinatura de {nomeAcao}
                        </Text>
                        <Text fontSize="sm" color="slate.300">
                            Informe o nome de quem {verboAcao} o processo.
                        </Text>
                    </Box>
                    <Button aria-label="Fechar" variant="ghost" color="white" size="sm" onClick={onCancel} disabled={loading}>
                        <X size={20} />
                    </Button>
                </HStack>

                <VStack p={6} align="stretch" gap={5}>
                    <Box>
                        <label htmlFor="assinatura-processo">
                            <Text fontSize="xs" fontWeight="black" color="gray.500">
                                NOME PARA ASSINATURA
                            </Text>
                        </label>
                        <Input
                            id="assinatura-processo"
                            value={assinatura}
                            onChange={(event) => setAssinatura(event.target.value)}
                            placeholder="Ex.: Maria da Silva"
                            maxLength={150}
                            minLength={3}
                            autoFocus
                            mt={2}
                            borderRadius="xl"
                        />
                        {!caracteresValidos && (
                            <Text mt={2} fontSize="xs" color="red.500" fontWeight="bold">
                                Use apenas letras e espaços.
                            </Text>
                        )}
                        {caracteresValidos && !assinaturaValida && assinatura.length > 0 && (
                            <Text mt={2} fontSize="xs" color="red.500" fontWeight="bold">
                                Digite pelo menos 3 letras.
                            </Text>
                        )}
                    </Box>

                    <HStack justify="flex-end" gap={3}>
                        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" colorPalette={corAcao} loading={loading} disabled={!assinaturaValida}>
                            {reabrindo ? <RotateCcw size={18} /> : arquivando ? <Archive size={18} /> : <CheckCircle size={18} />}
                            {reabrindo ? 'Reabrir e assinar' : arquivando ? 'Arquivar e assinar' : 'Finalizar e assinar'}
                        </Button>
                    </HStack>
                </VStack>
            </Box>
        </Box>
    );
}
