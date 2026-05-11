import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this';

export async function hashPin(pin: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pin, salt);
}

export async function verifyPin(pin: string, pinHash: string): Promise<boolean> {
  return bcrypt.compare(pin, pinHash);
}

export function generateToken(merchantId: string): string {
  return jwt.sign({ merchantId }, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): { merchantId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { merchantId: string };
    return decoded;
  } catch (error) {
    return null;
  }
}
