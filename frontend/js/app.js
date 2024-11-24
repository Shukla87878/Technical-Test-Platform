// Fetch the tests from the backend
fetch('http://localhost:5000/api/tests')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(tests => {
        console.log('Tests fetched:', tests);
        const testList = document.getElementById('test-list');

        // Create cards for each programming language
        tests.forEach(test => {
            const card = document.createElement('div');
            card.className = 'test-card';
            card.innerHTML = `
                <h3>${test.language}</h3>
                <button class="start-btn" onclick="startTest('${test.language}')">Start ${test.language} Test</button>
            `;
            testList.appendChild(card);
        });
    })
    .catch(error => console.error('Error fetching tests:', error));

// Function to start a test
function startTest(language) {
    console.log('Starting test for language:', language);
    fetch(`http://localhost:5000/api/tests`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(tests => {
            const test = tests.find(t => t.language === language);
            if (!test) return console.error('Test not found for language:', language);

            const questionContainer = document.getElementById('question-container');
            const scoreContainer = document.getElementById('score-container');
            questionContainer.innerHTML = ''; 
            scoreContainer.innerHTML = ''; 

            let score = 0;
            let currentQuestionIndex = 0;

            // Display current question
            function displayQuestion() {
                const question = test.questions[currentQuestionIndex];
                questionContainer.innerHTML = `
                    <h2>Question ${currentQuestionIndex + 1}: ${question.questionText}</h2>
                    <p>${question.description}</p>
                    <textarea id="userAnswer" placeholder="Write your code here..." cols="45" rows="20"></textarea>
                    <pre id="output"></pre>
                    <div class="action-buttons">
                        <button class="run-btn" onclick="runCode('${test.language}')">Run</button>
                        <button class="save-btn" onclick="saveAnswer()">Save</button>
                        <button class="submit-btn" onclick="submitAnswer('${test.language}', '${question.questionText}')">Submit Answer</button>
                    </div>
                    <div class="nav-buttons">
                        <button id="prev-btn" class="nav-btn" onclick="prevQuestion()" ${currentQuestionIndex === 0 ? 'disabled' : ''}>Previous</button>
                        <button id="next-btn" class="nav-btn" onclick="nextQuestion()" ${currentQuestionIndex === test.questions.length - 1 ? 'disabled' : ''}>Next</button>
                    </div>
                `;
            }

            // Save answer
            window.saveAnswer = function() {
                const userAnswer = document.getElementById('userAnswer').value;
                alert('Your answer has been saved!');
                console.log('Saved Answer:', userAnswer);
            };

            // Handle code execution (Run)
            window.runCode = function(language) {
                const userAnswer = document.getElementById('userAnswer').value;

                // Clear previous output
                document.getElementById('output').innerText = '';

                fetch('http://localhost:5000/api/compile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ language, sourceCode: userAnswer })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    // Show the output in the <pre> element
                    document.getElementById('output').innerText = `Output:\n${data.output || ''}\nErrors:\n${data.error || ''}`;
                })
                .catch(error => {
                    console.error('Error compiling code:', error);
                    document.getElementById('output').innerText = 'Error compiling code. Check console for details.';
                });
            };

            // Handle answer submission
            window.submitAnswer = function(language, questionText) {
                const userAnswer = document.getElementById('userAnswer').value;

                // Clear previous output
                document.getElementById('output').innerText = '';

                fetch('http://localhost:5000/api/compile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ language, sourceCode: userAnswer })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    // Show the output in the <pre> element
                    document.getElementById('output').innerText = `Output:\n${data.output || ''}\nErrors:\n${data.error || ''}`;

                    // Check if the code was correct
                    const isCorrect = !data.error;
                    if (isCorrect) {
                        score++;
                        alert('Correct Answer!');
                    } else {
                        alert('Wrong Answer. Check the errors above.');
                    }

                    if (currentQuestionIndex === test.questions.length - 1) {
                        scoreContainer.innerHTML = `<h2>Your final score: ${score}</h2>`;
                    }
                })
                .catch(error => {
                    console.error('Error compiling code:', error);
                    document.getElementById('output').innerText = 'Error compiling code. Check console for details.';
                });
            };

            // Navigate to next question
            window.nextQuestion = function() {
                if (currentQuestionIndex < test.questions.length - 1) {
                    currentQuestionIndex++;
                    displayQuestion();
                    document.getElementById('prev-btn').disabled = false;
                    if (currentQuestionIndex === test.questions.length - 1) {
                        document.getElementById('next-btn').disabled = true;
                    }
                }
            };

            // Navigate to previous question
            window.prevQuestion = function() {
                if (currentQuestionIndex > 0) {
                    currentQuestionIndex--;
                    displayQuestion();
                    document.getElementById('next-btn').disabled = false;
                    if (currentQuestionIndex === 0) {
                        document.getElementById('prev-btn').disabled = true;
                    }
                }
            };

            displayQuestion();
        })
        .catch(error => console.error('Error starting test:', error));
}