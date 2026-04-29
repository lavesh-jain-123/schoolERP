require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

app.use(cors());
app.options('*', cors());
app.use(express.json());

connectDB();

app.get('/', (req, res) => res.json({ ok: true, service: 'School ERP API' }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/fees', require('./routes/feeRoutes'));
app.use('/api/families', require('./routes/familyRoutes'));
app.use(require('./middleware/errorHandler'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/parents', require('./routes/parentRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));