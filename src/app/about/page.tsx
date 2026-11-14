import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "How it works" };

const POINTS: [string, string][] = [
  ["One goal per session", "Every stage has a goal you can check, like “make 7 of 10 free throws”. Focused practice on one weakness, with feedback straight away, is what separates practice that works from just playing (deliberate practice)."],
  ["Hard, but not too hard", "Drills and puzzles adjust so you succeed about 70–85% of the time. Much easier and you learn little; much harder and there’s too little success to learn from. That sweet spot is also where absorption (flow) tends to happen."],
  ["Test, don’t re-read", "New ideas start with a guess, and key facts come back as quick recall questions, spaced further apart each time. Retrieval and spacing are two of the best-supported findings in learning science."],
  ["Mix it up once the basics are in", "Later stages mix up shots, puzzle types and problems. It feels harder in the moment and transfers better to the real thing."],
  ["Bodies learn too", "Physical drills log makes and attempts, give one cue about the target, and offer a short mental rehearsal. Imagery helps most when combined with real practice. Sleep is when much of the gain is locked in."],
  ["No streaks to lose", "No points, badges or guilt. Motivation that lasts comes from choosing what you learn and seeing yourself get better, so the app shows your real numbers instead."],
  ["Honest about hype", "Where a popular claim doesn’t hold up (like photographic memory, or brain-training games making you smarter), the app says so and teaches what actually works."],
];

export default function About() {
  return (
    <article className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">How it works</h1>
        <p className="mt-2 text-muted">Seven ideas from the research on how people get good at things, and what each one changes in the app.</p>
      </header>
      <ol className="flex flex-col gap-5">
        {POINTS.map(([t, d], i) => (
          <li key={t} className="flex gap-4">
            <span aria-hidden className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm">{i + 1}</span>
            <div>
              <h2 className="font-medium">{t}</h2>
              <p className="mt-1 text-[15px] leading-relaxed text-muted">{d}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted">
        Sources and evidence ratings are in the project&apos;s research brief. <Link href="/" className="text-accent">Back to today</Link>
      </p>
    </article>
  );
}
