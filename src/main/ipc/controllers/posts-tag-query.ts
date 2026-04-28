type SearchTermMode = "exact" | "wildcard" | "fuzzy";

export interface ParsedSearchTerm {
  value: string;
  mode: SearchTermMode;
}

export interface ParsedSearchToken {
  exclude: boolean;
  terms: ParsedSearchTerm[];
}

export function parseTagFilterQuery(query: string): ParsedSearchToken[] {
  const rawTokens = query
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
  const parsed: ParsedSearchToken[] = [];

  for (const rawToken of rawTokens) {
    if (rawToken === "-") {
      continue;
    }

    const exclude = rawToken.startsWith("-") && rawToken.length > 1;
    let tokenValue = exclude ? rawToken.slice(1).trim() : rawToken.trim();
    if (
      tokenValue.startsWith("(") &&
      tokenValue.endsWith(")") &&
      tokenValue.length > 2
    ) {
      tokenValue = tokenValue.slice(1, -1).trim();
    }
    if (tokenValue.length === 0) {
      continue;
    }

    const terms = tokenValue
      .split("|")
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map((term): ParsedSearchTerm | null => {
        if (term.endsWith("~") && term.length > 1) {
          return { value: term.slice(0, -1).toLowerCase(), mode: "fuzzy" };
        }
        if (term.includes("*")) {
          return { value: term.toLowerCase(), mode: "wildcard" };
        }
        if (term.length > 0) {
          return { value: term.toLowerCase(), mode: "exact" };
        }
        return null;
      })
      .filter((term): term is ParsedSearchTerm => term !== null);

    if (terms.length > 0) {
      parsed.push({ exclude, terms });
    }
  }

  return parsed;
}
