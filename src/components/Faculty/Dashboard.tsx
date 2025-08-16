import React, { useState } from 'react';
import { Users, Plus, FileText, AlertTriangle, Download, Search, Filter, Upload, Mail } from 'lucide-react';
import { Faculty, Student, Poll } from '../../types';
import BulkUpload from '../Admin/BulkUpload';
import CreatePollForm from './CreatePollForm';

interface FacultyDashboardProps {
  faculty: Faculty;
}

const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ faculty }) => {
  const [activeTab, setActiveTab] = useState<'students' | 'polls' | 'results' | 'bulkUpload'>('students');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreatePoll, setShowCreatePoll] = useState(false);

  // Real data from API
  const [students, setStudents] = useState<Student[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data from API
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch students
        const studentsResponse = await fetch('/api/faculty/students', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json();
          setStudents(studentsData.students || []);
        }
        
        // Fetch polls
        const pollsResponse = await fetch('/api/faculty/polls', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (pollsResponse.ok) {
          const pollsData = await pollsResponse.json();
          setPolls(pollsData.polls || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [faculty.id]);

  const filteredStudents = students.filter(student =>
    student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.collegeEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToExcel = async (type: 'all' | 'fake' | 'correct') => {
    try {
      // Find the first poll with responses to test export
      const pollWithResponses = polls[0];
      if (!pollWithResponses) {
        alert('No polls available for export');
        return;
      }

      // Call the backend export API
      const response = await fetch(`/api/faculty/polls/${pollWithResponses.id}/export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Get the blob from the response
        const blob = await response.blob();
        
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `poll_${pollWithResponses.id}_${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert(`Successfully exported ${type} poll responses to Excel!`);
      } else {
        const error = await response.json();
        alert(`Failed to export: ${error.error}`);
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export to Excel. Please try again.');
    }
  };

  const sendEmailNotification = async () => {
    try {
      // Find the first poll with responses to test email
      const pollWithResponses = polls[0];
      if (!pollWithResponses) {
        alert('No polls available for email notification');
        return;
      }

      // Mock API call to send email notification
      const response = await fetch(`/api/faculty/polls/${pollWithResponses.id}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Email notification sent successfully! ${result.message}`);
      } else {
        const error = await response.json();
        alert(`Failed to send email: ${error.error}`);
      }
    } catch (error) {
      console.error('Error sending email notification:', error);
      alert('Failed to send email notification. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Faculty Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {faculty.name}</p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'students', label: 'My Students', icon: Users },
            { key: 'polls', label: 'Polls', icon: FileText },
            { key: 'results', label: 'Results & Analytics', icon: AlertTriangle },
            { key: 'bulkUpload', label: 'Bulk Upload', icon: Upload }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
            </div>
            <div className="text-sm text-gray-600">
              Total Students: {filteredStudents.length}
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Academic Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Competitive Programming
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{student.rollNumber}</div>
                        <div className="text-sm text-gray-500">{student.collegeEmail}</div>
                        <div className="text-xs text-gray-400">{student.personalEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Year {student.year}, Section {student.section}</div>
                      <div className="text-sm text-gray-500">{student.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {student.leetcodeId && <div className="text-xs text-gray-600">LC: {student.leetcodeId}</div>}
                        {student.codechefId && <div className="text-xs text-gray-600">CC: {student.codechefId}</div>}
                        {student.codeforcesId && <div className="text-xs text-gray-600">CF: {student.codeforcesId}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-blue-600 hover:text-blue-900">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Polls Tab */}
      {activeTab === 'polls' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Manage Polls</h2>
            <button 
              onClick={() => setShowCreatePoll(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Poll</span>
            </button>
          </div>

          <div className="grid gap-6">
            {polls.map((poll) => (
              <div key={poll.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{poll.title}</h3>
                    <p className="text-gray-600 mt-1">{poll.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      poll.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {poll.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Target:</span> Year {poll.targetClass.year}, Section {poll.targetClass.section}, {poll.targetClass.department}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Questions:</span> {poll.questions.length}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Created:</span> {poll.createdAt.toLocaleDateString()}
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View Responses
                  </button>
                  <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                    Edit Poll
                  </button>
                  <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                    {poll.isActive ? 'Deactivate' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Poll Results & Analytics</h2>
            <div className="flex space-x-3">
              <button
                onClick={() => exportToExcel('all')}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export All</span>
              </button>
              <button
                onClick={() => exportToExcel('fake')}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Export Fake Pollers</span>
              </button>
              <button
                onClick={() => exportToExcel('correct')}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Correct Pollers</span>
              </button>
              <button
                onClick={() => sendEmailNotification()}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>Send Email Alert</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Responses</p>
                  <p className="text-2xl font-bold text-gray-900">45</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Fake Poll Detections</p>
                  <p className="text-2xl font-bold text-red-600">8</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Accuracy Rate</p>
                  <p className="text-2xl font-bold text-green-600">82.2%</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Flagged Responses</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {[
                { student: '21CS003', poll: 'LeetCode Contest Attendance', reason: 'Claimed 5 problems solved, actual: 2', flaggedAt: '2 hours ago' },
                { student: '21CS015', poll: 'LeetCode Contest Attendance', reason: 'Claimed attendance but no contest participation found', flaggedAt: '3 hours ago' },
                { student: '21CS027', poll: 'LeetCode Contest Attendance', reason: 'Total problems count mismatch (claimed: 150, actual: 89)', flaggedAt: '5 hours ago' }
              ].map((item, index) => (
                <div key={index} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">{item.student}</p>
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          Flagged
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{item.poll}</p>
                      <p className="text-sm text-gray-800 mt-1">{item.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{item.flaggedAt}</p>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Tab */}
      {activeTab === 'bulkUpload' && (
        <BulkUpload />
      )}

      {/* Poll Creation Form Modal */}
      {showCreatePoll && (
        <CreatePollForm
          onClose={() => setShowCreatePoll(false)}
          onPollCreated={() => {
            setShowCreatePoll(false);
            // Refresh polls data
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default FacultyDashboard;