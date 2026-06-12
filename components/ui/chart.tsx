'use client';

// Public surface for the shadcn/ui Recharts wrapper. Implementation is split
// across sibling modules to stay under the 300-line file-size limit; import
// from '@/components/ui/chart' as before.

export { type ChartConfig, ChartStyle } from '@/components/ui/chart-context';
export { ChartContainer } from '@/components/ui/chart-container';
export {
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart-tooltip';
export { ChartLegend, ChartLegendContent } from '@/components/ui/chart-legend';
