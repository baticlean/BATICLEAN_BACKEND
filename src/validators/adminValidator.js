const { z } = require('zod');
const { QUOTE_REQUEST_STATUS } = require('../constants/enums');

const updateQuoteRequestStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(QUOTE_REQUEST_STATUS, {
      errorMap: () => ({ message: 'Statut de demande invalide.' }),
    }),
    internalNotes: z.string().optional().nullable(),
  }),
});

const adminQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().optional().default(1),
    limit: z.coerce.number().optional().default(10),
    status: z.string().optional(),
    search: z.string().optional(),
  }),
});

module.exports = {
  updateQuoteRequestStatusSchema,
  adminQuerySchema,
};
