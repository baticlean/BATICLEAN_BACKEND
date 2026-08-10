const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const AppError = require('../utils/appError');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/httpCodes');

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
};

const generateRefreshToken = async (userId) => {
  const token = jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({
    userId,
    token,
    expiresAt,
  });

  return token;
};

const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw new AppError(
      'Identifiants de connexion incorrects.',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.AUTHENTICATION_ERROR
    );
  }

  if (!user.isActive) {
    throw new AppError(
      'Ce compte utilisateur a été désactivé par l\'administration.',
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.AUTHORIZATION_ERROR
    );
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError(
      'Identifiants de connexion incorrects.',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.AUTHENTICATION_ERROR
    );
  }

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user._id);

  const userObject = user.toObject();
  delete userObject.passwordHash;

  return {
    user: userObject,
    accessToken,
    refreshToken,
  };
};

const refreshSession = async (incomingRefreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new AppError(
      'Jeton de rafraîchissement invalide ou expiré.',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.INVALID_TOKEN
    );
  }

  const storedToken = await RefreshToken.findOne({
    token: incomingRefreshToken,
    userId: decoded.id,
    isRevoked: false,
  });

  if (!storedToken) {
    throw new AppError(
      'Jeton de rafraîchissement introuvable ou révoqué.',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.INVALID_TOKEN
    );
  }

  storedToken.isRevoked = true;
  await storedToken.save();

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    throw new AppError(
      'Compte utilisateur inexistant ou inactif.',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.AUTHENTICATION_ERROR
    );
  }

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = await generateRefreshToken(user._id);

  storedToken.replacedByToken = newRefreshToken;
  await storedToken.save();

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

const logoutUser = async (refreshToken) => {
  if (refreshToken) {
    await RefreshToken.updateOne({ token: refreshToken }, { isRevoked: true });
  }
};

const registerAdmin = async ({ firstName, lastName, email, password, adminRegistrationKey }) => {
  if (adminRegistrationKey !== env.ADMIN_REGISTRATION_KEY) {
    throw new AppError(
      'La clé secrète d\'inscription administrateur est incorrecte.',
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.AUTHORIZATION_ERROR
    );
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError(
      'Un compte administrateur avec cette adresse email existe déjà.',
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.DUPLICATE_RESOURCE
    );
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    firstName,
    lastName,
    email,
    passwordHash,
    role: 'ADMIN',
    isActive: true,
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user._id);

  const userObject = user.toObject();
  delete userObject.passwordHash;

  return {
    user: userObject,
    accessToken,
    refreshToken,
  };
};

module.exports = {
  loginUser,
  registerAdmin,
  refreshSession,
  logoutUser,
};
