import db from '@/utils/mysql';

// Function to extract the date from nasLocation
const extractDateFromNasLocation = (nasLocation) => {
    const regex = /(\d{2})(\d{2})(\d{2})_/;
    const match = nasLocation.match(regex);

    if (match) {
        const year = parseInt(match[1], 10) + 2000;
        const month = parseInt(match[2], 10) - 1;
        const day = parseInt(match[3], 10);
        return new Date(year, month, day);
    }
    return null;
};

// Function to convert total to a float number
const parseTotal = (total) => {
    return parseFloat(total.replace(/[^0-9.-]+/g, ''));
};

// Sort results by nasLocation date (newest to oldest), then by total (low to high)
const sortResultsByNasLocationAndTotal = (data) => {
    return data.sort((a, b) => {
        const dateA = extractDateFromNasLocation(a.nasLocation);
        const dateB = extractDateFromNasLocation(b.nasLocation);

        if (dateA && dateB) {
            const dateDiff = dateB - dateA;
            if (dateDiff !== 0) return dateDiff;
        }

        const totalA = parseTotal(a.total);
        const totalB = parseTotal(b.total);
        return totalA - totalB;
    });
};

export default async function handler(req, res) {
    const page = parseInt(req.query.page, 10) || 1;
    const perPage = parseInt(req.query.perPage, 10) || 10;
    const offset = (page - 1) * perPage;
    const searchQuery = req.query.search ? req.query.search.toLowerCase() : '';

    try {
        const connection = await db();

        // Base SQL query to fetch results
        let sqlQuery = `
            SELECT invNumber, total, originalContent, nasLocation, imagePath, status, created_at
            FROM results
        `;

        const queryParams = [];
        let whereClauses = [];

        // If search query is present, split it into terms and create conditions
        if (searchQuery) {
            const terms = searchQuery.split(' ').filter(Boolean);

            terms.forEach(term => {
                const searchPattern = `%${term}%`;
                whereClauses.push(`(LOWER(invNumber) LIKE ? OR LOWER(total) LIKE ? OR LOWER(originalContent) LIKE ? OR LOWER(nasLocation) LIKE ? OR LOWER(status) LIKE ?)`);
                queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
            });

            sqlQuery += ` WHERE ` + whereClauses.join(' AND ');
        }

        // Fetch results with filtering and sorting
        const [results] = await connection.query(sqlQuery, queryParams);

        // Sort results by nasLocation date and total
        const sortedResults = sortResultsByNasLocationAndTotal(results);

        // Paginate sorted results if there's no search query, otherwise return all matching results
        const paginatedResults = searchQuery ? sortedResults : sortedResults.slice(offset, offset + perPage);

        // Get total count of results
        const totalCount = sortedResults.length;

        connection.end();

        res.status(200).json({ results: paginatedResults, totalCount });
    } catch (error) {
        console.error("Error fetching results:", error);
        res.status(500).json({ message: 'Error fetching results', error });
    }
}
