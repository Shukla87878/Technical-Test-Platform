// index.js (Backend API with Code Compilation Feature)
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');



const app = express();
app.use(cors()); // Avoid CORS issues
app.use(bodyParser.json()); // To parse JSON bodies in requests

// Data for six languages (Java, C++, Python, C, SQL, DBMS)
const tests = [
  {
    language: 'Java',
    questions: [
      {
        questionText: 'Problem 1: Reverse a Linked List',
        description: 'Write a Java program to reverse a singly linked list.',
        exampleInput: '1 -> 2 -> 3 -> 4 -> 5 -> null',
        exampleOutput: '5 -> 4 -> 3 -> 2 -> 1 -> null',
        correctAnswer: 'reverseLinkedList'
      },
      {
        questionText: 'Problem 2: Longest Substring Without Repeating Characters',
        description: 'Find the length of the longest substring without repeating characters.',
        exampleInput: '"abcabcbb"',
        exampleOutput: '3',
        correctAnswer: 'lengthOfLongestSubstring'
      }
    ]
  },
  {
    language: 'C++',
    questions: [
      {
        questionText: 'Problem 1: Merge Two Sorted Lists',
        description: 'Merge two sorted linked lists in C++.',
        exampleInput: '1 -> 2 -> 4, 1 -> 3 -> 4',
        exampleOutput: '1 -> 1 -> 2 -> 3 -> 4 -> 4',
        correctAnswer: 'mergeSortedLists'
      },
      {
        questionText: 'Problem 2: Valid Parentheses',
        description: 'Determine if a string contains valid parentheses.',
        exampleInput: '"()[]{}"',
        exampleOutput: 'true',
        correctAnswer: 'isValidParentheses'
      }
    ]
  },
  {
    language: 'Python',
    questions: [
      {
        questionText: 'Problem 1: FizzBuzz',
        description: 'Write a Python function that prints numbers from 1 to n. For multiples of 3, print "Fizz" and for multiples of 5, print "Buzz".',
        exampleInput: 'n = 15',
        exampleOutput: '1, 2, Fizz, 4, Buzz, Fizz, 7, 8, Fizz, Buzz, 11, Fizz, 13, 14, FizzBuzz',
        correctAnswer: 'fizzBuzz'
      },
      {
        questionText: 'Problem 2: Check Palindrome',
        description: 'Check if a string is a palindrome.',
        exampleInput: '"A man, a plan, a canal, Panama"',
        exampleOutput: 'true',
        correctAnswer: 'isPalindrome'
      }
    ]
  },
  {
    language: 'C',
    questions: [
      {
        questionText: 'Problem 1: Count Vowels',
        description: 'Write a C program to count vowels in a string.',
        exampleInput: '"Hello World"',
        exampleOutput: '3',
        correctAnswer: 'countVowels'
      },
      {
        questionText: 'Problem 2: Reverse a String',
        description: 'Write a C program to reverse a string.',
        exampleInput: '"Hello"',
        exampleOutput: '"olleH"',
        correctAnswer: 'reverseString'
      }
    ]
  },
  {
    language: 'SQL',
    questions: [
      {
        questionText: 'Problem 1: Second Highest Salary',
        description: 'Write an SQL query to find the second highest salary from an Employee table.',
        correctAnswer: 'SELECT MAX(Salary) FROM Employee WHERE Salary < (SELECT MAX(Salary) FROM Employee);'
      },
      {
        questionText: 'Problem 2: Count Employees by Department',
        description: 'Write an SQL query to count employees in each department.',
        correctAnswer: 'SELECT Department, COUNT(*) FROM Employee GROUP BY Department;'
      }
    ]
  },
  {
    language: 'DBMS',
    questions: [
      {
        questionText: 'Problem 1: Explain ACID Properties',
        description: 'What are the ACID properties in DBMS? Explain each one with an example.',
        correctAnswer: 'ACID properties: Atomicity, Consistency, Isolation, Durability'
      },
      {
        questionText: 'Problem 2: Normalization Types',
        description: 'Explain the types of Normalization in DBMS.',
        correctAnswer: 'Normalization reduces redundancy and dependency.'
      }
    ]
  }
];

// API endpoint to get all tests
app.get('/api/tests', (req, res) => {
  res.json(tests);
});

// Compile and run code using Judge0 API
app.post('/api/compile', async (req, res) => {
  const { language, sourceCode, input } = req.body;

  // Define Judge0 language IDs (modify/add as necessary for supported languages)
  const languageIds = {
    Java: 62,
    "C++": 54,
    Python: 71,
    C: 50,
    SQL: 82 // This is an example; SQL support may vary in Judge0
  };

  const languageId = languageIds[language];
  if (!languageId) {
    return res.status(400).json({ error: 'Language not supported' });
  }

  try {
    // Send code and input to Judge0
    const response = await axios.post('https://judge0-ce.p.rapidapi.com/submissions', {
      source_code: sourceCode,
      language_id: languageId,
      stdin: input,
    }, {
      headers: {
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        'X-RapidAPI-Key': 'YOUR_JUDGE0_API_KEY' // Replace with your Judge0 API Key
      }
    });

    // Poll Judge0 for results using submission token
    const { token } = response.data;
    let output;
    while (true) {
      const result = await axios.get(`https://judge0-ce.p.rapidapi.com/submissions/${token}`, {
        headers: {
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          'X-RapidAPI-Key': 'YOUR_JUDGE0_API_KEY' // Replace with your Judge0 API Key
        }
      });

      if (result.data.status.id >= 3) { // 3+ indicates completion
        output = result.data;
        break;
      }
    }

    res.json({
      stdout: output.stdout,
      stderr: output.stderr,
      status: output.status.description,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error communicating with Judge0 API', details: error.message });
  }
});

// Body parser middleware
const bodyParser = require('body-parser');
app.use(bodyParser.json()); // To parse JSON request bodies

// Endpoint to submit answers
app.post('/api/submit', (req, res) => {
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
    res.json({ isCorrect });
});


const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));