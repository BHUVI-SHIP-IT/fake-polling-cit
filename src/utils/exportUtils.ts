import { Student, PollResponse, Poll } from '../types';

export interface ExportData {
  student: Student;
  response: PollResponse;
  poll: Poll;
  status: 'correct' | 'fake';
}

export const exportToExcel = (data: ExportData[], filename: string) => {
  // Convert data to CSV format
  const headers = [
    'Roll Number',
    'College Email',
    'Personal Email',
    'Year',
    'Section',
    'Department',
    'LeetCode ID',
    'CodeChef ID',
    'Codeforces ID',
    'Poll Title',
    'Submitted At',
    'Status',
    'Flag Reason',
    'Response Details'
  ];

  const csvData = data.map(item => [
    item.student.rollNumber,
    item.student.collegeEmail,
    item.student.personalEmail,
    item.student.year,
    item.student.section,
    item.student.department,
    item.student.leetcodeId || '',
    item.student.codechefId || '',
    item.student.codeforcesId || '',
    item.poll.title,
    item.response.submittedAt.toISOString(),
    item.status,
    item.response.flagReason || '',
    JSON.stringify(item.response.answers)
  ]);

  const csvContent = [headers, ...csvData]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const generateFakePollersReport = (responses: PollResponse[], students: Student[], polls: Poll[]) => {
  const fakeResponses = responses.filter(response => response.isFlagged);
  
  const exportData: ExportData[] = fakeResponses.map(response => {
    const student = students.find(s => s.id === response.studentId)!;
    const poll = polls.find(p => p.id === response.pollId)!;
    
    return {
      student,
      response,
      poll,
      status: 'fake'
    };
  });

  exportToExcel(exportData, `fake_pollers_${new Date().toISOString().split('T')[0]}.csv`);
};

export const generateCorrectPollersReport = (responses: PollResponse[], students: Student[], polls: Poll[]) => {
  const correctResponses = responses.filter(response => !response.isFlagged);
  
  const exportData: ExportData[] = correctResponses.map(response => {
    const student = students.find(s => s.id === response.studentId)!;
    const poll = polls.find(p => p.id === response.pollId)!;
    
    return {
      student,
      response,
      poll,
      status: 'correct'
    };
  });

  exportToExcel(exportData, `correct_pollers_${new Date().toISOString().split('T')[0]}.csv`);
};

export const generateAllPollersReport = (responses: PollResponse[], students: Student[], polls: Poll[]) => {
  const exportData: ExportData[] = responses.map(response => {
    const student = students.find(s => s.id === response.studentId)!;
    const poll = polls.find(p => p.id === response.pollId)!;
    
    return {
      student,
      response,
      poll,
      status: response.isFlagged ? 'fake' : 'correct'
    };
  });

  exportToExcel(exportData, `all_poll_responses_${new Date().toISOString().split('T')[0]}.csv`);
};