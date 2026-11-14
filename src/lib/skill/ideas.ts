import type { SkillKind } from "./schema";

/**
 * Skills the discover screen can suggest before anyone has built them. Picking
 * one builds the module once; after that everyone gets the stored version.
 * Each has a one-line hook: curiosity (an information gap) is what makes a
 * bored person try something.
 */
export interface SkillIdea {
  name: string;
  kind: SkillKind;
  emoji: string;
  hook: string;
  tags: string[];
  /** Can be done indoors with nothing special. */
  indoor: boolean;
  /** Needs no equipment beyond a phone, pen or household items. */
  noGear: boolean;
}

const I = (name: string, kind: SkillKind, emoji: string, hook: string, tags: string[], indoor = true, noGear = true): SkillIdea => ({
  name,
  kind,
  emoji,
  hook,
  tags,
  indoor,
  noGear,
});

export const IDEAS: SkillIdea[] = [
  I("Speed reading (the honest version)", "mental", "📖", "Most speed-reading claims fail tests. One thing does make you faster without losing meaning.", ["study", "focus", "language"]),
  I("Mental arithmetic", "mental", "➗", "Multiply 47 × 53 in your head in five seconds. There's a trick for numbers either side of 50.", ["maths", "logic", "brain"]),
  I("Juggling three balls", "physical", "🤹", "Juggling is mostly one throw, done well. The catching takes care of itself.", ["coordination", "focus"], true, false),
  I("Touch typing", "mental", "⌨️", "Looking at the keys halves your speed. A few weeks of drills fixes it for life.", ["computer", "study", "focus"]),
  I("Sketching faces", "mental", "✏️", "The eyes sit halfway down the head. Almost everyone draws them too high.", ["art", "creativity"], true, false),
  I("Rubik's cube", "mental", "🧊", "You can solve it with about seven memorised move sequences.", ["puzzles", "logic", "memory"], true, false),
  I("Card magic", "mental", "🃏", "Most card tricks work because of where the audience looks, not how fast your hands are.", ["performance", "creativity"], true, false),
  I("Public speaking", "mental", "🎤", "The audience notices your nerves far less than you think. There's a name for it.", ["communication", "confidence"]),
  I("Sign language basics", "mental", "🤟", "Fingerspelling your name takes minutes. Holding a short conversation takes weeks, not years.", ["language", "communication"]),
  I("Spanish conversation starter", "mental", "🇪🇸", "A few hundred words cover most everyday conversation. Which ones matters.", ["language", "travel"]),
  I("Japanese kana", "mental", "🗾", "You can read all 46 hiragana in about a week with picture mnemonics.", ["language", "memory"]),
  I("Morse code", "mental", "📡", "Learn it by sound, not by dots and dashes, and you'll be twice as fast.", ["language", "memory", "puzzles"]),
  I("Handstands", "physical", "🤸", "Most failed handstands are a wrist problem, not an arm problem.", ["fitness", "balance"], true, true),
  I("Push-up progression to 20", "physical", "💪", "If you can't do one, the path to twenty is shorter than you think.", ["fitness", "strength"]),
  I("Football juggling (keepy-uppy)", "physical", "⚽", "Most people stall at ten touches because of one thing: ankle lock.", ["sport", "football", "coordination"], false, false),
  I("Football first touch", "physical", "🥅", "Great players decide where the ball goes before it arrives.", ["sport", "football"], false, false),
  I("Table tennis serve", "physical", "🏓", "Spin you can't see is the serve you can't return. It comes from the wrist, late.", ["sport", "coordination"], true, false),
  I("Skipping rope tricks", "physical", "🪢", "Double-unders are about a faster wrist, not a higher jump.", ["fitness", "coordination"], false, false),
  I("Running form for 5k", "physical", "🏃", "Most new runners go too fast. Slow runs make you faster.", ["fitness", "outdoors", "endurance"], false, true),
  I("Swimming freestyle breathing", "physical", "🏊", "The breathless feeling comes from holding your breath underwater, not from effort.", ["sport", "fitness"], false, false),
  I("Tennis forehand", "physical", "🎾", "Topspin comes from swinging low to high, not from rolling the wrist.", ["sport"], false, false),
  I("Golf putting", "physical", "⛳", "Pros look at a spot just in front of the ball, not the hole.", ["sport", "focus"], false, false),
  I("Darts", "physical", "🎯", "The best players move only their forearm. Everything else is still.", ["sport", "focus"], true, false),
  I("Yo-yo tricks", "physical", "🪀", "A good throw is a straight line. Most trick failures start there.", ["coordination"], true, false),
  I("Pen spinning", "physical", "🖊️", "The Thumbaround is the first trick everyone learns, and it's mostly one finger.", ["coordination"], true, true),
  I("Whistling with fingers", "physical", "😗", "It's the tongue position, not the fingers, that most people get wrong.", ["fun"], true, true),
  I("Speedcubing finger tricks", "physical", "🌀", "Fast solvers turn with fingertips, never re-gripping the cube.", ["puzzles", "coordination"], true, false),
  I("Guitar chords", "physical", "🎸", "Four chords play hundreds of songs. Fast switching between them is the real skill.", ["music", "creativity"], true, false),
  I("Piano: play by ear", "mental", "🎹", "Most melodies use a handful of notes. Your ear already knows more than you think.", ["music", "creativity"], true, false),
  I("Rhythm and beatboxing", "physical", "🥁", "Every beatbox pattern is built from three sounds: kick, hi-hat and snare.", ["music", "performance"]),
  I("Singing in tune", "physical", "🎶", "Being 'tone deaf' is very rare. Most people need feedback, not talent.", ["music", "performance"]),
  I("Drawing in perspective", "mental", "🏙️", "Two vanishing points and a ruler turn a sketch into a street.", ["art", "creativity"], true, false),
  I("Calligraphy", "physical", "🖋️", "Thick and thin strokes come from pressure, not the pen.", ["art", "focus"], true, false),
  I("Origami", "physical", "🦢", "Almost every model starts from one of five bases.", ["art", "focus", "puzzles"], true, true),
  I("Knot tying", "physical", "🪢", "Six knots cover nearly everything outdoors.", ["outdoors", "practical"], true, false),
  I("Cooking knife skills", "physical", "🔪", "The claw grip makes you faster and keeps your fingertips.", ["cooking", "practical"], true, false),
  I("Bread baking", "physical", "🍞", "Four ingredients. The difference is all time and temperature.", ["cooking", "practical"], true, false),
  I("Poker odds", "mental", "♠️", "Count your 'outs', multiply by four, and you know your odds on the flop.", ["games", "maths", "strategy"]),
  I("Go (the board game)", "mental", "⚫", "The rules fit on a card, yet it took AI twenty years longer to master than chess.", ["strategy", "games"]),
  I("Sudoku solving techniques", "mental", "🔢", "Hard sudokus aren't solved by guessing. There are named patterns.", ["puzzles", "logic"]),
  I("Cryptic crosswords", "mental", "🧩", "Every clue has a definition at one end. Find it first.", ["puzzles", "language"]),
  I("Logic puzzles", "mental", "🧠", "Write down what you know for sure. Most puzzles solve themselves from there.", ["puzzles", "logic"]),
  I("Coding basics in Python", "mental", "🐍", "You can automate a boring task on your computer in your first week.", ["computer", "logic"]),
  I("Excel formulas", "mental", "📊", "Three functions do most of the work in any spreadsheet job.", ["computer", "practical"]),
  I("Negotiation", "mental", "🤝", "The first number said out loud pulls the whole deal toward it.", ["communication", "confidence"]),
  I("Remembering names", "mental", "📛", "You don't forget names. You never stored them in the first place.", ["memory", "communication"]),
  I("Meditation for focus", "mental", "🧘", "The skill isn't an empty mind. It's noticing you've drifted, sooner.", ["focus", "calm"]),
  I("Sleep-friendly routines", "mental", "🌙", "Getting light in your eyes in the morning matters as much as the evening.", ["health", "calm"]),
  I("Stargazing and constellations", "mental", "✨", "Find the Plough and you can find the North Star in seconds.", ["outdoors", "science"], false, true),
  I("Bird identification by song", "mental", "🐦", "Five common songs can be learned with silly phrases that match their rhythm.", ["outdoors", "nature", "memory"], false, true),
  I("Plant identification", "mental", "🌿", "Leaf arrangement alone narrows most plants down to a few families.", ["outdoors", "nature"], false, true),
  I("World flags and capitals", "mental", "🌍", "Grouped by region and pattern, 195 flags is a few weeks of five-minute reviews.", ["memory", "geography"]),
  I("Mental maps of history", "mental", "🏛️", "A timeline with ten anchor dates makes everything else stick to it.", ["memory", "history", "study"]),
  I("Photography composition", "mental", "📷", "Most good photos break one rule on purpose. First, learn the rules.", ["art", "creativity", "outdoors"], true, true),
  I("Video editing", "mental", "🎬", "Cuts on movement are invisible. Cuts on stillness feel jarring.", ["computer", "creativity"]),
  I("Writing short stories", "mental", "📝", "Every story is a character who wants something and can't easily get it.", ["writing", "creativity"]),
  I("Persuasive writing", "mental", "✍️", "Readers decide in the first sentence whether to read the second.", ["writing", "communication"]),
  I("Drawing from memory", "mental", "🖍️", "Artists don't remember more. They remember shapes instead of details.", ["art", "memory"], true, false),
  I("Skateboarding: ollie", "physical", "🛹", "The ollie is a pop and a slide, and the slide is what most people miss.", ["sport", "outdoors", "balance"], false, false),
  I("Climbing (bouldering) technique", "physical", "🧗", "Good climbers use their legs. Tired forearms mean you're pulling with your arms.", ["sport", "strength"], false, false),
  I("Volleyball serve", "physical", "🏐", "A float serve wobbles because it has no spin. Hit the centre, stop your hand.", ["sport"], false, false),
  I("Badminton footwork", "physical", "🏸", "Elite players return to the centre after every shot. It's half the game.", ["sport", "fitness"], true, false),
  I("Martial arts basics: footwork", "physical", "🥋", "Balance first. A strike from a bad stance has no power.", ["sport", "fitness", "balance"]),
  I("Flexibility: touch your toes", "physical", "🧎", "Hamstrings respond to gentle daily stretching in a few weeks.", ["fitness", "health"]),
  I("Posture and desk setup", "physical", "🪑", "The best posture is your next posture. Moving often beats sitting perfectly.", ["health", "practical"]),
  I("Breathing for calm under pressure", "physical", "🌬️", "A longer out-breath than in-breath slows your heart within a minute.", ["calm", "health", "focus"]),
  I("Dance: basic footwork", "physical", "💃", "Every dance is counting to eight, then adding style.", ["music", "fitness", "coordination"]),
  I("Throwing a frisbee", "physical", "🥏", "A flat, spinning throw comes from the wrist snap, not the arm swing.", ["sport", "outdoors"], false, false),
  I("Cricket bowling action", "physical", "🏏", "A straight arm and a braced front leg do most of the work.", ["sport", "outdoors"], false, false),
  I("Chess openings", "mental", "♞", "Three opening ideas handle most of what beginners face as Black.", ["strategy", "games"]),
  I("Investing basics", "mental", "📈", "The cost you can control (fees) matters more than the returns you can't.", ["money", "practical"]),
  I("First aid basics", "mental", "⛑️", "In an emergency, the recovery position and calling for help save the most lives.", ["practical", "health"]),
  I("Map reading and navigation", "mental", "🧭", "Turn the map to match the ground. Most navigation mistakes stop there.", ["outdoors", "practical"], false, false),
  I("Debating", "mental", "🗣️", "Argue the other side's best point first, and they lose their best weapon.", ["communication", "logic"]),
  I("Learning the periodic table", "mental", "⚗️", "A story through a memory palace gets all 118 in order in an afternoon.", ["science", "memory", "study"]),
];
