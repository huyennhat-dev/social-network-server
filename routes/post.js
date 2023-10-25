import express from "express";

import {
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
} from "../controllers/post.js";
import formidable from "express-formidable";
import canUpdateOrDelete from "../middleware/canUpdateOrDelete.js";
import isAdmin from "../middleware/isAdmin.js";

const router = express.Router();

router.route("/").get(async (req, res) => {
  res.json({ msg: "Post" });
});

router.route("/create-post").post(createPost);
router.route("/all-posts").get(isAdmin, allPosts);
router.route("/news-feed/").get(newsFeed);

// upload-image
router.route("/upload-image").post(formidable(), uploadImage);
router.route("/upload-file").post(formidable(), uploadFile);

// like
router.route("/like-post").put(likePost);
router.route("/unlike-post").put(unlikePost);

// comment
router.route("/add-comment").put(addComment);
router.route("/remove-comment").put(removeComment);
router.route("/like-comment").put(likeComment);
router.route("/unlike-comment").put(unlikeComment);
router.route("/edit-comment").patch(editComment);
router.route("/add-reply-comment").put(addReplyComment);
router.route("/like-reply-comment").put(likeReplyComment);
router.route("/unlike-reply-comment").put(unlikeReplyComment);
router.route("/delete-reply-comment").put(deleteReplyComment);

router.route("/total-posts").get(totalPosts);

//admin
router.route("/admin/delete-post/:id").delete(isAdmin, deletePost);

// get post with userID
router.route("/getPostWithUser/:userId").get(getPostWithUserId);
router.route("/information/:postId").get(getInformationPost);

router
  .route("/:id")
  .get(getPost)
  .patch(canUpdateOrDelete, editPost)
  .delete(canUpdateOrDelete, deletePost);

export default router;
