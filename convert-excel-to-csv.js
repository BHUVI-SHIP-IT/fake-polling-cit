import XLSX from 'xlsx';
import fs from 'fs';

/**
 * Excel to CSV Converter for Fake Poll Detection System
 * This script converts two separate Excel files into one CSV file
 * that matches our system's expected format.
 */

function convertExcelToCSV() {
  try {
    console.log('🔄 Starting Excel to CSV conversion...\n');
    
    // Configuration - Update these paths to match your files
    const STUDENT_INFO_FILE = './student-info.xlsx';  // File with student details
    const COMPETITIVE_IDS_FILE = './competitive-ids.xlsx';  // File with CodeChef, Codeforces, LeetCode IDs
    const OUTPUT_CSV = './students-ready-for-import.csv';
    
    console.log('📁 Expected file names:');
    console.log(`   Student Info: ${STUDENT_INFO_FILE}`);
    console.log(`   Competitive IDs: ${COMPETITIVE_IDS_FILE}`);
    console.log(`   Output CSV: ${OUTPUT_CSV}\n`);
    
    // Check if files exist
    if (!fs.existsSync(STUDENT_INFO_FILE)) {
      console.log('❌ Student Info file not found!');
      console.log('   Please rename your first Excel file to: student-info.xlsx');
      return;
    }
    
    if (!fs.existsSync(COMPETITIVE_IDS_FILE)) {
      console.log('❌ Competitive IDs file not found!');
      console.log('   Please rename your second Excel file to: competitive-ids.xlsx');
      return;
    }
    
    console.log('✅ Both files found! Starting conversion...\n');
    
    // Read Student Info Excel
    console.log('📖 Reading Student Info file...');
    const studentWorkbook = XLSX.readFile(STUDENT_INFO_FILE);
    const studentSheet = studentWorkbook.Sheets[studentWorkbook.SheetNames[0]];
    const studentData = XLSX.utils.sheet_to_json(studentSheet);
    
    console.log(`   Found ${studentData.length} students\n`);
    
    // Read Competitive IDs Excel
    console.log('📖 Reading Competitive IDs file...');
    const competitiveWorkbook = XLSX.readFile(COMPETITIVE_IDS_FILE);
    const competitiveSheet = competitiveWorkbook.Sheets[competitiveWorkbook.SheetNames[0]];
    const competitiveData = XLSX.utils.sheet_to_json(competitiveSheet);
    
    console.log(`   Found ${competitiveData.length} competitive ID records\n`);
    
    // Convert to our system format
    console.log('🔄 Converting data to our system format...');
    
    const convertedStudents = [];
    
    for (let i = 0; i < studentData.length; i++) {
      const student = studentData[i];
      
      // Find matching competitive data by registration number
      const rollNumber = student['__EMPTY_1'] || student['REG NO'] || ''; // REG NO column
      const matchingCompetitive = competitiveData.find(c => c['Reg. NO'] === rollNumber);
      
      // Extract data from student info file
      const studentName = student['__EMPTY_2'] || student['Name'] || ''; // Name column
      const section = student['__EMPTY_3'] || student['SEC'] || 'A'; // SEC column
      const department = student['__EMPTY_8'] || student['Dept'] || 'Computer Science'; // Dept column
      const officialMailId = student['__EMPTY_10'] || student['official mail id'] || ''; // official mail id column
      
      // Extract competitive programming IDs from matching record
      const leetcodeId = matchingCompetitive ? (matchingCompetitive['CURRENTLY LEETCODE CONTEST ATTENDING ID'] || '') : '';
      const codechefId = matchingCompetitive ? (matchingCompetitive['codechef'] || '') : '';
      const codeforcesId = matchingCompetitive ? (matchingCompetitive['Codeforces'] || '') : '';
      const skillrackId = matchingCompetitive ? (matchingCompetitive['CURRENT SKILLRACK ID'] || '') : '';
      
      // Generate college email from official mail id or skillrack id
      let collegeEmail = '';
      if (officialMailId && officialMailId.includes('@')) {
        collegeEmail = officialMailId;
      } else if (skillrackId && skillrackId.includes('@')) {
        collegeEmail = skillrackId;
      } else {
        collegeEmail = `${rollNumber.toLowerCase()}@college.edu`;
      }
      
      // Generate personal email
      const personalEmail = `personal.${rollNumber.toLowerCase()}@gmail.com`;
      
      // Create student record in our format
      const convertedStudent = {
        rollNumber: rollNumber,
        collegeEmail: collegeEmail,
        personalEmail: personalEmail,
        year: '2',  // 2nd year students
        section: section,
        department: department,
        leetcodeId: leetcodeId || undefined,
        leetcodeContestId: '',  // Leave empty for now
        codechefId: codechefId || undefined,
        codeforcesId: codeforcesId || undefined,
        otherIds: skillrackId ? `[{"platform":"SkillRack","id":"${skillrackId}"}]` : ''
      };
      
      convertedStudents.push(convertedStudent);
      
      console.log(`   ✅ Converted: ${rollNumber} - ${studentName} | Section: ${section} | Dept: ${department}`);
    }
    
    // Create CSV content
    console.log('\n📝 Creating CSV file...');
    
    const csvHeaders = 'rollNumber,collegeEmail,personalEmail,year,section,department,leetcodeId,leetcodeContestId,codechefId,codeforcesId,otherIds';
    const csvRows = convertedStudents.map(student => 
      `${student.rollNumber},${student.collegeEmail},${student.personalEmail},${student.year},${student.section},${student.department},${student.leetcodeId || ''},${student.leetcodeContestId},${student.codechefId || ''},${student.codeforcesId || ''},${student.otherIds}`
    );
    
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    
    // Write CSV file
    fs.writeFileSync(OUTPUT_CSV, csvContent);
    
    console.log(`\n🎉 Conversion completed successfully!`);
    console.log(`📁 Output file: ${OUTPUT_CSV}`);
    console.log(`👥 Total students converted: ${convertedStudents.length}`);
    
    // Show sample of converted data
    console.log('\n📋 Sample of converted data:');
    console.log('First 3 students:');
    convertedStudents.slice(0, 3).forEach((student, index) => {
      console.log(`   ${index + 1}. ${student.rollNumber} | ${student.collegeEmail} | Section: ${student.section} | LeetCode: ${student.leetcodeId || 'No LeetCode'}`);
    });
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. Review the generated CSV file');
    console.log('   2. Update section (A, B, C, D) if needed');
    console.log('   3. Update personal emails if you have them');
    console.log('   4. Upload to the system using Bulk Upload feature');
    
  } catch (error) {
    console.error('❌ Error during conversion:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   - Make sure both Excel files are in the same folder as this script');
    console.log('   - Check that file names match exactly');
    console.log('   - Ensure Excel files are not open in Excel while running');
  }
}

// Run the conversion
convertExcelToCSV(); 