import db from '@/utils/mysql';

export default async function handler(req, res) {
    try {
        const connection = await db();
        const [rows] = await connection.query('SELECT 1 + 1 AS result');
        connection.end();

        res.status(200).json({ message: 'Connected successfully!', result: rows[0].result });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ message: 'Error connecting to the database', error });
    }
}
