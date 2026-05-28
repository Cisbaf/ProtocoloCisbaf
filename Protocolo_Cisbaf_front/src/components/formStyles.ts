export const COLORS = {
    bodyBg: '#F1F5F9',
    cardBg: '#FFFFFF',
    headingDark: '#0F172A',
    labelGray: '#374151',
    subtext: '#6B7280',
    border: '#CBD5E1',
    inputBorder: '#CBD5E1',
    inputFocus: '#3B82F6',

    step1Bg: '#EFF6FF',
    step1Text: '#1D4ED8',
    step2Bg: '#FFF7ED',
    step2Text: '#C2410C',
    step3Bg: '#F5F3FF',
    step3Text: '#7C3AED',

    reqAreaBg: '#EFF6FF',
    reqBorder: '#93C5FD',

    btnBg: '#2563EB',
    btnHover: '#1D4ED8',
};

export const inputStyle = {
    h: '56px',
    borderRadius: 'xl',
    border: '2px solid',
    borderColor: COLORS.inputBorder,
    bg: 'white',
    fontSize: 'md',
    fontWeight: '600',
    color: COLORS.headingDark,
    _placeholder: { color: '#9CA3AF', fontWeight: '400' },
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