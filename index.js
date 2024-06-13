import express, { json, response } from "express";
const cors = require('cors');
import mysql from 'mysql';
import jwt, { decode} from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
const salt = 10;

const app =  express();
app.use(express.json());


const allowedOrigins = ['http://localhost:3000', 'https://newshoppingapp.netlify.app','https://newshoppingapp.netlify.app'];

// // Configure CORS middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

app.use((rs,next)=>{
    res.setHeader('Access-Control-Allow-Origin', 'https://newshoppingapp.netlify.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
    });

app.use('/', require('./login'))
// app.use(cors({
//     origin:['https://spectre-backend.onrender.com/login'],
//     methods:["POST","GET"],
//     credentials:true
// }));
// app.use(cors({
//     origin:['http://localhost:3000'],
//     methods:["POST","GET"],
//     credentials:true
// }));
// app.use(cors({
//     origin:['https://fakestoreapi.com/products/'],
//     methods:["POST","GET"],
//     credentials:false
// }));
app.use(cookieParser());

 
const db = mysql.createConnection({
    host:'bnkedv2hsautkzdf8dll-mysql.services.clever-cloud.com', 
    user:'ukjj9c1guwwx5mup',
    password: 'ggJ2apbka4fbokvw0x84',
    database:'bnkedv2hsautkzdf8dll',host: 'localhost',
    waitForConnections: true,
    connectionLimit: 10, 
    queueLimit: 0
})


const verifyUser = (req,res,next)=>{
    const token = req.cookies.token;
    if(!token){
        return res.json({Error: "your are not authenticated"})
    }else{
        jwt.verify(token,"kiri-kiri",(err,decoded)=>{
            if(err){
                return res.json({Error: "Token is not okay"});
            }else{
                req.email = decoded.email;
                req.name = decoded.name;
                next();
            }
        })
    }
}
app.get('/',verifyUser,(req,res,next)=>{
    return res.json({Status: "Success", email:req.email,name:req.name});
    
})

app.get('/retrieve',async(req,res)=>{
    const email = await (req.query.email);
    if (email != "undefined"){
        const sql = "SELECT id,item FROM products WHERE email=?";
        db.query(sql,email,(err,data)=>{
        if(err) return res.json({Error:"emo ra babu"});
        if(data.length>0){
            var sol = JSON.stringify(data)
            return res.json(sol)
        }
    })
    }
    
})

app.post('/add',async (req,res)=>{
    const data = await req.body
    const {item,email}=data
    const jsonString = JSON.stringify(item)
    const sql = "INSERT INTO products (`email`,`item`) VALUES (?)";
    const value=[
        email,
        jsonString
    ]
    await db.query(sql,[value],(err,result)=>{
        if(err) {
            console.log(err, 'is from adddddddddddd')
        }
        return res.json({Status:"Success"})
    })
})

app.post('/removeitem',async(req,res)=>{
    const id = await req.body[0];
    if (id != null){
        const sql = "DELETE FROM products WHERE id=?";
        db.query(sql,id,(err,data)=>{
            if(err) return res.json({Error:"emo ra babu"});
            return res.json({Status:"Success"})
    })
}
})


app.post('/register',(req,res)=>{
    const sql = "INSERT INTO users (`name`,`email`,`password`) VALUES (?)";
    bcrypt.hash(req.body.password.toString(),salt,(err,hash)=>{
        if(err) return res.json({Error: "Error hashing"});
        const values=[
            req.body.name,
            req.body.email,
            hash
        ]
        db.query(sql,[values],(err,result)=>{
            if(err) return res.json({Error:"Inserting data error"})
            return res.json({Status:"Success"})
        })

    })
    
})

app.post("/login",(req,res)=>{
    const sql = 'SELECT * FROM users WHERE email=?';
    db.query(sql,[req.body.email],(err,data)=>{
        if(err) return res.json({Error:"Login error in server"});
        if(data.length>0){
            bcrypt.compare(req.body.password.toString(),data[0].password,(err,response)=>{
                if(err) return res.json({Error: "Password compare error"});
                if(response){
                    const name = data[0].name;
                    const email = data[0].email;
                    const token =  jwt.sign({name,email},"kiri-kiri",{expiresIn:'1d'});
                    res.cookie('token',token);
                    return res.json({Status:"Success"});
                }
                else{
                    return res.json({Error:"Password not matched"});
                }
            })
        }else{
            return res.json({Error:"No mail existed"});
        }
    })
})

app.get('/logout',(req,res)=>{
    res.clearCookie('token');
    return res.json({Status : "Success"})
})

app.listen(8081,()=>console.log("server running"))
