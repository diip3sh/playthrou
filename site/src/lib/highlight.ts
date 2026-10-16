export type Lang = "sh" | "css" | "html" | "jsx" | "ts" | "text";

export type Token =
  | "plain"
  | "punct"
  | "comment"
  | "keyword"
  | "tag"
  | "attr"
  | "prop"
  | "var"
  | "string"
  | "number"
  | "fn"
  | "component";

/** A rule matches at the cursor; each capture group becomes one token, in order. */
type Rule = [RegExp, ...Token[]];

const STRING = /("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`[^`]*`)/y;

/** Markup rules; JSX adds expression braces before the plain-text fallback. */
function markup(extra: Rule[] = []): Rule[] {
  return [
    [/(<!--[\s\S]*?-->)/y, "comment"],
    [/(<\/?)([A-Za-z][\w.-]*)/y, "punct", "tag"],
    [/(\s+)([A-Za-z_:@][\w:.-]*)(?==)/y, "plain", "attr"],
    [/(=)/y, "prop"],
    [STRING, "string"],
    [/(\/?>)/y, "punct"],
    ...extra,
    [/([^<"'=>{}]+)/y, "plain"],
  ];
}

const RULES: Record<Exclude<Lang, "text" | "sh">, Rule[]> = {
  css: [
    [/(\/\*[\s\S]*?\*\/)/y, "comment"],
    [/(@)([\w-]+)/y, "punct", "keyword"],
    [STRING, "string"],
    [/(--[\w-]+)/y, "var"],
    [/([a-z-]+)(?=\s*:(?!:))/y, "prop"],
    [/(\.[A-Za-z_][\w-]*)/y, "attr"],
    [/(:{1,2}[a-z-]+)/y, "keyword"],
    [/([\w-]+)(?=\()/y, "fn"],
    [/(-?\d*\.?\d+)(px|rem|em|ms|s|%|deg)?/y, "number", "tag"],
    [/([\w-]+)/y, "plain"],
    [/([{}();:,*/+])/y, "punct"],
  ],
  html: markup(),
  jsx: markup([[/([{}])/y, "punct"]]),
  ts: [
    [/(\/\/[^\n]*)/y, "comment"],
    [STRING, "string"],
    [/\b(import|export|from|const|let|return|function|type|interface|default|new)\b/y, "keyword"],
    [/([A-Za-z_$][\w$]*)(?=\()/y, "fn"],
    [/\b(\d+(?:\.\d+)?)\b/y, "number"],
    [/([A-Z][\w$]*)/y, "component"],
    [/([A-Za-z_$][\w$]*)/y, "var"],
    [/([{}()[\];,.:=<>+\-*/?!|&]+)/y, "punct"],
  ],
};

function tokenize(code: string, rules: Rule[]): Array<[Token, string]> {
  const out: Array<[Token, string]> = [];
  let i = 0;
  outer: while (i < code.length) {
    for (const [re, ...types] of rules) {
      re.lastIndex = i;
      const m = re.exec(code);
      if (!m || m[0].length === 0) continue;
      types.forEach((t, g) => {
        const text = m[g + 1];
        if (text) out.push([t, text]);
      });
      i += m[0].length;
      continue outer;
    }
    out.push(["plain", code[i] as string]);
    i++;
  }
  return out;
}

function tokenizeShell(code: string): Array<[Token, string]> {
  return code.split(/(\n)/).flatMap((line): Array<[Token, string]> => {
    if (line === "\n") return [["plain", line]];
    if (line.trimStart().startsWith("#")) return [["comment", line]];
    const m = /^(\s*)(\S+)(.*)$/.exec(line);
    if (!m) return [["plain", line]];
    return [
      ["plain", m[1] ?? ""],
      ["fn", m[2] ?? ""],
      ["string", m[3] ?? ""],
    ];
  });
}

/** Splits code into classed tokens. Plain text comes back as a single token. */
export function highlight(code: string, lang: Lang): Array<[Token, string]> {
  if (lang === "text") return [["plain", code]];
  return lang === "sh" ? tokenizeShell(code) : tokenize(code, RULES[lang]);
}
