import XLSX from 'xlsx';
import fs from 'fs';

function fixConversion() {
  try {
    console.log('🔧 Fixing Excel to CSV conversion...\n');
    
    // Read Student Info Excel
    console.log('📖 Reading Student Info file...');
    const studentWorkbook = XLSX.readFile('./student-info.xlsx');
    const studentSheet = studentWorkbook.Sheets[studentWorkbook.SheetNames[0]];
    const studentData = XLSX.utils.sheet_to_json(studentSheet);
    
    console.log(`   Found ${studentData.length} students\n`);
    
    // Read Competitive IDs Excel with better options
    console.log('📖 Reading Competitive IDs file with better parsing...');
    const competitiveWorkbook = XLSX.readFile('./competitive-ids.xlsx', {
      cellDates: true,
      cellNF: false,
      cellText: false
    });
    const competitiveSheet = competitiveWorkbook.Sheets[competitiveWorkbook.SheetNames[0]];
    
    // Get the actual range of data
    const range = XLSX.utils.decode_range(competitiveSheet['!ref']);
    console.log(`   Excel range: ${competitiveSheet['!ref']}`);
    console.log(`   Rows: ${range.e.r + 1}, Columns: ${range.e.c + 1}\n`);
    
    const competitiveData = XLSX.utils.sheet_to_json(competitiveSheet, {
      header: 1,
      defval: '',
      blankrows: false
    });
    
    console.log(`   Raw competitive data rows: ${competitiveData.length}\n`);
    
    // Convert to proper format
    const headers = competitiveData[0];
    const dataRows = competitiveData.slice(1);
    
    console.log('📋 Headers found:');
    headers.forEach((header, index) => {
      console.log(`   ${index}: ${header}`);
    });
    
    console.log('\n📊 First few data rows:');
    dataRows.slice(0, 5).forEach((row, index) => {
      console.log(`   Row ${index + 1}: ${row.join(' | ')}`);
    });
    
    // Now convert to proper objects
    const competitiveObjects = dataRows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
    
    console.log(`\n🏆 Converted competitive records: ${competitiveObjects.length}`);
    
    // Check sections
    const sections = {};
    competitiveObjects.forEach(record => {
      const section = record['SECTION'] || record['Section'] || 'Unknown';
      if (!sections[section]) {
        sections[section] = [];
      }
      sections[section].push(record);
    });
    
    console.log('\n📋 Sections found:');
    Object.keys(sections).sort().forEach(section => {
      console.log(`   Section ${section}: ${sections[section].length} students`);
    });
    
    // Show sample from each section
    Object.keys(sections).sort().forEach(section => {
      const sample = sections[section][0];
      if (sample) {
        console.log(`   Section ${section} sample: ${sample['Reg. NO'] || sample['REG NO']} - ${sample['STUDENT NAME'] || sample['Name']}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

fixConversion(); 