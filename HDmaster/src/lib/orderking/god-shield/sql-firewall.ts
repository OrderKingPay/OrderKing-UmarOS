import { Request, Response, NextFunction } from 'express';

// NOTE: Regex-based SQL injection prevention is highly discouraged in production environments.
// It is prone to bypasses and false positives. Always use parameterized queries or ORMs.
const sqlInjectionPattern = /(--|';\s*DROP|';\s*TRUNCATE|UNION\s+SELECT|OR\s+1=1)/i;

function sanitizePayload(obj: any): any {
    if (typeof obj === 'string') {
        if (sqlInjectionPattern.test(obj)) {
            return obj.replace(sqlInjectionPattern, '[REDACTED]');
        }
        return obj;
    } else if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                obj[key] = sanitizePayload(obj[key]);
            }
        }
    }
    return obj;
}

export function sqlFirewall(req: Request, res: Response, next: NextFunction) {
    if (req.body) {
        req.body = sanitizePayload(req.body);
    }
    if (req.query) {
        req.query = sanitizePayload(req.query);
    }
    next();
}
