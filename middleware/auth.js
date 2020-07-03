const jwt =require('jsonwebtoken');
const config =require('config');
const User= require('../models/User');

module.exports= function(req,res,next){
    //to get the token from header
    const token =req.header('x-auth-token');

   //check if token is empty
   if(!token)
   {
    return   res.status(401).json({msg:'No Token , Auth denied'})
   }
        else{
            try {
                const decoded =jwt.decode(token,config.get('jwtSecret'));
                req.user=decoded.user;
                next();
            } catch (error) {
                return res.status(401).json({msg: 'Invalid Token , Auth denied'});
            }
        }
    }


    