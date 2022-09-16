const express = require("express");
const User = require("../models/user");
const router = express.Router();
const { body } = require("express-validator/check");
const AuthControllers = require("../controllers/auth");

router.put(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("Email address alewady exists");
          }
        });
      })
      .normalizeEmail(),
    body("password").trim().isLength({ min: 5 }),
    body("name").not().isEmpty(),
  ],
  AuthControllers.signup
);

router.post("/login", AuthControllers.login);
module.exports = router;
