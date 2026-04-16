const express = require("express");
const mongoose = require("mongoose");
const env = require("dotenv");
const cors = require("cors");
const erp = require("./routes/erp.routes");
const business = require("./routes/business.routes");
const auth = require("./routes/auth.routes");
const items = require("./routes/item.routes");
const customer = require("./routes/customer.routes");
const bills = require("./routes/bill.routes");
const payment = require("./routes/payment.routes");
const workOrders = require("./routes/workorder.routes");
const path = require("path");

// environment variables
env.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Database connected"))
  .catch((err) => console.log(err));

// CORS Configuration
app.use(cors());

// Serve Static Files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API
app.use("/api", erp);
app.use("/api/business", business);
app.use("/api/auth", auth);
app.use("/api/items", items);
app.use("/api/customers", customer);
app.use("/api/bills", bills);
app.use("/api/payments", payment);
app.use("/api/workorders", workOrders);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Tranzoop service running on port ${PORT}`);
});
