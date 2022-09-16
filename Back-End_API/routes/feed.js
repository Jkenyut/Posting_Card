const express = require("express");
const feedController = require("../controllers/feed");
const router = express.Router();
const { body } = require("express-validator/check");
const isAuth = require("../middleware/is-auth");

// /feed/post
router.get("/posts", isAuth, feedController.getPosts);

router.post(
  "/post",
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 6 }),
  ],
  isAuth,
  feedController.createPost
);

router.get("/post/:postId", isAuth, feedController.getPost);
router.put("/post/:postId", isAuth, feedController.updatePost);
router.delete("/post/:postId", isAuth, feedController.deletePost);

module.exports = router;
