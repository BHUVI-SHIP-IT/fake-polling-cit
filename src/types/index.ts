export interface Student {
  id: string;
  rollNumber: string;
  collegeEmail: string;
  personalEmail: string;
  year: string;
  section: string;
  department: string;
  leetcodeId?: string;
  leetcodeContestId?: string;
  codechefId?: string;
  codeforcesId?: string;
  otherIds?: { platform: string; id: string }[];
  createdAt: Date;
}

export interface Faculty {
  id: string;
  name: string;
  collegeEmail: string;
  phoneNumber: string;
  designation: string;
  handlingClasses: ClassSection[];
  createdAt: Date;
}

export interface ClassSection {
  year: string;
  section: string;
  department: string;
}

export interface Poll {
  id: string;
  facultyId: string;
  title: string;
  description: string;
  questions: PollQuestion[];
  targetClass: ClassSection;
  createdAt: Date;
  isActive: boolean;
  expiresAt?: Date;
}

export interface PollQuestion {
  id: string;
  type: 'text' | 'number' | 'boolean' | 'multiple-choice';
  question: string;
  options?: string[];
  required: boolean;
  validationField?: 'leetcodeProblems' | 'contestProblems' | 'attendance';
}

export interface PollResponse {
  id: string;
  pollId: string;
  studentId: string;
  answers: { questionId: string; answer: any }[];
  submittedAt: Date;
  isFlagged: boolean;
  flagReason?: string;
  actualData?: any;
}

export type UserType = 'student' | 'faculty';

export interface AuthUser {
  id: string;
  type: UserType;
  email: string;
  data: Student | Faculty;
}