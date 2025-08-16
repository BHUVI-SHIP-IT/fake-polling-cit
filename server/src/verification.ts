import fetch from 'node-fetch';

// Enhanced verification system for fake poll detection

export interface VerificationResult {
  isFlagged: boolean;
  flagReason: string;
  verifiedProblems: number;
  verificationSource: string;
  confidence: number; // 0-100 confidence level
}

export interface ContestWindow {
  start: Date;
  end: Date;
  contestType: 'leetcode' | 'codeforces' | 'codechef' | 'general';
}

export class FakePollDetector {
  private static readonly LEE_CODE_TOTAL_THRESHOLD = 5;
  private static readonly CONTEST_PROBLEMS_THRESHOLD = 1;
  private static readonly ATTENDANCE_THRESHOLD = 0;

  /**
   * Main verification method for poll responses
   */
  static async verifyPollResponse(
    studentData: any,
    pollResponse: any,
    contestWindow: ContestWindow
  ): Promise<VerificationResult> {
    let totalVerified = 0;
    let verificationSources: string[] = [];
    let confidence = 0;

    // 1. Verify LeetCode total problems
    if (studentData.leetcodeId) {
      const lcTotal = await this.verifyLeetCodeTotal(studentData.leetcodeId);
      if (lcTotal !== null) {
        totalVerified = Math.max(totalVerified, lcTotal);
        verificationSources.push('LeetCode Total');
        confidence += 30;
      }
    }

    // 2. Verify contest-specific problems
    const contestProblems = await this.verifyContestProblems(
      studentData,
      contestWindow
    );
    if (contestProblems !== null) {
      totalVerified = Math.max(totalVerified, contestProblems);
      verificationSources.push('Contest Problems');
      confidence += 40;
    }

    // 3. Verify attendance
    const attendanceVerified = await this.verifyAttendance(
      studentData,
      contestWindow
    );
    if (attendanceVerified !== null) {
      confidence += 30;
    }

    // 4. Apply verification rules
    return this.applyVerificationRules(
      pollResponse,
      totalVerified,
      verificationSources.join('/'),
      confidence
    );
  }

