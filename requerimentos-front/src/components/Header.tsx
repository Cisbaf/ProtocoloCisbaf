'use client';

import { Box, Container, Flex, Heading, Link, HStack, Text, VStack, Button } from "@chakra-ui/react";
import { Users, LayoutDashboard, UserCircle, Ticket, Menu as MenuIcon, X } from "lucide-react";
import NextLink from "next/link";
import { useEffect, useState } from "react";

export default function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <Box
      as="header"
      w="full"
      h="80px"
      bg="rgba(255, 255, 255, 0.95)"
      backdropFilter="blur(12px)"
      position="sticky"
      top="0"
      zIndex="1000"
      borderBottom="1px solid"
      borderColor="rgba(226, 232, 240, 0.5)"
    >
      <Container maxW="container.xl" h="full" px={{ base: 4, md: 8 }}>
        <Flex justify="space-between" align="center" h="full">

          {/* ── LOGO ── */}
          <Link as={NextLink} href="/" _hover={{ textDecoration: "none" }} onClick={() => setIsMobileMenuOpen(false)}>
            <HStack gap={3}>
              <Box bg="blue.600" p={{ base: 1.5, md: 2 }} borderRadius="xl" shadow="lg" color="white">
                <Users size={24} />
              </Box>
              <VStack align="start" gap={0}>
                <Heading size={{ base: "sm", md: "md" }} fontWeight="black" color="slate.900" letterSpacing="tight">
                  Protocolo Cisbaf
                </Heading>
                <Text fontSize={{ base: "2xs", md: "xs" }} fontWeight="bold" color="blue.600" textTransform="uppercase" letterSpacing="widest">
                  Central de Requisições
                </Text>
              </VStack>
            </HStack>
          </Link>

          {/* ── MENU DESKTOP ── */}
          <HStack gap={6} display={{ base: "none", md: "flex" }}>
            <Link as={NextLink} href="/track" fontSize="sm" fontWeight="bold" color="slate.600" _hover={{ color: "blue.600" }} display="flex" alignItems="center" gap={2}>
              <Ticket size={18} /> Acompanhar Solicitação
            </Link>
            {isAuthenticated ? (
              <Link as={NextLink} href="/admin" fontSize="sm" fontWeight="bold" color="slate.600" _hover={{ color: "blue.600" }} display="flex" alignItems="center" gap={2}>
                <LayoutDashboard size={18} /> Painel Administrativo
              </Link>
            ) : (
              <Link as={NextLink} href="/login" fontSize="sm" fontWeight="bold" color="slate.600" _hover={{ color: "blue.600" }} display="flex" alignItems="center" gap={2}>
                <UserCircle size={18} /> Acesso Restrito
              </Link>
            )}
          </HStack>

          {/* ── BOTÃO MENU MOBILE ── */}
          <Button
            display={{ base: "flex", md: "none" }}
            bg="transparent" // Trocado variant="ghost" por bg="transparent" para evitar bugs de clique
            _hover={{ bg: "gray.100" }}
            p={2}
            borderRadius="md"
            onClick={toggleMobileMenu}
            aria-label="Abrir Menu"
            color="slate.600"
            cursor="pointer"
          >
            {isMobileMenuOpen ? <X size={28} /> : <MenuIcon size={28} />}
          </Button>
        </Flex>
      </Container>

      {/* ── DROPDOWN MOBILE ── */}
      {isMobileMenuOpen && (
        <Box
          position="absolute"
          top="80px"
          left={0}
          w="full"
          bg="white"
          shadow="2xl"
          borderBottomRadius="2xl"
          display={{ md: "none" }}
          p={4}
          borderTop="1px solid"
          borderColor="gray.100"
          zIndex={9999} // Z-index super alto para passar por cima de tudo na página
        >
          <VStack align="stretch" gap={3}>
            <Link
              as={NextLink}
              href="/track"
              fontSize="md"
              fontWeight="bold"
              color="slate.700"
              _hover={{ color: "blue.600", bg: "blue.50" }}
              display="flex"
              alignItems="center"
              gap={3}
              p={4} // Aumentei o padding para ficar mais fácil de clicar no celular
              borderRadius="lg"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Ticket size={22} color="#2563EB" /> Acompanhar Solicitação
            </Link>

            {isAuthenticated ? (
              <Link
                as={NextLink}
                href="/admin"
                fontSize="md"
                fontWeight="bold"
                color="slate.700"
                _hover={{ color: "blue.600", bg: "blue.50" }}
                display="flex"
                alignItems="center"
                gap={3}
                p={4}
                borderRadius="lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <LayoutDashboard size={22} color="#2563EB" /> Painel Administrativo
              </Link>
            ) : (
              <Link
                as={NextLink}
                href="/login"
                fontSize="md"
                fontWeight="bold"
                color="slate.700"
                _hover={{ color: "blue.600", bg: "blue.50" }}
                display="flex"
                alignItems="center"
                gap={3}
                p={4}
                borderRadius="lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <UserCircle size={22} color="#2563EB" /> Acesso Restrito
              </Link>
            )}
          </VStack>
        </Box>
      )}
    </Box>
  );
}