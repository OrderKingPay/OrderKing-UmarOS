import { z } from 'zod';
import { fabric } from './universal-fabric';

// Request validation schemas for different engines
export const TravelSchemas = {
  BookFlight: z.object({
    origin: z.string().length(3),
    destination: z.string().length(3),
    date: z.string(),
    passengers: z.number().int().positive(),
  }),
};

export const JobsSchemas = {
  PostJob: z.object({
    title: z.string(),
    description: z.string(),
    salary: z.number().positive(),
  }),
};

export const KingPaySchemas = {
  Transfer: z.object({
    toUserId: z.string(),
    amount: z.number().positive(),
    currency: z.string().length(3),
  }),
};

export const EconomicsSchemas = {
  UpdateTaxRate: z.object({
    newRate: z.number().min(0).max(100),
    region: z.string(),
  }),
};

// Registering endpoints securely in the Universal Connector Fabric

// Travel Engine
fabric.registerRoute(
  'POST',
  '/api/fabric/travel/book',
  { schema: { body: TravelSchemas.BookFlight }, requiredRole: 'USER' },
  async (req, ctx) => {
    // Ideally this would import from the travel orchestrator
    // e.g. await travelOrchestrator.bookFlight(req.body)
    return {
      status: 200,
      data: {
        message: 'Flight booked via Travel Engine',
        bookingId: `BK_${Math.random().toString(36).substring(7).toUpperCase()}`,
        details: req.body,
        userId: ctx.userId,
      },
    };
  }
);

// Jobs Engine
fabric.registerRoute(
  'POST',
  '/api/fabric/jobs/post',
  { schema: { body: JobsSchemas.PostJob }, requiredRole: 'ADMIN' },
  async (req, ctx) => {
    return {
      status: 201,
      data: {
        message: 'Job posted via Jobs Engine',
        jobId: `JB_${Date.now()}`,
        details: req.body,
        postedBy: ctx.userId,
      },
    };
  }
);

// KingPay Engine
fabric.registerRoute(
  'POST',
  '/api/fabric/kingpay/transfer',
  { schema: { body: KingPaySchemas.Transfer }, requiredRole: 'USER' },
  async (req, ctx) => {
    return {
      status: 200,
      data: {
        message: 'Funds transferred successfully via KingPay Engine',
        transactionId: `TX_${Date.now()}`,
        amount: req.body.amount,
        currency: req.body.currency,
      },
    };
  }
);

// Economics Engine (Founder-level only)
fabric.registerRoute(
  'POST',
  '/api/fabric/economics/update-tax',
  { schema: { body: EconomicsSchemas.UpdateTaxRate }, requiredRole: 'FOUNDER' },
  async (req, ctx) => {
    // Only a Founder can hit this endpoint
    return {
      status: 200,
      data: {
        message: 'Tax rate updated via Economics Engine',
        newRate: req.body.newRate,
        region: req.body.region,
        updatedBy: ctx.userId, // founder ID
      },
    };
  }
);

export const FabricEngines = {
  isReady: true,
};
