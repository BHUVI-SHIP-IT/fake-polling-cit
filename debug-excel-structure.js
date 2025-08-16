import XLSX from 'xlsx';

function debugExcelStructure() {
  try {
    console.log('🔍 Debugging Excel file structure...\n');
    
    // Read Student Info Excel
    console.log('📖 Reading Student Info file structure...');
    const studentWorkbook = XLSX.readFile('./student-info.xlsx');
    const studentSheet = studentWorkbook.Sheets[studentWorkbook.SheetNames[0]];
    const studentData = XLSX.utils.sheet_to_json(studentSheet);
    
    if (studentData.length > 0) {
      console.log('📋 Student Info file columns:');
      console.log(Object.keys(studentData[0]));
      console.log('\n📊 First row sample:');
      console.log(studentData[0]);
    }
    
    console.log(`\n👥 Total student records: ${studentData.length}\n`);
    
    // Read Competitive IDs Excel
    console.log('📖 Reading Competitive IDs file structure...');
    const competitiveWorkbook = XLSX.readFile('./competitive-ids.xlsx');
    const competitiveSheet = competitiveWorkbook.Sheets[competitiveWorkbook.SheetNames[0]];
    const competitiveData = XLSX.utils.sheet_to_json(competitiveSheet);
    
    if (competitiveData.length > 0) {
      console.log('📋 Competitive IDs file columns:');
      console.log(Object.keys(competitiveData[0]));
      console.log('\n📊 First row sample:');
      console.log(competitiveData[0]);
    }
    
    console.log(`\n🏆 Total competitive ID records: ${competitiveData.length}\n`);
    
  } catch (error) {
    console.error('❌ Error reading Excel files:', error.message);
  }
}

debugExcelStructure(); 