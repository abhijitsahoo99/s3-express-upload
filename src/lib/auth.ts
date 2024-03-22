import { Request, Response, NextFunction } from 'express';
import { config } from './config';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).send({ message: 'Unauthorized' });
    return;
  }
  const token = authHeader.split(' ')[1]; 
  if (token !== config.token) {
    res.status(401).send({ message: 'Unauthorized' });
    return;
  }
  next();
}


