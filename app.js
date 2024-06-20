const express = require('express');
const app = express();
const userModel = require('./models/user');
const postModel = require('./models/post');
const cookieParser = require('cookie-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config()


app.set('view engine' , 'ejs');
app.use( express.json() );
app.use( express.urlencoded({extended:true}));
app.use(express.static(path.join( __dirname , "public" )));
app.use(cookieParser())





function isLoggedIn(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect('/login');
    }
    else{try {
        const data = jwt.verify(token, "5399");
        req.user = data;
        next();
    } catch (error) {
        return res.redirect('/login');
    }}
}


app.get('/' , function(req,res){
    res.render("index" );
})


app.get('/login' , async function(req,res){
    res.render("login");
})

app.get('/profile', async function(req, res) {
    let user = await userModel.findOne(req.body._id).populate("posts");
    res.render('profile' , {user}); 
});


app.post('/register' , async function(req,res){
    let {username , name , email , password , age } = req.body;
    let user = await userModel.findOne({email});
    if(user) return res.status(300).send("user already registered")

    bcrypt.genSalt(10 , function(err , salt){
        bcrypt.hash(password , salt ,async function(err,hash){
            let user = await userModel.create({
                username,
                name,
                email,
                password:hash,
                age
            })
            let token = jwt.sign({email:email , userid:user._id} , "5399" )
            res.cookie("token" , token)
            res.redirect("/login")
        })
    })
})


app.post('/login' , async function(req,res){
    let {email , password } = req.body;
    let user = await userModel.findOne({email:email});
    if(!user) return res.status(300).send("went wrong")

    bcrypt.compare( password , user.password , function(err, result){
        if(result) {
            let token = jwt.sign({email:email , userid:user._id} , "5399" )
            res.cookie("token" , token)
            res.status(200).redirect("/profile")
        }
        else res.redirect('/login')
    })
})


app.get('/logout' , function(req,res){
    res.cookie("token", "" );
    res.redirect("/login");
})

app.get('/like/:id', isLoggedIn, async function(req, res) {
    try {
        const postId = req.params.id.trim();
        const post = await postModel.findOne({ _id: postId }).populate("user");

        if (!post) {
            return res.status(404).send("Post not found");
        }
        const userId = req.user.userid;

        if (post.likes.includes(userId)) {
            post.likes = post.likes.filter(id => id.toString() !== userId);
        } else {
            post.likes.push(userId);
        }

        await post.save();
        res.redirect("/profile");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error liking post");
    }
});




app.get('/edit/:id', isLoggedIn, async function(req, res) {
    try {
        const postId = req.params.id.trim();
        const post = await postModel.findById(postId).populate("user");
        if (!post) return res.status(404).send("Post not found");

        res.render("edit", { post });
    } catch (error) {
        res.status(500).send("Error retrieving post");
    }
});


app.post('/update/:id', isLoggedIn, async function(req, res) {
    try {
        const postId = req.params.id.trim();
        const post = await postModel.findOneAndUpdate(
            { _id: postId },
            { img: req.body.img },
            {caption : req.body.caption},
            { new: true } // Option to return the updated document
        );
        if (!post) {
            return res.status(404).send("Post not found");
        }
        res.redirect("/profile");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error updating post");
    }
});

app.get('/delete/:id', isLoggedIn, async function(req, res) {
    try {
        const postId = req.params.id.trim();
        const post = await postModel.findOneAndDelete({ _id: postId });
        if (!post) {
            return res.status(404).send("Post not found");
        }
        res.redirect("/profile");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error updating post");
    }
});


app.post('/post', isLoggedIn, async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.user.email });
        const { caption, img } = req.body;
        if (!caption || !img) {
            return res.status(400).send("Caption and image are required");
        }
        const post = await postModel.create({
            user: user._id,
            caption,
            img
        });
        user.posts.push(post._id);
        await user.save();
        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        res.status(500).send("post error");
    }
});


app.listen(process.env.PORT , function(){
    console.log("server started");
})


module.exports = isLoggedIn;
