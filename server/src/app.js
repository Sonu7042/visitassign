const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const mongoose = require("mongoose");

const logger = require("./utils/logger");
const swaggerSpec = require("./config/swagger");
const { corsOptions } = require("./config/cors");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");
const { isCloudinaryConfigured } = require("./config/cloudinary");
const { isEmailConfigured } = require("./services/email.service");

const app = express();

app.set("trust proxy", 1);

app.use(helmet());

app.use(cors(corsOptions));

app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("combined", { stream: logger.stream }));

app.get("/", (req, res) => {
  res.send("Welcome to the Visitor Pass System API");
});

app.get("/health", (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  const services = {
    database: databaseReady,
    cloudinary: isCloudinaryConfigured(),
    email: isEmailConfigured(),
  };
  const ready = Object.values(services).every(Boolean);

  res.status(ready ? 200 : 503).set("Cache-Control", "no-store").json({
    status: ready ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    services,
  });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
