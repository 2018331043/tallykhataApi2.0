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
app.get('/activeShopOwner',authenticateToken,async (req,res)=>{
    try{

    }catch (e){
        console.log(e);
    }
    con.query(`SELECT * FROM shop_owner where shop_owner.email = "${req.user.email}"`, function (err, result) {
        if (err) throw err;
        else{
            res.json({activeUsers:result})
        }
    });
})
app.post('/signin',async (req, res) => {
    try{
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
    }catch (e){
        console.log(e);
    }

});
app.post('/signup', async (req, res) => {
    try{
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
    }catch (e){
        console.log(e);
    }

});
app.post('/save-debt-for-customer', authenticateToken, async (req, res) => {
    try{
        const data={
            customer_phone_number:req.body.customer_phone_number,
            shop_number:req.body.shop_number,
            description:req.body.description,
            amount:req.body.amount,
            customer_name:req.body.customer_name
        }
        var getExistingQuery = `Select * from customer_wise_debt where customer_wise_debt.customer_phone_number = "${req.body.customer_phone_number}" and customer_wise_debt.shop_number = "${req.body.shop_number}"`
        con.query(getExistingQuery,data ,function (err, result) {
            try{
                if (err) throw err;
                else{
                    if(result.length != 0){
                        data.amount += result[0].amount;
                        if(data.customer_name==null){
                            data.customer_name = result[0].customer_name;
                        }
                        con.query(`Update customer_wise_debt set ? where customer_wise_debt.id= ${result[0].id}`,data ,function (err, result) {
                            try{
                                if (err) throw err;
                                else{
                                    res.send('User Created');
                                }
                            }catch (e){
                                res.send('User Created');
                            }
                        });
                    }
                    else{
                        con.query(`Insert into customer_wise_debt set ?`,data ,function (err, result) {
                            if (err) throw err;
                            else{
                                res.send('User Created');
                            }
                        });
                    }
                }
            }catch (e){
                res.send('User Created');
            }
        });
    }catch (e){
        res.send('User Created');
        console.log(e);
    }
});
app.post('/add-shop-for-owner', authenticateToken,async (req, res) => {
    try{
        const data={
            lattitude : req.body.lat,
            longitude : req.body.lng,
            shop_owner_number:req.user.phone_number,
            shop_number:req.body.shop_number,
            description:req.body.description,
            shop_name:req.body.name
        }
        con.query(`Insert into shop set ?`,data ,function (err, result) {
            if (err) throw err;
            else{
                res.send('Shop Created for owner');
            }
        });
    }catch (e){
        console.log(e);
    }

});
app.get('/get-shops-of-owner', authenticateToken, async (req, res) => {
    try{
        var query=`Select shop.shop_number as shop_number, shop.shop_name as shop_name,shop.description as description, shop.shop_owner_number as owner_number, shop.longitude as longitude, shop.lattitude as lattitude, shop_owner.user_name as owner_name
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
    }catch (e){
        console.log(e);
    }
});
app.post('/get-shop-details', authenticateToken, async (req, res) => {
    try{
        var shopDebtsQuery = `Select * from customer_wise_debt where  customer_wise_debt.shop_number = "${req.body.shop_number}"`
        if(req.body.searchKeyWord!=null && req.body.searchKeyWord.length!=0 ){
            shopDebtsQuery = shopDebtsQuery + `and (customer_wise_debt.customer_phone_number like '%${req.body.searchKeyWord}%' or customer_wise_debt.customer_name like '%${req.body.searchKeyWord}%' )`
        }
        var query=`Select shop.shop_name as shop_name, shop.shop_owner_number as owner_number, shop.longitude as longitude, shop.lattitude as lattitude, shop_owner.user_name as owner_name 
                from shop 
                    left join shop_owner on shop_owner.phone_number = shop.shop_owner_number
                where shop.shop_number= "${req.body.shop_number}"`
        con.query(query,function (err, shopDetailsresult) {
            if (err) throw err;
            else{
                con.query(shopDebtsQuery,function (err, shopDebtresult) {
                    if (err) throw err;
                    else{
                        console.log(shopDebtresult);
                        res.send({shopDetails: shopDetailsresult[0],
                            shopDebtresult:shopDebtresult
                        });
                    }
                });
            }
        });
    }catch (e){
        console.log(e);
    }
});
//listening to port
app.listen(port, () => console.log(process.env.DB_USERNAME))
console.log("hello world!");