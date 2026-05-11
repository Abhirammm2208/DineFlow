import type { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            merchantId?: string;
        }
    }
}
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=authMiddleware.d.ts.map