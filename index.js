// Import required packages
const express = require('express');        // Web framework for creating routes and server
const dotenv = require('dotenv');          // Loads environment variables from .env file
const multer = require('multer');          // Handles file uploads (e.g., CSV file)
const csv = require('csv-parser');         // Parses CSV file data
const fs = require('fs');                  // File system module for reading/deleting files
const bcrypt = require('bcrypt');          // Used to hash passwords before storing them
const { PrismaClient } = require('@prisma/client'); // ORM to interact with the database

// Initialize environment variables
dotenv.config();

// Create an Express app
const app = express();
app.use(express.json()); // Allows JSON body parsing

// Initialize Prisma Client
const prisma = new PrismaClient();

// Configure Multer to store uploaded files temporarily in 'uploads/' folder
const upload = multer({ dest: 'uploads/' });

// Test route to confirm backend is working
app.get('/', (req, res) => {
  res.send('LMS Backend is running');
});

// Route to handle CSV upload
app.post('/upload-csv', upload.single('file'), async (req, res) => {
  // Check if file is actually attached
  if (!req.file) return res.status(400).send('No file uploaded');

  const results = [];  // Stores all rows from CSV
  const errors = [];   // Stores error details for rows that fail

  // Read the uploaded CSV file
  fs.createReadStream(req.file.path)
    .pipe(csv()) // Parse CSV data row by row
    .on('data', (row) => {
      results.push(row); // Add each row to results array
    })
    .on('end', async () => {
      // Delete the file after reading to free memory and storage
      fs.unlinkSync(req.file.path);

      const processedResults = []; // Stores success results

      // Loop through each row from the CSV
      for (const [index, row] of results.entries()) {
        try {
          // Step 1: Validate required fields
          if (!row.name || !row.email || !row.password) {
            errors.push({
              row: index + 1,
              error: 'Missing required fields (name, email, password)',
            });
            continue; // Skip this row and go to the next
          }

          // Step 2: Hash password before storing
          const hashedPassword = await bcrypt.hash(row.password, 10);

          // Step 3: Prepare user object for database
          const userData = {
            name: row.name,
            email: row.email,
            password: hashedPassword,
            // If firstLogin is empty or true — default to true
            firstLogin: row.firstLogin === 'false' ? false : true
          };

          // Step 4: Save user in database using Prisma
          const user = await prisma.user.create({ data: userData });

          // Step 5: Store success info
          processedResults.push({
            row: index + 1,
            status: 'success',
            user,
          });
        } catch (err) {
          // If there's any error (ex: duplicate email), add to errors list
          errors.push({
            row: index + 1,
            error: err.message,
          });
        }
      }

      // Step 6: Return summary response to client
      res.json({ processedResults, errors });
    });
});

// Start the server on specified port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

