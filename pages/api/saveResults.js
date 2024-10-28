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

      if (!Array.isArray(invNumber) || !Array.isArray(total) || !Array.isArray(originalContent) || !Array.isArray(nasLocation)) {
        return res.status(400).json({ message: 'Invalid data format, expecting arrays' });
      }

      if (fields.errors && fields.errors.length > 0) {
        return res.status(400).json({ message: 'Entries were unable to save due to errors.', errors: fields.errors });
      }

      let imagePaths = [];

      for (let i = 0; i < invNumber.length; i++) {
        const imageFile = files.image[i];
        const fileName = `${Date.now()}_${imageFile.originalFilename}`;
        const newFilePath = path.join(uploadDir, fileName);

        try {
          fs.renameSync(imageFile.filepath, newFilePath);
          imagePaths[i] = `/uploads/${fileName}`;
        } catch (error) {
          console.error("Error saving image:", error);
          return res.status(500).json({ message: 'Error saving image', error });
        }
      }

      // Combine all entry data into objects for sorting
      const entries = invNumber.map((_, i) => ({
        invNumber: invNumber[i],
        total: total[i].startsWith("RM") ? total[i] : `RM${total[i]}`, // Ensure "RM" prefix for display
        totalValue: parseFloat(total[i].replace(/[^0-9.-]+/g, '')), // Strip "RM" for sorting
        originalContent: originalContent[i],
        nasLocation: nasLocation[i],
        imagePath: imagePaths[i],
        date: (() => {
          const match = nasLocation[i].match(/(\d{2})(\d{2})(\d{2})_/);
          if (match) {
            const year = parseInt(match[1], 10) + 2000;
            const month = parseInt(match[2], 10) - 1;
            const day = parseInt(match[3], 10);
            return new Date(year, month, day);
          }
          return new Date(0); // Default to epoch date if parsing fails
        })(),
      }));

      // Sort entries by date (newest to oldest), then by total (low to high)
      entries.sort((a, b) => {
        if (b.date - a.date !== 0) return b.date - a.date; // Sort by date descending
        return a.totalValue - b.totalValue; // Sort by total ascending if dates are equal
      });

      // Proceed to save sorted entries to the database
      try {
        const connection = await db();

        for (const entry of entries) {
          const query = `
            INSERT INTO results (invNumber, total, originalContent, nasLocation, imagePath)
            VALUES (?, ?, ?, ?, ?)
          `;
          const values = [entry.invNumber, entry.total, entry.originalContent, entry.nasLocation, entry.imagePath];

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
