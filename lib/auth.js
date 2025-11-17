import jwt from 'jsonwebtoken';
import cookie from 'cookie';

export function getAdminFromReq(req) {
  const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
  const token = cookies['nandan_admin'];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    return payload;
  } catch (e) {
    return null;
  }
}

export function requireAdmin(handler) {
  return async (req, res) => {
    const admin = getAdminFromReq(req);
    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return handler(req, res);
  };
}
