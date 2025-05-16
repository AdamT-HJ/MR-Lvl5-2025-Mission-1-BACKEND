
const express = require('express')
require("dotenv").config();
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');

const mysql = require('mysql');



// enable express
const app = express();

app.use(express.json())

// Middlewares
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

//Multer Configuration
//Images to be stored temp. in RAM
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

//Azure Custom Vision API Configuration
const AZURE_CUSTOM_VISION_ENDPOINT = process.env.AZURE_CUSTOM_VISION_ENDPOINT;

const AZURE_CUSTOM_VISION_KEY = process.env.AZURE_CUSTOM_VISION_KEY;


//Database Config


//Endpoints

//test
app.get('/', (req, res) => {
    res.status(200).send('Backend Server is ready for Image Classification!')
});

//image upload for classification AZURE
app.post('/api/classify-image', upload.single('image'), async(req, res) => {
    try{
        if(!req.file) {
            return res.status(400).json({error: 'No image file provided.'});
        }

        const imageBuffer = req.file.buffer; // image data from multer

        // API Key check
        if (!AZURE_CUSTOM_VISION_ENDPOINT || !AZURE_CUSTOM_VISION_KEY) {
            console.error('Azure Custom Vision API credentials are not properly set in .env');
            return res.status(500).json({error: 'Server configuration error: Azure credentials mission'});
        }

        //POST request to Azure Custom Vision API
        const azureResponse = await axios.post(
            AZURE_CUSTOM_VISION_ENDPOINT, 
            imageBuffer,
            {
                headers: {
                    'Content-Type': 'application/octet-stream', //for binary image upload
                    'Prediction-Key': AZURE_CUSTOM_VISION_KEY 
                },
                maxBodyLength: Infinity, //to handle large uploads
                maxContentLength: Infinity
            }
        );

        // Azure results back to frontend
        res.status(200).json({
            message: 'Image classified successfully!',
            results: azureResponse.data // containing the 'predictions' array etc.
        });

    } catch (error) {
        console.error('Error during the image classification:', error);
        //error details
        if(error.response) {
            //Azure API responded with an error status
            console.error('Azure API Error Details:', error.response.data);
            res.status(error.response.status).json({
                error: 'Error from Azure Custom Vision API',
                details: error.response.data
            });

        } else if (error.request) {
            // Request made but no response received
            res.status(500).json({error:'No response received from Azure Custom Vision API.'});
        } else {
            // Other issue
            res.status(500).json({error: error.message || 'An unknown error occurred'});
        }
    }

});


// PORT
app.listen(process.env.PORT, () =>{
    console.log(`Server listening at http://localhost:${process.env.PORT}`);
    })
    .on('error', (error) => {
        console.log("Server Error!!!💥💥", error);
    });