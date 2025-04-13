require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

app.use('/api/verifications', require('./routes/verificationCode'));
app.use('/api/users', require('./routes/user'));
app.use("/api/posts", require('./routes/post'));
app.use("/api", require("./routes/upload"));
app.use("/api/follows", require("./routes/follow"));

// MongoDB Atlas bağlantısı
mongoose.connect(process.env.MONGO_URI, {})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("Mini Instagram API Çalişiyor!");
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server ${PORT} portunda çalişiyor`));
