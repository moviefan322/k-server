const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { userService } = require('../services');

module.exports = async function optionalAuth(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    if (!h.startsWith('Bearer ')) return next();
    const token = h.split(' ')[1];
    const payload = jwt.verify(token, config.jwt.secret);
    const user = await userService.getUserById(payload.sub);
    if (user) req.user = user;
    return next();
  } catch (err) {
    // Bad/expired/missing token → treat as anonymous
    return next();
  }
};
