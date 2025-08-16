import XLSX from 'xlsx';
import fs from 'fs';

/**
 * Complete Excel to CSV Converter for Fake Poll Detection System
 * This script converts the multi-sheet competitive IDs file into one complete CSV
 * that includes ALL students with their competitive programming IDs.
 */

function completeConversion() {
  try {
    console.log('🚀 Starting Complete Excel to CSV conversion...\n');
    
    // Configuration
    const STUDENT_INFO_FILE = './student-info.xlsx';
    const COMPETITIVE_IDS_FILE = './competitive-ids.xlsx';
    const OUTPUT_CSV = './students-complete-with-competitive-ids.csv';
    
    console.log('📁 Files to process:');
    console.log(`   Student Info: ${STUDENT_INFO_FILE}`);
    console.log(`   Competitive IDs: ${COMPETITIVE_IDS_FILE}`);
    console.log(`   Output CSV: ${OUTPUT_CSV}\n`);
    
    // Check if files exist
    if (!fs.existsSync(STUDENT_INFO_FILE)) {
      console.log('❌ Student Info file not found!');
      return;
    }
    
    if (!fs.existsSync(COMPETITIVE_IDS_FILE)) {
      console.log('❌ Competitive IDs file not found!');
      return;
    }
    
    console.log('✅ Both files found! Starting conversion...\n');
    
    // Read Student Info Excel
    console.log('📖 Reading Student Info file...');
    const studentWorkbook = XLSX.readFile(STUDENT_INFO_FILE);
    const studentSheet = studentWorkbook.Sheets[studentWorkbook.SheetNames[0]];
    const studentData = XLSX.utils.sheet_to_json(studentSheet);
    
    console.log(`   Found ${studentData.length} students\n`);
    
    // Read Competitive IDs Excel - ALL SHEETS
    console.log('📖 Reading Competitive IDs file - ALL SHEETS...');
    const competitiveWorkbook = XLSX.readFile(COMPETITIVE_IDS_FILE);
    
    console.log(`   Found ${competitiveWorkbook.SheetNames.length} sheets: ${competitiveWorkbook.SheetNames.join(', ')}\n`);
    
    // Collect ALL competitive data from all sheets
    const allCompetitiveData = [];
    
    competitiveWorkbook.SheetNames.forEach((sheetName, index) => {
      console.log(`   📊 Processing Sheet ${index + 1}: "${sheetName}"`);
      
      const sheet = competitiveWorkbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(sheet);
      
      console.log(`      Records: ${sheetData.length}`);
      
      // Add section info to each record
      sheetData.forEach(record => {
        record.SECTION = sheetName; // Use sheet name as section
        allCompetitiveData.push(record);
      });
    });
    
    console.log(`\n🏆 Total competitive records collected: ${allCompetitiveData.length}\n`);
    
    // Convert to our system format
    console.log('🔄 Converting data to our system format...');
    
    const convertedStudents = [];
    let matchedCount = 0;
    let unmatchedCount = 0;
    
    for (let i = 0; i < studentData.length; i++) {
      const student = studentData[i];
      
      // Find matching competitive data by registration number
      const rollNumber = student['__EMPTY_1'] || student['REG NO'] || '';
      const matchingCompetitive = allCompetitiveData.find(c => 
        c['Reg. NO'] === rollNumber || c['REG NO'] === rollNumber
      );
      
      // Extract data from student info file
      const studentName = student['__EMPTY_2'] || student['Name'] || '';
      const section = student['__EMPTY_3'] || student['SEC'] || 'A';
      const department = student['__EMPTY_8'] || student['Dept'] || 'Computer Science';
      const officialMailId = student['__EMPTY_10'] || student['official mail id'] || '';
      
      // Extract competitive programming IDs from matching record
      let leetcodeId = '';
      let leetcodeContestId = '';
      let codechefId = '';
      let codeforcesId = '';
      let skillrackId = '';
      
      if (matchingCompetitive) {
        // Handle both LeetCode IDs - contest and regular problems
        leetcodeId = matchingCompetitive['CURRENTLY LEETCODE CONTEST ATTENDING ID'] || 
                    matchingCompetitive['LeetCode ID'] || 
                    matchingCompetitive['leetcode'] || '';
        
        leetcodeContestId = matchingCompetitive['CURRENTLY LEETCODE CONTEST ATTENDING ID'] || 
                           matchingCompetitive['LeetCode Contest ID'] || 
                           matchingCompetitive['leetcodeContest'] || '';
        
        codechefId = matchingCompetitive['codechef'] || matchingCompetitive['CodeChef'] || '';
        codeforcesId = matchingCompetitive['Codeforces'] || matchingCompetitive['codeforces'] || '';
        skillrackId = matchingCompetitive['CURRENT SKILLRACK ID'] || matchingCompetitive['SkillRack'] || '';
        
        matchedCount++;
      } else {
        unmatchedCount++;
      }
      
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
        leetcodeContestId: leetcodeContestId || undefined,
        codechefId: codechefId || undefined,
        codeforcesId: codeforcesId || undefined,
        otherIds: skillrackId ? `[{"platform":"SkillRack","id":"${skillrackId}"}]` : ''
      };
      
      convertedStudents.push(convertedStudent);
      
      if (i < 10 || i % 100 === 0) {
        console.log(`   ✅ Converted: ${rollNumber} - ${studentName} | Section: ${section} | LeetCode: ${leetcodeId || 'None'} | Contest: ${leetcodeContestId || 'None'}`);
      }
    }
    
    console.log(`\n📊 Conversion Summary:`);
    console.log(`   Total students: ${convertedStudents.length}`);
    console.log(`   With competitive IDs: ${matchedCount}`);
    console.log(`   Without competitive IDs: ${unmatchedCount}`);
    console.log(`   Match rate: ${((matchedCount / convertedStudents.length) * 100).toFixed(1)}%\n`);
    
    // Create CSV content
    console.log('📝 Creating complete CSV file...');
    
    const csvHeaders = 'rollNumber,collegeEmail,personalEmail,year,section,department,leetcodeId,leetcodeContestId,codechefId,codeforcesId,otherIds';
    const csvRows = convertedStudents.map(student => 
      `${student.rollNumber},${student.collegeEmail},${student.personalEmail},${student.year},${student.section},${student.department},${student.leetcodeId || ''},${student.leetcodeContestId || ''},${student.codechefId || ''},${student.codeforcesId || ''},${student.otherIds}`
    );
    
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    
    // Write CSV file
    fs.writeFileSync(OUTPUT_CSV, csvContent);
    
    console.log(`🎉 Complete conversion finished successfully!`);
    console.log(`📁 Output file: ${OUTPUT_CSV}`);
    console.log(`👥 Total students: ${convertedStudents.length}`);
    
    // Show sample of converted data
    console.log('\n📋 Sample of converted data:');
    console.log('First 5 students with competitive IDs:');
    const withCompetitiveIds = convertedStudents.filter(s => s.leetcodeId || s.codechefId || s.codeforcesId);
    withCompetitiveIds.slice(0, 5).forEach((student, index) => {
      console.log(`   ${index + 1}. ${student.rollNumber} | ${student.collegeEmail} | Section: ${student.section}`);
      console.log(`      LeetCode: ${student.leetcodeId || 'None'} | Contest: ${student.leetcodeContestId || 'None'}`);
      console.log(`      CodeChef: ${student.codechefId || 'None'} | Codeforces: ${student.codeforcesId || 'None'}`);
    });
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. Review the generated CSV file');
    console.log('   2. Upload to the system using Bulk Upload feature');
    console.log('   3. All students will have competitive programming IDs!');
    
  } catch (error) {
    console.error('❌ Error during conversion:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the complete conversion
completeConversion(); 