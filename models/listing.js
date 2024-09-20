const mongoose=require("mongoose");
const Schema=mongoose.Schema;

const listingSchema=new Schema({
    nameofproduct:{
        type:String,
    },
    description:{
        type:String
    },
    image:{
        url:String,
        filename:String,
    },
    baseprice:Number,
    location:String,
    topbid:Number,
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
    },
    listbid:[
        {
            type:Schema.Types.ObjectId,
            ref:"Listbid",
        }
    ],
    time:{
        type:Number,
        required:true,
    },
    status:{
        type:String,
    }
});

const Listing=mongoose.model("Listing",listingSchema);

module.exports=Listing;