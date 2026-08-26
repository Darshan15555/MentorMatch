/**
 * Two-way interest matching:
 *  - Primary signal: mentee's "want to learn" skills vs mentor's "have" skills
 *  - Secondary signal: shared "have" skills (common ground / peer language)
 *  - Tertiary signal: shared general interests
 *
 * Score is 0-100. Weighting: 60% want->have overlap, 25% shared-have overlap, 15% shared interests.
 *
 * These are pure functions — they take plain data (skills/interests arrays) and
 * return a result, with no Mongoose/DB calls inside. That makes them trivially
 * unit-testable without a database connection.
 */

function splitSkills(skills = []) {
  const have = skills.filter(s => s.type === 'have').map(s => s.name);
  const want = skills.filter(s => s.type === 'want').map(s => s.name);
  return { have, want };
}

function jaccardOverlapCount(a, b) {
  const setA = new Set(a.map(x => x.toLowerCase()));
  const setB = new Set(b.map(x => x.toLowerCase()));
  const intersection = [...setA].filter(x => setB.has(x));
  return { intersection, unionSize: new Set([...setA, ...setB]).size };
}

/**
 * Computes a match between a mentee and a mentor.
 * @param {{ skills: Array, interests: Array }} menteeUser
 * @param {{ skills: Array, interests: Array }} mentorUser
 */
function computeMatch(menteeUser, mentorUser) {
  const menteeSkills = splitSkills(menteeUser.skills);
  const mentorSkills = splitSkills(mentorUser.skills);
  const menteeInterests = menteeUser.interests || [];
  const mentorInterests = mentorUser.interests || [];

  const teachable = jaccardOverlapCount(menteeSkills.want, mentorSkills.have);
  const teachScore = menteeSkills.want.length
    ? (teachable.intersection.length / menteeSkills.want.length) * 100
    : 0;

  const sharedHave = jaccardOverlapCount(menteeSkills.have, mentorSkills.have);
  const commonGroundScore = sharedHave.unionSize
    ? (sharedHave.intersection.length / sharedHave.unionSize) * 100
    : 0;

  const sharedInterests = jaccardOverlapCount(menteeInterests, mentorInterests);
  const interestScore = sharedInterests.unionSize
    ? (sharedInterests.intersection.length / sharedInterests.unionSize) * 100
    : 0;

  const finalScore = Math.round(
    teachScore * 0.6 + commonGroundScore * 0.25 + interestScore * 0.15
  );

  const parts = [];
  if (teachable.intersection.length > 0) {
    parts.push(`can teach you ${teachable.intersection.slice(0, 3).join(', ')}`);
  }
  if (sharedHave.intersection.length > 0) {
    parts.push(`you both already know ${sharedHave.intersection.slice(0, 2).join(', ')}`);
  }
  if (sharedInterests.intersection.length > 0) {
    parts.push(`you're both into ${sharedInterests.intersection.slice(0, 2).join(', ')}`);
  }
  const explanation = parts.length
    ? `They ${parts.join(', and ')}.`
    : `Limited overlap detected yet — explore their profile for more.`;

  const allMenteeSkills = [...new Set([...menteeSkills.have, ...menteeSkills.want])];
  const allMentorSkills = [...new Set([...mentorSkills.have, ...mentorSkills.want])];
  const sharedAllLower = jaccardOverlapCount(allMenteeSkills, allMentorSkills).intersection;

  const skillGraph = {
    menteeOnly: allMenteeSkills.filter(s => !sharedAllLower.includes(s.toLowerCase())),
    shared: sharedAllLower,
    mentorOnly: allMentorSkills.filter(s => !sharedAllLower.includes(s.toLowerCase())),
    teachable: teachable.intersection,
  };

  return {
    score: finalScore,
    explanation,
    skillGraph,
    breakdown: {
      teachScore: Math.round(teachScore),
      commonGroundScore: Math.round(commonGroundScore),
      interestScore: Math.round(interestScore),
    }
  };
}

module.exports = { computeMatch, splitSkills };
