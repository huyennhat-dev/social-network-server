import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import morgan from "morgan";
import dotenv from "dotenv";
dotenv.config();

// Middle
import errorHandlerMiddleware from "./middleware/error-handler.js";
import notFound from "./middleware/not-found.js";

import auth from "./routes/auth.js";
import post from "./routes/post.js";
import message from "./routes/message.js";
import weather from "./routes/weather.js";
import requireSignIn from "./middleware/authentication.js";
import * as http from "http";
import {Server} from "socket.io";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "PATCH"],
        allowedHeaders: ["Content-type"],
    },
});

if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
}

app.use(express.json({limit: "5mb"}));

app.use(express.urlencoded({extended: true}));

app.use(cors());

app.use("/api/auth", auth);

app.use("/api/post", requireSignIn, post);

app.use("/api/message", requireSignIn, message);

app.use("/api/weather", requireSignIn, weather);

app.use("/", (req, res) => {
    res.send("Welcome to my api!");
});

io.on("connect", (socket) => {
    socket.on("new-message", (newMessage) => {
        socket.broadcast.emit("new-message", newMessage);
    });
});

const port = process.env.PORT || 8000;

app.use(notFound);

app.use(errorHandlerMiddleware);

mongoose.set("strictQuery", true);

const start = async () => {
    try {
        await mongoose
            .connect(process.env.MONGDB || "")
            .then(() => console.log("MongoDb connected"));

        server.listen(port, () => {
            console.log("Server is running on port", port);
        });
    } catch (error) {
        console.log(error);
    }
};

start();
