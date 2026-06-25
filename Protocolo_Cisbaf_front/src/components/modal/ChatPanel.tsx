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
import { MessageCircle, Send, Paperclip, FileText, X, Download } from 'lucide-react';
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

function obterNomeOriginal(arquivoPath: string) {
    const parts = arquivoPath.split('_');
    if (parts.length > 1) {
        return parts.slice(1).join('_');
    }
    return arquivoPath;
}

const isAdmin = (msg: Mensagem) => msg.remetente === 'ADMIN';

export default function ChatPanel({ formularioId, remetente, nomeRemetente }: ChatPanelProps) {
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [conteudo, setConteudo] = useState('');
    const [arquivosSelecionados, setArquivosSelecionados] = useState<File[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [enviando, setEnviando] = useState(false);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mensagensLengthRef = useRef(0); // Referência para evitar scroll hijacking

    const fetchMensagens = useCallback(async () => {
        try {
            const res = await fetch(`/api/requerimentos/${formularioId}/mensagens`);
            if (res.ok) {
                const data: Mensagem[] = await res.json();
                // Só atualiza o estado se houver mudança real (baseado no tamanho)
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            if (arquivosSelecionados.length + files.length > 3) {
                alert("Você só pode enviar no máximo 3 arquivos.");
                return;
            }
            setArquivosSelecionados((prev) => [...prev, ...files]);
        }
    };

    const handleRemoveFile = (indexToRemove: number) => {
        setArquivosSelecionados((prev) => prev.filter((_, idx) => idx !== indexToRemove));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
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
            link.download = obterNomeOriginal(arquivoPath);

            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (err: unknown) {
            console.error("Erro no download:", err);
            alert("Não foi possível baixar o arquivo.");
        }
    };

    const handleEnviar = async () => {
        const texto = conteudo.trim();
        if (!texto && arquivosSelecionados.length === 0) return;
        if (enviando) return;

        setEnviando(true);
        try {
            const formData = new FormData();
            formData.append('conteudo', texto);
            formData.append('remetente', remetente);
            formData.append('nomeRemetente', nomeRemetente);
            arquivosSelecionados.forEach((file) => {
                formData.append('arquivos', file);
            });

            const res = await fetch(`/api/requerimentos/${formularioId}/mensagens`, {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                const nova: Mensagem = await res.json();
                setMensagens((prev) => [...prev, nova]);
                setConteudo('');
                setArquivosSelecionados([]);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        } catch (error) {
            console.error(error);
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
                                    {msg.conteudo && (
                                        <Text fontSize="sm" whiteSpace="pre-wrap" wordBreak="break-word">
                                            {msg.conteudo}
                                        </Text>
                                    )}

                                    {msg.arquivoPath && (
                                        <VStack align="stretch" gap={1.5} mt={msg.conteudo ? 2 : 0}>
                                            {msg.arquivoPath.split(';').map((path, idx) => {
                                                const nomeOriginal = obterNomeOriginal(path);
                                                return (
                                                    <HStack
                                                        key={idx}
                                                        bg={
                                                            proprio
                                                                ? 'whiteAlpha.200'
                                                                : { base: 'gray.50', _dark: 'slate.800' }
                                                        }
                                                        border="1px solid"
                                                        borderColor={
                                                            proprio
                                                                ? 'whiteAlpha.300'
                                                                : { base: 'gray.200', _dark: 'slate.600' }
                                                        }
                                                        px={3}
                                                        py={1.5}
                                                        borderRadius="xl"
                                                        justify="space-between"
                                                        gap={3}
                                                    >
                                                        <HStack gap={2} minW={0} flex={1}>
                                                            <FileText size={16} style={{ flexShrink: 0 }} />
                                                            <Text
                                                                fontSize="xs"
                                                                fontWeight="bold"
                                                                truncate
                                                                title={nomeOriginal}
                                                                color={
                                                                    proprio
                                                                        ? 'white'
                                                                        : { base: 'slate.800', _dark: 'slate.200' }
                                                                }
                                                            >
                                                                {nomeOriginal}
                                                            </Text>
                                                        </HStack>
                                                        <Button
                                                            size="2xs"
                                                            variant="ghost"
                                                            color={
                                                                proprio
                                                                    ? 'white'
                                                                    : { base: 'blue.500', _dark: 'blue.400' }
                                                            }
                                                            _hover={{
                                                                bg: proprio
                                                                    ? 'whiteAlpha.300'
                                                                    : { base: 'gray.200', _dark: 'slate.700' }
                                                            }}
                                                            onClick={() => handleDownloadArquivo(path)}
                                                            p={1}
                                                            minW="auto"
                                                            h="auto"
                                                            borderRadius="md"
                                                        >
                                                            <Download size={14} />
                                                        </Button>
                                                    </HStack>
                                                );
                                            })}
                                        </VStack>
                                    )}
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
                {/* Visualização de arquivos selecionados */}
                {arquivosSelecionados.length > 0 && (
                    <Flex gap={2} mb={2} flexWrap="wrap">
                        {arquivosSelecionados.map((file, idx) => (
                            <HStack
                                key={idx}
                                bg={{ base: 'blue.50', _dark: 'blue.950/45' }}
                                border="1px solid"
                                borderColor={{ base: 'blue.200', _dark: 'blue.900/60' }}
                                px={3}
                                py={1.5}
                                borderRadius="full"
                                gap={1.5}
                            >
                                <FileText size={14} className="text-blue-500" />
                                <Text fontSize="xs" fontWeight="bold" maxW="150px" truncate color={{ base: 'blue.700', _dark: 'blue.300' }}>
                                    {file.name}
                                </Text>
                                <Box
                                    as="button"
                                    onClick={() => handleRemoveFile(idx)}
                                    color={{ base: 'blue.400', _dark: 'blue.500' }}
                                    _hover={{ color: 'red.500' }}
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    transition="color 0.2s"
                                >
                                    <X size={14} />
                                </Box>
                            </HStack>
                        ))}
                    </Flex>
                )}

                <HStack gap={2} align="end">
                    <Button
                        variant="ghost"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={enviando}
                        borderRadius="xl"
                        size="sm"
                        h="52px"
                        w="52px"
                        p={0}
                        color={{ base: 'gray.500', _dark: 'slate.400' }}
                        _hover={{ bg: { base: 'gray.100', _dark: 'slate.800' } }}
                        flexShrink={0}
                    >
                        <Paperclip size={20} />
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        multiple
                        style={{ display: 'none' }}
                    />
                    <Textarea
                        value={conteudo}
                        onChange={(e) => setConteudo(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            arquivosSelecionados.length > 0
                                ? "Adicione um comentário (opcional)..."
                                : "Digite sua mensagem... (Enter para enviar)"
                        }
                        size="sm"
                        borderRadius="xl"
                        resize="none"
                        rows={2}
                        color={{ base: "black", _dark: "white" }}
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
                        disabled={!conteudo.trim() && arquivosSelecionados.length === 0}
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
                    Shift+Enter para nova linha · Envie até 3 arquivos · Atualiza a cada 8s
                </Text>
            </Box>
        </Box>
    );
}