require('dotenv').config();
const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const app = express();
const cors = require('cors');
const connectDB = require('./config/connectMongo')
const CashflowModel = require('./model/cashflowModel')
const securityDetailsModel = require('./model/securityDetailsModel')
const clientDetailsModal = require('./model/clientDetailsModal')

// Enable CORS for all requests
app.use(cors());

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Connect to MongoDB
connectDB()

// Route to handle file uploads


app.post('/cashflow', upload.single('file'), async (req, res) => {
  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
    console.log(data);

    // Save the data to MongoDB
    await CashflowModel.insertMany(data);
    res.status(200).json({ message: 'File uploaded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// securityDetails upload route
app.post('/securityDetails', upload.single('file'), async (req, res) => {
  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
    console.log(data);

    // Save the data to MongoDB
    await securityDetailsModel.insertMany(data);
    res.status(200).json({ message: 'File uploaded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// app.get('/clientDetails', async(req, res) => {
//   try {
//     const data = await clientDetailsModal.find();
//     console.log("Clientdata",data);
//     res.json(data); // Send the data as a response
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).json({ message: 'Error fetching data' });
//   }
// });

 // API endpoint to retrieve all data from a collection
 app.get('/clientDetails', async (req, res) => {
  try {
    const collection = db.collection('clientDetails');
    const data = await collection.find({}).toArray(); // Find all documents

    res.json(data); // Send data as JSON response
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error retrieving data'); // Handle errors appropriately
  }
});

app.post('/clientDetails', upload.single('file'), async (req, res) => {
  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
    console.log(data);

    // Save the data to MongoDB
    await clientDetailsModal.insertMany(data);
    res.status(200).json({ message: 'File uploaded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// db.cashflow.aggregate([

// ])


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});