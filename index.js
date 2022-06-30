const express = require('express');
require('dotenv').config()
const bodyParser = require('body-parser');
const cors=require('cors')
const app = express();
const port = 8000;
const con= require('./dbConnection')
const jwt = require('jsonwebtoken')
const http = require("http");
//middleware
app.use(cors({
    origin: '*'
}));
function authenticateToken(req, res , next){
    const authHeader=req.headers['authorization'];
    const token=authHeader && authHeader.split(' ')[1]
    if(token==null)return res.sendStatus(401);
    jwt.verify(token, process.env.SECRET_KEY,(err,user)=>{
        if(err) return res.sendStatus(403);
        req.user=user;
        next();
    })
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))
//routes
app.get('/activeShopOwner',authenticateToken,(req,res)=>{
    con.query(`SELECT * FROM shop_owner where shop_owner.email = "${req.user.email}"`, function (err, result) {
        if (err) throw err;
        else{
            res.json({activeUsers:result})
        }
    });
})
app.post('/signin', (req, res) => {
    con.query(`SELECT * FROM shop_owner where shop_owner.email = "${req.body.email}"`, function (err, result) {
        if (err) throw err;
        else{
            if(req.body.password===result[0].password_hash){
                const user={
                    phone_number:result[0].phone_number,
                    user_name:result[0].user_name,
                    email:result[0].email,
                }
                const accessToken=jwt.sign(user,process.env.SECRET_KEY);
                res.json({accessToken:accessToken,user:user})
            }
            else if(req.password !== result[0].password_hash){
                res.status(401);
                res.send('Access Denied');
            }
        }
    });
});
app.post('/signup', (req, res) => {
    const user={
        phone_number:req.body.phone_number,
        user_name:req.body.user_name,
        email:req.body.email,
        password_hash:req.body.password_hash
    }
    con.query(`Insert into shop_owner Set ? `,user ,function (err, result) {
        if (err) throw err;
        else{
            res.send('User Created');
        }
    });
});
app.post('/save-debt-for-customer', authenticateToken,(req, res) => {
    const data={
        customer_phone_number:req.body.customer_phone_number,
        shop_owner_number:req.body.shop_owner_number,
        description:req.body.description,
        amount:req.body.amount
    }
    con.query(`Insert into customer_wise_debt set ?`,data ,function (err, result) {
        if (err) throw err;
        else{
            res.send('User Created');
        }
    });
});
app.post('/add-shop-for-owner', authenticateToken,(req, res) => {
    const data={
        lattitude : req.body.lattitude,
        longitude : req.body.longitude,
        shop_owner_number:req.user.phone_number,
        shop_number:req.body.shop_number,
        description:req.body.description,
        name:req.body.name
    }
    con.query(`Insert into shop set ?`,data ,function (err, result) {
        if (err) throw err;
        else{
            res.send('Shop Created for owner');
        }
    });
});
app.get('/get-shops-of-owner', authenticateToken,(req, res) => {
    var query=`Select shop.shop_name as shop_name, shop.shop_owner_number as owner_number, shop.longitude as longitude, shop.lattitude as lattitude, shop_owner.user_name as owner_name 
                from shop 
                    left join shop_owner on shop_owner.phone_number = shop.shop_owner_number
                where shop.shop_owner_number= "${req.user.phone_number}"`
    if(req.query.searchKyeWord!=null && req.query.searchKyeWord.length!=0 ){
        query = query + `and shop.shop_name like '%${req.query.searchKyeWord}%'`
    }
    con.query(query,function (err, result) {
        if (err) throw err;
        else{
            res.send(result);
        }
    });
});
//listening to port
app.listen(port, () => console.log(process.env.DB_USERNAME))
console.log("hello world!");