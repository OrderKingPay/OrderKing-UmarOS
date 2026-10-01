
// @ts-nocheck
import { createFileRoute } from '@tanstack/react-router';
import { UmarOSDashboardWrapper } from '@/components/dashboard/UmarOS_Dashboard_Wrapper';

export const Route = createFileRoute('/app/')({
  component: UmarOSDashboardWrapper,
});

