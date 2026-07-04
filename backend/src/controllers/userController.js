// User Controller
const User = require('../models/User');
const MpesaTransaction = require('../models/MpesaTransaction');
const { AppError } = require('../middleware/errorHandler');

class UserController {
  async registerOrLogin(req, res, next) {
    try {
      const { name, phone_number } = req.body;

      console.log('[AUTH] Registration attempt:', { name, phone_number });

      if (!phone_number) {
        console.warn('[AUTH] Missing phone number');
        return next(new AppError('Phone number is required', 400));
      }

      // Check if user exists
      let user = await User.findByPhone(phone_number);

      if (!user) {
        // Create new user
        console.log('[AUTH] Creating new user:', phone_number);
        user = await User.create({
          name: name || 'User',
          phone_number,
          email: `user_${phone_number}@app.local`,
          password: Math.random().toString(36).slice(-8),
        });
      } else {
        console.log('[AUTH] User already exists:', phone_number);
      }

      const token = user.generateToken();

      // Fetch user's last transaction for resume functionality
      const lastTransaction = await MpesaTransaction.findLastByUserId(user.id);

      console.log('[AUTH] Login successful:', phone_number);

      res.status(201).json({
        success: true,
        data: {
          user: user.toJSON(),
          token,
          lastTransaction: lastTransaction ? {
            checkoutRequestId: lastTransaction.checkoutRequestId,
            amount: lastTransaction.amount,
            loanAmount: lastTransaction.loanAmount,
            termDays: lastTransaction.termDays,
            phone: lastTransaction.phone,
            status: lastTransaction.status,
            createdAt: lastTransaction.createdAt,
          } : null,
        },
      });
    } catch (error) {
      console.error('[AUTH] Error:', error.message);
      next(new AppError(error.message, 500));
    }
  }

  async getProfile(req, res, next) {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return next(new AppError('User not found', 404));
      }

      res.status(200).json({
        success: true,
        data: user.toJSON(),
      });
    } catch (error) {
      next(new AppError(error.message, 500));
    }
  }

  async updateProfile(req, res, next) {
    try {
      const { name, email } = req.body;
      const user = await User.findById(req.user.id);

      if (!user) {
        return next(new AppError('User not found', 404));
      }

      if (name) user.name = name;
      if (email) user.email = email;
      user.updatedAt = new Date();

      res.status(200).json({
        success: true,
        data: user.toJSON(),
      });
    } catch (error) {
      next(new AppError(error.message, 500));
    }
  }
}

module.exports = new UserController();
