import React, { useState } from 'react';
import Papa from 'papaparse';

interface StudentData {
  rollNumber: string;
  collegeEmail: string;
  name: string;
  personalEmail: string;
  year: string;
  section: string;
  department: string;
  leetcodeId?: string;
  leetcodeContestId?: string;
  codechefId?: string;
  codeforcesId?: string;
  otherIds?: Array<{ platform: string; id: string }>;
}

interface UploadResult {
  success: number;
  failed: number;
  errors: string[];
}

const BulkUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<StudentData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      parseCSV(selectedFile);
    } else {
      setError('Please select a valid CSV file');
    }
  };

  const parseCSV = (file: File) => {
    // First try Papa Parse
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transform: (value: string) => value.trim(),
      error: (error: any) => {
        console.error('CSV parsing error:', error);
        setError(`Error parsing CSV: ${error.message}`);
      },
      complete: (results: any) => {
        console.log('CSV parsing results:', results);
        console.log('Total rows:', results.data.length);
        console.log('Errors:', results.errors);
        
        // If Papa Parse only got 2 rows, try manual parsing
        if (results.data.length <= 2) {
          console.log('Papa Parse got too few rows, trying manual parsing...');
          parseCSVManually(file);
          return;
        }
        
        // Filter out invalid rows and clean data
        const students = results.data
          .filter((row: any) => {
            // Check if row has required fields
            const hasRequiredFields = row.rollNumber && 
              row.rollNumber !== 'REG NO' && 
              row.rollNumber.trim() !== '' &&
              row.collegeEmail && 
              row.collegeEmail.trim() !== '' &&
              row.name && 
              row.name.trim() !== '';
            
            if (!hasRequiredFields) {
              console.log('Filtered out row:', row);
            }
            
            return hasRequiredFields;
          })
          .map((row: any) => {
            // Clean and validate data
            const cleanedRow = {
              rollNumber: row.rollNumber.trim(),
              collegeEmail: row.collegeEmail.trim(),
              name: row.name.trim(),
              personalEmail: row.personalEmail?.trim() || '',
              year: row.year?.trim() || '2',
              section: row.section?.trim() || 'A',
              department: row.department?.trim() || 'CSE',
              leetcodeId: row.leetcodeId?.trim() || undefined,
              leetcodeContestId: row.leetcodeContestId?.trim() || undefined,
              codechefId: row.codechefId?.trim() || undefined,
              codeforcesId: row.codeforcesId?.trim() || undefined,
              otherIds: row.otherIds ? row.otherIds : undefined
            };
            
            console.log('Cleaned row:', cleanedRow);
            return cleanedRow;
          }) as StudentData[];
        
        console.log('Filtered students count:', students.length);
        console.log('Filtered students:', students);
        
        if (students.length === 0) {
          setError('No valid student data found in CSV. Please check the file format.');
        } else {
          setPreview(students);
          setError('');
        }
      }
    });
  };

  // Fallback manual CSV parsing
  const parseCSVManually = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n');
      
      console.log('Manual parsing - Total lines:', lines.length);
      
      // Skip header and placeholder row
      const dataLines = lines.slice(2).filter(line => line.trim() !== '');
      console.log('Manual parsing - Data lines:', dataLines.length);
      
      const students: StudentData[] = [];
      
              dataLines.forEach((line, index) => {
          try {
            // Split by comma, but handle quoted fields
            const fields = line.split(',').map(field => field.trim());
            
            if (fields.length >= 7) {
              const student: StudentData = {
                rollNumber: fields[0] || '',
                collegeEmail: fields[1] || '',
                name: fields[2] || '',
                personalEmail: fields[3] || '',
                year: fields[4] || '2',
                section: fields[5] || 'A',
                department: fields[6] || 'CSE',
                leetcodeId: fields[7] || undefined,
                leetcodeContestId: fields[8] || undefined,
                codechefId: fields[9] || undefined,
                codeforcesId: fields[10] || undefined,
                otherIds: fields[11] ? (() => {
                  try {
                    return JSON.parse(fields[11]);
                  } catch (error) {
                    console.log(`Warning: Invalid JSON in otherIds for line ${index + 3}:`, fields[11]);
                    return undefined;
                  }
                })() : undefined
              };
              
              // Validate required fields
              if (student.rollNumber && student.rollNumber !== 'REG NO' && 
                  student.rollNumber.trim() !== '' &&
                  student.collegeEmail && student.collegeEmail.trim() !== '' &&
                  student.name && student.name.trim() !== '') {
                students.push(student);
                console.log(`Successfully parsed student: ${student.rollNumber} - ${student.name}`);
              } else {
                console.log(`Skipping invalid student data at line ${index + 3}:`, student);
              }
            } else {
              console.log(`Skipping line ${index + 3} - insufficient fields (${fields.length}):`, line);
            }
          } catch (error) {
            console.log(`Error parsing line ${index + 3}:`, error);
            console.log(`Line content:`, line);
          }
        });
      
      console.log('Manual parsing - Valid students:', students.length);
      setPreview(students);
      setError('');
    };
    
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!preview.length) return;

    setUploading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/import-students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ students: preview }),
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setResult(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `rollNumber,collegeEmail,name,personalEmail,year,section,department,leetcodeId,leetcodeContestId,codechefId,codeforcesId,otherIds
21CS001,student1@college.edu,John Doe,student1@personal.com,3,A,Computer Science,student1_lc,student1_contest,student1_cc,student1_cf,"[{""platform"":""HackerRank"",""id"":""student1_hr""}]"
21CS002,student2@college.edu,Jane Smith,student2@personal.com,3,A,Computer Science,student2_lc,student2_contest,student2_cc,student2_cf,"[{""platform"":""AtCoder"",""id"":""student2_at""}]"`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Bulk Student Upload</h2>
        
        {/* Instructions */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">How to use:</h3>
          <ol className="list-decimal list-inside text-blue-700 space-y-1">
            <li>Download the CSV template below</li>
            <li>Fill in your student data</li>
            <li>Upload the CSV file</li>
            <li>Review the preview and upload</li>
          </ol>
        </div>

        {/* Template Download */}
        <div className="mb-6">
          <button
            onClick={downloadTemplate}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            📥 Download CSV Template
          </button>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Preview */}
        {preview.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Preview ({preview.length} students)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll</th>
                    <th className="px-3 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-3 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">College Email</th>
                    <th className="px-3 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                    <th className="px-3 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                    <th className="px-3 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 10).map((student, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 border-b text-sm text-gray-900">{student.rollNumber}</td>
                      <td className="px-3 py-2 border-b text-sm text-gray-900">{student.name}</td>
                      <td className="px-3 py-2 border-b text-sm text-gray-900">{student.collegeEmail}</td>
                      <td className="px-3 py-2 border-b text-sm text-gray-900">{student.year}</td>
                      <td className="px-3 py-2 border-b text-sm text-gray-900">{student.section}</td>
                      <td className="px-3 py-2 border-b text-sm text-gray-900">{student.department}</td>
                    </tr>
                  ))}
                  {preview.length > 10 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-2 text-sm text-gray-500 text-center">
                        ... and {preview.length - 10} more students
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Upload Button */}
        {preview.length > 0 && (
          <div className="mb-6">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              {uploading ? 'Uploading...' : `Upload ${preview.length} Students`}
            </button>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Upload Results</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{result.success}</div>
                <div className="text-sm text-gray-600">Successfully Added</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{result.success + result.failed}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
            
            {result.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-red-600 mb-2">Errors:</h4>
                <ul className="text-sm text-red-600 space-y-1">
                  {result.errors.slice(0, 5).map((error, index) => (
                    <li key={index} className="ml-4">• {error}</li>
                  ))}
                  {result.errors.length > 5 && (
                    <li className="ml-4 text-gray-500">... and {result.errors.length - 5} more errors</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Important Notes */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Important Notes:</h3>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>• All students will have default password: <code className="bg-yellow-200 px-1 rounded">Student@123</code></li>
            <li>• Students can change their password after first login</li>
            <li>• Duplicate college emails will be skipped</li>
            <li>• Classes will be automatically created based on year/section/department</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BulkUpload; 