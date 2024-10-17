import fs from 'fs';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { tempFiles } = req.body;

    try {
      tempFiles.forEach(file => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file); // Delete the temporary file
          console.log(`Deleted temp file: ${file}`);
        }
      });

      res.status(200).json({ message: 'Temporary files deleted successfully!' });
    } catch (error) {
      console.error('Error deleting temporary files:', error);
      res.status(500).json({ message: 'Error deleting temporary files', error });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
