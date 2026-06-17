'use client';

import { Box, Container, Flex, Heading, Link, HStack, Text, VStack, Button } from "@chakra-ui/react";
import { Users, LayoutDashboard, UserCircle, Ticket, Menu as MenuIcon, X } from "lucide-react";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import { ColorModeButton } from "@/components/ui/color-mode";

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
      bg={{ base: "rgba(255, 255, 255, 0.95)", _dark: "rgba(15, 23, 42, 0.95)" }}
      backdropFilter="blur(12px)"
      position="sticky"
      top="0"
      zIndex="1000"
      borderBottom="1px solid"
      borderColor={{ base: "rgba(226, 232, 240, 0.5)", _dark: "rgba(30, 41, 59, 0.5)" }}
    >
      <Container maxW="container.xl" h="full" px={{ base: 4, md: 8 }}>
        <Flex justify="space-between" align="center" h="full">

          {/* ── LOGO ── */}
          <Link as={NextLink} href="/" _hover={{ textDecoration: "none" }} onClick={() => setIsMobileMenuOpen(false)}>
            <HStack gap={3}>
              <Box display="flex" alignItems="center" justifyContent="center">
                <img src="/cisbaf.png" alt="Logo Cisbaf" style={{ height: '60px', width: 'auto', objectFit: 'contain' }} />
              </Box>
              <VStack align="start" gap={0}>
                <Heading size={{ base: "sm", md: "md" }} fontWeight="black" color={{ base: "red.700", _dark: "red.400" }} letterSpacing="tight">
                  Protocolo Cisbaf
                </Heading>
                <Text fontSize={{ base: "2xs", md: "xs" }} fontWeight="bold" color={{ base: "yellow.600", _dark: "yellow.400" }} textTransform="uppercase" letterSpacing="widest">
                  Central de Requerimentos
                </Text>
              </VStack>
            </HStack>
          </Link>

          {/* ── MENU DESKTOP ── */}
          <HStack gap={6} display={{ base: "none", md: "flex" }}>
            <Link as={NextLink} href="/track" fontSize="sm" fontWeight="bold" color={{ base: "slate.600", _dark: "slate.300" }} _hover={{ color: { base: "blue.600", _dark: "blue.400" } }} display="flex" alignItems="center" gap={2}>
              <Ticket size={18} /> Acompanhar Solicitação
            </Link>
            {isAuthenticated ? (
              <Link as={NextLink} href="/admin" fontSize="sm" fontWeight="bold" color={{ base: "slate.600", _dark: "slate.300" }} _hover={{ color: { base: "blue.600", _dark: "blue.400" } }} display="flex" alignItems="center" gap={2}>
                <LayoutDashboard size={18} /> Painel Administrativo
              </Link>
            ) : (
              <Link as={NextLink} href="/login" fontSize="sm" fontWeight="bold" color={{ base: "slate.600", _dark: "slate.300" }} _hover={{ color: { base: "blue.600", _dark: "blue.400" } }} display="flex" alignItems="center" gap={2}>
                <UserCircle size={18} /> Acesso Restrito
              </Link>
            )}
            <ColorModeButton />
          </HStack>

          {/* ── BOTÃO MENU MOBILE E MODO ESCURO ── */}
          <HStack gap={2} display={{ base: "flex", md: "none" }}>
            <ColorModeButton />
            <Button
              bg="transparent"
              _hover={{ bg: { base: "gray.100", _dark: "slate.800" } }}
              p={2}
              borderRadius="md"
              onClick={toggleMobileMenu}
              aria-label="Abrir Menu"
              color={{ base: "slate.600", _dark: "slate.300" }}
              cursor="pointer"
            >
              {isMobileMenuOpen ? <X size={28} /> : <MenuIcon size={28} />}
            </Button>
          </HStack>
        </Flex>
      </Container>

      {/* ── DROPDOWN MOBILE ── */}
      {isMobileMenuOpen && (
        <Box
          position="absolute"
          top="80px"
          left={0}
          w="full"
          bg={{ base: "white", _dark: "slate.900" }}
          shadow="2xl"
          borderBottomRadius="2xl"
          display={{ md: "none" }}
          p={4}
          borderTop="1px solid"
          borderColor={{ base: "gray.100", _dark: "slate.800" }}
          zIndex={9999} // Z-index super alto para passar por cima de tudo na página
        >
          <VStack align="stretch" gap={3}>
            <Link
              as={NextLink}
              href="/track"
              fontSize="md"
              fontWeight="bold"
              color={{ base: "slate.700", _dark: "slate.200" }}
              _hover={{ color: { base: "blue.600", _dark: "blue.400" }, bg: { base: "blue.50", _dark: "slate.800" } }}
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
                color={{ base: "slate.700", _dark: "slate.200" }}
                _hover={{ color: { base: "blue.600", _dark: "blue.400" }, bg: { base: "blue.50", _dark: "slate.800" } }}
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
                color={{ base: "slate.700", _dark: "slate.200" }}
                _hover={{ color: { base: "blue.600", _dark: "blue.400" }, bg: { base: "blue.50", _dark: "slate.800" } }}
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