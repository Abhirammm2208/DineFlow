import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this';
export async function hashPin(pin) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(pin, salt);
}
export async function verifyPin(pin, pinHash) {
    return bcrypt.compare(pin, pinHash);
}
export function generateToken(merchantId) {
    return jwt.sign({ merchantId }, JWT_SECRET, { expiresIn: '24h' });
}
export function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    }
    catch (error) {
        return null;
    }
}
//# sourceMappingURL=auth.js.map