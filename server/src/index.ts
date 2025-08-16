import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient, UserType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import fetch from 'node-fetch';
import XLSX from 'xlsx';
import { FakePollDetector } from './verification';
import { createEmailService } from './emailService';

const app = express();
const prisma = new PrismaClient();
const emailService = createEmailService();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

function authMiddleware(requiredTypes?: UserType[]) {
	return async (req: any, res: any, next: any) => {
		try {
			const authHeader = req.headers.authorization || '';
			const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
			if (!token) return res.status(401).json({ error: 'Unauthorized' });
			const payload: any = jwt.verify(token, JWT_SECRET);
			req.user = payload;
			if (requiredTypes && !requiredTypes.includes(payload.type)) {
				return res.status(403).json({ error: 'Forbidden' });
			}
			next();
		} catch (e) {
			return res.status(401).json({ error: 'Unauthorized' });
		}
	};
}

// Auth routes
const registerSchemaStudent = z.object({
	email: z.string().email(),
	password: z.string().min(6),
	rollNumber: z.string(),
	personalEmail: z.string().email(),
	year: z.string(),
	section: z.string(),
	department: z.string(),
	leetcodeId: z.string().optional().nullable(),
	leetcodeContestId: z.string().optional().nullable(),
	codechefId: z.string().optional().nullable(),
	codeforcesId: z.string().optional().nullable(),
	otherIds: z.array(z.object({ platform: z.string(), id: z.string() })).optional().nullable()
});

const registerSchemaFaculty = z.object({
	email: z.string().email(),
	password: z.string().min(6),
	name: z.string(),
	phoneNumber: z.string(),
	designation: z.string(),
	handlingClasses: z.array(z.object({ year: z.string(), section: z.string(), department: z.string() })).optional()
});

app.post('/api/auth/register/student', async (req, res) => {
	try {
		const data = registerSchemaStudent.parse(req.body);
		const passwordHash = await bcrypt.hash(data.password, 10);
		const user = await prisma.user.create({
			data: { email: data.email, passwordHash, type: 'student' }
		});
		const student = await prisma.student.create({
			data: {
				userId: user.id,
				rollNumber: data.rollNumber,
				personalEmail: data.personalEmail,
				year: data.year,
				section: data.section,
				department: data.department,
				leetcodeId: data.leetcodeId || undefined,
				leetcodeContestId: data.leetcodeContestId || undefined,
				codechefId: data.codechefId || undefined,
				codeforcesId: data.codeforcesId || undefined,
				otherIds: data.otherIds ? data.otherIds : undefined
			}
		});
		// ensure Class exists and map
		const klass = await prisma.class.upsert({
			where: { year_section_department: { year: data.year, section: data.section, department: data.department } },
			create: { year: data.year, section: data.section, department: data.department },
			update: {}
		});
		await prisma.studentClass.create({ data: { studentId: student.id, classId: klass.id } });
		return res.json({ success: true });
	} catch (e: any) {
		return res.status(400).json({ error: e.message });
	}
});

app.post('/api/auth/register/faculty', async (req, res) => {
	try {
		const data = registerSchemaFaculty.parse(req.body);
		const passwordHash = await bcrypt.hash(data.password, 10);
		const user = await prisma.user.create({
			data: { email: data.email, passwordHash, type: 'faculty' }
		});
		await prisma.faculty.create({
			data: {
				userId: user.id,
				name: data.name,
				phoneNumber: data.phoneNumber,
				designation: data.designation,
				handlingClasses: data.handlingClasses ?? []
			}
		});
		// ensure all classes exist
		for (const c of data.handlingClasses ?? []) {
			await prisma.class.upsert({
				where: { year_section_department: c },
				create: c,
				update: {}
			});
		}
		return res.json({ success: true });
	} catch (e: any) {
		return res.status(400).json({ error: e.message });
	}
});

