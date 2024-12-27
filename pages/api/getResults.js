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

// Preprocess the search query to handle "g.skill"/"gskill" and other patterns
const preprocessQuery = (query) => {
    // Check if the query seems to be for nasLocation
    const isNasLocation = /naslocation|\\\\/.test(query); // Check for "naslocation" or literal backslashes
    const isTotal = /\btotal\b/i.test(query);
    const isDate = /created_at,\s*'%d\/%m\/%Y'/i.test(query);
    const isInvoiceId = /\btotal,\s*'_',\s*invNumber\b/i.test(query);

    if (isNasLocation || isTotal || isDate || isInvoiceId) {
        // If it's a nasLocation query, skip further replacements
        return query.trim();
    }

    return query
        // Replace "gskill" with "g.skill" for consistent searching
        .replace(/\bgskill\b/gi, 'g.skill')

        // Remove specific prefixes
        .replace(/\b(speaker|accessories|monitor & accessories|powersupply (psu)|peripherals|gaming chair|gaming desk|software (optional)|optical drive|networking (wifi receiver)|networking (wifi router)|amd ryzen prcessor|intel processor|psu|ram|ssd|hdd|os|powersupplyunit|motherboard (intel)|motherboard (amd)|cooler|graphic card|case):\s*/gi, '')

        // Remove "| RM XX" pattern, case insensitive
        .replace(/\s?\|\s?rm\s?\d+\b/gi, '')

        // Remove "7 YEARS WARRANTY" or similar patterns
        .replace(/\b\d+\s?years?\s?warranty\b/gi, '')

        // Remove anything inside square brackets, including brackets
        .replace(/\s?\[.*?\]\s?/g, '')

        // Replace multiple spaces with a single space
        .replace(/\s+/g, ' ')

        // Remove descriptive words
        .replace(/\b(Dual Chamber|Touchscreen|ATX Case|with|Cooling|Matte)\b/gi, '')

        // Trim any extra whitespace
        .trim();
};

export default async function handler(req, res) {
    const page = parseInt(req.query.page, 10) || 1;
    const perPage = parseInt(req.query.perPage, 10) || 10;
    const offset = (page - 1) * perPage;
    let searchQuery = req.query.search ? req.query.search.toLowerCase() : '';

    // Preprocess the search query to handle specific patterns
    searchQuery = preprocessQuery(searchQuery);

    try {
        const connection = await db();

        // Fetch the total count of all results in the database
        const [[{ totalCount }]] = await connection.query(`SELECT COUNT(*) as totalCount FROM results`);

        // Escape backslashes in search query for nasLocation and other fields
        const escapedSearch = searchQuery.replace(/\\/g, '\\\\');

        // Base SQL query to fetch results
        let sqlQuery = `
            SELECT invNumber, total, originalContent, nasLocation, imagePath, status, created_at,
            DATE_FORMAT(created_at, '%d/%m/%Y') AS formatted_date  -- Format created_at for search
            FROM results
        `;

        const queryParams = [];
        let whereClauses = [];

        // If search query is present, split it into terms and create conditions
        if (searchQuery) {
            const terms = escapedSearch.split(' ').filter(term => term && term !== "core");

            terms.forEach(term => {
                // Special handling for "g.skill" or "gskill" search terms
                if (term === "g.skill" || term === "gskill") {
                    whereClauses.push(`(
                        LOWER(originalContent) LIKE ? OR LOWER(originalContent) LIKE ?
                    )`);
                    queryParams.push(`%gskill%`, `%g.skill%`);
                } else {
                    // Handle other terms, both numeric and non-numeric
                    const searchPattern = `%${term}%`;
                    whereClauses.push(`(
                        LOWER(invNumber) LIKE ? 
                        OR LOWER(total) LIKE ? 
                        OR LOWER(originalContent) LIKE ? 
                        OR LOWER(nasLocation) LIKE ? 
                        OR LOWER(status) LIKE ? 
                        OR DATE_FORMAT(created_at, '%d/%m/%Y') LIKE ?  -- Formats created_at to DD/MM/YYYY for search
                        OR LOWER(CONCAT(total, '_', invNumber)) LIKE ?
                    )`);
                    queryParams.push(
                        searchPattern,
                        searchPattern,
                        searchPattern,
                        searchPattern,
                        searchPattern,
                        searchPattern,
                        searchPattern
                    );
                }
            });

            sqlQuery += ` WHERE ` + whereClauses.join(' AND ');
        }

        // Fetch results with filtering and sorting
        const [results] = await connection.query(sqlQuery, queryParams);

        // Sort results by nasLocation date and total
        const sortedResults = sortResultsByNasLocationAndTotal(results);

         // Total filtered results
         const filteredCount = sortedResults.length;

        // Paginate sorted results if there's no search query, otherwise return all matching results
        const paginatedResults = sortedResults.slice(offset, offset + perPage);

        connection.end();

        res.status(200).json({ results: paginatedResults, totalCount: filteredCount });
    } catch (error) {
        console.error("Error fetching results:", error);
        res.status(500).json({ message: 'Error fetching results', error });
    }
}