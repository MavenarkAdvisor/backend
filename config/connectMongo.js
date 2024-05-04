const mongoose = require("mongoose")

const connectDB = async () =>{
    try{
        const connect = await mongoose.connect(process.env.MONGODB_CONNECT)
    } catch (error){
        console.log(error);
        process.exit(1)
    }
}

module.exports = connectDB