app.post('/api/auth/login', async (req, res) => {
	const { email, password, type } = req.body as { email: string; password: string; type: UserType };
	
	if (!email || !type) return res.status(400).json({ error: 'Missing fields' });
	
	if (type === 'student') {
		// Student login: email only, no password required
		const user = await prisma.user.findUnique({ where: { email } });
		if (!user || user.type !== 'student') {
			return res.status(401).json({ error: 'Student not found. Please check your email or contact administrator.' });
		}
		
		const student = await prisma.student.findUnique({ where: { userId: user.id } });
		if (!student) {
			return res.status(401).json({ error: 'Student profile not found. Please contact administrator.' });
		}
		
		const token = jwt.sign({ id: user.id, email: user.email, type: user.type }, JWT_SECRET, { expiresIn: '7d' });
		return res.json({ 
			token, 
			user: { 
				id: user.id, 
				type: user.type, 
				email: user.email, 
				data: { ...student, collegeEmail: user.email } 
			} 
		});
	}
	
	if (type === 'faculty') {
		// Faculty login: email + password required
		if (!password) return res.status(400).json({ error: 'Password is required for faculty login' });
		
		const user = await prisma.user.findUnique({ where: { email } });
		if (!user || user.type !== 'faculty') {
			return res.status(401).json({ error: 'Invalid faculty credentials' });
		}
		
		const ok = await bcrypt.compare(password, user.passwordHash);
		if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
		
		const faculty = await prisma.faculty.findUnique({ where: { userId: user.id } });
		const token = jwt.sign({ id: user.id, email: user.email, type: user.type }, JWT_SECRET, { expiresIn: '7d' });
		return res.json({ 
			token, 
			user: { 
				id: user.id, 
				type: user.type, 
				email: user.email, 
				data: { ...faculty, collegeEmail: user.email } 
			} 
		});
	}
	
	return res.status(400).json({ error: 'Invalid user type' });
});

// Faculty: list students in handling classes
app.get('/api/faculty/students', authMiddleware(['faculty']), async (req: any, res) => {
	const faculty = await prisma.faculty.findUnique({ where: { userId: req.user.id } });
	if (!faculty) return res.status(404).json({ error: 'Faculty not found' });
	const handling = (faculty.handlingClasses as any[]) || [];
	if (handling.length === 0) return res.json({ students: [] });
	const classes = await prisma.class.findMany({
		where: {
			OR: handling.map(c => ({ year: c.year, section: c.section, department: c.department }))
		},
		include: { students: { include: { student: { include: { user: true } } } } }
	});
	const students = classes.flatMap(c => c.students.map(sc => ({
		...sc.student,
		collegeEmail: sc.student.user.email
	})));
	return res.json({ students });
});

// Faculty: list own polls
app.get('/api/faculty/polls', authMiddleware(['faculty']), async (req: any, res) => {
	const faculty = await prisma.faculty.findUnique({ where: { userId: req.user.id } });
	if (!faculty) return res.status(404).json({ error: 'Faculty not found' });
	const polls = await prisma.poll.findMany({ where: { facultyId: faculty.id }, orderBy: { createdAt: 'desc' } });
	return res.json({ polls });
});

// Faculty: create/update handling classes
app.post('/api/faculty/handling-classes', authMiddleware(['faculty']), async (req: any, res) => {
	const schema = z.array(z.object({ year: z.string(), section: z.string(), department: z.string() }));
	try {
		const payload = schema.parse(req.body);
		const faculty = await prisma.faculty.findUnique({ where: { userId: req.user.id } });
		if (!faculty) return res.status(404).json({ error: 'Faculty not found' });
		const updated = await prisma.faculty.update({ where: { id: faculty.id }, data: { handlingClasses: payload } });
		for (const c of payload) {
			await prisma.class.upsert({
				where: { year_section_department: c },
				create: c,
				update: {}
			});
		}
		return res.json({ faculty: updated });
	} catch (e: any) {
		return res.status(400).json({ error: e.message });
	}
});

