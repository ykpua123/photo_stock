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

      // Ensure that there are no errors passed from the frontend
      if (fields.errors && fields.errors.length > 0) {
        return res.status(400).json({ message: 'Entries were unable to save due to errors.', errors: fields.errors });
      }

      let imagePaths = []; // To store image paths for valid entries

      // Process the images and save them
      for (let i = 0; i < invNumber.length; i++) {
        const imageFile = files.image[i];
        const fileName = `${Date.now()}_${imageFile.originalFilename}`;
        const newFilePath = path.join(uploadDir, fileName);

        try {
          fs.renameSync(imageFile.filepath, newFilePath);
          imagePaths[i] = `/uploads/${fileName}`; // Assign the correct image path
        } catch (error) {
          console.error("Error saving image:", error);
          return res.status(500).json({ message: 'Error saving image', error });
        }
      }

      // Proceed to save valid entries to the database
      try {
        const connection = await db();

        for (let i = 0; i < invNumber.length; i++) {
          const query = `
            INSERT INTO results (invNumber, total, originalContent, nasLocation, imagePath)
            VALUES (?, ?, ?, ?, ?)
          `;
          const values = [invNumber[i], total[i], originalContent[i], nasLocation[i], imagePaths[i]];

          await connection.query(query, values);
        }

        connection.end();
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
