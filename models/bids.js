const mongoose=require("mongoose");
const Schema=mongoose.Schema;

const bidSchema=({
    Product:{
        type:String,
        required:true,
    },
    newbid:{
        type:Number,
        required:true,
    },
    lastbid:{
        type:Number,
        required:true,
    },
    bidOwner:{
        type:String,
        required:true,
    },
});

module.exports=mongoose.model("Listbid",bidSchema);