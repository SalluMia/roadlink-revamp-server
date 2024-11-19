const mongoose=require('mongoose')

const Mongo_URI = process.env.Mongo_URI;

// Connect to MongoDB
mongoose.connect(Mongo_URI)
.then(() => {
  console.log('Db Connection Established');
})
.catch((error) => {
  console.error('Connection Error:', error.message);
});