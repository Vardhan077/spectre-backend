import express from 'express';
import cors from 'cors';
import mysql from 'mysql';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';

const salt = 10;
const app = express();
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
  'http://localhost:3000',
  'https://newshoppingapp.netlify.app',
  'https://spectre-backend.onrender.com'
];

// Configure CORS middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// Middleware for setting headers
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

let db;

function handleDisconnect() {
  db = mysql.createConnection({
    host: 'bnkedv2hsautkzdf8dll-mysql.services.clever-cloud.com',
    user: 'ukjj9c1guwwx5mup',
    password: 'ggJ2apbka4fbokvw0x84',
    database: 'bnkedv2hsautkzdf8dll',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  db.connect(function(err) {
    if (err) {
      console.log('Error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect.
    }
  });

  db.on('error', function(err) {
    console.log('db error', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect(); // Reconnect on connection loss.
    } else {
      throw err;
    }
  });
}

handleDisconnect();

const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ Error: 'you are not authenticated' });
  } else {
    jwt.verify(token, 'kiri-kiri', (err, decoded) => {
      if (err) {
        return res.json({ Error: 'Token is not okay' });
      } else {
        req.email = decoded.email;
        req.name = decoded.name;
        next();
      }
    });
  }
};

app.get('/', verifyUser, (req, res) => {
  return res.json({ Status: 'Success', email: req.email, name: req.name });
});

app.get('/retrieve', async (req, res) => {
  const email = await req.query.email;
  if (email !== "undefined") {
    const sql = "SELECT id, item FROM products WHERE email=?";
    db.query(sql, email, (err, data) => {
      if (err) return res.json({ Error: "emo ra babu" });
      if (data.length > 0) {
        var sol = JSON.stringify(data);
        return res.json(sol);
      }
    });
  }
});

app.post('/add', async (req, res) => {
  const { item, email } = req.body;
  const jsonString = JSON.stringify(item);
  const sql = "INSERT INTO products (`email`, `item`) VALUES (?)";
  const value = [email, jsonString];
  await db.query(sql, [value], (err, result) => {
    if (err) {
      console.log(err, 'is from add');
      return res.json({ Error: "Inserting data error" });
    }
    return res.json({ Status: "Success" });
  });
});

app.post('/removeitem', async (req, res) => {
  const id = await req.body[0];
  if (id != null) {
    const sql = "DELETE FROM products WHERE id=?";
    db.query(sql, id, (err, data) => {
      if (err) return res.json({ Error: "emo ra babu" });
      return res.json({ Status: "Success" });
    });
  }
});

app.post('/register', (req, res) => {
  const sql = "INSERT INTO users (`name`, `email`, `password`) VALUES (?)";
  bcrypt.hash(req.body.password.toString(), salt, (err, hash) => {
    if (err) return res.json({ Error: "Error hashing" });
    const values = [req.body.name, req.body.email, hash];
    db.query(sql, [values], (err, result) => {
      if (err) return res.json({ Error: "Inserting data error" });
      return res.json({ Status: "Success" });
    });
  });
});

app.post("/login", (req, res) => {
  const sql = 'SELECT * FROM users WHERE email=?';
  db.query(sql, [req.body.email], (err, data) => {
    if (err) return res.json({ Error: "Login error in server" });
    if (data.length > 0) {
      bcrypt.compare(req.body.password.toString(), data[0].password, (err, response) => {
        if (err) return res.json({ Error: "Password compare error" });
        if (response) {
          const name = data[0].name;
          const email = data[0].email;
          const token = jwt.sign({ name, email }, "kiri-kiri", { expiresIn: '1d' });
          res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none' });
          return res.json({ Status: "Success" });
        } else {
          return res.json({ Error: "Password not matched" });
        }
      });
    } else {
      return res.json({ Error: "No mail existed" });
    }
  });
});

app.get('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'none' });
  return res.json({ Status: "Success" });
});

app.listen(8081, () => console.log("server running on port 8081"));