// Faculty: create poll
app.post('/api/faculty/polls', authMiddleware(['faculty']), async (req: any, res) => {
	const schema = z.object({
		title: z.string(),
		description: z.string().optional(),
		questions: z.array(z.object({ id: z.string(), type: z.string(), question: z.string(), required: z.boolean().optional(), validationField: z.string().optional() })),
		targetClass: z.object({ year: z.string(), section: z.string(), department: z.string() }),
		expiresAt: z.string().optional()
	});
	try {
		const body = schema.parse(req.body);
		const faculty = await prisma.faculty.findUnique({ where: { userId: req.user.id } });
		if (!faculty) return res.status(404).json({ error: 'Faculty not found' });
		const klass = await prisma.class.upsert({
			where: { year_section_department: body.targetClass },
			create: body.targetClass,
			update: {}
		});
		const poll = await prisma.poll.create({
			data: {
				facultyId: faculty.id,
				title: body.title,
				description: body.description,
				questions: body.questions,
				classId: klass.id,
				expiresAt: body.expiresAt ? new Date(body.expiresAt) : null
			}
		});
		return res.json({ poll });
	} catch (e: any) {
		return res.status(400).json({ error: e.message });
	}
});

// Faculty: poll responses list
app.get('/api/faculty/polls/:pollId/responses', authMiddleware(['faculty']), async (req: any, res) => {
	const { pollId } = req.params;
	const poll = await prisma.poll.findUnique({ where: { id: pollId } });
	if (!poll) return res.status(404).json({ error: 'Poll not found' });
	const responses = await prisma.pollResponse.findMany({ where: { pollId }, include: { student: { include: { user: true } } } });
	const shaped = responses.map(r => ({
		...r,
		student: {
			...r.student,
			collegeEmail: r.student.user.email
		}
	}));
	return res.json({ responses: shaped });
});

// Student: list available polls
app.get('/api/student/polls', authMiddleware(['student']), async (req: any, res) => {
	const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
	if (!student) return res.status(404).json({ error: 'Student not found' });
	const mappings = await prisma.studentClass.findMany({ where: { studentId: student.id }, include: { class: true } });
	const classIds = mappings.map(m => m.classId);
	const polls = await prisma.poll.findMany({ where: { classId: { in: classIds }, isActive: true }, orderBy: { createdAt: 'desc' } });
	return res.json({ polls });
});

// Student: my response history
app.get('/api/student/responses', authMiddleware(['student']), async (req: any, res) => {
	const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
	if (!student) return res.status(404).json({ error: 'Student not found' });
	const responses = await prisma.pollResponse.findMany({ where: { studentId: student.id }, orderBy: { submittedAt: 'desc' } });
	return res.json({ responses });
});

// Helper: fetch competitive stats
async function fetchLeetCodeTotalSolved(username: string): Promise<number | null> {
	try {
		const resp = await fetch('https://leetcode-stats-api.herokuapp.com/' + encodeURIComponent(username));
		if (!resp.ok) return null;
		const data: any = await resp.json();
		return typeof data.totalSolved === 'number' ? data.totalSolved : null;
	} catch { return null; }
}

async function fetchLeetCodeContestSolved(username: string, contestStart: Date, contestEnd: Date): Promise<number | null> {
	try {
		// Using GraphQL API for contest submissions
		const query = `
		query userContestRankingInfo($username: String!) {
			userContestRankingInfo(username: $username) {
				attendedContestsCount
				rating
				globalRanking
				totalParticipants
				topPercentage
				badge {
					name
				}
			}
		}`;
		
		const resp = await fetch('https://leetcode.com/graphql', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query, variables: { username } })
		});
		
		if (!resp.ok) return null;
		const data: any = await resp.json();
		
		// For now, return null as contest-specific data requires authentication
		// This will fall back to total problems verification
		return null;
	} catch { return null; }
}

async function fetchCodeforcesContestSolved(handle: string, sinceUnix: number): Promise<number | null> {
	try {
		const url = `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1`;
		const resp = await fetch(url);
		if (!resp.ok) return null;
		const data: any = await resp.json();
		if (data.status !== 'OK') return null;
		const solved = new Set<string>();
		for (const sub of data.result) {
			if (sub.verdict === 'OK' && sub.creationTimeSeconds >= sinceUnix) {
				solved.add(`${sub.problem.contestId}-${sub.problem.index}`);
			}
		}
		return solved.size;
	} catch { return null; }
}

