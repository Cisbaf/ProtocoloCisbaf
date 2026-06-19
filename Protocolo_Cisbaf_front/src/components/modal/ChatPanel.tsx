'use client';

import { Mensagem } from '@/components/types';
import {
    Box,
    Button,
    Flex,
    HStack,
    Spinner,
    Text,
    Textarea,
    VStack,
} from '@chakra-ui/react';
import { MessageCircle, Send } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ChatPanelProps {
    formularioId: string;
    remetente: 'ADMIN' | 'SOLICITANTE';
    nomeRemetente: string;
}

// ── Funções Auxiliares Movidas Para Fora do Componente ──
function formatarHora(dataEnvio: string) {
    try {
        const d = new Date(dataEnvio);
        return d.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return dataEnvio;
    }
}

const isAdmin = (msg: Mensagem) => msg.remetente === 'ADMIN';

export default function ChatPanel({ formularioId, remetente, nomeRemetente }: ChatPanelProps) {
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [conteudo, setConteudo] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [enviando, setEnviando] = useState(false);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const mensagensLengthRef = useRef(0); // Referência para evitar scroll hijacking

    const fetchMensagens = useCallback(async () => {
        try {
            const res = await fetch(`/api/requerimentos/${formularioId}/mensagens`);
            if (res.ok) {
                const data: Mensagem[] = await res.json();
                // Opcional: Só atualiza o estado se houver mudança real (baseado no tamanho)
                setMensagens((prev) => (prev.length !== data.length ? data : prev));
            }
        } catch {
            // silencioso — não interrompe o polling
        } finally {
            setCarregando(false);
        }
    }, [formularioId]);

    // Carregamento inicial + polling a cada 8 segundos
    useEffect(() => {
        fetchMensagens();
        const interval = setInterval(fetchMensagens, 8000);
        return () => clearInterval(interval);
    }, [fetchMensagens]);

    // Auto-scroll apenas quando uma NOVA mensagem chega dentro do container de chat
    useEffect(() => {
        if (mensagens.length > mensagensLengthRef.current) {
            scrollContainerRef.current?.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
        mensagensLengthRef.current = mensagens.length;
    }, [mensagens]);

    const handleEnviar = async () => {
        const texto = conteudo.trim();
        if (!texto || enviando) return;

        setEnviando(true);
        try {
            const res = await fetch(`/api/requerimentos/${formularioId}/mensagens`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conteudo: texto, remetente, nomeRemetente }),
            });
            if (res.ok) {
                const nova: Mensagem = await res.json();
                setMensagens((prev) => [...prev, nova]);
                setConteudo('');
            }
        } finally {
            setEnviando(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleEnviar();
        }
    };

    const isMe = (msg: Mensagem) => msg.remetente === remetente;

    return (
        <Box
            border="1px solid"
            borderColor={{ base: 'gray.200', _dark: 'slate.700' }}
            borderRadius="2xl"
            overflow="hidden"
            bg={{ base: 'white', _dark: 'slate.900' }}
        >


            {/* Área de mensagens */}
            <Box
                ref={scrollContainerRef}
                h="320px"
                overflowY="auto"
                p={4}
                bg={{ base: 'gray.50', _dark: 'slate.800/50' }}
                display="flex"
                flexDir="column"
                gap={3}
            >
                {carregando ? (
                    <Flex h="full" align="center" justify="center">
                        <Spinner color="blue.400" />
                    </Flex>
                ) : mensagens.length === 0 ? (
                    <Flex h="full" align="center" justify="center" flexDir="column" gap={2} opacity={0.5}>
                        <MessageCircle size={36} />
                        <Text fontSize="sm" fontWeight="medium">
                            Nenhuma mensagem ainda.
                        </Text>
                        <Text fontSize="xs" textAlign="center">
                            {remetente === 'ADMIN'
                                ? 'Envie uma mensagem para o solicitante.'
                                : 'Aguarde o RH entrar em contato ou envie uma mensagem.'}
                        </Text>
                    </Flex>
                ) : (
                    mensagens.map((msg) => {
                        const proprio = isMe(msg);
                        const admin = isAdmin(msg);
                        return (
                            <VStack
                                key={msg.id}
                                align={proprio ? 'end' : 'start'}
                                gap={0.5}
                            >
                                {/* Nome + hora */}
                                <HStack
                                    gap={1}
                                    flexDir={proprio ? 'row-reverse' : 'row'}
                                >
                                    <Text
                                        fontSize="2xs"
                                        fontWeight="black"
                                        color={
                                            admin
                                                ? { base: 'blue.600', _dark: 'blue.400' }
                                                : { base: 'teal.600', _dark: 'teal.400' }
                                        }
                                        textTransform="uppercase"
                                    >
                                        {msg.nomeRemetente}
                                    </Text>
                                    <Text fontSize="2xs" color={{ base: 'gray.400', _dark: 'slate.500' }}>
                                        · {formatarHora(msg.dataEnvio)}
                                    </Text>
                                </HStack>

                                {/* Balão */}
                                <Box
                                    maxW="80%"
                                    px={4}
                                    py={2}
                                    borderRadius={
                                        proprio
                                            ? '2xl 2xl 4px 2xl'
                                            : '2xl 2xl 2xl 4px'
                                    }
                                    bg={
                                        proprio
                                            ? admin
                                                ? { base: 'blue.500', _dark: 'blue.600' }
                                                : { base: 'teal.500', _dark: 'teal.600' }
                                            : { base: 'white', _dark: 'slate.700' }
                                    }
                                    color={
                                        proprio
                                            ? 'white'
                                            : { base: 'slate.800', _dark: 'slate.100' }
                                    }
                                    shadow="sm"
                                    border="1px solid"
                                    borderColor={
                                        proprio
                                            ? 'transparent'
                                            : { base: 'gray.200', _dark: 'slate.600' }
                                    }
                                >
                                    <Text fontSize="sm" whiteSpace="pre-wrap" wordBreak="break-word">
                                        {msg.conteudo}
                                    </Text>
                                </Box>
                            </VStack>
                        );
                    })
                )}
            </Box>

            {/* Input de envio */}
            <Box
                p={3}
                borderTop="1px solid"
                borderColor={{ base: 'gray.200', _dark: 'slate.700' }}
                bg={{ base: 'white', _dark: 'slate.900' }}
            >
                <HStack gap={2} align="end">
                    <Textarea
                        value={conteudo}
                        onChange={(e) => setConteudo(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Digite sua mensagem... (Enter para enviar)"
                        size="sm"
                        borderRadius="xl"
                        resize="none"
                        rows={2}
                        bg={{ base: 'gray.50', _dark: 'slate.800' }}
                        border="1.5px solid"
                        borderColor={{ base: 'gray.200', _dark: 'slate.600' }}
                        _focus={{
                            borderColor: { base: 'blue.400', _dark: 'blue.500' },
                            bg: { base: 'white', _dark: 'slate.900' },
                        }}
                        disabled={enviando}
                        flex={1}
                    />
                    <Button
                        onClick={handleEnviar}
                        loading={enviando}
                        disabled={!conteudo.trim()}
                        colorPalette="blue"
                        borderRadius="xl"
                        size="sm"
                        h="52px"
                        px={4}
                        flexShrink={0}
                    >
                        <Send size={16} />
                    </Button>
                </HStack>
                <Text fontSize="2xs" color={{ base: 'gray.400', _dark: 'slate.500' }} mt={1}>
                    Shift+Enter para nova linha · Atualiza automaticamente a cada 8s
                </Text>
            </Box>
        </Box>
    );
}