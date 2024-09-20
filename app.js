if(process.NODE_ENV!="production"){
    require("dotenv").config();
}


const exp = require("constants");
const express=require("express");
const app=express();

const port=8000;

app.set("view engine","ejs");
const path=require("path");
app.set("views",path.join(__dirname,"/views"));

app.use(express.static(path.join(__dirname,"public/css")));
app.use(express.static(path.join(__dirname,"public/js")));

app.use(express.urlencoded({extended:true}));
app.use(express.json());

const methodOverride=require("method-override");
app.use(methodOverride("_method"));

const ejsMate=require("ejs-mate");
app.engine("ejs",ejsMate);


const flash=require("connect-flash");

const multer=require("multer");
const upload=multer({dest:"E:/New folder"});

const session=require("express-session");
const sessionOptions={
    secret:"mydreamspicebid",
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now()*7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
      }
};
app.use(session(sessionOptions));






const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");
app.use(passport.initialize());
app.use(passport.session());
//////////////////////
app.use(flash());
///////////////////
app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
    console.log(res.locals.currUser);
    next();
});
//////////////////////////
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());








const mongoose=require("mongoose");
main()
.then((res)=>{
    //console.log(res)
})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/spicebid');
}

const Listing=require("./models/listing.js");
const Listbid=require("./models/bids.js");


app.get("/home",(req,res)=>{
    res.render("home.ejs");
});

app.get("/listings",async(req,res)=>{
    let listings=await Listing.find({});
    
    res.render("listing/index.ejs",{listings});
    
});
app.get("/listings/new",(req,res)=>{
    if(!req.isAuthenticated()){
        req.flash("error","you must be logged in to create new auction");
        res.redirect("/login");
    }else{
        res.render("listing/new.ejs");
    }
    
});
app.post("/listings",upload.single('listing[image]'),async(req,res,next)=>{
    let newlisting=req.body.listing;
    let listing1=new Listing(newlisting);
    await listing1.save();
    let url=req.file.path;
    let filename=req.file.filename;
    listing1.image.url=url;
    listing1.image.filename=filename;
    listing1.topbid=newlisting.baseprice;
    listing1.owner=req.user._id;
    listing1.status="active";
    let listing2 = await listing1.save();
//    console.log(req.file);
    setTimeout(()=>{
        listing1.status="dormant";
        listing1.save();
    },1*60*1000);
   req.flash("success","New Auction created successfully");
    res.redirect("/listings");
    next();
});
app.get("/listings/:id",async(req,res)=>{
    let {id}=req.params;
    let listing=await Listing.findById(id).populate("listbid");
    let size=listing.listbid.length;
    let lastbid=listing.listbid[size-1];
    res.render("listing/show.ejs",{listing,lastbid});
});
app.get("/listings/:id/newbid",async(req,res)=>{
    if(!req.isAuthenticated()){
        req.flash("error","you must be logged in to set a bid for this auction ");
        res.redirect("/login");
    }else{
        let {id}=req.params;
    let listing=await Listing.findById(id);
    res.render("listing/listbid.ejs",{listing});
    }
});
app.put("/listings/:id/newbid",async(req,res)=>{
    let {id}=req.params;
    let {newbid}=req.body;
    let newbid1=newbid;
    let listing=await Listing.findById(id);
    // console.log(listing);
    // console.log(req.body);
    if(newbid>listing.topbid){
        let lastbid1=listing.topbid;
        let bidOwner1=req.user;
        await Listing.findByIdAndUpdate(id,{topbid:newbid});
        let latestbid=new Listbid({Product:listing.nameofproduct,newbid:newbid1,lastbid:lastbid1,bidOwner:bidOwner1.username});
        console.log(latestbid);
        listing.listbid.push(latestbid);
        await latestbid.save();
        await listing.save();
        req.flash("success","your bid set successfully");
        res.redirect(`/listings/${id}`);
    }else{
        res.send("you need to enter bidprice higher than the topbid");
    }
});
app.get("/listings/:id/edit",async(req,res)=>{
    if(!req.isAuthenticated()){
        req.flash("error","you must be logged in to edit this auction details");
        res.redirect("/login");
    }else{
        let {id}=req.params;
        let listing=await Listing.findById(id);
        res.render("listing/edit.ejs",{listing});
    }
    
});
app.put("/listings/:id",upload.single('listing[image]'),async(req,res)=>{
    let {id}=req.params;
    let uplisting=req.body.listing;
    console.log(uplisting);
    await Listing.findByIdAndUpdate(id,{...uplisting});
    req.flash("success","The product details updated successfully");
    res.redirect("/listings");
});
app.delete("/listing/:id",async(req,res)=>{
    console.log(req.user);
    if(!req.isAuthenticated()){
        req.flash("error","you must be logged in to delete this listing");
        return res.redirect("/login");
    }else{
        let {id}=req.params;
    let dellisting=await Listing.findByIdAndDelete(id);
    req.flash("success","deleted successfully");
    res.redirect("/listings");
    }
    
});
app.get("/listings/:id/biddetails",async(req,res,next)=>{
    let {id}=req.params;
    let listing=await Listing.findById(id).populate("listbid");
    let listbid1=listing.listbid;
    console.log(listbid1);
    let i=1;
    res.render("listing/biddetails.ejs",{listbid1,i});
});
app.get("/accounts/:id/myauctions",async(req,res)=>{
    let{id}=req.params;
    let listings = await Listing.find({ owner: id });
    res.render("listing/index.ejs",{listings});
});
app.get("/accounts/:id/mybids",async(req,res)=>{
    // let{id}=req.params;
    // let bidOwner1=await User.findById(id);
    // let bids=await Listbid.find({bidOwner:bidOwner1.username});
    let{id}=req.params;
    let bidowner=await User.findById(id);
    let listbids  = await Listbid.find({bidOwner:bidowner});
    let i=1;
    res.render("listing/mybids.ejs",{listbids,i});
    
});
app.get("/signup",(req,res)=>{
    res.render("users/signup.ejs");
});
app.post("/signup",async(req,res)=>{
    let {name,username,password,email,mobile}=req.body;
    let newUser=new User({name,email,mobile,username});
    console.log(newUser);
    const registeredUser=await User.register(newUser,password);
    res.redirect("/listings");
});
app.get("/login",(req,res)=>{
    res.render("users/login.ejs");
});
app.post("/login",passport.authenticate("local",{failureRedirect:"/login",failureFlash:true}),async(req,res)=>{
    req.flash("success","Welcome back to Wanderlust");
   res.redirect("/listings"); 
});
app.get("/logout",(req,res)=>{
    req.logout((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","you are logged out successfully");
        res.redirect("/listings");
    });
})
//app.post("/listing",(req,res)=>{
    
//});
app.use((err,req,res,next)=>{
    console.log(err);
});
app.listen(port,()=>{
    console.log(`app is listening to port ${port}`);
});
