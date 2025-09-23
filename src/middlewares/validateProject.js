const { body, validationResult } = require("express-validator");

const projectValidationRules = [
  body("title")
    .notEmpty()
    .withMessage("عنوان نباید خالی باشد")
    .isLength({ min: 3 })
    .withMessage("عنوان باید حداقل ۳ کاراکتر باشد"),

  body("description")
    .notEmpty()
    .withMessage("توضیحات نباید خالی باشد")
    .isLength({ min: 2 })
    .withMessage("توضیحات باید حداقل 2 کاراکتر باشد"),

  body("imageUrl").optional().isURL().withMessage("آدرس عکس معتبر نیست"),
];

const validateProject = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = { projectValidationRules, validateProject };
