import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { dbRepository } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || "ai_resume_analyzer_super_secret_jwt_key_2026";
const TOKEN_EXPIRY = "7d";

export async function hashPassword(plainText) {
  return bcrypt.hash(plainText, 10);
}

export async function comparePassword(plainText, hash) {
  return bcrypt.compare(plainText, hash);
}

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function registerUser({ email, password, name, role }) {
  if (!email || !email.includes("@")) {
    throw new Error("A valid email address is required.");
  }
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = dbRepository.findUserByEmail(normalizedEmail);
  if (existing) {
    throw new Error("An account with this email address already exists.");
  }

  const passwordHash = await hashPassword(password);
  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const createdUser = dbRepository.createUser({
    id: userId,
    email: normalizedEmail,
    passwordHash,
    name: name?.trim() || null,
    role,
  });

  const token = generateToken({
    id: createdUser.id,
    email: createdUser.email,
    name: createdUser.name,
    role: createdUser.role,
  });

  return {
    user: createdUser,
    token,
  };
}

export async function loginUser({ email, password }) {
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const userRecord = dbRepository.findUserByEmail(normalizedEmail);
  if (!userRecord) {
    throw new Error("Invalid email or password.");
  }

  const isMatch = await comparePassword(password, userRecord.password_hash);
  if (!isMatch) {
    throw new Error("Invalid email or password.");
  }

  const safeUser = {
    id: userRecord.id,
    email: userRecord.email,
    name: userRecord.name,
    role: userRecord.role || "job_seeker",
    created_at: userRecord.created_at,
  };

  const token = generateToken({
    id: safeUser.id,
    email: safeUser.email,
    name: safeUser.name,
    role: safeUser.role,
  });

  return {
    user: safeUser,
    token,
  };
}

export function getCurrentUser(userId) {
  return dbRepository.findUserById(userId);
}

export function updateUserRole(userId, newRole) {
  const updated = dbRepository.updateUserRole(userId, newRole);
  const token = generateToken({
    id: updated.id,
    email: updated.email,
    name: updated.name,
    role: updated.role,
  });
  return { user: updated, token };
}
