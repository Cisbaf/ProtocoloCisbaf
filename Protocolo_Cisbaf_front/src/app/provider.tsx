
'use client';

import { ChakraProvider, createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';
import { ColorModeProvider } from '@/components/ui/color-mode'; // gerado pelo snippet oficial do Chakra v3

// ─── Tema personalizado ───────────────────────────────────────────────────────
const customConfig = defineConfig({
  // Força light-mode como padrão; remove o bug de cores no SSR/dark-mode
  theme: {
    tokens: {
      colors: {
        // Adiciona a paleta "slate" que o Chakra v3 não tem nativamente,
        // mapeando para os valores do Tailwind/Radix.
        slate: {
          50: { value: '#F8FAFC' },
          100: { value: '#F1F5F9' },
          200: { value: '#E2E8F0' },
          300: { value: '#CBD5E1' },
          400: { value: '#94A3B8' },
          500: { value: '#64748B' },
          600: { value: '#475569' },
          700: { value: '#334155' },
          800: { value: '#1E293B' },
          900: { value: '#0F172A' },
          950: { value: '#020617' },
        },
      },
    },
    semanticTokens: {
      colors: {
        // Garante que os tokens de texto do Chakra apontem para cinza escuro
        // no modo claro – evita herdar "currentColor" quebrando headings
        'chakra-body-text': {
          value: { base: '#1E293B', _dark: '#F1F5F9' },
        },
        'chakra-placeholder-color': {
          value: { base: '#9CA3AF', _dark: '#6B7280' },
        },
      },
    },
  },
});

const system = createSystem(defaultConfig, customConfig);

import EmotionRegistry from './emotion-registry';

// ─── Provider ─────────────────────────────────────────────────────────────────
export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <EmotionRegistry>
      <ColorModeProvider defaultTheme="light">
        <ChakraProvider value={system}>
          {children}
        </ChakraProvider>
      </ColorModeProvider>
    </EmotionRegistry>
  );
}
