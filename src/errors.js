export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function notFound(req, res) {
  res.status(404).json({ error: `Hittade inte ${req.method} ${req.path}` });
}

// Express 5 skickar även fel från async-handlers hit
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, ...(err.details && { details: err.details }) });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Ogiltig JSON i request body' });
  }
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Resursen finns redan' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internt serverfel' });
}
