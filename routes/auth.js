const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const User = mongoose.model("User")
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const {JWT_SECRET} = require('../config/key')
const requireLogin = require('../middleware/requireLogin')
const nodemailer = require('nodemailer')
const sendgridTransport = require('nodemailer-sendgrid-transport')


const transporter = nodemailer.createTransport(sendgridTransport({
    auth:{
        api_key:"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"
    }
}))
// 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
// 
// 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
router.post('/signup', (req,res)=>{
    const {name,email,password,pic} = req.body
    if(!email ||!password ||!name){
        return res.status(422).json({error:"Please add all the feilds"})
    }

    User.findOne({email:email})
    .then((savedUser)=>{
        if(savedUser){
            return res.status(422).json({error:"User already exits with that email"}) 
        }
        bcrypt.hash(password,12)
        .then(hashedpassword=>{
            const user = new User({
                email,
                password:hashedpassword,
                name,
                pic
            })
            user.save()
            .then(user=>{
                 transporter.sendMail({
                    to:user.email,
                    from:"aravindhalahalli.81@gmail.com",
                    subject:"Signup Successfully",
                    html:"<h1>Welcome to instagram-clone-Webapp</h1>"
                })
                res.json({message:"SignedUp Successfully"})
            })
            .catch(err=>{
                console.log(err)
            })

        })
        
    })
    .catch(err=>{
        console.log(err)
    })
})

router.post('/signin', (req,res)=>{
    const {email,password} = req.body
    if(!email|| !password){
        return res.status(422).json({error:"please add email or password"})
    }
    User.findOne({email:email})
    .then((savedUser)=>{
        if(!savedUser){
            return res.status(422).json({error:"Invalid Email or Password"}) 
        }
        bcrypt.compare(password, savedUser.password)
        .then(doMatch=>{
            if(doMatch){
                // return res.json({message:"Successfully Signed In"})
                const token = jwt.sign({_id:savedUser._id},JWT_SECRET)
                const {_id,name,email,followers,following,pic} = savedUser
                res.json({token,user:{_id,name,email,followers,following,pic}})
            }
            else{
                return res.status(422).json({error:"Invalid Email or Password"})
            }
        })
        .catch(err=>{
            console.log(err)
        })
    })
})

router.post('/reset-password',(req,res)=>{
    crypto.randomBytes(32,(err,buffer)=>{
        if(err){
            console.log(err)
        }
        const token = buffer.toString("hex")
        User.findOne({email:req.body.email})
        .then(user=>{
            if(!user){
                return res.status(422).json({error:"User dont exists with that email"})
            }
            user.resetToken = token
            user.expireToken = Date.now() + 3600000
            user.save().then((result)=>{
                transporter.sendMail({
                    to:user.email,
                    from:"aravindhalahalli.81@gmail.com",
                    subject:"password reset",
                    html:`
                    <p>You requested for password reset</p>
                    <h5>click in this <a href="http://localhost:3000/reset/${token}">link</a> to reset password</h5>
                    `
                })
                res.json({message:"check your email"})
            })

        })
    })
})


router.post('/new-password',(req,res)=>{
   const newPassword = req.body.password
   const sentToken = req.body.token
   User.findOne({resetToken:sentToken,expireToken:{$gt:Date.now()}})
   .then(user=>{
       if(!user){
           return res.status(422).json({error:"Try again session expired"})
       }
       bcrypt.hash(newPassword,12).then(hashedpassword=>{
          user.password = hashedpassword
          user.resetToken = undefined
          user.expireToken = undefined
          user.save().then((saveduser)=>{
              res.json({message:"password updated success"})
          })
       })
   }).catch(err=>{
       console.log(err)
   })
})

module.exports = router