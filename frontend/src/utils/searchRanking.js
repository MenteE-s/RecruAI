// Ranking for the universal search result page.
//
// The API returns three independently ranked groups. The page needs one "top
// result" across all of them, so score names exactly once here: exact name or
// job title first, then prefix, then substring, then a hit in a secondary
// field. Ties stay stable and favour people, then companies, then job posts.
const TYPE_PRIORITY = { person: 3, company: 2, job: 1 };

export function bestResult(data, query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return null;

  const candidates = [];
  const consider = (kind, items) => {
    (items || []).forEach((item) => {
      const name = (kind === "job" ? item.title : item.name || "").toLowerCase();
      let score = 1;
      if (name === q) score = 300;
      else if (name.startsWith(q)) score = 200;
      else if (name.includes(q)) score = 100;
      else {
        const secondary = [
          item.headline, item.current_position, item.current_company,
          item.industry, item.organization_name, item.category, item.location,
        ].filter(Boolean).join(" ").toLowerCase();
        if (secondary.includes(q)) score = 20;
      }
      candidates.push({ kind, item, score, priority: TYPE_PRIORITY[kind] });
    });
  };
  consider("person", data?.people);
  consider("company", data?.companies);
  consider("job", data?.jobs);

  candidates.sort((a, b) => (
    b.score - a.score ||
    b.priority - a.priority ||
    String(a.item.name || a.item.title || "").localeCompare(
      String(b.item.name || b.item.title || "")
    )
  ));
  return candidates[0] || null;
}

export function withoutTopResult(kind, items, top) {
  if (!top || top.kind !== kind) return items || [];
  return (items || []).filter((item) => item.id !== top.item.id);
}
