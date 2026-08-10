const authService = require('../services/authService');
const { sendSuccess } = require('../utils/responseHandler');
const { HTTP_STATUS } = require('../constants/httpCodes');
const env = require('../config/env');

const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProd = env.NODE_ENV === 'production';
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  });
  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    setTokenCookies(res, result.accessToken, result.refreshToken);
    return sendSuccess(res, result, HTTP_STATUS.OK);
  } catch (error) {
    return next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
    const result = await authService.refreshSession(refreshToken);
    setTokenCookies(res, result.accessToken, result.refreshToken);
    return sendSuccess(res, result, HTTP_STATUS.OK);
  } catch (error) {
    return next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
    await authService.logoutUser(refreshToken);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return sendSuccess(res, { message: 'Déconnexion effectuée avec succès.' });
  } catch (error) {
    return next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, { user: req.user });
  } catch (error) {
    return next(error);
  }
};

const registerAdmin = async (req, res, next) => {
  try {
    const result = await authService.registerAdmin(req.body);
    setTokenCookies(res, result.accessToken, result.refreshToken);
    return sendSuccess(res, result, HTTP_STATUS.CREATED);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  login,
  registerAdmin,
  refresh,
  logout,
  getMe,
};
