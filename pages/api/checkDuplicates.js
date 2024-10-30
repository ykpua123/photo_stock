// /api/checkDuplicates.js
import db from '@/utils/mysql';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { invNumbers } = req.body;

            if (!Array.isArray(invNumbers) || invNumbers.length === 0) {
                return res.status(400).json({ message: 'No invNumbers provided.' });
            }

            const connection = await db();

            // Use `IN` clause to check for duplicates in one query
            const [results] = await connection.query(
                `SELECT invNumber FROM results WHERE invNumber IN (?)`, 
                [invNumbers]
            );

            connection.end();

            // Extract and return only the invNumbers that exist in the database
            const existingInvNumbers = results.map(row => row.invNumber);
            res.status(200).json({ duplicates: existingInvNumbers });
        } catch (error) {
            console.error('Error checking duplicates:', error);
            res.status(500).json({ message: 'Error checking duplicates', error });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}
