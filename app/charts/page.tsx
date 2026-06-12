'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';
import { PageShell } from '../components/PageShell';
import { PageHero } from '../components/PageHero';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

// Sample data — replace with data from your API / Supabase.
const monthlyData = [
  { month: 'Jan', signups: 186, active: 80 },
  { month: 'Feb', signups: 305, active: 200 },
  { month: 'Mar', signups: 237, active: 120 },
  { month: 'Apr', signups: 273, active: 190 },
  { month: 'May', signups: 209, active: 130 },
  { month: 'Jun', signups: 314, active: 240 },
];

const chartConfig = {
  signups: {
    label: 'Sign-ups',
    color: 'hsl(var(--chart-1))',
  },
  active: {
    label: 'Active Users',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export default function ChartsPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Charts"
        title={
          <>
            Charts{' '}
            <span className="font-serif font-normal italic text-primary">
              Example
            </span>
          </>
        }
        subtitle={
          <>
            Built with <strong>Recharts</strong> and shadcn/ui chart components.
            Edit{' '}
            <code className="rounded bg-muted px-1.5 py-0.5">
              app/charts/page.tsx
            </code>{' '}
            to use your own data.
          </>
        }
      />

      <Card className="border-2 border-foreground rounded-2xl shadow-hard">
        <CardHeader>
          <CardTitle className="font-display">Monthly Sign-ups</CardTitle>
          <CardDescription>A bar chart comparing two series</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="max-h-[320px] w-full">
            <BarChart accessibilityLayer data={monthlyData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="signups" fill="var(--color-signups)" radius={4} />
              <Bar dataKey="active" fill="var(--color-active)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="border-2 border-foreground rounded-2xl shadow-hard">
        <CardHeader>
          <CardTitle className="font-display">Growth Trend</CardTitle>
          <CardDescription>A line chart over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="max-h-[320px] w-full">
            <LineChart
              accessibilityLayer
              data={monthlyData}
              margin={{ left: 12, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                dataKey="signups"
                type="monotone"
                stroke="var(--color-signups)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                dataKey="active"
                type="monotone"
                stroke="var(--color-active)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="border-2 border-foreground rounded-2xl shadow-hard">
        <CardHeader>
          <CardTitle className="font-display">Why Recharts?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Recharts</strong> is the charting library shadcn/ui is built
            around. The
            <code className="bg-muted px-1.5 py-0.5 rounded mx-1">
              ChartContainer
            </code>
            wrapper in{' '}
            <code className="bg-muted px-1.5 py-0.5 rounded">
              components/ui/chart.tsx
            </code>
            handles theming (via CSS variables), tooltips, and legends so your
            charts match the rest of the UI.
          </p>
          <p>
            Add more chart types (area, pie, radar, radial) straight from the{' '}
            <a
              href="https://ui.shadcn.com/charts"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              shadcn/ui charts gallery
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
