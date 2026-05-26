'use client';

import { useForm } from 'react-hook-form';
import {
  Box,
  Button,
  Field,
  Input,
  VStack,
  Heading,
  Card,
  Container,
  Text,
  Center,
  Separator
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { Lock, LogIn, User } from 'lucide-react';
import { toaster } from "@/components/ui/toaster";

type LoginForm = { username: string; password: string };

export default function Login() {
  const router = useRouter();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<LoginForm>();

  const onLogin = async (data: LoginForm) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Credenciais inválidas");

      toaster.create({ title: 'Logado com sucesso', type: 'success' });
      router.push('/admin');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro interno';
      toaster.create({
        title: 'Erro de login',
        description: errorMessage,
        type: 'error',
      });
    }
  };

  return (
    <Box bg="gray.100" minH="100vh" display="flex" alignItems="center" justifyContent="center" py={12}>
      <Container maxW="500px">
        <Card.Root variant="elevated" boxShadow="2xl" borderRadius="3xl" overflow="hidden" border="2px solid" borderColor="gray.200">
          <Card.Body p={10}>
            <VStack gap={8} align="stretch">
              <VStack align="center" gap={2}>
                <Heading size="2xl" fontWeight="black" color="blue.800">
                  Acesso Restrito
                </Heading>
                <Text color="gray.500" fontWeight="medium">
                  Área Administrativa
                </Text>
              </VStack>

              <Separator />

              <form onSubmit={handleSubmit(onLogin)}>
                <VStack gap={5} align="stretch">
                  <Field.Root required>
                    <Field.Label fontWeight="bold" display="flex" alignItems="center" gap={2}>
                      <User size={18} /> Usuário
                    </Field.Label>
                    <Input
                      {...register('username', { required: true })}
                      placeholder="Seu usuário"
                      h="55px"
                      borderRadius="xl"
                      bg="gray.50"
                    />
                  </Field.Root>

                  <Field.Root required>
                    <Field.Label fontWeight="bold" display="flex" alignItems="center" gap={2}>
                      <Lock size={18} /> Senha
                    </Field.Label>
                    <Input
                      {...register('password', { required: true })}
                      type="password"
                      placeholder="Sua senha"
                      h="55px"
                      borderRadius="xl"
                      bg="gray.50"
                    />
                  </Field.Root>

                  <Button
                    type="submit"
                    colorPalette="blue"
                    width="full"
                    h="60px"
                    borderRadius="xl"
                    fontSize="lg"
                    fontWeight="black"
                    loading={isSubmitting}
                    mt={4}
                    shadow="lg"
                  >
                    <LogIn size={20} style={{ marginRight: '10px' }} /> ENTRAR NO PAINEL
                  </Button>
                </VStack>
              </form>

              <Center>
                <Button variant="ghost" size="sm" color="gray.500" onClick={() => router.push('/')}>
                  Voltar para o formulário público
                </Button>
              </Center>
            </VStack>
          </Card.Body>
        </Card.Root>
      </Container>
    </Box>
  );
}
