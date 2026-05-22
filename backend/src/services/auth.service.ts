import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { RegisterInput, LoginInput, JwtPayload } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

function generateTokens(payload: JwtPayload) {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);
  return { accessToken, refreshToken };
}

// ─── REGISTRO ────────────────────────────────────
export async function register(input: RegisterInput) {
  // Verificar si el email ya existe
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError(409, 'Ya existe una cuenta con este email');
  }

  // Hash de la contraseña
  const passwordHash = await bcrypt.hash(input.password, 12);

  // Crear usuario
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
      phone: input.phone,
      role: input.role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  // Generar tokens
  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return { user, ...tokens };
}

// ─── LOGIN ───────────────────────────────────────
export async function login(input: LoginInput) {
  // Buscar usuario
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { vendor: true },
  });

  if (!user) {
    throw new AppError(401, 'Email o contraseña incorrectos');
  }

  if (!user.isActive) {
    throw new AppError(403, 'Tu cuenta está desactivada');
  }

  // Verificar contraseña
  const validPassword = await bcrypt.compare(input.password, user.passwordHash);
  if (!validPassword) {
    throw new AppError(401, 'Email o contraseña incorrectos');
  }

  // Generar tokens
  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Retornar sin passwordHash
  const { passwordHash: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, ...tokens };
}

// ─── REFRESH TOKEN ───────────────────────────────
export async function refreshToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Verificar que el usuario siga existiendo y activo
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AppError(401, 'Usuario no encontrado o inactivo');
    }

    return generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
  } catch {
    throw new AppError(401, 'Refresh token inválido');
  }
}

// ─── GET PROFILE ─────────────────────────────────
export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
      vendor: true,
    },
  });

  if (!user) {
    throw new AppError(404, 'Usuario no encontrado');
  }

  return user;
}
