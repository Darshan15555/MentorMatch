/**
 * Seeds the database with a small, realistic demo dataset so the app isn't
 * empty on first run. Safe to re-run: it clears prior demo data (matched by
 * @college.edu / @demo.edu emails) before reinserting.
 *
 * Usage: node seed.js   (requires MONGODB_URI to be reachable)
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB, mongoose } = require('./db/mongo');
const User = require('./models/User');
const { Match, Room, Resource } = require('./models/index');

const DEMO_PASSWORD = 'password123';

async function upsertUser(data) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await User.deleteOne({ email: data.email });
  return User.create({ ...data, passwordHash });
}

async function seed() {
  await connectDB();
  console.log('Connected. Seeding demo data...');

  const mentors = await Promise.all([
    upsertUser({
      name: 'Asha Rao', email: 'asha@college.edu', role: 'mentor',
      bio: 'Full-stack dev, 4th year CSE. Love pairing with juniors on real projects.',
      yearBranch: '4th Year, CSE', isVerified: true, availabilityStatus: 'open',
      githubUrl: 'https://github.com/asharao',
      skills: [
        { name: 'React', type: 'have' }, { name: 'Node.js', type: 'have' },
        { name: 'Python', type: 'have' }, { name: 'System Design', type: 'have' },
      ],
      interests: ['Open Source', 'Hackathons'],
      timeline: [
        { year: '2024', title: 'Backend intern at a fintech startup', description: 'Built payment reconciliation services in Node.js.', sortOrder: 1 },
        { year: '2025', title: 'Started open-source contributions', description: 'Contributed to a React state-management library.', sortOrder: 2 },
      ],
      sessionCount: 6, avgRating: 4.7, mentorLevel: 'Rising Mentor',
    }),
    upsertUser({
      name: 'Devan Iyer', email: 'devan@college.edu', role: 'mentor',
      bio: 'ML enthusiast, into competitive programming and DSA.',
      yearBranch: '3rd Year, CSE', isVerified: true, availabilityStatus: 'open',
      skills: [
        { name: 'DSA', type: 'have' }, { name: 'Python', type: 'have' }, { name: 'Machine Learning', type: 'have' },
      ],
      interests: ['Competitive Programming', 'Open Source'],
      timeline: [
        { year: '2025', title: 'Codeforces Expert', description: 'Reached Expert rank after a year of consistent practice.', sortOrder: 1 },
      ],
      sessionCount: 2, avgRating: 5, mentorLevel: 'New Mentor',
    }),
  ]);

  const mentees = await Promise.all([
    upsertUser({
      name: 'Ravi Kumar', email: 'ravi@demo.edu', role: 'mentee',
      bio: 'Second year, trying to get into web dev.',
      yearBranch: '2nd Year, IT', isVerified: false, availabilityStatus: 'open',
      skills: [
        { name: 'Python', type: 'have' }, { name: 'React', type: 'want' }, { name: 'DSA', type: 'want' },
      ],
      interests: ['Open Source'],
    }),
    upsertUser({
      name: 'Meera Shah', email: 'meera@demo.edu', role: 'mentee',
      bio: 'First year, curious about machine learning.',
      yearBranch: '1st Year, CSE', isVerified: false, availabilityStatus: 'open',
      skills: [{ name: 'Machine Learning', type: 'want' }, { name: 'Python', type: 'want' }],
      interests: ['Competitive Programming'],
    }),
  ]);

  await upsertUser({
    name: 'Admin User', email: 'admin@college.edu', role: 'both',
    isVerified: true, isAdmin: true, availabilityStatus: 'open',
    skills: [], interests: [],
  });

  // A sample accepted connection with a resource attached, so Browse/Connections aren't empty
  const [asha, , ravi] = [...mentors, ...mentees];
  await Match.deleteMany({ mentorId: asha._id, menteeId: ravi._id });
  await Match.create({
    mentorId: asha._id, menteeId: ravi._id, matchScore: 78, status: 'accepted',
    introMessage: 'Hi! Would love your guidance on React.',
  });

  await Resource.deleteMany({ mentorId: asha._id });
  await Resource.create({
    mentorId: asha._id, title: 'React docs — start here', link: 'https://react.dev/learn',
    notes: '', tags: ['React'],
  });

  await Room.deleteMany({ mentorId: asha._id });
  await Room.create({
    mentorId: asha._id, topic: 'Web Dev Basics', recurringDay: 'Monday', recurringTime: '18:00',
    memberIds: [asha._id],
  });

  console.log('\nSeed complete. Demo accounts (all use password: ' + DEMO_PASSWORD + '):');
  console.log('  Mentor:  asha@college.edu');
  console.log('  Mentor:  devan@college.edu');
  console.log('  Mentee:  ravi@demo.edu');
  console.log('  Mentee:  meera@demo.edu');
  console.log('  Admin:   admin@college.edu');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
