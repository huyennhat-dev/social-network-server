import Post from "./../models/post.js";
import cloudinary from "cloudinary";
import User from "./../models/user.js";

// config cloud for upload img
cloudinary.v2.config({
  cloud_name: "huyennhat",
  api_key: "836136537452954",
  api_secret: "qsXAaQH1f5b5zcLCtXu7-p0NTto",
});

const createPost = async (req, res) => {
  const { content, image } = req.body;
  if (!content.length) {
    return res.status(400).json({ msg: "Content is required!" });
  }
  try {
    const post = await Post.create({
      content,
      postedBy: req.user.userId,
      image,
    });

    const postWithUser = await Post.findById(post._id).populate(
      "postedBy",
      "-password -secret"
    );
    return res.status(200).json({ post: postWithUser });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ msg: err });
  }
};

const allPosts = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const perPage = Number(req.query.perPage) || 10;
    const posts = await Post.find({})
      .populate("postedBy", "-password -secret")
      .limit(perPage)
      .skip((page - 1) * perPage)
      .sort({ createdAt: -1 });
    if (!posts) {
      return res.status(400).json({ msg: "No posts found!" });
    }
    const postsCount = await Post.find({}).estimatedDocumentCount();
    return res.status(200).json({ posts, postsCount });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ msg: error });
  }
};

const uploadImage = async (req, res) => {
  try {
    const path = req.files.image.path;
    //console.log(path);
    const result = await cloudinary.v2.uploader.upload(path, {
      folder: "social-network-app/images",
    });
    return res.status(200).json({
      url: result.url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ msg: error });
  }
};

const uploadFile = async (req, res) => {
  try {
    const path = req.files.fileData.path;
    const fileName = req.files.fileData.name;
    const parts = fileName.split(".");
    const result = await cloudinary.v2.uploader.upload(path, {
      folder: "social-network-app/files",
      resource_type: "raw",
      public_id: Math.floor(Math.random() * (100000 - 1)) + 1 + fileName,
    });
    console.log("rs:" + parts[parts.length - 1]);
    return res.status(200).json({
      url: result.url,
      public_id: result.public_id,
      name: fileName,
    });
  } catch (error) {
    console.log("err:" + error);
    return res.status(400).json({ msg: error });
  }
};

// get one post for edit
const getPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId)
      .populate("postedBy", "-password -secret")
      .populate("comments.postedBy", "-password -secret")
      .populate("comments.reply.postedBy", "-password -secret");
    if (!post) {
      return res.status(400).json({ msg: "No post found!" });
    }
    return res.status(200).json({ post });
  } catch (error) {
    return res.status(400).json({ msg: error });
  }
};

// get all posts with user's follower
const newsFeed = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ msg: "No user found!" });
    }
    let { following } = user;
    following.push(req.user.userId);

    // pagination

    const page = Number(req.query.page) || 1;
    const perPage = Number(req.query.perPage) || 3;

    const posts = await Post.find({ postedBy: { $in: following } })
      .skip((page - 1) * perPage)
      .populate("postedBy", "-password -secret")
      .populate("comments.postedBy", "-password -secret")
      .populate("comments.reply.postedBy", "-password -secret")
      .sort({ createdAt: -1 })
      .limit(perPage);
    return res.status(200).json({ posts });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ msg: error });
  }
};

const editPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { content, image } = req.body;
    const post = await Post.findById(postId)
      .populate("postedBy", "-password -secret")
      .populate("comments.postedBy", "-password -secret")
      .populate("comments.reply.postedBy", "-password -secret");
    if (!post) {
      return res.status(400).json({ msg: "No post found!" });
    }
    post.content = content;
    post.image = image;
    await post.save();
    return res.status(200).json({ post });
  } catch (error) {
    return res.status(400).json({ msg: error });
  }
};

const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findByIdAndDelete(postId);
    if (!post) {
      return res.status(400).json({ msg: "No post found!" });
    }
    if (post.image && post.image.public_id) {
      await cloudinary.v2.uploader.destroy(post.image.public_id);
    }
    return res.status(200).json({ msg: "Deleted post!" });
  } catch (error) {
    return res.status(400).json({ msg: error });
  }
};

/// like
const likePost = async (req, res) => {
  try {
    const postId = req.body.postId;
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $addToSet: { likes: req.user.userId },
      },
      {
        new: true,
      }
    );
    return res.status(200).json({ msg: "something", post });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ msg: error });
  }
};

const unlikePost = async (req, res) => {
  try {
    const postId = req.body.postId;
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { likes: req.user.userId },
      },
      {
        new: true,
      }
    );
    return res.status(200).json({ msg: "something", post });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ msg: error });
  }
};
// comment
const addComment = async (req, res) => {
  try {
    const { postId, comment, image } = req.body;
    let data = { text: comment, postedBy: req.user.userId };
    if (image) {
      data.image = image;
    }
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: {
          comments: data,
        },
      },
      {
        new: true,
      }
    )
      .populate("postedBy", "-password -secret")
      .populate("comments.postedBy", "-password -secret")
      .populate("comments.reply.postedBy", "-password -secret");

    return res.status(200).json({ msg: "something", post });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ msg: error });
  }
};

