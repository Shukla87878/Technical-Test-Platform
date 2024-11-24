const mongoose = require('mongoose');

const TestSchema = new mongoose.Schema({
  question: String,
  options: [String],
  correctAnswer: String,
});

module.exports = mongoose.model('Test', TestSchema);