  /**
   * Verify LeetCode total problems solved
   */
  private static async verifyLeetCodeTotal(username: string): Promise<number | null> {
    try {
      const query = `
        query userProblemsSolved($username: String!) {
          matchedUser(username: $username) {
            submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
              }
            }
          }
        }
      `;

      const response = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { username }
        })
      });

      if (!response.ok) return null;

      const data = await response.json() as any;
      const submissions = data.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum;
      
      if (!submissions) return null;

      return submissions.reduce((total: number, item: any) => total + item.count, 0);
    } catch (error) {
      console.error('LeetCode verification error:', error);
      return null;
    }
  }

  /**
   * Verify contest-specific problems solved
   */
  private static async verifyContestProblems(
    studentData: any,
    contestWindow: ContestWindow
  ): Promise<number | null> {
    let maxProblems = 0;

    // Try Codeforces first (most reliable for contests)
    if (studentData.codeforcesId) {
      const cfProblems = await this.verifyCodeforcesContest(
        studentData.codeforcesId,
        contestWindow
      );
      if (cfProblems !== null) {
        maxProblems = Math.max(maxProblems, cfProblems);
      }
    }

    // Try CodeChef
    if (studentData.codechefId) {
      const ccProblems = await this.verifyCodeChefContest(
        studentData.codechefId,
        contestWindow
      );
      if (ccProblems !== null) {
        maxProblems = Math.max(maxProblems, ccProblems);
      }
    }

    // Try LeetCode contest (if we have contest ID)
    if (studentData.leetcodeContestId) {
      const lcProblems = await this.verifyLeetCodeContest(
        studentData.leetcodeId,
        studentData.leetcodeContestId,
        contestWindow
      );
      if (lcProblems !== null) {
        maxProblems = Math.max(maxProblems, lcProblems);
      }
    }

    return maxProblems > 0 ? maxProblems : null;
  }

  /**
   * Verify Codeforces contest participation
   */
  private static async verifyCodeforcesContest(
    username: string,
    contestWindow: ContestWindow
  ): Promise<number | null> {
    try {
      // Get user's submissions during contest window
      const response = await fetch(
        `https://codeforces.com/api/user.status?handle=${username}&from=1&count=1000`
      );

      if (!response.ok) return null;

      const data = await response.json() as any;
      if (data.status !== 'OK') return null;

      const submissions = data.result || [];
      let maxProblems = 0;

      for (const submission of submissions) {
        const submissionTime = new Date(submission.creationTimeSeconds * 1000);
        
        // Check if submission is within contest window
        if (submissionTime >= contestWindow.start && submissionTime <= contestWindow.end) {
          if (submission.verdict === 'OK') {
            // Count unique problems solved
            const problemKey = `${submission.problem.contestId}-${submission.problem.index}`;
            maxProblems = Math.max(maxProblems, 1); // Simplified for now
          }
        }
      }

      return maxProblems;
    } catch (error) {
      console.error('Codeforces verification error:', error);
      return null;
    }
  }

  /**
   * Verify CodeChef contest participation
   */
  private static async verifyCodeChefContest(
    username: string,
    contestWindow: ContestWindow
  ): Promise<number | null> {
    try {
      // CodeChef API is limited, but we can try to get contest results
      // This would require contest-specific API calls
      // For now, return null (placeholder)
      return null;
    } catch (error) {
      console.error('CodeChef verification error:', error);
      return null;
    }
  }

  /**
   * Verify LeetCode contest participation
   */
  private static async verifyLeetCodeContest(
    username: string,
    contestId: string,
    contestWindow: ContestWindow
  ): Promise<number | null> {
    try {
      // LeetCode contest verification requires authenticated access
      // This is the most challenging part due to API limitations
      // For now, return null (placeholder)
      return null;
    } catch (error) {
      console.error('LeetCode contest verification error:', error);
      return null;
    }
  }

  /**
   * Verify attendance based on contest participation
   */
  private static async verifyAttendance(
    studentData: any,
    contestWindow: ContestWindow
  ): Promise<boolean | null> {
    // If we can verify any contest participation, attendance is confirmed
    const contestProblems = await this.verifyContestProblems(studentData, contestWindow);
    return contestProblems !== null ? contestProblems > 0 : null;
  }

  /**
   * Apply verification rules and determine if response is fake
   */
  private static applyVerificationRules(
    pollResponse: any,
    verifiedProblems: number,
    verificationSource: string,
    confidence: number
  ): VerificationResult {
    let isFlagged = false;
    let flagReason = '';
    let finalConfidence = confidence;

    // Rule 1: Contest problems mismatch
    if (verifiedProblems > 0) {
      const claimedProblems = this.extractProblemsFromResponse(pollResponse);
      
      if (claimedProblems > verifiedProblems + this.CONTEST_PROBLEMS_THRESHOLD) {
        isFlagged = true;
        flagReason = `Contest problems mismatch: claimed ${claimedProblems}, verified ${verifiedProblems} via ${verificationSource}`;
        finalConfidence = Math.min(100, confidence + 20);
      }
    }

    // Rule 2: Total problems mismatch (for LeetCode total questions)
    const totalProblemsQuestion = this.findTotalProblemsQuestion(pollResponse);
    if (totalProblemsQuestion && verifiedProblems > 0) {
      const claimed = parseInt(totalProblemsQuestion.answer);
      if (claimed > verifiedProblems + this.LEE_CODE_TOTAL_THRESHOLD) {
        isFlagged = true;
        flagReason = `Total problems mismatch: claimed ${claimed}, verified ${verifiedProblems} via ${verificationSource}`;
        finalConfidence = Math.min(100, confidence + 15);
      }
    }

    // Rule 3: Attendance verification
    const attendanceQuestion = this.findAttendanceQuestion(pollResponse);
    if (attendanceQuestion && attendanceQuestion.answer > this.ATTENDANCE_THRESHOLD) {
      if (verifiedProblems === 0) {
        isFlagged = true;
        flagReason = `Claimed contest participation but no verified activity found on any platform`;
        finalConfidence = Math.min(100, confidence + 25);
      }
    }

    // Rule 4: Confidence-based flagging
    if (confidence < 30) {
      isFlagged = true;
      flagReason = `Low verification confidence (${confidence}%). Unable to verify claims.`;
      finalConfidence = confidence;
    }

    return {
      isFlagged,
      flagReason,
      verifiedProblems,
      verificationSource,
      confidence: finalConfidence
    };
  }

  /**
   * Extract problems count from poll response
   */
  private static extractProblemsFromResponse(pollResponse: any): number {
    // Look for questions about contest problems
    const contestQuestion = pollResponse.answers?.find((a: any) => 
      a.question.toLowerCase().includes('contest') || 
      a.question.toLowerCase().includes('problem')
    );
    
    return contestQuestion ? parseInt(contestQuestion.answer) || 0 : 0;
  }

  /**
   * Find total problems question in poll response
   */
  private static findTotalProblemsQuestion(pollResponse: any): any {
    return pollResponse.answers?.find((a: any) => 
      a.question.toLowerCase().includes('total') && 
      a.question.toLowerCase().includes('problem')
    );
  }

  /**
   * Find attendance question in poll response
   */
  private static findAttendanceQuestion(pollResponse: any): any {
    return pollResponse.answers?.find((a: any) => 
      a.question.toLowerCase().includes('attend') || 
      a.question.toLowerCase().includes('present')
    );
  }

  /**
   * Convert IST to UTC for contest window calculations
   */
  static istToUtc(istTime: Date): Date {
    // IST is UTC+5:30
    const utcTime = new Date(istTime.getTime() - (5.5 * 60 * 60 * 1000));
    return utcTime;
  }

  /**
   * Get contest window based on poll creation time
   */
  static getContestWindow(pollCreatedAt: Date, contestType: string = 'general'): ContestWindow {
    const start = new Date(pollCreatedAt.getTime() - (12 * 60 * 60 * 1000)); // 12 hours before
    const end = new Date(pollCreatedAt.getTime() + (2 * 60 * 60 * 1000));   // 2 hours after
    
    return {
      start,
      end,
      contestType: contestType as any
    };
  }
} 