const removeComment = async (req, res) => {
  try {
    const { postId, commentId } = req.body;
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { comments: { _id: commentId } },
      },
      {
        new: true,
      }
    )
      .populate("postedBy", "-password -secret")
      .populate("comments.postedBy", "-password -secret")
      .populate("comments.reply.postedBy", "-password -secret");

    return res.status(200).json({ msg: "something", post });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ msg: error });
  }
};

const totalPosts = async (req, res) => {
  try {
    const totalPosts = await Post.find({}).estimatedDocumentCount();
    return res.status(200).json({ totalPosts });
  } catch (error) {
    return res.status(400).json({ msg: error });
  }
};

const getPostWithUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const posts = await Post.find({ postedBy: { _id: userId } })
      .populate("postedBy", "-password -secret")
      .populate("comments.postedBy", "-password -secret")
      .populate("comments.reply.postedBy", "-password -secret")
      .sort({
        createdAt: -1,
      });
    return res.status(200).json({ posts });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ msg: error });
  }
};

const getInformationPost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const post = await Post.findById(postId)
      .populate("postedBy", "-password -secret")
      .populate("comments.postedBy", "-password -secret")
      .populate("comments.reply.postedBy", "-password -secret")
      .sort({
        createdAt: -1,
      });
    return res.status(200).json({ post });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ msg: error });
  }
};
const editComment = async (req, res) => {
  try {
    const { postId, text, commentId, image } = req.body;
    let data = { "comments.$.text": text, "comments.$.image": image };
    const post = await Post.updateOne(
      { _id: postId, "comments._id": commentId },
      {
        $set: data,
      }
    );
    return res.status(200).json({ post });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ msg: error });
  }
};
const likeComment = async (req, res) => {
  try {
    const { postId, commentId } = req.body;
    const post = await Post.findById(postId);
    let comment = post.comments.id(commentId);
    if (!comment["like"].includes(req.user.userId)) {
      comment["like"].push(req.user.userId);
    }
    await post.save();
    return res.status(200).json({ comment });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ msg: error });
  }
};
const unlikeComment = async (req, res) => {
  try {
    const { postId, commentId } = req.body;
    const post = await Post.findById(postId);
    let comment = post.comments.id(commentId);
    if (comment["like"].includes(req.user.userId)) {
      comment["like"].splice(comment["like"].indexOf(req.user.userId), 1);
    }
    await post.save();
    return res.status(200).json({ comment });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ msg: error });
  }
};
const addReplyComment = async (req, res) => {
  try {
    const { postId, commentId, image, text } = req.body;
    let data = { text, postedBy: req.user.userId };
    if (image) {
      data.image = image;
    }
    const post = await Post.findById(postId)
      .populate("postedBy", "-password -secret")
      .populate("comments.postedBy", "-password -secret")
      .populate("comments.reply.postedBy", "-password -secret");
    let comment = post.comments.id(commentId);
    comment["reply"].push(data);
    await post.save();

    const newPost = await Post.findById(postId)
      .populate("postedBy", "-password -secret")
      .populate("comments.postedBy", "-password -secret")
      .populate("comments.reply.postedBy", "-password -secret");
    const newComment = newPost.comments.id(commentId);
    return res.status(200).json({ comment: newComment });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ msg: error });
  }
};

const likeReplyComment = async (req, res) => {
  try {
    const { postId, commentId, replyId } = req.body;
    const post = await Post.findById(postId);
    let { reply } = post.comments.id(commentId);
    let currentReply = reply.id(replyId);
    if (!currentReply["like"].includes(req.user.userId)) {
      currentReply["like"].push(req.user.userId);
    }
    await post.save();
    return res.status(200).json({ reply: currentReply });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ msg: error });
  }
};

const unlikeReplyComment = async (req, res) => {
  try {
    const { postId, commentId, replyId } = req.body;
    const post = await Post.findById(postId);
    let { reply } = post.comments.id(commentId);
    let currentReply = reply.id(replyId);
    if (currentReply["like"].includes(req.user.userId)) {
      currentReply["like"].splice(
        currentReply["like"].indexOf(req.user.userId),
        1
      );
    }
    await post.save();
    return res.status(200).json({ reply: currentReply });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ msg: error });
  }
};

const deleteReplyComment = async (req, res) => {
  try {
    const { postId, commentId, replyId } = req.body;
    const post = await Post.findById(postId)
      .populate("postedBy", "-password -secret")
      .populate("comments.postedBy", "-password -secret")
      .populate("comments.reply.postedBy", "-password -secret");
    let { reply } = post.comments.id(commentId);
    let index = -1;
    reply.forEach((v, k) => {
      if (String(v._id) === replyId) {
        index = k;
      }
    });
    reply.splice(index, 1);
    await post.save();
    return res.status(200).json({ reply });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ msg: error });
  }
};

const something = async (req, res) => {
  try {
    const postId = req.body;
    return res.status(200).json({ msg: "something" });
  } catch (error) {
    return res.status(400).json({ msg: error });
  }
};

export {
  createPost,
  allPosts,
  uploadImage,
  uploadFile,
  editPost,
  getPost,
  deletePost,
  newsFeed,
  likePost,
  unlikePost,
  addComment,
  removeComment,
  totalPosts,
  getPostWithUserId,
  getInformationPost,
  editComment,
  likeComment,
  unlikeComment,
  addReplyComment,
  unlikeReplyComment,
  likeReplyComment,
  deleteReplyComment,
};
