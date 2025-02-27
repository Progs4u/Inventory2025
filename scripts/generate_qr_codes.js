const { v4: uuidv4 } = require('uuid');

function generateQRCodes(count = 16) {
    const results = [];
    for (let i = 0; i < count; i++) {
        const uuid = uuidv4();
        const link = `https://api.progs4u.com:3001/qr/${uuid}`;
        results.push({ uuid, link });
    }
    
    // Generate SQL insert statement
    const values = results.map(r => `('${r.uuid}')`).join(',\n');
    const sqlStatement = `INSERT INTO inv_qr_codes (uuid) VALUES\n${values};`;
    
    console.log('Generated SQL Statement:');
    console.log(sqlStatement);
    
    console.log('\nGenerated QR Code Links:');
    results.forEach(r => console.log(r.link));
}

if (require.main === module) {
    generateQRCodes();
}

module.exports = generateQRCodes;
