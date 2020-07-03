
const mongoose =require('mongoose');

const UserSchema =new mongoose.Schema({
firstName:{
type:String
},
lastName: {
    type: String
 } ,

email:{
     type: String,

 },
 mac_address:{
     type: String,
     required :true
 },password:{
  type: String
},
gender:{
     type: String,
 },
 date_of_birth:{
   type: Date,
 },
 registration_date:{
     type: Date ,
     default: Date.now()
 },
 phone:{
   type: String,
   required: true,
   unique:true

 },
 role:{
   type: String,
     required: true,
     default: "USER"
 }
 ,
 token:{
   type: String,
     default: ""
 },
 address:{
     type: {}
 },
 health_stat_info:{
type:[]
 },
 infection:{
      is_infected:{type: Boolean,default:false},
      date:{type: Date}
 },
 bluetooth_info:{
     type :{}
 },
bluetooth_id:{
    type:String
}
});
module.exports= User= mongoose.model('user',UserSchema);
