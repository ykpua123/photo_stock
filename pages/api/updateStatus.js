import db from '@/utils/mysql';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { invNumber, status } = req.body;

    if (!invNumber || !status) {
      return res.status(400).json({ message: 'Missing invNumber or status' });
    }

    try {
      const connection = await db();

      // Update the status in the database
      const query = `
        UPDATE results
        SET status = ?
        WHERE invNumber = ?
      `;
      const values = [status, invNumber];
      await connection.query(query, values);

      connection.end();
      res.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
      console.error('Error updating status:', error);
      res.status(500).json({ message: 'Error updating status', error });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
