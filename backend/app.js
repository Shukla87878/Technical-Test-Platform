require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const winston = require('winston'); // Logging
 // Load environment variables from .env

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Create a Winston logger instance
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(), // Log to console
        new winston.transports.File({ filename: 'error.log', level: 'error' }) // Log errors to file
    ]
});

// Rate limiting for JDoodle API (max 5 requests per minute per IP)
const compileLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Sample test data for various programming languages
const tests = [
    {
        language: 'Java',
        questions: [
            { questionText: 'Java Question 1', description: 'Write code for reverse string', correctAnswer: 'reverseString' },
            { questionText: 'Java Question 2', description: 'Take the input and find the factorial of a number ', correctAnswer: 'factorial' }
        ]
    },
    {
        language: 'C++',
        questions: [
            { questionText: 'C++ Question 1', description: 'Write code for binary search', correctAnswer: 'binarySearch' },
            { questionText: 'C++ Question 2', description: 'Implement a queue using stacks', correctAnswer: 'queueUsingStacks' }
        ]
    },
    {
        language: 'Python',
        questions: [
            { questionText: 'Python Question 1', description: 'Write code for FizzBuzz', correctAnswer: 'fizzbuzz' },
            { questionText: 'Python Question 2', description: 'Check if a string is palindrome', correctAnswer: 'palindrome' }
        ]
    },
    {
        language: 'C',
        questions: [
            { questionText: 'C Question 1', description: 'Write code to count vowels', correctAnswer: 'countVowels' },
            { questionText: 'C Question 2', description: 'Write code to reverse a string', correctAnswer: 'reverseString' }
        ]
    },
    {
        language: 'SQL',
        questions: [
            { questionText: 'SQL Question 1', description: 'Find second highest salary', correctAnswer: 'secondHighestSalary' },
            { questionText: 'SQL Question 2', description: 'Write a query to get employee details by department', correctAnswer: 'employeeByDepartment' }
        ]
    },
    {
        language: 'DBMS',
        questions: [
            { questionText: 'DBMS Question 1', description: 'Explain ACID properties', correctAnswer: 'ACID' },
            { questionText: 'DBMS Question 2', description: 'Define normalization', correctAnswer: 'normalization' }
        ]
    }
];

// Endpoint to get available tests
app.get('/api/tests', (req, res) => {
    res.json(tests);
});

// Compile and run code using JDoodle API with rate limiting and validation
app.post('/api/compile', compileLimiter, [
    body('language').isString().withMessage('Language is required'),
    body('sourceCode').isString().withMessage('Source code is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { language, sourceCode, input } = req.body;

    // Logging the request
    logger.info(`Compiling code for language: ${language}`);

    const jdoodleApiUrl = 'https://api.jdoodle.com/v1/execute';
    const clientId = process.env.JDOODLE_CLIENT_ID;
    const clientSecret = process.env.JDOODLE_CLIENT_SECRET;

    const payload = {
        script: sourceCode,
        language: language.toLowerCase(),
        versionIndex: '0',
        stdin: input || '' // Handle optional input
    };

    try {
        const response = await axios.post(jdoodleApiUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'X-JDoodle-Client-Id': clientId,
                'X-JDoodle-Client-Secret': clientSecret
            }
        });

        // Log success and send back the response
        logger.info(`Compilation success for language: ${language}`);
        res.json({
            output: response.data.output,
            error: response.data.error,
            status: response.data.statusCode
        });
    } catch (error) {
        logger.error('Error communicating with JDoodle API', { error: error.message });

        res.status(500).json({
            error: 'Error communicating with JDoodle API',
            details: error.message,
            response: error.response ? error.response.data : null
        });
    }
});

// Endpoint to submit answers
app.post('/api/submit', [
    body('language').isString().withMessage('Language is required'),
    body('questionText').isString().withMessage('Question text is required'),
    body('userAnswer').isString().withMessage('Answer is required')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { language, questionText, userAnswer } = req.body;
    const test = tests.find(t => t.language === language);

    if (!test) {
        return res.status(404).json({ message: 'Test not found' });
    }

    const question = test.questions.find(q => q.questionText === questionText);
    if (!question) {
        return res.status(404).json({ message: 'Question not found' });
    }

    // Simple check for correct answer
    const isCorrect = userAnswer.includes(question.correctAnswer);
    logger.info(`User submitted answer for ${language}: ${isCorrect ? 'Correct' : 'Incorrect'}`);

    res.json({ isCorrect });
});

// Server setup
const PORT = 5000;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    console.log(`Server running on port ${PORT}`);
});