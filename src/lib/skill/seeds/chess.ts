import type { SkillSpec } from "../schema";

export const chessSeed: SkillSpec = {
  version: 1,
  slug: "chess",
  name: "Chess",
  kind: "mental",
  emoji: "♟️",
  hook: "The best predictor of chess strength isn't games played. It's time spent solving positions alone.",
  summary:
    "From the rules to real tactics. You'll build the checks-captures-threats habit, solve puzzles pitched at your level, and play a computer that can give you hints.",
  equipment: [],
  tags: ["strategy", "games", "logic", "focus"],
  source: "seed",
  stages: [
    {
      id: "rules",
      title: "How the pieces move",
      goal: "Get every rules question right, then finish one game against the computer.",
      why: "Patterns come later. First the moves need to be automatic so your attention is free for ideas.",
      minutes: 12,
      activities: [
        {
          type: "explain",
          id: "board",
          title: "The board",
          text: "Eight by eight squares. White moves first. Each side has a king, a queen, two rooks, two bishops, two knights and eight pawns. You win by checkmate: attacking the king so it has no legal way out.",
        },
        {
          type: "quiz",
          id: "knight",
          question: "Which piece can jump over others?",
          options: [
            { text: "The knight", why: "Right. It moves in an L (two squares one way, one square sideways) and ignores pieces in between." },
            { text: "The queen", why: "The queen is powerful, but she's blocked by any piece in her path." },
            { text: "The king", why: "The king moves one square in any direction and can't jump." },
          ],
          answer: 0,
        },
        {
          type: "quiz",
          id: "bishop",
          question: "A bishop starts on a light square. Where can it ever go?",
          options: [
            { text: "Any square", why: "Bishops only move diagonally, and diagonals never change colour." },
            { text: "Only light squares", why: "Right. That's why each side has a light-squared and a dark-squared bishop." },
          ],
          answer: 1,
        },
        {
          type: "quiz",
          id: "castle",
          question: "When can you NOT castle?",
          options: [
            { text: "When your king is in check", why: "Right. You also can't castle through or into check, or if the king or that rook has moved." },
            { text: "After move 10", why: "There's no move limit. It depends on whether the king and rook have moved and on checks." },
            { text: "If your queen is still on the board", why: "The queen has nothing to do with castling." },
          ],
          answer: 0,
        },
        {
          type: "quiz",
          id: "promotion",
          question: "A pawn reaches the far side of the board. What happens?",
          options: [
            { text: "It's removed", why: "No, this is a pawn's big moment." },
            { text: "It becomes a queen, rook, bishop or knight of your choice", why: "Right. Almost always a queen." },
            { text: "It moves backwards", why: "Pawns never move backwards." },
          ],
          answer: 1,
        },
        { type: "engine", id: "first-game", engine: "chess-play", title: "Play a relaxed game", intro: "Tap a piece to see where it can go. Ask for a hint any time.", params: { level: 0 } },
      ],
      cards: [
        { id: "knight-move", front: "How does a knight move?", back: "In an L: two squares one way, then one square sideways. It jumps over pieces." },
        { id: "castle-rules", front: "Three things that stop you castling?", back: "The king or that rook has moved; the king is in check; the king would pass through or land on an attacked square." },
        { id: "checkmate", front: "Check vs checkmate?", back: "Check: the king is attacked. Checkmate: it's attacked and has no legal way out. Checkmate wins." },
      ],
    },
    {
      id: "cct",
      title: "Checks, captures, threats",
      goal: "In a full game, look for checks, captures and threats (yours and theirs) before every move.",
      why: "Most games below club level are decided by a piece left hanging or a move not seen. One habit before each move fixes most of it.",
      minutes: 15,
      activities: [
        {
          type: "explain",
          id: "cct-intro",
          title: "The three-second scan",
          predict: {
            question: "How are most beginner games decided?",
            options: ["Deep strategy", "A piece left unprotected or a simple tactic missed", "Opening knowledge"],
            answer: 1,
          },
          text: "Before every move, ask: what checks, captures and threats can I make? Then: what checks, captures and threats does my move allow? Forcing moves come first because they limit the opponent's replies. It feels slow for a week, then it becomes automatic.",
        },
        {
          type: "order",
          id: "cct-order",
          prompt: "Order the scan before you move.",
          steps: ["Look at their last move: what does it threaten?", "Find all your checks", "Find all your captures", "Find your threats", "Check your chosen move doesn't hang anything"],
        },
        { type: "engine", id: "cct-game", engine: "chess-play", title: "Play with the scan switched on", intro: "Before each move you'll get a short checklist. It goes away once it's a habit.", params: { level: 1, cct: true } },
        { type: "reflect", id: "cct-reflect", prompt: "Which part of the scan did you skip most?" },
      ],
      cards: [
        { id: "cct", front: "What does CCT stand for?", back: "Checks, captures, threats. Scan them for both sides before every move." },
      ],
    },
    {
      id: "mate1",
      title: "Mate in one",
      goal: "Solve 10 mate-in-one puzzles, 8 or more on the first try.",
      why: "Seeing mating patterns instantly is the first layer of chess vision. Each puzzle checks itself, so you know straight away.",
      minutes: 10,
      activities: [
        {
          type: "explain",
          id: "mate-patterns",
          title: "Look at the king first",
          text: "Find the enemy king. Which squares around it are covered, blocked by its own pieces, or free? Checks are forcing, so try every check in your head before anything else. The answer is always a check.",
        },
        { type: "engine", id: "mate1-puzzles", engine: "chess-puzzles", title: "Mate in one", params: { theme: "mate1", count: 10 } },
      ],
      cards: [
        { id: "back-rank", front: "What is a back-rank mate?", back: "A rook or queen checks the king along its back row, and the king's own pawns block its escape." },
      ],
    },
    {
      id: "material",
      title: "Win material: loose pieces and forks",
      goal: "Solve 10 win-material puzzles, 7 or more on the first try.",
      why: "Loose pieces drop off. A fork attacks two things at once, so the opponent can only save one.",
      minutes: 12,
      activities: [
        {
          type: "explain",
          id: "forks",
          title: "Two targets, one move",
          text: "A fork attacks two pieces at once. Knights are great at it. A pin freezes a piece because moving it would expose something bigger behind it. And unprotected pieces are targets: 'loose pieces drop off'.",
        },
        {
          type: "quiz",
          id: "fork-quiz",
          question: "Your knight can move to a square that attacks the enemy king and queen at the same time. What is that called?",
          options: [
            { text: "A pin", why: "A pin is along a line, with a more valuable piece behind." },
            { text: "A fork (a royal fork)", why: "Right. The king must move out of check, and the queen falls." },
            { text: "A skewer", why: "A skewer attacks a valuable piece that must move and exposes one behind it." },
          ],
          answer: 1,
        },
        { type: "engine", id: "material-puzzles", engine: "chess-puzzles", title: "Win material", params: { theme: "material", count: 10 } },
      ],
      cards: [
        { id: "fork", front: "What's a fork?", back: "One piece attacking two or more enemy pieces at once." },
        { id: "pin", front: "What's a pin?", back: "A piece can't move (or shouldn't) because a more valuable piece is behind it on the same line." },
        { id: "values", front: "Usual piece values?", back: "Pawn 1, knight 3, bishop 3, rook 5, queen 9." },
      ],
    },
    {
      id: "mate2",
      title: "Mate in two",
      goal: "Solve 8 mate-in-two puzzles, 6 or more on the first try.",
      why: "Two-move combinations train you to calculate: picture the board after a move, then find the follow-up.",
      minutes: 12,
      activities: [
        {
          type: "explain",
          id: "calc",
          title: "Picture, then check",
          text: "Pick a forcing first move (a check, or a capture, or a quiet move that threatens mate). Picture their best reply. Then find the mate. If any reply escapes, it's the wrong first move. Say the moves to yourself; don't move pieces until you're sure.",
        },
        { type: "engine", id: "mate2-puzzles", engine: "chess-puzzles", title: "Mate in two", params: { theme: "mate2", count: 8 } },
      ],
      cards: [
        { id: "forcing", front: "Why check forcing moves first?", back: "They limit the opponent's replies, so you can calculate them fully." },
      ],
    },
    {
      id: "openings",
      title: "Opening principles, then play",
      goal: "Win or draw a game against the level-2 computer using the opening principles.",
      why: "You don't need to memorise openings yet. Four principles get you a healthy position almost every time.",
      minutes: 20,
      activities: [
        {
          type: "explain",
          id: "principles",
          title: "Four rules for the first ten moves",
          text: "Control the centre with a pawn or two. Bring out knights and bishops before moving any piece twice. Castle early to tuck your king away. Don't bring the queen out early, because she gets chased.",
        },
        {
          type: "quiz",
          id: "queen-early",
          question: "Why is moving the queen out early usually bad?",
          options: [
            { text: "It's against the rules", why: "It's legal, just usually unwise." },
            { text: "The opponent develops pieces while chasing her, gaining time", why: "Right. Every time she has to run, they get a free developing move." },
          ],
          answer: 1,
        },
        { type: "engine", id: "principles-game", engine: "chess-play", title: "Play the level-2 computer", params: { level: 2 } },
        { type: "reflect", id: "game-review", prompt: "Where did the game turn? Name the move." },
      ],
      cards: [
        { id: "principles", front: "Four opening principles?", back: "Centre, develop minor pieces, castle early, don't bring the queen out early." },
      ],
    },
  ],
};
