const { z } = require('zod');

const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Please enter a valid email address'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long'),
  }),
});

const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters long'),
    email: z
      .string({ required_error: 'Email is required' })
      .email('Please enter a valid email address'),
    role: z
      .enum(['FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'], {
        errorMap: () => ({ message: 'Role must be FLEET_MANAGER, DISPATCHER, SAFETY_OFFICER, or FINANCIAL_ANALYST' }),
      }),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long'),
  }),
});

module.exports = {
  loginSchema,
  registerSchema,
};
