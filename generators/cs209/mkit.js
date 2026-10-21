// Builders for method problems: a whole-class program is main plus methods, written as line lists.
// A line is a string, or { src, bad: true } for the line a find-the-bug problem flags.
export const ind = (ls) => ls.map((l) => (typeof l === 'string' ? '    ' + l : { ...l, src: '    ' + l.src }));
export const main = (body) => ['public static void main(String[] args) {', ...ind(body), '}'];
export const method = (sig, body) => [`public static ${sig} {`, ...ind(body), '}'];
export const bad = (src) => ({ src, bad: true });
export const text = (...blocks) => blocks.flat().map((l) => (typeof l === 'string' ? l : l.src)).join('\n');
// For bug problems: the program text plus the 1-based number of the flagged line.
export const prog = (...blocks) => {
  const lines = blocks.flat();
  return { code: text(lines), answer: lines.findIndex((l) => typeof l !== 'string' && l.bad) + 1 };
};
