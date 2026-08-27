'use client';

import { toaster } from '@/components/ui/toaster';
import {
    Box, Button, Center,
    HStack, SimpleGrid, Text, VStack, chakra
} from '@chakra-ui/react';
import {
    BarChart as BarChartIcon,
    FileText, XCircle
} from 'lucide-react';
import { ChangeEvent, useState } from 'react';
import {
    Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';

interface StatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    bases: string[]; // NOVO: Recebendo a lista de unidades do Inspector
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const StyledInput = chakra('input');
const StyledSelect = chakra('select');

type ChartType = 'TODOS' | 'EVOLUCAO_DIARIA' | 'RANKING_UNIDADES' | 'VOLUME_CARGO';
type ChartData = { label: string; value: number };

interface Charts {
    unidades: ChartData[];
    evolucao: ChartData[];
    cargos: ChartData[];
}

function GraficoEvolucao({ data }: { data: ChartData[] }) {
    return (
        <Box h="300px" w="full" p={4} borderRadius="xl" borderColor={{ base: "gray.100", _dark: "slate.700" }}>
            <Text fontSize="sm" fontWeight="bold" color={{ base: "gray.500", _dark: "slate.400" }} mb={4}>EVOLUÇÃO DE SOLICITAÇÕES</Text>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" name="Solicitações" />
                </AreaChart>
            </ResponsiveContainer>
        </Box>
    );
}

function GraficoUnidades({ data }: { data: ChartData[] }) {
    return (
        <Box h="330px" w="full" p={4} borderRadius="xl">
            <Text fontSize="sm" fontWeight="bold" color={{ base: "gray.500", _dark: "slate.400" }} mb={4}>VOLUME POR UNIDADE</Text>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="label"
                        label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} />
                </PieChart>
            </ResponsiveContainer>
        </Box>
    );
}

function GraficoCargos({ data }: { data: ChartData[] }) {
    return (
        <Box h="300px" w="full" p={4} borderRadius="xl">
            <Text fontSize="sm" fontWeight="bold" color={{ base: "gray.500", _dark: "slate.400" }} mb={4}>VOLUME POR CARGO</Text>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Quantidade" />
                </BarChart>
            </ResponsiveContainer>
        </Box>
    );
}

