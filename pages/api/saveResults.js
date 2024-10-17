import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import db from '@/utils/mysql';

export const config = {
  api: {
    bodyParser: false, // Disable bodyParser to handle form data
  },
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const form = new IncomingForm();
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    form.uploadDir = uploadDir;
    form.keepExtensions = true;

    // Ensure the uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Error parsing the form:", err);
        return res.status(500).json({ message: 'Error processing the form', err });
      }

      const { invNumber, total, originalContent, nasLocation } = fields;

      // Ensure all required fields are arrays of the same length
      if (!Array.isArray(invNumber) || !Array.isArray(total) || !Array.isArray(originalContent) || !Array.isArray(nasLocation)) {
        return res.status(400).json({ message: 'Invalid data format, expecting arrays' });
      }

      try {
        const connection = await db();
        const errors = [];

        // Loop through each entry and validate
        for (let i = 0; i < invNumber.length; i++) {
          let errorMessage = '';
          let imagePath = ''; // Initialize imagePath for each entry

          // 1. Check if invNumber already exists in the database
          const [existingEntry] = await connection.query('SELECT invNumber FROM results WHERE invNumber = ?', [invNumber[i]]);
          if (existingEntry.length > 0) {
            errorMessage += `INV#: ${invNumber[i]} is already in the database.\n`;
          }

          // 2. Check if an image is missing
          if (!files.image || !files.image[i]) {
            errorMessage += 'Image is missing, please ensure image filename matches INV#.\n';
          } else {
            // Save image if it exists
            const imageFile = files.image[i];
            const fileName = `${Date.now()}_${imageFile.originalFilename}`;
            const newFilePath = path.join(uploadDir, fileName);

            try {
              fs.renameSync(imageFile.filepath, newFilePath);
              imagePath = `/uploads/${fileName}`; // Assign the correct image path
            } catch (error) {
              console.error("Error saving image:", error);
              return res.status(500).json({ message: 'Error saving image', error });
            }
          }

          // 3. Check for missing spec items in originalContent
          const requiredSpecs = ['INV#', 'CPU', 'GPU', 'CASE', 'MOBO', 'RAM', 'PSU'];
          const missingSpecs = requiredSpecs.filter(spec => !originalContent[i].includes(spec));
          if (missingSpecs.length > 0) {
            errorMessage += `Missing ${missingSpecs.join(', ')} in the spec list, ensure format is correct.\n`;
          }

          // If there's an error, store it and continue to the next entry
          if (errorMessage) {
            errors.push({ invNumber: invNumber[i], message: errorMessage.trim() });
            continue; // Skip saving this entry
          }

          // Insert the individual result into the database
          const query = `
            INSERT INTO results (invNumber, total, originalContent, nasLocation, imagePath)
            VALUES (?, ?, ?, ?, ?)
          `;
          const values = [invNumber[i], total[i], originalContent[i], nasLocation[i], imagePath];

          await connection.query(query, values);
        }

        connection.end();

        if (errors.length > 0) {
          return res.status(400).json({ message: 'Entries were unable to save due to errors', errors });
        }

        res.status(200).json({ message: 'Results saved successfully!' });
      } catch (error) {
        console.error("Error saving result:", error);
        res.status(500).json({ message: 'Error saving result', error });
      }
    });
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
