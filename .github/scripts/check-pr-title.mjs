// Checks a PR title against the release-notes format in .claude/skills/git-workflow/SKILL.md:
// `<type>[!]: <emoji> <short past-tense description>`, no scope. The squash commit takes the
// title, so this is the line that ends up in the release notes.
const types = ['feat', 'fix', 'perf', 'revert', 'refactor', 'docs', 'test', 'build', 'ci', 'chore'];
const emoji = String.raw`(?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:[\p{Extended_Pictographic}\p{Emoji_Modifier}\p{Regional_Indicator}]|\u{FE0F}|\u{200D}|\u{20E3})*`;
const pattern = new RegExp(String.raw`^(${types.join('|')})!?: ${emoji} \S.*$`, 'u');
const maxLength = 72;

const title = process.env.PR_TITLE ?? '';
const found = [];
if (/^\w+\(.*\)!?:/.test(title))
	found.push('Drop the scope: write `feat: 🪵 ...`, not `feat(x): 🪵 ...`.');
else if (!pattern.test(title))
	found.push(`Use \`<type>: <emoji> <description>\` with one of: ${types.join(', ')}.`);
if (title.endsWith('.')) found.push('Drop the trailing period.');
if ([...title].length > maxLength) found.push(`Keep it within ${maxLength} characters.`);

if (found.length) {
	console.error(`PR title "${title}" doesn't follow the release-notes format:`);
	for (const p of found) console.error(`- ${p}`);
	console.error('See .claude/skills/git-workflow/SKILL.md.');
	process.exit(1);
}
console.log(`PR title OK: ${title}`);