export default function StatsModal({ isOpen, onClose, bases }: StatsModalProps) {
    const [startDate, setStartDate] = useState("2000-01-01");
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [chartType, setChartType] = useState<ChartType>("TODOS");
    const [selectedUnidade, setSelectedUnidade] = useState("all");
    const [loadingStats, setLoadingStats] = useState(false);
    const [charts, setCharts] = useState<Charts>({
        unidades: [],
        evolucao: [],
        cargos: []
    });
    const unidade = bases.length === 1
        ? bases[0]
        : bases.includes(selectedUnidade) ? selectedUnidade : "all";

    if (!isOpen) return null;

    const fetchStats = async () => {
        if (!startDate || !endDate) {
            toaster.create({ title: 'Aviso', description: 'Selecione a data de início e fim', type: 'info' });
            return;
        }

        setLoadingStats(true);
        try {
            // NOVO: Criamos um timestamp único para esta execução
            const timestamp = new Date().getTime();

            if (chartType === "TODOS") {
                // Adicionamos &_t=${timestamp} no final de cada URL
                const [resUnidades, resEvolucao, resCargos] = await Promise.all([
                    fetch(`/api/dashboard/graficos?tipo=RANKING_UNIDADES&inicio=${startDate}&fim=${endDate}&unidade=${unidade}&_t=${timestamp}`),
                    fetch(`/api/dashboard/graficos?tipo=EVOLUCAO_DIARIA&inicio=${startDate}&fim=${endDate}&unidade=${unidade}&_t=${timestamp}`),
                    fetch(`/api/dashboard/graficos?tipo=VOLUME_CARGO&inicio=${startDate}&fim=${endDate}&unidade=${unidade}&_t=${timestamp}`)
                ]);

                if (!resUnidades.ok || !resEvolucao.ok || !resCargos.ok) throw new Error("Erro ao carregar múltiplos gráficos");

                setCharts({
                    unidades: await resUnidades.json(),
                    evolucao: await resEvolucao.json(),
                    cargos: await resCargos.json()
                });
            } else {
                // Adicionamos &_t=${timestamp} no final desta URL também
                const res = await fetch(`/api/dashboard/graficos?tipo=${chartType}&inicio=${startDate}&fim=${endDate}&unidade=${unidade}&_t=${timestamp}`);
                if (!res.ok) throw new Error("Erro ao carregar gráfico");

                const data = await res.json();
                setCharts({
                    unidades: chartType === "RANKING_UNIDADES" ? data : [],
                    evolucao: chartType === "EVOLUCAO_DIARIA" ? data : [],
                    cargos: chartType === "VOLUME_CARGO" ? data : []
                });
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro interno';
            toaster.create({ title: 'Erro', description: errorMessage, type: 'error' });
        } finally {
            setLoadingStats(false);
        }
    };

    const exportToExcel = () => {
        let content = "\uFEFF"; // BOM para UTF-8 (acentos no Excel)

        const createCsvSection = (title: string, data: ChartData[]) => {
            if (data.length === 0) return "";
            return `${title}\nCategoria,Quantidade\n` + data.map(d => `"${d.label}",${d.value}`).join("\n") + "\n\n";
        };

        if (chartType === "TODOS") {
            content += createCsvSection("EVOLUCAO DIARIA", charts.evolucao);
            content += createCsvSection("RANKING UNIDADES", charts.unidades);
            content += createCsvSection("VOLUME POR CARGO", charts.cargos);
        } else {
            const activeData = chartType === "RANKING_UNIDADES" ? charts.unidades : chartType === "EVOLUCAO_DIARIA" ? charts.evolucao : charts.cargos;
            content += createCsvSection(chartType, activeData);
        }

        if (content === "\uFEFF") return; // Sem dados

        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `relatorio_${chartType}_${startDate}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const hasData = charts.unidades.length > 0 || charts.evolucao.length > 0 || charts.cargos.length > 0;

    return (
        <Box
            position="fixed" top={0} left={0} right={0} bottom={0}
            bg="blackAlpha.800" zIndex={3000} display="flex"
            justifyContent="center" alignItems="center"
            backdropFilter="blur(10px)" p={4}
            className="print-modal-container"
        >
            <Box
                bg={{ base: "gray.50", _dark: "slate.950" }}
                w="full" maxW="6xl" maxH="90vh" overflowY="auto"
                borderRadius="2xl" shadow="2xl" p={{ base: 4, md: 8 }}
                onClick={(e) => e.stopPropagation()}
            >
                <VStack align="stretch" gap={6}>
                    <HStack justify="space-between" flexWrap="wrap">
                        {/* ... Heading e Botão Fechar ... */}
                    </HStack>

                    {/* Filtros */}
                    <Box bg={{ base: "gray.50", _dark: "slate.800" }} p={4} borderRadius="xl" border="1px solid" borderColor={{ base: "gray.200", _dark: "slate.700" }}>
                        {/* NOVO: Alterado de columns={4} para columns={5} para caber o novo filtro no desktop */}
                        <SimpleGrid columns={{ base: 1, md: 5 }} gap={4} alignItems="end">
                            <VStack align="start" gap={1}>
                                <Text fontSize="xs" fontWeight="black" color={{ base: "gray.500", _dark: "slate.400" }}>DATA INICIAL</Text>
                                <StyledInput type="date" value={startDate} onChange={(event: ChangeEvent<HTMLInputElement>) => setStartDate(event.target.value)} w="full" p="10px" borderRadius="12px" border="1px solid" borderColor={{ base: "gray.200", _dark: "slate.600" }} bg={{ base: "white", _dark: "slate.900" }} color={{ base: "black", _dark: "white" }} fontSize="14px" fontWeight="600" outline="none" />
                            </VStack>
                            <VStack align="start" gap={1}>
                                <Text fontSize="xs" fontWeight="black" color={{ base: "gray.500", _dark: "slate.400" }}>DATA FINAL</Text>
                                <StyledInput type="date" value={endDate} onChange={(event: ChangeEvent<HTMLInputElement>) => setEndDate(event.target.value)} w="full" p="10px" borderRadius="12px" border="1px solid" borderColor={{ base: "gray.200", _dark: "slate.600" }} bg={{ base: "white", _dark: "slate.900" }} color={{ base: "black", _dark: "white" }} fontSize="14px" fontWeight="600" outline="none" />
                            </VStack>

                            {/* NOVO: Select de Unidade */}
                            <VStack align="start" gap={1}>
                                <Text fontSize="xs" fontWeight="black" color={{ base: "gray.500", _dark: "slate.400" }}>UNIDADE</Text>
                                <StyledSelect value={unidade} onChange={(event: ChangeEvent<HTMLSelectElement>) => setSelectedUnidade(event.target.value)} w="full" p="10px" borderRadius="12px" border="1px solid" borderColor={{ base: "gray.200", _dark: "slate.600" }} bg={{ base: "white", _dark: "slate.900" }} color={{ base: "black", _dark: "white" }} fontSize="14px" fontWeight="600" outline="none">
                                    {bases.length > 1 && (
                                        <option value="all">Todas as Unidades</option>
                                    )}
                                    {bases.map(b => <option key={b} value={b}>{b}</option>)}
                                </StyledSelect>
                            </VStack>


                            <VStack align="start" gap={1}>
                                <Text fontSize="xs" fontWeight="black" color={{ base: "gray.500", _dark: "slate.400" }}>VISUALIZAÇÃO</Text>
                                <StyledSelect value={chartType} onChange={(event: ChangeEvent<HTMLSelectElement>) => setChartType(event.target.value as ChartType)} w="full" p="10px" borderRadius="12px" border="1px solid" borderColor={{ base: "gray.200", _dark: "slate.600" }} bg={{ base: "white", _dark: "slate.900" }} color={{ base: "black", _dark: "white" }} fontSize="14px" fontWeight="600" outline="none">
                                    <option value="TODOS">Visão Geral (Todos)</option>
                                    <option value="EVOLUCAO_DIARIA">Apenas Evolução Diária</option>
                                    <option value="RANKING_UNIDADES">Apenas Volume por Unidade</option>
                                    {bases.length > 1 && (
                                        <option value="VOLUME_CARGO">Apenas Volume por Cargo</option>

                                    )}
                                </StyledSelect>
                            </VStack>
                            <Button colorPalette="blue" onClick={() => fetchStats()} loading={loadingStats ? true : undefined} w="full">
                                Gerar Relatórios
                            </Button>
                        </SimpleGrid>
                    </Box>

                    {/* Área dos Gráficos */}
                    {!hasData ? (
                        <Box h="300px" w="full" bg={{ base: "white", _dark: "slate.800" }} p={4} borderRadius="xl" border="1px solid" borderColor={{ base: "gray.100", _dark: "slate.700" }}>
                            <Center h="full" flexDir="column" gap={2} color={{ base: "gray.400", _dark: "slate.500" }}>
                                <BarChartIcon size={48} opacity={0.5} />
                                <Text fontWeight="bold">Selecione o período e clique em Gerar Relatórios</Text>
                            </Center>
                        </Box>
                    ) : (
                        <VStack align="stretch" gap={4}>
                            {/* Gráfico 1: Evolução Temporal (Largura total, ou apenas se for selecionado/Todos) */}
                            {(chartType === "TODOS" || chartType === "EVOLUCAO_DIARIA") && charts.evolucao.length > 0 && (
                                <GraficoEvolucao data={charts.evolucao} />
                            )}

                            {/* Gráficos 2 e 3: Unidades e Cargos (Lado a lado no Desktop, um embaixo do outro no Mobile) */}
                            <SimpleGrid columns={{ base: 1, md: chartType === "TODOS" ? 2 : 1 }} gap={4}>
                                {(chartType === "TODOS" || chartType === "RANKING_UNIDADES") && charts.unidades.length > 1 && (
                                    <GraficoUnidades data={charts.unidades} />
                                )}
                                {(chartType === "TODOS" || chartType === "VOLUME_CARGO") && charts.cargos.length > 0 && (
                                    <GraficoCargos data={charts.cargos} />
                                )}
                            </SimpleGrid>
                        </VStack>
                    )}

                    {/* Botões de Exportação */}
                    <HStack justify="flex-end" gap={3} pt={4} borderTop="1px solid" borderColor={{ base: "gray.200", _dark: "slate.700" }}>
                        <Button colorPalette="green" variant="outline" disabled={!hasData} onClick={exportToExcel}>
                            <FileText size={18} style={{ marginRight: '8px' }} /> Exportar Excel
                        </Button>
                        <Button size="sm" variant="outline" colorPalette={"red"} onClick={onClose}>
                            <XCircle size={20} /> Fechar
                        </Button>
                    </HStack>
                </VStack>
            </Box>
        </Box>
    );
}
