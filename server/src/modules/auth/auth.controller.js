const jwt = require('jsonwebtoken');
const User = require('../users/user.model');
const { UnauthorizedError } = require('../../shared/errors/customErrors');

const signToken = (id) => {
  const secret = process.env.JWT_SECRET || 'test-secret';
  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Set cookie options
  const cookieOptions = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 1 day
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  res.cookie('token', token, cookieOptions);

  // Hide password from return JSON
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    data: {
      user,
      token,
    },
  });
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Retrieve user and select password which is hidden by default
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password, user.password))) {
      return next(new UnauthorizedError('Incorrect email or password'));
    }

    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  res.cookie('token', 'loggedout', {
    expires: new Date(Date.now() + 5000),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

const getMe = async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
};

const register = async (req, res, next) => {
  try {
    const { name, email, role, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'A user with this email address already exists',
        },
      });
    }

    const user = await User.create({
      name,
      email,
      role,
      password,
    });

    createSendToken(user, 201, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout,
  getMe,
  register,
};
