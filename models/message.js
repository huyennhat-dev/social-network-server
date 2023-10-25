import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    members: [
      {
        type: mongoose.Types.ObjectId,
        ref: "User",
      },
    ],
    content: [
      {
        text: String,
        image: {
          url: String,
          public_id: String,
          default: {
            url: "",
            public_id: "",
          },
        },
        file: {
          url: String,
          public_id: String,
          name: String,
          default: {
            url: "",
            public_id: "",
            name: "",
          },
        },
        created: {
          type: Date,
          default: Date.now,
        },
        like: [
          {
            type: mongoose.Types.ObjectId,
            ref: "User",
          },
        ],
        sentBy: {
          type: mongoose.Types.ObjectId,
          ref: "User",
        },
        reply: {
          type: mongoose.Types.ObjectId,
          ref: "Message",
        },
        seen: [
          {
            type: mongoose.Types.ObjectId,
            ref: "User",
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
