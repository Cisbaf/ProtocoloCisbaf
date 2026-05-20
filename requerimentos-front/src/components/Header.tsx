'use client';

import { Box, Container, Flex, Heading, Link, HStack, Text, VStack } from "@chakra-ui/react";
import { Users, LayoutDashboard, UserCircle, Ticket } from "lucide-react";
import { useEffect, useState } from "react";

export default function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          setIsAuthenticated(data.isAuthenticated);
        }
      } catch {
        // ignore
      }
    };
    checkAuth();
  }, []);

  return (
    <Box
      as="header"
      w="full"
      h="80px"
      bg="rgba(255, 255, 255, 0.8)"
      backdropFilter="blur(12px)"
      position="sticky"
      top="0"
      zIndex="1000"
      borderBottom="1px solid"
      borderColor="rgba(226, 232, 240, 0.5)"
    >
      <Container maxW="container.xl" h="full">
        <Flex justify="space-between" align="center" h="full">
          <Link href="/" _hover={{ textDecoration: "none" }}>
            <HStack gap={3}>
              <Box bg="blue.600" p={2} borderRadius="xl" shadow="lg" color="white">
                <Users size={24} />
              </Box>
              <VStack align="start" gap={0}>
                <Heading size="md" fontWeight="black" color="slate.900" letterSpacing="tight">
                  Protocolo Cisbaf
                </Heading>
                <Text fontSize="xs" fontWeight="bold" color="blue.600" textTransform="uppercase" letterSpacing="widest">
                  Central de Requisições
                </Text>
              </VStack>
            </HStack>
          </Link>

          <HStack gap={6}>
            <Link href="/track" fontSize="sm" fontWeight="bold" color="slate.600" _hover={{ color: "blue.600" }} display="flex" alignItems="center" gap={2}>
              <Ticket size={18} /> Acompanhar Solicitação
            </Link>
            {isAuthenticated ? (
              <Link href="/admin" fontSize="sm" fontWeight="bold" color="slate.600" _hover={{ color: "blue.600" }} display="flex" alignItems="center" gap={2}>
                <LayoutDashboard size={18} /> Painel Administrativo
              </Link>
            ) : (
              <Link href="/login" fontSize="sm" fontWeight="bold" color="slate.600" _hover={{ color: "blue.600" }} display="flex" alignItems="center" gap={2}>
                <UserCircle size={18} /> Acesso Restrito
              </Link>
            )}
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}

