'use client';

import { assuntos } from '@/components/types';
import { toaster } from '@/components/ui/toaster';
import { Badge, Box, Button, HStack, Input, SimpleGrid, Spinner, Text, VStack } from '@chakra-ui/react';
import { Pencil, ShieldCheck, Trash2, UserPlus, X } from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';

export interface AdminAccount {
  id: number;
  username: string;
  assuntosPermitidos: string[];
  acessoTotal: boolean;
}

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
}

export default function AdminUsersModal({ isOpen, onClose, currentUsername }: AdminUsersModalProps) {
  const [users, setUsers] = useState<AdminAccount[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [assuntosSelecionados, setAssuntosSelecionados] = useState<string[]>([]);
  const [acessoTotal, setAcessoTotal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Não foi possível carregar os usuários');
      setUsers(await res.json());
    } catch (error: unknown) {
      toaster.create({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro interno',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Recarrega a lista sempre que o modal é aberto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isOpen) void loadUsers();
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleAssunto = (assunto: string) => {
    setAssuntosSelecionados((atuais) =>
      atuais.includes(assunto) ? atuais.filter((item) => item !== assunto) : [...atuais, assunto]
    );
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setAssuntosSelecionados([]);
    setAcessoTotal(false);
    setEditingUser(null);
  };

  const editUser = (user: AdminAccount) => {
    setEditingUser(user);
    setUsername(user.username);
    setPassword('');
    setAssuntosSelecionados(user.assuntosPermitidos);
    setAcessoTotal(user.acessoTotal);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setSaving(true);
    try {
      const isEditing = editingUser !== null;
      const endpoint = isEditing
        ? `/api/admin/users/${encodeURIComponent(editingUser.username)}`
        : '/api/admin/users';
      const res = await fetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          assuntosPermitidos: assuntosSelecionados,
          acessoTotal: acessoTotal || assuntosSelecionados.length === 0,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || body?.error || (isEditing
          ? 'Não foi possível editar o usuário'
          : 'Não foi possível criar o usuário'));
      }

      resetForm();
      await loadUsers();
      toaster.create({ title: isEditing ? 'Usuário atualizado com sucesso' : 'Usuário criado com sucesso', type: 'success' });
    } catch (error: unknown) {
      toaster.create({
        title: editingUser ? 'Erro ao editar usuário' : 'Erro ao criar usuário',
        description: error instanceof Error ? error.message : 'Erro interno',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (user: AdminAccount) => {
    if (!window.confirm(`Excluir o usuário ${user.username}?`)) return;
    const res = await fetch(`/api/admin/users/${encodeURIComponent(user.username)}`, { method: 'DELETE' });
    if (!res.ok) {
      toaster.create({ title: 'Erro ao excluir usuário', type: 'error' });
      return;
    }
    setUsers((atuais) => atuais.filter((item) => item.id !== user.id));
    toaster.create({ title: 'Usuário excluído', type: 'success' });
  };

  return (
    <Box position="fixed" inset={0} zIndex={2000} bg="blackAlpha.700" p={{ base: 3, md: 8 }} overflowY="auto">
      <Box maxW="900px" mx="auto" bg={{ base: 'white', _dark: 'slate.900' }} color={{ base: 'slate.900', _dark: 'white' }} borderRadius="3xl" shadow="2xl" overflow="hidden">
        <HStack justify="space-between" bg="slate.900" color="white" px={{ base: 5, md: 8 }} py={5}>
          <HStack gap={3}>
            <ShieldCheck size={24} />
            <Box>
              <Text fontWeight="black" fontSize="lg">Usuários administrativos</Text>
              <Text fontSize="xs" color="slate.300">Defina exatamente quais assuntos cada usuário pode visualizar</Text>
            </Box>
          </HStack>
          <Button aria-label="Fechar" variant="ghost" color="white" onClick={handleClose}><X /></Button>
        </HStack>

        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={0}>
          <Box as="form" onSubmit={handleSubmit} p={{ base: 5, md: 8 }} borderRight={{ lg: '1px solid' }} borderColor={{ base: 'gray.200', _dark: 'slate.700' }}>
            <HStack mb={5}>
              {editingUser ? <Pencil size={20} /> : <UserPlus size={20} />}
              <Text fontWeight="black">{editingUser ? `Editar ${editingUser.username}` : 'Novo usuário'}</Text>
            </HStack>
            <VStack align="stretch" gap={4}>
              <Box>
                <Text fontSize="xs" fontWeight="black" mb={1}>USUÁRIO</Text>
                <Input required disabled={editingUser !== null} value={username} onChange={(event: ChangeEvent<HTMLInputElement>) => setUsername(event.target.value)} autoComplete="off" borderRadius="xl" bg={{ base: 'white', _dark: 'slate.800' }} color={{ base: 'slate.900', _dark: 'white' }} borderColor={{ base: 'gray.300', _dark: 'slate.600' }} />
              </Box>
              <Box>
                <Text fontSize="xs" fontWeight="black" mb={1}>SENHA</Text>
                <Input required={!editingUser} type="password" minLength={4} value={password} onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)} autoComplete="new-password" placeholder={editingUser ? 'Deixe em branco para manter a senha' : undefined} borderRadius="xl" bg={{ base: 'white', _dark: 'slate.800' }} color={{ base: 'slate.900', _dark: 'white' }} borderColor={{ base: 'gray.300', _dark: 'slate.600' }} />
              </Box>

              <HStack p={3} border="1px solid" borderColor={acessoTotal ? { base: 'green.400', _dark: 'green.600' } : { base: 'gray.200', _dark: 'slate.600' }} borderRadius="xl" bg={acessoTotal ? { base: 'green.50', _dark: 'green.950' } : { base: 'gray.50', _dark: 'slate.800' }}>
                <input type="checkbox" checked={acessoTotal} disabled={editingUser?.username.toLowerCase() === currentUsername.toLowerCase()} onChange={(event: ChangeEvent<HTMLInputElement>) => setAcessoTotal(event.target.checked)} style={{ width: 18, height: 18 }} />
                <Box>
                  <Text fontWeight="bold">Acesso de Administrador</Text>
                  <Text fontSize="xs" color={{ base: 'gray.600', _dark: 'slate.200' }}>Inclui todos os assuntos atuais e futuros, além de permitir a adição e remoção de usuários.</Text>
                </Box>
              </HStack>

              {!acessoTotal && (
                <Box>
                  <Text fontSize="xs" fontWeight="black" mb={2}>ASSUNTOS PERMITIDOS</Text>
                  <VStack align="stretch" gap={2}>
                    {assuntos.items.map((assunto) => (
                      <HStack key={assunto.value} as="label" cursor="pointer" p={2} borderRadius="lg" _hover={{ bg: { base: 'gray.50', _dark: 'slate.800' } }}>
                        <input type="checkbox" checked={assuntosSelecionados.includes(assunto.value)} onChange={() => toggleAssunto(assunto.value)} style={{ width: 18, height: 18 }} />
                        <Text fontSize="sm" fontWeight="semibold">{assunto.label}</Text>
                      </HStack>
                    ))}
                  </VStack>
                  {assuntosSelecionados.length === 0 && (
                    <Text mt={2} fontSize="xs" color={{ base: 'green.700', _dark: 'green.300' }} fontWeight="bold">
                      Nenhum assunto selecionado: este usuário poderá ver tudo.
                    </Text>
                  )}
                </Box>
              )}

              <HStack>
                <Button type="submit" flex={1} colorPalette="blue" loading={saving} borderRadius="xl">
                  {editingUser ? 'Salvar alterações' : 'Criar usuário'}
                </Button>
                {editingUser && <Button type="button" variant="outline" onClick={resetForm} borderRadius="xl">Cancelar</Button>}
              </HStack>
            </VStack>
          </Box>

          <Box p={{ base: 5, md: 8 }} bg={{ base: 'gray.50', _dark: 'slate.800' }}>
            <Text fontWeight="black" mb={5}>Usuários cadastrados</Text>
            {loading ? <Spinner /> : (
              <VStack align="stretch" gap={3}>
                {users.map((user) => (
                  <Box key={user.id} p={4} bg={{ base: 'white', _dark: 'slate.900' }} color={{ base: 'slate.900', _dark: 'white' }} border="1px solid" borderColor={{ base: 'gray.200', _dark: 'slate.600' }} borderRadius="xl">
                    <HStack justify="space-between" align="start">
                      <Box>
                        <Text fontWeight="black">{user.username}</Text>
                        <HStack mt={2} gap={1} flexWrap="wrap">
                          {user.acessoTotal ? <Badge bg="green.600" color="white">Acesso total</Badge> : user.assuntosPermitidos.map((assunto) => <Badge key={assunto} bg="blue.600" color="white">{assunto}</Badge>)}
                        </HStack>
                      </Box>
                      <HStack gap={1}>
                        <Button aria-label={`Editar usuário ${user.username}`} size="sm" colorPalette="blue" variant="ghost" onClick={() => editUser(user)}><Pencil size={17} /></Button>
                        <Button aria-label="Excluir usuário" size="sm" colorPalette="red" variant="ghost" disabled={user.username === currentUsername} onClick={() => void deleteUser(user)}><Trash2 size={17} /></Button>
                      </HStack>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            )}
          </Box>
        </SimpleGrid>
      </Box>
    </Box>
  );
}
