import db from '@/utils/mysql';

export default async function handler(req, res) {
  const resultsPerPage = 1000; // Load a large number of results (or all) initially
  const offset = 0; // Fetch from the beginning

  try {
    const connection = await db();

    // Fetch all results including the created_at field
    const sqlQuery = `
      SELECT invNumber, total, originalContent, nasLocation, imagePath, status, created_at 
      FROM results
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const queryParams = [resultsPerPage, offset];

    // Fetch the results
    const [results] = await connection.query(sqlQuery, queryParams);

    // Count total results in the database
    const [[{ totalCount }]] = await connection.query(`
      SELECT COUNT(*) as totalCount FROM results
    `);

    connection.end();

    // Return the full results and total count to the frontend
    res.status(200).json({ results, totalCount });

  } catch (error) {
    console.error("Error fetching results:", error);
    res.status(500).json({ message: 'Error fetching results', error });
  }
}