async function fetchCodeChefContestSolved(username: string, contestStart: Date, contestEnd: Date): Promise<number | null> {
	try {
		// CodeChef API for contest submissions
		const url = `https://www.codechef.com/api/rankings/${contestStart.getFullYear()}${contestStart.getMonth().toString().padStart(2, '0')}?search=${encodeURIComponent(username)}&sortBy=rank&order=asc&page=1&itemsPerPage=1`;
		const resp = await fetch(url);
		if (!resp.ok) return null;
		const data: any = await resp.json();
		
		// Parse contest results from CodeChef
		if (data.result && data.result.data && data.result.data.content) {
			const userData = data.result.data.content.find((u: any) => u.username === username);
			if (userData && userData.score) {
				return parseInt(userData.score) || 0;
			}
		}
		return null;
	} catch { return null; }
}

// Convert IST to UTC for API calls
function istToUtc(istTime: string): Date {
	const istDate = new Date(istTime + ' IST');
	return new Date(istDate.getTime() - (5.5 * 60 * 60 * 1000)); // IST is UTC+5:30
}

// Get contest window (IST timezone)
function getContestWindow(pollExpiry: Date): { start: Date; end: Date } {
	const istExpiry = new Date(pollExpiry.getTime() + (5.5 * 60 * 60 * 1000)); // Convert to IST
	const start = new Date(istExpiry.getTime() - (12 * 60 * 60 * 1000)); // 12 hours before
	const end = new Date(istExpiry.getTime() + (2 * 60 * 60 * 1000)); // 2 hours after
	return { start, end };
}

// Student: submit response with verification
app.post('/api/student/polls/:pollId/respond', authMiddleware(['student']), async (req: any, res) => {
	const { pollId } = req.params;
	const { answers } = req.body as { answers: { questionId: string; answer: any }[] };
	const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
	if (!student) return res.status(404).json({ error: 'Student not found' });
	const poll = await prisma.poll.findUnique({ where: { id: pollId } });
	if (!poll || !poll.isActive) return res.status(404).json({ error: 'Poll not found' });
	const questions = poll.questions as any[];

	// Enhanced verification logic with IST timezone and multiple platforms
	let isFlagged = false;
	let flagReason: string | undefined = undefined;
	const contestWindow = getContestWindow(poll.expiresAt ?? new Date());

	for (const q of questions) {
		const a = answers.find(x => x.questionId === q.id);
		if (!a) continue;
		
		// LeetCode total problems verification
		if (q.validationField === 'leetcodeProblems' && typeof a.answer === 'number' && student.leetcodeId) {
			const live = await fetchLeetCodeTotalSolved(student.leetcodeId);
			if (live !== null && a.answer > live + 5) {
				isFlagged = true; flagReason = `LeetCode total mismatch (claimed: ${a.answer}, live: ${live})`;
				break;
			}
		}
		
		// Contest problems verification (multi-platform)
		if (q.validationField === 'contestProblems' && typeof a.answer === 'number') {
			let verifiedProblems = 0;
			let verificationSource = '';
			
			// Try LeetCode contest first
			if (student.leetcodeId) {
				const lcContest = await fetchLeetCodeContestSolved(student.leetcodeId, contestWindow.start, contestWindow.end);
				if (lcContest !== null) {
					verifiedProblems = Math.max(verifiedProblems, lcContest);
					verificationSource = 'LeetCode';
				}
			}
			
			// Try Codeforces
			if (student.codeforcesId) {
				const cfContest = await fetchCodeforcesContestSolved(student.codeforcesId, Math.floor(contestWindow.start.getTime() / 1000));
				if (cfContest !== null) {
					verifiedProblems = Math.max(verifiedProblems, cfContest);
					verificationSource = verificationSource ? `${verificationSource}/Codeforces` : 'Codeforces';
				}
			}
			
			// Try CodeChef
			if (student.codechefId) {
				const ccContest = await fetchCodeChefContestSolved(student.codechefId, contestWindow.start, contestWindow.end);
				if (ccContest !== null) {
					verifiedProblems = Math.max(verifiedProblems, ccContest);
					verificationSource = verificationSource ? `${verificationSource}/CodeChef` : 'CodeChef';
				}
			}
			
			// Flag if claimed problems exceed verified + threshold
			if (verifiedProblems > 0 && a.answer > verifiedProblems + 1) {
				isFlagged = true; 
				flagReason = `Contest problems mismatch (claimed: ${a.answer}, verified: ${verifiedProblems} via ${verificationSource})`;
				break;
			}
			
			// Attendance verification: if claimed > 0 but no contest participation found
			if (a.answer > 0 && verifiedProblems === 0) {
				isFlagged = true;
				flagReason = `Claimed contest participation but no verified activity found on any platform`;
				break;
			}
		}
	}

	const response = await prisma.pollResponse.create({
		data: { pollId, studentId: student.id, answers, isFlagged, flagReason }
	});
	return res.json({ response });
});

