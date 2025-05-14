const jwt = require('jsonwebtoken');

const verifyToken = (roles = []) => (req, res, next) => {
    try {

        const token = req.headers['x-auth-token'];
        if (!token) {
            return res.status(403).send({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        req.userRole = decoded.role;

        if (roles.length && !roles.includes(decoded.role)) {
            return res.status(403).send({ error: 'Forbidden: Access denied' });
        }

        next();

    } catch (error) {
        return res.status(401).send({ error: 'Unauthorized' });
    }
};

module.exports = { verifyToken };
