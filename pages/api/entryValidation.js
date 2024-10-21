// import { IncomingForm } from 'formidable';
// import db from '@/utils/mysql';

// export const config = {
//   api: {
//     bodyParser: false, // Disable bodyParser to handle form data
//   },
// };

// export default async function handler(req, res) {
//   if (req.method === 'POST') {
//     const form = new IncomingForm();
//     form.parse(req, async (err, fields, files) => {
//       if (err) {
//         console.error("Error parsing the form:", err);
//         return res.status(500).json({ message: 'Error processing the form', err });
//       }

//       const { invNumber, total, originalContent } = fields;
//       const errors = [];

//       try {
//         const connection = await db();

//         // Loop through and validate each entry
//         for (let i = 0; i < invNumber.length; i++) {
//           let errorMessage = '';

          // Check if INV# already exists in the database
          const [existingEntry] = await connection.query('SELECT invNumber FROM results WHERE invNumber = ?', [invNumber[i]]);
          if (existingEntry.length > 0) {
            errorMessage += `INV#: ${invNumber[i]} is already in the database.\n`;
          }

//           // Check if an image is missing
//           if (!files.image || !files.image[i]) {
//             errorMessage += 'Missing image, ensure image filename matches INV#.\n';
//           }

//           // Check for required specs in originalContent
//           const requiredSpecs = ['INV#', 'CPU', 'GPU', 'CASE', 'MOBO', 'RAM', 'PSU'];
//           const missingSpecs = requiredSpecs.filter(spec => !originalContent[i].includes(spec));
//           if (missingSpecs.length > 0) {
//             errorMessage += `Missing specs: ${missingSpecs.join(', ')}. Ensure specs list format is correct.\n`;
//           }

//           // If there are errors, store them for the current entry
//           if (errorMessage) {
//             errors.push({ invNumber: invNumber[i], message: errorMessage.trim() });
//           }
//         }

//         connection.end();

//         // If errors exist, return them without saving
//         if (errors.length > 0) {
//           return res.status(400).json({ message: 'Validation failed', errors });
//         }

//         res.status(200).json({ message: 'Validation passed, no errors found' });
//       } catch (error) {
//         console.error('Error validating entries:', error);
//         res.status(500).json({ message: 'Error validating entries', error });
//       }
//     });
//   } else {
//     res.status(405).json({ message: 'Method Not Allowed' });
//   }
// }
