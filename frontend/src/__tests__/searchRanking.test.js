/* Ranking is the part that decides which single result gets the prominent
   card. It used to be "whatever the API returned first", which put a person
   with "Aarzo" in their headline above the company actually named Aarzo. */
import { bestResult, withoutTopResult } from "../utils/searchRanking";

const data = {
  people: [
    { id: 1, name: "Aarzo Person", headline: "Designer" },
    { id: 2, name: "Someone Else", headline: "Works at Aarzo" },
  ],
  companies: [
    { id: 3, name: "Aarzo" },
    { id: 4, name: "Aarzo Labs" },
  ],
  jobs: [
    { id: 5, title: "Backend Engineer", organization_name: "Aarzo" },
    { id: 6, title: "Aarzo Engineer" },
  ],
};

describe("bestResult", () => {
  test("an exact company name beats a job from that company", () => {
    expect(bestResult(data, "aarzo")).toMatchObject({
      kind: "company",
      item: { id: 3 },
    });
  });

  test("an exact person name still wins when the query is a person", () => {
    expect(bestResult({
      people: [{ id: 1, name: "Sara" }],
      companies: [{ id: 2, name: "Sara Labs" }],
      jobs: [],
    }, "sara")).toMatchObject({ kind: "person", item: { id: 1 } });
  });

  test("an exact job title beats a person's secondary-field mention", () => {
    expect(bestResult({
      people: [{ id: 1, name: "Someone", headline: "Backend Engineer" }],
      companies: [],
      jobs: [{ id: 2, title: "Backend Engineer" }],
    }, "backend engineer")).toMatchObject({ kind: "job", item: { id: 2 } });
  });

  test("returns null for an empty query or empty result set", () => {
    expect(bestResult(data, "  ")).toBeNull();
    expect(bestResult({ people: [], companies: [], jobs: [] }, "aarzo")).toBeNull();
  });

  test("removes the top result only from its own group", () => {
    const top = bestResult(data, "aarzo");
    expect(top).toMatchObject({ kind: "company", item: { id: 3 } });

    expect(withoutTopResult("company", data.companies, top).map((c) => c.id))
      .toEqual([4]);
    expect(withoutTopResult("person", data.people, top)).toHaveLength(2);
    expect(withoutTopResult("job", data.jobs, top)).toHaveLength(2);
  });
});
