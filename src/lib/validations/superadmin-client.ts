import { z } from 'zod';

export const superadminClientSchema = z.object({
  name: z.string().min(2),
  legalName: z.string().optional(),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  email: z.string().email(),
  phone: z.string().optional(),
  representativeName: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  address: z.string().optional(),
  monthlyFee: z.coerce.number().min(0).default(0),
  currency: z.string().default('GTQ'),
  paymentStatus: z.enum(['current', 'pending', 'overdue', 'grace', 'suspended']).default('current'),
  tenantStatus: z.enum(['trial', 'active', 'suspended', 'cancelled']).default('active'),
  nextDueDate: z.string().optional(),
  notes: z.string().optional(),
  adminFirstName: z.string().min(2),
  adminLastName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
});