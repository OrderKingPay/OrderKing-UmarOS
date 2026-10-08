import helmet from 'helmet';

export function getHelmetMiddleware() {
  return helmet({
    contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } },
    hsts: { maxAge: 31536000, includeSubDomains: true },
    frameguard: { action: 'deny' }
  });
}
