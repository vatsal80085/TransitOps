const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, {
  message: 'Invalid ObjectId format',
});

const vehicleIdQuerySchema = z.object({
  query: z.object({
    vehicleId: objectIdSchema.optional(),
  }),
});

module.exports = {
  vehicleIdQuerySchema,
};
