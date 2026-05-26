const express = require('express');
const router = express.Router();

// GET /bfhl
router.get('/', (req, res) => {
  res.status(200).json({ operation_code: 1 });
});

// POST /bfhl
router.post('/', (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ is_success: false, message: "Invalid input" });
    }

    const numbers = [];
    const alphabets = [];
    let highest_lowercase_alphabet = [];

    for (let item of data) {
      if (!isNaN(item)) {
        numbers.push(item);
      } else if (typeof item === 'string' && item.length === 1 && /^[a-zA-Z]$/.test(item)) {
        alphabets.push(item);
        if (item >= 'a' && item <= 'z') {
          if (highest_lowercase_alphabet.length === 0 || item > highest_lowercase_alphabet[0]) {
            highest_lowercase_alphabet = [item];
          }
        }
      }
    }

    // You can replace these with the actual user details required by the assessment
    const response = {
      is_success: true,
      user_id: "john_doe_17091999", // Format: fullname_dob
      email: "john@xyz.com",
      roll_number: "ABCD123",
      numbers,
      alphabets,
      highest_lowercase_alphabet
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ is_success: false, message: "Server error" });
  }
});

module.exports = router;
