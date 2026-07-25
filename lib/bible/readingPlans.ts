export interface ReadingPlanDay {
  day: number;
  label: string;
  readings: { bookId: string; chapter: number }[];
}

export interface ReadingPlanDefinition {
  id: string;
  title: string;
  description: string;
  days: number;
  schedule: ReadingPlanDay[];
  config?: import("./planBuilder").PlanBuilderConfig;
}

function otDay(bookId: string, chapter: number, day: number): ReadingPlanDay {
  return { day, label: `Day ${day}`, readings: [{ bookId, chapter }] };
}

function buildBibleInYear(): ReadingPlanDay[] {
  const days: ReadingPlanDay[] = [];
  let day = 1;
  for (const book of [
    { id: "genesis", chapters: 50 },
    { id: "exodus", chapters: 40 },
    { id: "leviticus", chapters: 27 },
    { id: "numbers", chapters: 36 },
    { id: "deuteronomy", chapters: 34 },
    { id: "joshua", chapters: 24 },
    { id: "judges", chapters: 21 },
    { id: "ruth", chapters: 4 },
    { id: "1-samuel", chapters: 31 },
    { id: "2-samuel", chapters: 24 },
    { id: "1-kings", chapters: 22 },
    { id: "2-kings", chapters: 25 },
    { id: "1-chronicles", chapters: 29 },
    { id: "2-chronicles", chapters: 36 },
    { id: "ezra", chapters: 10 },
    { id: "nehemiah", chapters: 13 },
    { id: "esther", chapters: 10 },
    { id: "job", chapters: 42 },
    { id: "psalms", chapters: 150 },
    { id: "proverbs", chapters: 31 },
    { id: "ecclesiastes", chapters: 12 },
    { id: "song-of-solomon", chapters: 8 },
    { id: "isaiah", chapters: 66 },
    { id: "jeremiah", chapters: 52 },
    { id: "lamentations", chapters: 5 },
    { id: "ezekiel", chapters: 48 },
    { id: "daniel", chapters: 12 },
    { id: "hosea", chapters: 14 },
    { id: "joel", chapters: 3 },
    { id: "amos", chapters: 9 },
    { id: "obadiah", chapters: 1 },
    { id: "jonah", chapters: 4 },
    { id: "micah", chapters: 7 },
    { id: "nahum", chapters: 3 },
    { id: "habakkuk", chapters: 3 },
    { id: "zephaniah", chapters: 3 },
    { id: "haggai", chapters: 2 },
    { id: "zechariah", chapters: 14 },
    { id: "malachi", chapters: 4 },
    { id: "matthew", chapters: 28 },
    { id: "mark", chapters: 16 },
    { id: "luke", chapters: 24 },
    { id: "john", chapters: 21 },
    { id: "acts", chapters: 28 },
    { id: "romans", chapters: 16 },
    { id: "1-corinthians", chapters: 16 },
    { id: "2-corinthians", chapters: 13 },
    { id: "galatians", chapters: 6 },
    { id: "ephesians", chapters: 6 },
    { id: "philippians", chapters: 4 },
    { id: "colossians", chapters: 4 },
    { id: "1-thessalonians", chapters: 5 },
    { id: "2-thessalonians", chapters: 3 },
    { id: "1-timothy", chapters: 6 },
    { id: "2-timothy", chapters: 4 },
    { id: "titus", chapters: 3 },
    { id: "philemon", chapters: 1 },
    { id: "hebrews", chapters: 13 },
    { id: "james", chapters: 5 },
    { id: "1-peter", chapters: 5 },
    { id: "2-peter", chapters: 3 },
    { id: "1-john", chapters: 5 },
    { id: "2-john", chapters: 1 },
    { id: "3-john", chapters: 1 },
    { id: "jude", chapters: 1 },
    { id: "revelation", chapters: 22 },
  ]) {
    for (let ch = 1; ch <= book.chapters; ch++) {
      days.push(otDay(book.id, ch, day++));
    }
  }
  return days;
}

function buildNt90(): ReadingPlanDay[] {
  const ntBooks = [
    { id: "matthew", chapters: 28 },
    { id: "mark", chapters: 16 },
    { id: "luke", chapters: 24 },
    { id: "john", chapters: 21 },
    { id: "acts", chapters: 28 },
    { id: "romans", chapters: 16 },
    { id: "1-corinthians", chapters: 16 },
    { id: "2-corinthians", chapters: 13 },
    { id: "galatians", chapters: 6 },
    { id: "ephesians", chapters: 6 },
    { id: "philippians", chapters: 4 },
    { id: "colossians", chapters: 4 },
    { id: "1-thessalonians", chapters: 5 },
    { id: "2-thessalonians", chapters: 3 },
    { id: "1-timothy", chapters: 6 },
    { id: "2-timothy", chapters: 4 },
    { id: "titus", chapters: 3 },
    { id: "philemon", chapters: 1 },
    { id: "hebrews", chapters: 13 },
    { id: "james", chapters: 5 },
    { id: "1-peter", chapters: 5 },
    { id: "2-peter", chapters: 3 },
    { id: "1-john", chapters: 5 },
    { id: "2-john", chapters: 1 },
    { id: "3-john", chapters: 1 },
    { id: "jude", chapters: 1 },
    { id: "revelation", chapters: 22 },
  ];
  const all: { bookId: string; chapter: number }[] = [];
  for (const b of ntBooks) {
    for (let ch = 1; ch <= b.chapters; ch++) all.push({ bookId: b.id, chapter: ch });
  }
  const perDay = Math.ceil(all.length / 90);
  const days: ReadingPlanDay[] = [];
  for (let d = 0; d < 90; d++) {
    const slice = all.slice(d * perDay, (d + 1) * perDay);
    if (!slice.length) break;
    days.push({ day: d + 1, label: `Day ${d + 1}`, readings: slice });
  }
  return days;
}

function buildPsalmsProverbs30(): ReadingPlanDay[] {
  const days: ReadingPlanDay[] = [];
  for (let d = 1; d <= 30; d++) {
    const psalm = Math.min(d * 5, 150);
    const proverb = Math.min(d, 31);
    days.push({
      day: d,
      label: `Day ${d}`,
      readings: [
        { bookId: "psalms", chapter: psalm },
        { bookId: "proverbs", chapter: proverb },
      ],
    });
  }
  return days;
}

export const READING_PLANS: ReadingPlanDefinition[] = [
  {
    id: "bible-in-a-year",
    title: "Bible in a Year",
    description: "One chapter per day through the whole Bible",
    days: 1189,
    schedule: buildBibleInYear(),
  },
  {
    id: "nt-90",
    title: "New Testament in 90 Days",
    description: "Read the entire New Testament in three months",
    days: 90,
    schedule: buildNt90(),
  },
  {
    id: "psalms-proverbs-30",
    title: "Psalms & Proverbs (30 Days)",
    description: "Daily wisdom from Psalms and Proverbs",
    days: 30,
    schedule: buildPsalmsProverbs30(),
  },
];

export function getReadingPlan(id: string): ReadingPlanDefinition | undefined {
  return READING_PLANS.find((p) => p.id === id);
}