// Faculty: export Excel with email notification
app.get('/api/faculty/polls/:pollId/export', authMiddleware(['faculty']), async (req: any, res) => {
	const { pollId } = req.params;
	const poll = await prisma.poll.findUnique({ where: { id: pollId } });
	if (!poll) return res.status(404).json({ error: 'Poll not found' });
	
	// Get faculty details
	const faculty = await prisma.faculty.findUnique({ 
		where: { userId: req.user.id } 
	});
	if (!faculty) return res.status(404).json({ error: 'Faculty not found' });
	
	const responses = await prisma.pollResponse.findMany({ where: { pollId }, include: { student: true } });
	const allRows: any[] = [];
	const fakeRows: any[] = [];
	const correctRows: any[] = [];
	
	for (const r of responses) {
		const base = {
			rollNumber: r.student.rollNumber,
			name: r.student.name,
			collegeEmail: (await prisma.user.findUnique({ where: { id: r.student.userId } }))?.email,
			personalEmail: r.student.personalEmail,
			year: r.student.year,
			section: r.student.section,
			department: r.student.department,
			leetcodeId: r.student.leetcodeId,
			leetcodeContestId: r.student.leetcodeContestId,
			codechefId: r.student.codechefId,
			codeforcesId: r.student.codeforcesId,
			answers: JSON.stringify(r.answers),
			isFlagged: r.isFlagged,
			flagReason: r.flagReason || '',
			submittedAt: r.submittedAt.toISOString()
		};
		allRows.push(base);
		(r.isFlagged ? fakeRows : correctRows).push(base);
	}
	
	// Create Excel workbook
	const wb = XLSX.utils.book_new();
	const allWs = XLSX.utils.json_to_sheet(allRows);
	XLSX.utils.book_append_sheet(wb, allWs, 'All');
	const fakeWs = XLSX.utils.json_to_sheet(fakeRows);
	XLSX.utils.book_append_sheet(wb, fakeWs, 'FakePollers');
	const correctWs = XLSX.utils.json_to_sheet(correctRows);
	XLSX.utils.book_append_sheet(wb, correctWs, 'CorrectPollers');
	const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
	
	// Send email notification if there are fake pollers
	if (fakeRows.length > 0) {
		try {
			// Get faculty's email from User table
			const facultyUser = await prisma.user.findUnique({ where: { id: faculty.userId } });
			if (!facultyUser) {
				console.error('Faculty user not found');
				return res.status(500).json({ error: 'Faculty user not found' });
			}
			
			const fakePollers = fakeRows.map(row => {
				const response = responses.find(r => r.student.rollNumber === row.rollNumber);
				return {
					student: response?.student,
					response: response
				};
			}).filter(item => item.student && item.response);
			
			const notification = {
				faculty: { ...faculty, collegeEmail: facultyUser.email },
				poll,
				fakePollers: fakePollers as any,
				totalResponses: responses.length,
				fakeCount: fakeRows.length,
				correctCount: correctRows.length
			};
			
			// Send email notification (async - don't wait for it)
			emailService.sendFakePollerNotification(notification, buf).catch(error => {
				console.error('Failed to send email notification:', error);
			});
			
			console.log(`Email notification sent to ${facultyUser.email} for ${fakeRows.length} fake pollers`);
		} catch (error) {
			console.error('Error preparing email notification:', error);
		}
	}
	
	// Send Excel file to client
	res.setHeader('Content-Disposition', `attachment; filename=poll_${pollId}_${new Date().toISOString().split('T')[0]}.xlsx`);
	res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
	return res.send(buf);
});

