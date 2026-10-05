const {  mongoose } = require("mongoose")

const connectDB = async () =>{
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL)
        console.log(`MongoDB Connected: ${conn.connection.name}`)       
    } catch (error) {
       console.log(`DB CONNECTION FAILD ${error.message}`)
    }
}



module.exports = connectDB