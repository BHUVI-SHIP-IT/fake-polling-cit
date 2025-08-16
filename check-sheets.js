import XLSX from 'xlsx';

function checkSheets() {
  try {
    console.log('🔍 Checking all sheets in Competitive IDs file...\n');
    
    // Read Competitive IDs Excel
    const competitiveWorkbook = XLSX.readFile('./competitive-ids.xlsx');
    
    console.log('📋 All sheet names:');
    competitiveWorkbook.SheetNames.forEach((sheetName, index) => {
      console.log(`   ${index + 1}: "${sheetName}"`);
    });
    
    console.log('\n🔍 Analyzing each sheet...\n');
    
    competitiveWorkbook.SheetNames.forEach((sheetName, index) => {
      console.log(`📊 Sheet ${index + 1}: "${sheetName}"`);
      
      const sheet = competitiveWorkbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);
      
      console.log(`   Records: ${data.length}`);
      
      if (data.length > 0) {
        // Check sections in this sheet
        const sections = {};
        data.forEach(record => {
          const section = record['SECTION'] || record['Section'] || 'Unknown';
          if (!sections[section]) {
            sections[section] = [];
          }
          sections[section].push(record);
        });
        
        console.log(`   Sections found: ${Object.keys(sections).join(', ')}`);
        
        Object.keys(sections).forEach(section => {
          console.log(`     Section ${section}: ${sections[section].length} students`);
          if (sections[section].length <= 3) {
            sections[section].forEach(student => {
              const regNo = student['Reg. NO'] || student['REG NO'] || 'Unknown';
              const name = student['STUDENT NAME'] || student['Name'] || 'Unknown';
              console.log(`       - ${regNo}: ${name}`);
            });
          }
        });
      }
      
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSheets(); 