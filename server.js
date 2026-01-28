const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const colors = require("colors");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bodyParser = require("body-parser");
const cors = require("cors");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Load environment variables
dotenv.config({ path: "./config/config.env" });

// Connect to the database
connectDB();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, 
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, 
  message: "Too many login attempts, please try again after 15 minutes.",
  skipSuccessfulRequests: true,
});

app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());

// Custom sanitization middleware
app.use((req, res, next) => {
  const skipFields = ["email", "password", "role", "mediaUrl", "profilePicture"];

  const sanitize = (obj) => {
    if (obj && typeof obj === "object") {
      for (const key in obj) {
        if (skipFields.includes(key)) continue;

        if (typeof obj[key] === "string") {
          obj[key] = obj[key].replace(/\$/g, "");
          if (!obj[key].includes("@") && !obj[key].startsWith("http")) {
            obj[key] = obj[key].replace(/</g, "&lt;").replace(/>/g, "&gt;");
          }
        } else if (typeof obj[key] === "object") {
          sanitize(obj[key]);
        }
      }
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.params) req.params = sanitize(req.params);

  next();
});

app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",")
      : [];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(limiter);
app.use(express.static(path.join(__dirname, "public")));

// Users
const userRoutes = require("./routes/user_route");
app.use("/api/v1/users/login", authLimiter);
app.use("/api/v1/users", userRoutes);

// Room Rental App
const addRoomRoutes = require("./routes/add_room_route");
app.use("/api/v1/rooms", addRoomRoutes);

// Room Types
const roomTypeRoutes = require("./routes/room_type_route");
app.use("/api/v1/roomTypes", roomTypeRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
      .green.bold.underline
  );
});
