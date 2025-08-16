import React, { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, AlertTriangle, User, Award } from 'lucide-react';
import { Student, Poll, PollResponse } from '../../types';

interface StudentDashboardProps {
  student: Student;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ student }) => {
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [responses, setResponses] = useState<{ [key: string]: any }>({});
  const [availablePolls, setAvailablePolls] = useState<Poll[]>([]);
  const [pollHistory, setPollHistory] = useState<PollResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch real data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch available polls
        const pollsResponse = await fetch('/api/student/polls', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (pollsResponse.ok) {
          const pollsData = await pollsResponse.json();
          setAvailablePolls(pollsData.polls || []);
        }
        
        // Fetch response history
        const historyResponse = await fetch('/api/student/responses', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setPollHistory(historyData.responses || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [student.id]);

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const submitPoll = async () => {
    if (selectedPoll) {
      // Validate required questions
      const requiredQuestions = selectedPoll.questions.filter(q => q.required);
      const missingAnswers = requiredQuestions.filter(q => !responses[q.id]);
      
      if (missingAnswers.length > 0) {
        alert('Please answer all required questions');
        return;
      }
      
      try {
        setSubmitting(true);
        
        // Prepare answers in the format expected by the backend
        const answers = Object.entries(responses).map(([questionId, answer]) => ({
          questionId,
          answer
        }));
        
        // Submit to backend API
        const response = await fetch(`/api/student/polls/${selectedPoll.id}/respond`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ answers })
        });
        
        if (response.ok) {
          const result = await response.json();
          
          // Check if response was flagged
          if (result.response.isFlagged) {
            alert(`Response submitted but flagged: ${result.response.flagReason}`);
          } else {
            alert('Poll response submitted successfully!');
          }
          
          // Reset form and refresh data
          setSelectedPoll(null);
          setResponses({});
          
          // Refresh poll history
          const historyResponse = await fetch('/api/student/responses', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (historyResponse.ok) {
            const historyData = await historyResponse.json();
            setPollHistory(historyData.responses || []);
          }
        } else {
          const errorData = await response.json();
          alert(`Failed to submit response: ${errorData.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error submitting poll:', error);
        alert('Failed to submit response. Please try again.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const renderQuestionInput = (question: any) => {
    switch (question.type) {
      case 'boolean':
        return (
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name={question.id}
                value="true"
                onChange={(e) => handleResponseChange(question.id, true)}
                className="mr-2 text-blue-600"
              />
              Yes
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={question.id}
                value="false"
                onChange={(e) => handleResponseChange(question.id, false)}
                className="mr-2 text-blue-600"
              />
              No
            </label>
          </div>
        );
      case 'number':
        return (
          <input
            type="number"
            value={responses[question.id] || ''}
            onChange={(e) => handleResponseChange(question.id, parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter a number"
          />
        );
      case 'text':
        return (
          <input
            type="text"
            value={responses[question.id] || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your answer"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
        <div className="mt-2 flex items-center space-x-4">
          <p className="text-gray-600">Welcome, {student.rollNumber}</p>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <User className="w-4 h-4" />
            <span>Year {student.year}, Section {student.section}</span>
          </div>
        </div>
      </div>

      {/* Student Profile Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">My Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Academic Information</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium">Roll Number:</span> {student.rollNumber}</p>
              <p><span className="font-medium">Department:</span> {student.department}</p>
              <p><span className="font-medium">Year:</span> {student.year}</p>
              <p><span className="font-medium">Section:</span> {student.section}</p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Competitive Programming</h3>
            <div className="space-y-2 text-sm text-gray-600">
              {student.leetcodeId && <p><span className="font-medium">LeetCode:</span> {student.leetcodeId}</p>}
              {student.codechefId && <p><span className="font-medium">CodeChef:</span> {student.codechefId}</p>}
              {student.codeforcesId && <p><span className="font-medium">Codeforces:</span> {student.codeforcesId}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Available Polls */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Polls</h2>
          <div className="space-y-4">
            {loading ? (
              <p>Loading available polls...</p>
            ) : availablePolls.length === 0 ? (
              <p>No available polls at the moment. Please check back later.</p>
            ) : (
              availablePolls.map((poll) => (
                <div key={poll.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{poll.title}</h3>
                      <p className="text-gray-600 mt-1">{poll.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>Expires: {poll.expiresAt?.toLocaleDateString()}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <FileText className="w-4 h-4" />
                          <span>{poll.questions.length} questions</span>
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Active
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedPoll(poll)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Take Poll
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Poll Response Modal */}
          {selectedPoll && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{selectedPoll.title}</h3>
                      <p className="text-gray-600 mt-1">{selectedPoll.description}</p>
                    </div>
                    <button
                      onClick={() => setSelectedPoll(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-6">
                    {selectedPoll.questions.map((question) => (
                      <div key={question.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                        <div className="mb-3">
                          <p className="text-gray-900 font-medium">
                            {question.question}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                          </p>
                          {question.validationField && (
                            <p className="text-sm text-gray-500 mt-1">
                              This answer will be validated against your {question.validationField} data
                            </p>
                          )}
                        </div>
                        {renderQuestionInput(question)}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setSelectedPoll(null)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitPoll}
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Submitting...' : 'Submit Response'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Poll Statistics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Poll Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Total Polls Taken</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">{pollHistory.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Accurate Responses</span>
                </div>
                <span className="text-lg font-semibold text-green-600">
                  {pollHistory.filter(r => !r.isFlagged).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-gray-600">Flagged Responses</span>
                </div>
                <span className="text-lg font-semibold text-red-600">
                  {pollHistory.filter(r => r.isFlagged).length}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-gray-600">Accuracy Rate</span>
                  </div>
                  <span className="text-lg font-semibold text-yellow-600">
                    {pollHistory.length > 0 
                      ? `${Math.round(((pollHistory.filter(r => !r.isFlagged).length / pollHistory.length) * 100) * 10) / 10}%`
                      : '0%'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Poll History */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Responses</h3>
            <div className="space-y-3">
              {loading ? (
                <p>Loading recent responses...</p>
              ) : pollHistory.length === 0 ? (
                <p>No recent responses yet.</p>
              ) : (
                pollHistory.slice(0, 5).map((response, index) => (
                  <div key={response.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Poll #{index + 1}</p>
                      <p className="text-xs text-gray-500">
                        {response.submittedAt.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {response.isFlagged ? (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      <span className={`text-xs font-medium ${
                        response.isFlagged ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {response.isFlagged ? 'Flagged' : 'Verified'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;