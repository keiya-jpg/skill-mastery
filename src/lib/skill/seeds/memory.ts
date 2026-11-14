import type { SkillSpec } from "../schema";

export const memorySeed: SkillSpec = {
  version: 1,
  slug: "memory-training",
  name: "Memory training",
  kind: "mental",
  emoji: "🧠",
  hook: "In six weeks, ordinary people more than doubled how many words they could recall. Here's the method they used.",
  summary:
    "Train the techniques memory champions actually use: a memory palace for lists, the Major system for numbers, and visual chunking. Measured against your own baseline.",
  equipment: ["A quiet 10 minutes", "A route through your home you know well"],
  tags: ["memory", "focus", "study", "brain"],
  honesty:
    "No adult has been verified to photograph a page and read it back later. Brief vivid afterimages show up in some young children and fade with age. What memory champions have is technique, not special brains. Their IQ and brain structure are ordinary; they use places, pictures and codes. In one study, people who trained 30 minutes a day for six weeks went from about 26 to 62 words remembered, and kept most of it four months later. That's what this trains.",
  source: "seed",
  stages: [
    {
      id: "baseline",
      title: "See where your memory is today",
      goal: "Record a baseline: how many of 15 words and how many digits you recall without any technique.",
      why: "You can only see yourself improve against a starting point. Most people are surprised how ordinary their baseline is, and how fast it moves.",
      minutes: 8,
      activities: [
        {
          type: "explain",
          id: "why-baseline",
          title: "Your starting line",
          predict: {
            question: "Shown 15 random words once, how many do most people recall in the right order?",
            options: ["About 5 to 7", "About 10 to 12", "Nearly all 15"],
            answer: 0,
          },
          text: "Short-term memory holds roughly 4 to 7 chunks. That's why a phone number feels like a stretch and a random list falls apart. You're going to measure yours now, with no tricks. Later you'll beat it with technique, not effort.",
        },
        { type: "engine", id: "baseline-words", engine: "memory-words", title: "15 words, no technique", params: { count: 15, method: "none", fixed: true } },
        { type: "engine", id: "baseline-digits", engine: "memory-digits", title: "Digit span", params: { start: 5, method: "none" } },
        { type: "reflect", id: "baseline-reflect", prompt: "What did your mind do while you tried to hold the words?" },
      ],
      cards: [
        { id: "chunks", front: "About how many separate chunks can short-term memory hold?", back: "Roughly 4 to 7.", tip: "A phone number is right at the edge, which is why we split it into groups." },
      ],
    },
    {
      id: "palace",
      title: "Build your first memory palace",
      goal: "Walk 10 places along a route in your home, in order, from memory, without a miss.",
      why: "The method of loci uses spatial memory, which is strong and effortless. Every top memoriser uses some version of it.",
      minutes: 10,
      activities: [
        {
          type: "explain",
          id: "loci",
          title: "Rooms you already know",
          predict: {
            question: "What do most world memory champions have in common?",
            options: ["Unusually high IQ", "A bigger hippocampus", "They use imagined routes through familiar places"],
            answer: 2,
          },
          text: "Brain scans of champions found ordinary intelligence and ordinary brains. What they share is a strategy: they place images along a route they know, such as their home, then walk it in their mind to read them back. Your route needs 10 distinct spots, in an order you'd naturally walk.",
        },
        { type: "engine", id: "build-palace", engine: "memory-palace", title: "Choose 10 places", params: { size: 10 } },
        {
          type: "order",
          id: "loci-steps",
          prompt: "Put the method in order.",
          steps: ["Pick a familiar route", "Fix 10 spots along it", "Make a vivid image for each item", "Place each image at the next spot", "Walk the route to read them back"],
        },
      ],
      cards: [
        { id: "loci-what", front: "What is the method of loci?", back: "Placing vivid images of items at spots along a familiar route, then mentally walking it to recall them." },
        { id: "loci-study", front: "In Dresler's 2017 study, roughly how much did 6 weeks of loci training raise word recall?", back: "From about 26 to 62 words out of 72.", tip: "More than double, and it lasted months." },
      ],
    },
    {
      id: "words",
      title: "Words through the palace",
      goal: "Recall 10 words in order using your palace, with 9 or more right.",
      why: "This is the core move of memory sport. Bizarre, moving, multi-sense images stick far better than plain ones.",
      minutes: 12,
      activities: [
        {
          type: "explain",
          id: "vivid",
          title: "Make it weird",
          text: "For each word, picture it at the next spot in your palace, doing something. Make it huge, loud, smelly or wrong. A loaf of bread on your doormat is forgettable; a loaf of bread kicking your front door in is not. Spend about 5 seconds per image.",
        },
        {
          type: "quiz",
          id: "best-image",
          question: "Which image will you most likely remember for the word 'clock' at your sofa?",
          options: [
            { text: "A clock sitting on the sofa", why: "Static and ordinary. It blends into a thousand other sofa memories." },
            { text: "A giant clock bouncing on the sofa, ringing so loud the cushions explode", why: "Yes: oversized, moving, noisy and absurd. Each of those makes it more distinctive." },
            { text: "The word CLOCK written on the sofa", why: "Words are weaker than pictures. Turn the word into something you can see happen." },
          ],
          answer: 1,
        },
        { type: "engine", id: "palace-words", engine: "memory-words", title: "10 words, using your palace", params: { count: 10, method: "palace" } },
        { type: "reflect", id: "words-reflect", prompt: "Which image was strongest, and what made it work?" },
      ],
      cards: [
        { id: "vivid-rules", front: "Four ways to make a memory image stick?", back: "Exaggerate it, make it move, add a sense (sound, smell), make it interact with the place." },
      ],
    },
    {
      id: "major",
      title: "Numbers become words: the Major system",
      goal: "Turn any 2-digit number into a word in under 5 seconds.",
      why: "Digits are abstract and hard to picture. The Major system turns each digit into a consonant sound, so numbers become words, and words become images.",
      minutes: 12,
      activities: [
        {
          type: "explain",
          id: "major-intro",
          title: "Ten sounds",
          text: "0 = s/z, 1 = t/d, 2 = n, 3 = m, 4 = r, 5 = l, 6 = j/sh/ch, 7 = k/hard g, 8 = f/v, 9 = p/b. Vowels are free. So 14 = t + r = 'tyre', 32 = m + n = 'moon'. You'll learn the sounds as cards, then practise converting.",
        },
        { type: "engine", id: "major-drill", engine: "memory-major", title: "Number to word", params: { rounds: 12 } },
      ],
      cards: [
        { id: "m0", front: "Major system: 0", back: "s / z", tip: "z is the first letter of zero." },
        { id: "m1", front: "Major system: 1", back: "t / d", tip: "t has one downstroke." },
        { id: "m2", front: "Major system: 2", back: "n", tip: "n has two downstrokes." },
        { id: "m3", front: "Major system: 3", back: "m", tip: "m has three downstrokes." },
        { id: "m4", front: "Major system: 4", back: "r", tip: "fouR ends in r." },
        { id: "m5", front: "Major system: 5", back: "l", tip: "Five fingers with the thumb out make an L." },
        { id: "m6", front: "Major system: 6", back: "j / sh / ch", tip: "A J flipped looks like a 6." },
        { id: "m7", front: "Major system: 7", back: "k / hard g", tip: "A K is two 7s back to back." },
        { id: "m8", front: "Major system: 8", back: "f / v", tip: "A handwritten f has two loops like an 8." },
        { id: "m9", front: "Major system: 9", back: "p / b", tip: "p is a mirrored 9." },
      ],
    },
    {
      id: "digits",
      title: "Long numbers through the palace",
      goal: "Recall 20 digits in order after one study pass.",
      why: "Put the two techniques together: two digits make one word, each word goes at one spot. This is how people reach spans of 80+ digits.",
      minutes: 12,
      activities: [
        {
          type: "explain",
          id: "digits-combo",
          title: "Chunk, picture, place",
          text: "Split the number into pairs. Turn each pair into its Major word. Put each word's image at the next spot in your palace. A student in 1980 went from 7 to 79 digits with chunking like this, and his general memory didn't change at all. It's the method.",
        },
        { type: "engine", id: "digits-major", engine: "memory-digits", title: "Digits with the Major system", params: { start: 10, method: "major" } },
        { type: "reflect", id: "digits-reflect", prompt: "Where did the chain break, and why?" },
      ],
      cards: [
        { id: "sf", front: "How far did 'SF' (Ericsson & Chase, 1980) raise his digit span with chunking?", back: "From about 7 to 79 digits.", tip: "His memory for letters stayed normal: it was technique, not a better memory." },
      ],
    },
    {
      id: "snapshot",
      title: "Snapshot: train what you notice",
      goal: "Rebuild a pattern of 8 lit squares on a 5×5 grid after a 2-second look.",
      why: "This isn't photographic memory. It trains you to see a scene in chunks (shapes, lines, clusters) instead of single dots, which is what experts in any visual field do.",
      minutes: 6,
      activities: [
        {
          type: "explain",
          id: "snapshot-why",
          title: "Look for shapes",
          text: "You'll see lit squares for a moment, then rebuild them. Don't try to hold each square. Look for shapes: an L, a diagonal, a cluster in a corner. Chess masters remember real positions this way, and lose the advantage on random ones.",
        },
        { type: "engine", id: "snapshot-game", engine: "memory-snapshot", title: "Snapshot", params: { size: 5, start: 4 } },
      ],
      cards: [
        { id: "chess-chunks", front: "Why do chess masters recall real positions better than random ones?", back: "They see familiar chunks (patterns), not single pieces. Random positions have no chunks, so their advantage mostly disappears." },
      ],
    },
  ],
};