// Faculty: Send email notification manually
app.post('/api/faculty/polls/:pollId/notify', authMiddleware(['faculty']), async (req: any, res) => {
	const { pollId } = req.params;
	const poll = await prisma.poll.findUnique({ where: { id: pollId } });
	if (!poll) return res.status(404).json({ error: 'Poll not found' });
	
	// Get faculty details
	const faculty = await prisma.faculty.findUnique({ where: { userId: req.user.id } });
	if (!faculty) return res.status(404).json({ error: 'Faculty not found' });
	
	// Get faculty's email
	const facultyUser = await prisma.user.findUnique({ where: { id: faculty.userId } });
	if (!facultyUser) return res.status(500).json({ error: 'Faculty user not found' });
	
	// Get poll responses
	const responses = await prisma.pollResponse.findMany({ where: { pollId }, include: { student: true } });
	const fakeRows = responses.filter(r => r.isFlagged);
	const correctRows = responses.filter(r => !r.isFlagged);
	
	if (fakeRows.length === 0) {
		return res.json({ message: 'No fake pollers to notify about' });
	}
	
	try {
		// Create Excel file
		const allRows: any[] = [];
		for (const r of responses) {
			const user = await prisma.user.findUnique({ where: { id: r.student.userId } });
			allRows.push({
				rollNumber: r.student.rollNumber,
				collegeEmail: user?.email,
				personalEmail: r.student.personalEmail,
				year: r.student.year,
				section: r.student.section,
				department: r.student.department,
				leetcodeId: r.student.leetcodeId,
				codechefId: r.student.codechefId,
				codeforcesId: r.student.codeforcesId,
				answers: JSON.stringify(r.answers),
				isFlagged: r.isFlagged,
				flagReason: r.flagReason || '',
				submittedAt: r.submittedAt.toISOString()
			});
		}
		
		const wb = XLSX.utils.book_new();
		const allWs = XLSX.utils.json_to_sheet(allRows);
		XLSX.utils.book_append_sheet(wb, allWs, 'All');
		const fakeWs = XLSX.utils.json_to_sheet(fakeRows.map(r => allRows.find(row => row.rollNumber === r.student.rollNumber)));
		XLSX.utils.book_append_sheet(wb, fakeWs, 'FakePollers');
		const correctWs = XLSX.utils.json_to_sheet(correctRows.map(r => allRows.find(row => row.rollNumber === r.student.rollNumber)));
		XLSX.utils.book_append_sheet(wb, correctWs, 'CorrectPollers');
		
		const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
		
		// Prepare notification
		const fakePollers = fakeRows.map(r => ({
			student: r.student,
			response: r
		}));
		
		const notification = {
			faculty: { ...faculty, collegeEmail: facultyUser.email },
			poll,
			fakePollers,
			totalResponses: responses.length,
			fakeCount: fakeRows.length,
			correctCount: correctRows.length
		};
		
		// Send email
		const emailSent = await emailService.sendFakePollerNotification(notification, buf);
		
		if (emailSent) {
			return res.json({ 
				success: true, 
				message: `Email notification sent to ${facultyUser.email}`,
				fakeCount: fakeRows.length,
				correctCount: correctRows.length
			});
		} else {
			return res.status(500).json({ error: 'Failed to send email notification' });
		}
	} catch (error) {
		console.error('Error sending email notification:', error);
		return res.status(500).json({ error: 'Failed to send email notification' });
	}
});



