const { computeMatch, splitSkills } = require('../utils/matching');

let pass = 0, fail = 0;
function check(label, cond, extra) {
  if (cond) { pass++; console.log(`✅ ${label}`); }
  else { fail++; console.log(`❌ ${label}`, extra ?? ''); }
}

// ---- splitSkills ----
{
  const skills = [
    { name: 'React', type: 'have' }, { name: 'Node.js', type: 'have' }, { name: 'DSA', type: 'want' },
  ];
  const { have, want } = splitSkills(skills);
  check('splitSkills separates have/want', have.length === 2 && want.length === 1, { have, want });
}

// ---- computeMatch: mentor can teach mentee's wanted skills ----
{
  const mentee = {
    skills: [{ name: 'Python', type: 'have' }, { name: 'React', type: 'want' }, { name: 'DSA', type: 'want' }],
    interests: ['Open Source', 'Hackathons'],
  };
  const mentor = {
    skills: [{ name: 'React', type: 'have' }, { name: 'Node.js', type: 'have' }, { name: 'Python', type: 'have' }],
    interests: ['Open Source'],
  };
  const result = computeMatch(mentee, mentor);
  check('score is a number between 0-100', typeof result.score === 'number' && result.score >= 0 && result.score <= 100, result.score);
  check('score > 0 when there is real overlap', result.score > 0, result.score);
  check('skillGraph.teachable includes react', result.skillGraph.teachable.includes('react'), result.skillGraph.teachable);
  check('skillGraph.shared includes python (both have it)', result.skillGraph.shared.includes('python'), result.skillGraph.shared);
  check('explanation is non-empty string', typeof result.explanation === 'string' && result.explanation.length > 0);
  check('breakdown has all three sub-scores', ['teachScore', 'commonGroundScore', 'interestScore'].every(k => typeof result.breakdown[k] === 'number'));
}

// ---- computeMatch: zero overlap ----
{
  const mentee = { skills: [{ name: 'Photoshop', type: 'want' }], interests: ['Painting'] };
  const mentor = { skills: [{ name: 'Kubernetes', type: 'have' }], interests: ['Chess'] };
  const result = computeMatch(mentee, mentor);
  check('zero overlap produces score of 0', result.score === 0, result.score);
  check('zero overlap explanation mentions limited overlap', result.explanation.toLowerCase().includes('limited overlap'));
}

// ---- computeMatch: mentee has no "want" skills at all (edge case, no div-by-zero) ----
{
  const mentee = { skills: [{ name: 'Python', type: 'have' }], interests: [] };
  const mentor = { skills: [{ name: 'Python', type: 'have' }], interests: [] };
  const result = computeMatch(mentee, mentor);
  check('no NaN when mentee has no "want" skills', !Number.isNaN(result.score), result.score);
  check('shared "have" skill still contributes to score', result.score > 0, result.score);
}

// ---- computeMatch: case-insensitive matching ----
{
  const mentee = { skills: [{ name: 'react', type: 'want' }], interests: [] };
  const mentor = { skills: [{ name: 'REACT', type: 'have' }], interests: [] };
  const result = computeMatch(mentee, mentor);
  // Case-insensitivity is proven by the teach sub-score hitting 100 (full overlap),
  // not the final blended score, since commonGround/interest sub-scores are 0 here by design.
  check('matching is case-insensitive (teachScore = 100)', result.breakdown.teachScore === 100, result.breakdown);
  check('skillGraph.shared normalizes case', result.skillGraph.shared.includes('react'), result.skillGraph.shared);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
