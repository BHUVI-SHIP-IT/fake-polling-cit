import XLSX from 'xlsx';

function checkSections() {
  try {
    console.log('🔍 Checking sections in Competitive IDs file...\n');
    
    // Read Competitive IDs Excel
    const competitiveWorkbook = XLSX.readFile('./competitive-ids.xlsx');
    const competitiveSheet = competitiveWorkbook.Sheets[competitiveWorkbook.SheetNames[0]];
    const competitiveData = XLSX.utils.sheet_to_json(competitiveSheet);
    
    console.log(`📊 Total competitive ID records: ${competitiveData.length}\n`);
    
    // Check sections
    const sections = {};
    competitiveData.forEach((record, index) => {
      const section = record['SECTION'] || 'Unknown';
      const regNo = record['Reg. NO'] || 'Unknown';
      const name = record['STUDENT NAME'] || 'Unknown';
      
      if (!sections[section]) {
        sections[section] = [];
      }
      sections[section].push({ regNo, name });
    });
    
    console.log('📋 Sections found in Competitive IDs file:');
    Object.keys(sections).sort().forEach(section => {
      console.log(`   Section ${section}: ${sections[section].length} students`);
      if (sections[section].length <= 5) {
        sections[section].forEach(student => {
          console.log(`     - ${student.regNo}: ${student.name}`);
        });
      } else {
        console.log(`     - First 3: ${sections[section].slice(0, 3).map(s => s.regNo).join(', ')}`);
        console.log(`     - Last 3: ${sections[section].slice(-3).map(s => s.regNo).join(', ')}`);
      }
    });
    
    console.log('\n🔍 Sample records by section:');
    Object.keys(sections).sort().forEach(section => {
      const firstStudent = sections[section][0];
      console.log(`   Section ${section}: ${firstStudent.regNo} - ${firstStudent.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSections(); 