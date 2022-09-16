const User = require("../models/user");
const bcyrpt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const Post = require("../models/post");
const { clearImageUrl } = require("../util/file");

module.exports = {
  createUser: async ({ userInput }, req) => {
    const errors = [];
    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: "E-mail is invalid." });
    }
    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    ) {
      errors.push({ message: "Password too short min 5" });
    }
    if (errors.length > 0) {
      const error = new Error("invalid Input");
      error.data = errors;
      error.code = 422;
      throw error;
    }
    const existingUser = await User.findOne({ email: userInput.email });
    if (existingUser) {
      const error = new Error("User exists already");
      throw error;
    }
    const hashedPw = await bcyrpt.hash(userInput.password, 12);
    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPw,
    });
    const createdUser = await user.save();
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },

  login: async ({ email, password }) => {
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("User not found");
      error.code = 401;
      throw error;
    }
    const isEqual = await bcyrpt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error("password incorrect");
      error.code = 401;
      throw error;
    }
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      "secret key",
      { expiresIn: "1h" }
    );
    return { token: token, userId: user._id.toString() };
  },
  createPost: async ({ postInput }, req) => {
    if (!req.isAuth) {
      const error = new Error("Not authentication");
      error.code = 422;
      throw error;
    }
    const errors = [];
    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, { min: 5 })
    ) {
      errors.push({ message: "content is valid" });
    }
    if (errors.length > 0) {
      const error = new Error("invalid Input");
      error.data = errors;
      error.code = 422;
      throw error;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("invalid User");
      error.data = errors;
      error.code = 401;
      throw error;
    }
    const post = new Post({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
      creator: user,
    });
    const createPost = await post.save();
    user.posts.push(createPost);
    await user.save();
    //add post to 'users' post
    return {
      ...createPost._doc,
      _id: createPost._id.toString(),
      createdAt: createPost.createdAt.toISOString(),
      updatedAt: createPost.updatedAt.toISOString(),
    };
  },
  posts: async ({ page }, req) => {
    if (!req.isAuth) {
      const error = new Error("Not authentication");
      error.code = 422;
      throw error;
    }
    if (!page) {
      page = 1;
    }
    const perPage = 2;

    const totalPosts = await Post.find().countDocuments();
    const post = await Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate("creator");

    return {
      posts: post.map((p) => {
        return {
          ...p._doc,
          _id: p._id.toString(),
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        };
      }),
      totalPosts: totalPosts,
    };
  },
  post: async ({ id }, req) => {
    if (!req.isAuth) {
      const error = new Error("Not authentication");
      error.code = 422;
      throw error;
    }
    const post = await Post.findById(id).populate("creator");
    if (!post) {
      const error = new Error("No post found");
      error.code = 422;
      throw error;
    }
    console.log(post);
    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  },
  updatePost: async ({ id, postInput }, req) => {
    if (!req.isAuth) {
      const error = new Error("Not authentication");
      error.code = 401;
      throw error;
    }
    const post = await Post.findById(id).populate("creator");
    if (!post) {
      const error = new Error("No post found");
      error.code = 422;
      throw error;
    }
    if (post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error("Not authorized");
      error.code = 403;
      throw error;
    }
    const errors = [];
    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, { min: 5 })
    ) {
      errors.push({ message: "content is valid" });
    }
    if (errors.length > 0) {
      const error = new Error("invalid Input");
      error.data = errors;
      error.code = 422;
      throw error;
    }
    post.title = postInput.title;
    post.content = postInput.content;
    if (postInput.imageUrl !== "undefined") {
      post.imageUrl = postInput.imageUrl;
    }
    const updatePost = await post.save();
    return {
      ...updatePost._doc,
      _id: updatePost._id.toString(),
      createdAt: updatePost.createdAt.toISOString(),
      updatedAt: updatePost.updatedAt.toISOString(),
    };
  },
  deletePost: async ({ id }, req) => {
    if (!req.isAuth) {
      const error = new Error("Not authentication");
      error.code = 401;
      throw error;
    }
    const post = await Post.findById(id);
    if (!post) {
      const error = new Error("No post found");
      error.code = 422;
      throw error;
    }
    if (post.creator.toString() !== req.userId.toString()) {
      const error = new Error("Not authorized");
      error.code = 403;
      throw error;
    }
    clearImageUrl(post.imageUrl);
    await Post.findOneAndDelete(id);
    const user = await User.findById(req.userId);
    user.posts.pop(id);
    await user.save();
    return true;
  },
  user: async (args, req) => {
    if (!req.isAuth) {
      const error = new Error("Not authentication");
      error.code = 401;
      throw error;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("invalid User");
      error.data = errors;
      error.code = 401;
      throw error;
    }
    return { ...user._doc, id: user._id.toString() };
  },
  updateStatus: async ({ status }, req) => {
    if (!req.isAuth) {
      const error = new Error("Not authentication");
      error.code = 401;
      throw error;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("invalid User");
      error.data = errors;
      error.code = 401;
      throw error;
    }
    user.status = status;
    await user.save();
    return { ...user._doc };
  },
};
