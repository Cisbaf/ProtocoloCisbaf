export const COLORS = {
    bodyBg: { base: '#F1F5F9', _dark: '#020617' },
    cardBg: { base: '#FFFFFF', _dark: '#0F172A' },
    headingDark: { base: '#0F172A', _dark: '#F8FAFC' },
    labelGray: { base: '#374151', _dark: '#94A3B8' },
    subtext: { base: '#6B7280', _dark: '#94A3B8' },
    border: { base: '#CBD5E1', _dark: '#334155' },
    inputBorder: { base: '#CBD5E1', _dark: '#334155' },
    inputFocus: '#3B82F6',

    step1Bg: { base: '#EFF6FF', _dark: '#1E3A8A' },
    step1Text: { base: '#1D4ED8', _dark: '#BFDBFE' },
    step2Bg: { base: '#FFF7ED', _dark: '#7C2D12' },
    step2Text: { base: '#C2410C', _dark: '#FFEDD5' },
    step3Bg: { base: '#F5F3FF', _dark: '#4C1D95' },
    step3Text: { base: '#7C3AED', _dark: '#EDE9FE' },

    reqAreaBg: { base: '#EFF6FF', _dark: '#1E3A8A' },
    reqBorder: { base: '#93C5FD', _dark: '#1E40AF' },

    btnBg: '#2563EB',
    btnHover: '#1D4ED8',
};

export const inputStyle = {
    h: '56px',
    borderRadius: 'xl',
    border: '2px solid',
    borderColor: COLORS.inputBorder,
    bg: { base: 'white', _dark: '#0F172A' },
    fontSize: 'md',
    fontWeight: '600',
    color: COLORS.headingDark,
    _placeholder: { color: { base: '#9CA3AF', _dark: '#64748B' }, fontWeight: '400' },
    _focus: {
        borderColor: COLORS.inputFocus,
        boxShadow: `0 0 0 3px ${COLORS.inputFocus}22`,
        outline: 'none',
    },
};

export const labelStyle = {
    fontWeight: '700' as const,
    fontSize: 'xs' as const,
    letterSpacing: 'wider' as const,
    color: COLORS.labelGray,
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '6px' as const,
};