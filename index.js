const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: `./.env.${process.env.NODE_ENV}` });
require("./src/utilities/queue");
const authRoutes = require("./src/routes/auth.routes");
const depositRoutes = require("./src/routes/deposit.routes");
const withdrawalRoutes = require("./src/routes/withdrawal.routes");
const purchaseRoutes = require("./src/routes/purchase.routes");

const app = express();
app.set("views", path.join(__dirname, "src/templates"));
app.set("view engine", "ejs");

app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/deposit", depositRoutes);
app.use("/api/withdraw", withdrawalRoutes);
app.use("/api/purchase", purchaseRoutes);
app.use("/src", express.static(path.join(__dirname, "src")));

app.get("/", (req, res) => {
  res.send("Hello World");
});

const port = process.env.PORT;

app.use((req, res, next) => {
  return res.status(404).send({ error: "Not found" });
});

app.listen(port, () => {
  console.log(`App listening on port ${port}!`, process.env.DB_HOST);
});
