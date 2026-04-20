/**
 * Zod validation middleware factory.
 * Parses req.body against the given schema and attaches result to req.validatedBody.
 * Usage: validate(myZodSchema)
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.issues.map((e) => e.message).join('; ');
    return res.status(400).json({ error: message });
  }
  req.validatedBody = result.data;
  next();
};

module.exports = validate;
