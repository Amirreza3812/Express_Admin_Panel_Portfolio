const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "دسترسی غیرمجاز" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded; // اطلاعات ادمین لاگین‌شده
    next();
  } catch (error) {
    return res.status(403).json({ message: "توکن نامعتبر است" });
  }
};

module.exports = authenticate;