// Admin: Bulk import students from CSV
app.post('/api/admin/import-students', async (req, res) => {
	const schema = z.object({
		students: z.array(z.object({
			rollNumber: z.string(),
			collegeEmail: z.string().email(),
			name: z.string(),
			personalEmail: z.string().email(),
			year: z.string(),
			section: z.string(),
			department: z.string(),
			leetcodeId: z.string().optional(),
			leetcodeContestId: z.string().optional(),
			codechefId: z.string().optional(),
			codeforcesId: z.string().optional(),
			otherIds: z.array(z.object({ platform: z.string(), id: z.string() })).optional()
		}))
	});
	
	try {
		const { students } = schema.parse(req.body);
		const results = { success: 0, failed: 0, errors: [] as string[] };
		
		for (const studentData of students) {
			try {
				// Check if user already exists
				const existingUser = await prisma.user.findUnique({ where: { email: studentData.collegeEmail } });
				if (existingUser) {
					results.failed++;
					results.errors.push(`User ${studentData.collegeEmail} already exists`);
					continue;
				}
				
				// Create user with default password
				const defaultPassword = await bcrypt.hash('Student@123', 10);
				const user = await prisma.user.create({
					data: { email: studentData.collegeEmail, passwordHash: defaultPassword, type: 'student' }
				});
				
				// Create student
				const student = await prisma.student.create({
					data: {
						userId: user.id,
						name: studentData.name,
						rollNumber: studentData.rollNumber,
						personalEmail: studentData.personalEmail,
						year: studentData.year,
						section: studentData.section,
						department: studentData.department,
						leetcodeId: studentData.leetcodeId || undefined,
						leetcodeContestId: studentData.leetcodeContestId || undefined,
						codechefId: studentData.codechefId || undefined,
						codeforcesId: studentData.codeforcesId || undefined,
						otherIds: studentData.otherIds || undefined
					}
				});
				
				// Ensure class exists and map student
				const klass = await prisma.class.upsert({
					where: { year_section_department: { year: studentData.year, section: studentData.section, department: studentData.department } },
					create: { year: studentData.year, section: studentData.section, department: studentData.department },
					update: {}
				});
				await prisma.studentClass.create({ data: { studentId: student.id, classId: klass.id } });
				
				results.success++;
			} catch (e: any) {
				results.failed++;
				results.errors.push(`Failed to import ${studentData.rollNumber}: ${e.message}`);
			}
		}
		
		return res.json(results);
	} catch (e: any) {
		return res.status(400).json({ error: e.message });
	}
});

// Admin: Get all students (for CSV export)
app.get('/api/admin/students', async (req, res) => {
	const students = await prisma.student.findMany({
		include: { user: true, classes: { include: { class: true } } }
	});
	
	const shaped = students.map(s => ({
		...s,
		collegeEmail: s.user.email,
		classes: s.classes.map(sc => ({ year: sc.class.year, section: sc.class.section, department: sc.class.department }))
	}));
	
	return res.json({ students: shaped });
});

// Admin: Export students CSV
app.get('/api/admin/export-students', async (req, res) => {
	const students = await prisma.student.findMany({
		include: { user: true }
	});
	
	const rows = students.map(s => ({
		rollNumber: s.rollNumber,
		collegeEmail: s.user.email,
		personalEmail: s.personalEmail,
		year: s.year,
		section: s.section,
		department: s.department,
		leetcodeId: s.leetcodeId || '',
		leetcodeContestId: s.leetcodeContestId || '',
		codechefId: s.codechefId || '',
		codeforcesId: s.codeforcesId || '',
		otherIds: s.otherIds ? JSON.stringify(s.otherIds) : '',
		createdAt: s.createdAt.toISOString()
	}));
	
	const wb = XLSX.utils.book_new();
	const ws = XLSX.utils.json_to_sheet(rows);
	XLSX.utils.book_append_sheet(wb, ws, 'Students');
	const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
	
	res.setHeader('Content-Disposition', 'attachment; filename=students_export.xlsx');
	res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
	return res.send(buf);
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const port = process.env.PORT || 4000;

// Better error handling for server startup
const server = app.listen(port, () => {
	console.log(`Server listening on http://localhost:${port}`);
	console.log('Environment:', {
		NODE_ENV: process.env.NODE_ENV,
		PORT: process.env.PORT,
		DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
		JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING'
	});
});

// Handle server errors
server.on('error', (error) => {
	console.error('Server error:', error);
	process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
	console.log('SIGTERM received, shutting down gracefully');
	server.close(() => {
		console.log('Server closed');
		process.exit(0);
	});
}); 