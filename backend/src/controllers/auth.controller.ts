import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../data-source';
import { User } from '../models/User';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, name, password, default_currency = 'ZAR', country, phone_number } = req.body;

      if (!email || !name || !password) {
        return res.status(400).json({ error: 'Email, name, and password are required' });
      }

      const userRepository = AppDataSource.getRepository(User);
      
      // Check if user already exists
      const existingUser = await userRepository.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Create user
      const user = userRepository.create({
        email,
        name,
        password_hash,
        default_currency,
        country,
        phone_number,
        preferred_currencies: `${default_currency},USD,EUR`
      });

      await userRepository.save(user);

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_fallback';
      const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' });

      // Return user data (excluding password)
      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        default_currency: user.default_currency,
        preferred_currencies: user.preferred_currencies,
        country: user.country,
        phone_number: user.phone_number,
        created_at: user.created_at,
        token
      };

      res.status(201).json(userResponse);
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const userRepository = AppDataSource.getRepository(User);
      
      // Find user with password hash
      const user = await userRepository.findOne({
        where: { email },
        select: ['id', 'email', 'name', 'password_hash', 'default_currency', 'preferred_currencies', 'country', 'phone_number', 'created_at']
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_fallback';
      const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' });

      // Return user data (excluding password)
      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        default_currency: user.default_currency,
        preferred_currencies: user.preferred_currencies,
        country: user.country,
        phone_number: user.phone_number,
        created_at: user.created_at,
        token
      };

      res.status(200).json(userResponse);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      // This endpoint should be protected by auth middleware
      // The user will be attached to req by the middleware
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      res.status(200).json(user);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { name, default_currency, country, phone_number, preferred_currencies } = req.body;

      if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userRepository = AppDataSource.getRepository(User);
      
      // Update user fields
      if (name) user.name = name;
      if (default_currency) user.default_currency = default_currency;
      if (country) user.country = country;
      if (phone_number) user.phone_number = phone_number;
      if (preferred_currencies) user.preferred_currencies = preferred_currencies;

      await userRepository.save(user);

      res.status(200).json({
        id: user.id,
        email: user.email,
        name: user.name,
        default_currency: user.default_currency,
        preferred_currencies: user.preferred_currencies,
        country: user.country,
        phone_number: user.phone_number,
        updated_at: user.updated_at
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}