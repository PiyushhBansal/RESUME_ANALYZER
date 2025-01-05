const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const multer = require('multer');
const cors = require('cors'); // Import CORS middleware
require('dotenv').config(); // Load environment variables

const app = express();
const port = 3100;

// Use CORS middleware (allows all origins by default)
app.use(cors());  

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Setup file storage for Multer (file handling)
const storage = multer.memoryStorage(); // Store file in memory
const upload = multer({ storage: storage });

app.use(express.static('public'));

// API endpoint to handle file upload and job description analysis
app.post('/upload', upload.single('resumeFile'), async (req, res) => {
    const { jobDescription } = req.body;
    const resumeFile = req.file;

    // Validate that resume file and job description are present
    if (!resumeFile) {
        return res.status(400).send('Resume file is required.');
    }

    if (!jobDescription) {
        return res.status(400).send('Job description is required.');
    }

    try {
        // Step 1: Send the resume to the ResumeParser API for parsing
        const formData = new FormData();
        formData.append('file', resumeFile.buffer, { filename: 'resume.pdf' });

        const apiResponse = await axios.post('https://api.resumeparser.com/v1/upload', formData, {
            headers: {
                'Authorization': `Bearer ${process.env.RESUME_PARSER_API_KEY}`, // Use your ResumeParser API key here
                'Content-Type': 'multipart/form-data',
            },
        });

        const resumeData = apiResponse.data;

        // Step 2: Match the parsed resume with the job description
        const matchingScore = matchResumeWithJobDescription(resumeData, jobDescription);

        // Step 3: Generate suggestions for improvement (skills, keywords, etc.)
        const suggestions = generateSuggestions(resumeData, jobDescription);

        // Step 4: Return parsed resume data and analysis results
        res.json({
            parsedResume: resumeData,
            matchingScore,
            suggestions,
        });

    } catch (error) {
        console.error('Error processing resume:', error);
        res.status(500).send('Error analyzing resume.');
    }
});

// Function to calculate matching score between resume and job description
function matchResumeWithJobDescription(resumeData, jobDescription) {
    const resumeKeywords = resumeData.skills.join(' ');
    const jobKeywords = jobDescription.toLowerCase();

    let matchingScore = 0;

    resumeKeywords.split(' ').forEach((word) => {
        if (jobKeywords.includes(word.toLowerCase())) {
            matchingScore += 1;
        }
    });

    return matchingScore;
}

// Function to generate suggestions based on missing skills or keywords
function generateSuggestions(resumeData, jobDescription) {
    const requiredSkills = ['JavaScript', 'React', 'Node.js']; // Example required skills from job description
    const missingSkills = requiredSkills.filter((skill) => !resumeData.skills.includes(skill));

    return missingSkills.length > 0 ? `Missing skills: ${missingSkills.join(', ')}` : 'No missing skills.';
}

// Start the server
app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
});
