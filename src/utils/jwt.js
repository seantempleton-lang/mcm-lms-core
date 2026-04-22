import jwt from 'jsonwebtoken';
import { config } from '../config.js';
export function signToken(user){
  return jwt.sign({ sub:user.id, username:user.username, role:user.role, name:user.name }, config.jwtSecret, { expiresIn:'12h' });
}
