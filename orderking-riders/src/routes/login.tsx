import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { FleetRunnerPlatformApp } from '../components/fleet-runner/FleetRunnerPlatformApp';

export const Route = createFileRoute('/login')({
  component: FleetRunnerPlatformApp,
});

export default FleetRunnerPlatformApp;
