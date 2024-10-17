import db from '@/utils/mysql'; // Make sure this is your DB connection
import fs from 'fs'; // File system module for file operations
import path from 'path'; // Path module for file paths

export default async function handler(req, res) {
    if (req.method === 'DELETE') {
        const { invNumber } = req.body; // Extract invNumber from the request

        try {
            const connection = await db();

            // Fetch the image path before deleting the record
            const selectQuery = `SELECT imagePath FROM results WHERE invNumber = ?`;
            const [rows] = await connection.query(selectQuery, [invNumber]);

            // Check if a result with the given invNumber exists
            if (rows.length > 0) {
                const imagePath = rows[0].imagePath;

                // Delete the image file if it exists
                if (imagePath) {
                    const fullImagePath = path.join(process.cwd(), 'public', imagePath);
                    if (fs.existsSync(fullImagePath)) {
                        fs.unlinkSync(fullImagePath); // Delete the image file
                        console.log(`Image file deleted: ${fullImagePath}`);
                    } else {
                        console.log(`Image file not found: ${fullImagePath}`);
                    }
                }

                // Now delete the record from the database
                const deleteQuery = `DELETE FROM results WHERE invNumber = ?`;
                await connection.query(deleteQuery, [invNumber]);

                connection.end();

                res.status(200).json({ message: 'Result and image deleted successfully!' });
            } else {
                // No matching record found
                res.status(404).json({ message: 'Result not found!' });
            }
        } catch (error) {
            console.error('Error deleting result:', error);
            res.status(500).json({ message: 'Error deleting result', error });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}
