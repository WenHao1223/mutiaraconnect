import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { categoryLabels, STATUS_ORDER, statusMeta } from "@/lib/tickets/tickets";
import type { Ticket, TicketCategory, TicketStatus } from "@/types/ticket";

const CATEGORY_COLORS = ["#2563eb", "#0ea5e9", "#f59e0b", "#22c55e", "#8b5cf6", "#ef4444", "#94a3b8"];

const STATUS_COLORS: Record<TicketStatus, string> = {
    received: "#94a3b8",
    under_review: "#0ea5e9",
    in_progress: "#f59e0b",
    resolved: "#22c55e",
};

const countConfig = {
    count: { label: "Tickets", color: "#2563eb" },
} satisfies ChartConfig;

const statusConfig = {
    value: { label: "Tickets" },
    ...Object.fromEntries(
        STATUS_ORDER.map((status) => [status, { label: statusMeta[status].label, color: STATUS_COLORS[status] }]),
    ),
} satisfies ChartConfig;

const shortDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short" });

function buildCategoryData(tickets: Ticket[]) {
    const categories = Object.keys(categoryLabels) as TicketCategory[];
    return categories.map((category) => ({
        category: categoryLabels[category],
        count: tickets.filter((ticket) => ticket.category === category).length,
    }));
}

function buildTimeData(tickets: Ticket[]) {
    const byDay = new Map<string, number>();
    for (const ticket of tickets) {
        const day = ticket.submittedAt.slice(0, 10);
        byDay.set(day, (byDay.get(day) ?? 0) + 1);
    }
    return [...byDay.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([day, count]) => ({ day: shortDate(day), count }));
}

function buildStatusData(tickets: Ticket[]) {
    return STATUS_ORDER.map((status) => ({
        status,
        label: statusMeta[status].label,
        value: tickets.filter((ticket) => ticket.status === status).length,
    }));
}

/** The three management charts: reports by category, over time, and by status. */
export default function ReportsCharts({ tickets }: { tickets: Ticket[] }) {
    return (
        <div className="grid min-w-0 gap-6 lg:grid-cols-2">
            <Card className="min-w-0">
                <CardHeader>
                    <CardTitle className="text-lg">Tickets by category</CardTitle>
                    <CardDescription>What people are reporting.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={countConfig} className="h-64 w-full">
                        <BarChart data={buildCategoryData(tickets)}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="category"
                                tickLine={false}
                                axisLine={false}
                                interval={0}
                                tick={{ fontSize: 11 }}
                                angle={-20}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {buildCategoryData(tickets).map((entry, index) => (
                                    <Cell key={entry.category} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card className="min-w-0">
                <CardHeader>
                    <CardTitle className="text-lg">Tickets over time</CardTitle>
                    <CardDescription>Daily submissions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={countConfig} className="h-64 w-full">
                        <LineChart data={buildTimeData(tickets)}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="var(--color-count)"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                            />
                        </LineChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card className="min-w-0 lg:col-span-2">
                <CardHeader>
                    <CardTitle className="text-lg">Status breakdown</CardTitle>
                    <CardDescription>Where every ticket currently sits.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={statusConfig} className="mx-auto h-64 w-full max-w-md">
                        <PieChart>
                            <ChartTooltip content={<ChartTooltipContent nameKey="status" />} />
                            <Pie
                                data={buildStatusData(tickets)}
                                dataKey="value"
                                nameKey="status"
                                innerRadius={55}
                                outerRadius={90}
                                paddingAngle={2}
                            >
                                {buildStatusData(tickets).map((entry) => (
                                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                    <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {buildStatusData(tickets).map((entry) => (
                            <li key={entry.status} className="flex items-center gap-1.5">
                                <span
                                    className="size-2.5 rounded-full"
                                    style={{ backgroundColor: STATUS_COLORS[entry.status] }}
                                    aria-hidden
                                />
                                {entry.label}: {entry.value}
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
