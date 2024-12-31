import db from '@/utils/mysql'; // Ensure this is the correct path to your database utility

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { invNumber, originalFilename, compressedImage } = req.body;

    if (!invNumber || !originalFilename || !compressedImage) {
      return res.status(400).json({ message: 'Missing required fields: invNumber, originalFilename, or compressedImage' });
    }

    try {
      const connection = await db(); // Initialize the database connection

      // File path to overwrite
      const filePath = `/uploads/${originalFilename}`;

      // Decode Base64 compressed image and save it to the file system
      const buffer = Buffer.from(compressedImage, 'base64');
      const fs = require('fs');
      const path = require('path');
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      
      // Ensure the uploads directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fullPath = path.join(uploadDir, originalFilename);
      fs.writeFileSync(fullPath, buffer); // Overwrite the file with the compressed image

      // Update the database to confirm the file path
      const query = `
        UPDATE results
        SET ImagePath = ?
        WHERE invNumber = ?
      `;
      const values = [filePath, invNumber];
      await connection.query(query, values);

      // Close the database connection
      connection.end();

      res.status(200).json({ message: 'Image successfully overwritten and database updated.' });
    } catch (error) {
      console.error('Error overwriting image:', error);
      res.status(500).json({ message: 'Error overwriting image', error });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
