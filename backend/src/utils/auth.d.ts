export declare function hashPin(pin: string): Promise<string>;
export declare function verifyPin(pin: string, pinHash: string): Promise<boolean>;
export declare function generateToken(merchantId: string): string;
export declare function verifyToken(token: string): {
    merchantId: string;
} | null;
//# sourceMappingURL=auth.d.ts.map