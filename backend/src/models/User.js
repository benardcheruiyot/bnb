// User Model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getJwtSecret, getJwtExpiresIn } = require('../utils/jwtSecret');

// In-memory store for demo (replace with MongoDB in production)
const users = new Map();

class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.phone_number = data.phone_number;
    this.password = data.password;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static async create(data) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = new User({
      ...data,
      id: Date.now().toString(),
      password: hashedPassword,
    });
    users.set(user.id, user);
    return user;
  }

  static async findByPhone(phone) {
    for (let user of users.values()) {
      if (user.phone_number === phone) return user;
    }
    return null;
  }

  static async findById(id) {
    return users.get(id) || null;
  }

  async comparePassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  generateToken() {
    return jwt.sign(
      { id: this.id, phone: this.phone_number },
      getJwtSecret(),
      { expiresIn: getJwtExpiresIn() }
    );
  }

  toJSON() {
    const { password, ...user } = this;
    return user;
  }
}

module.exports = User;
