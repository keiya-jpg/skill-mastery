# Research brief: what actually makes people get good at things

This is the evidence the app is built on. Each section ends with **→ In the app**, the design rule it produced. Evidence strength is marked honestly: **strong** (many studies, meta-analyses, replicated), **moderate** (consistent but smaller or narrower), **weak / contested** (popular, but the data is thin or has failed to replicate).

Most of this extends Retain's research brief (spaced repetition, retrieval, hints, focus sessions, no streaks). The new parts are motor learning, expertise, engagement and memory-sport training.

---

## 1. The core loop of getting better: deliberate practice

- Ericsson, Krampe & Tesch-Römer (1993): experts differ mainly in accumulated *deliberate practice*, meaning effortful practice on a specific weakness, with immediate feedback, just beyond current ability, usually designed by a coach.
- Macnamara, Hambrick & Oswald (2014) meta-analysis: deliberate practice explains a lot of the difference between people in **games (26%)**, **music (21%)** and **sports (18%)**, but only 4% in education and under 1% in professions. Practice matters most when the skill has stable rules and fast feedback, which is exactly chess, an instrument, free throws, or memory sports. **Strong** that it helps; **strong** that it isn't the whole story (starting age, working memory, body, interest also matter).
- What separates it from "just playing": a narrow goal per block, feedback after each attempt, and difficulty that keeps moving with you.

**→ In the app:** every session has **one observable goal** ("make 7 of 10 free throws from the line", "find mate in one in under 20 s"). Every activity gives feedback straight away. Difficulty adapts per activity. Free play exists (play a game of chess) but sits *after* focused practice, not instead of it.

## 2. Difficulty: the sweet spot between bored and overwhelmed

- **Challenge point** (Guadagnoli & Lee, 2004) and **desirable difficulties** (Bjork): learning is best when practice is hard enough that you make errors, but not so hard you can't extract information from them. **Moderate–strong.**
- The "85% rule" (Wilson et al., 2019, *Nature Communications*): for a broad class of learning algorithms, training is fastest at about 85% success. It is a mathematical result about machine learners, not a human experiment, but it lines up with the human findings. **Moderate (theoretical).**
- **Flow** (Csikszentmihalyi): absorption is most likely when challenge roughly matches skill, goals are clear, and feedback is immediate. Meta-analysis (Fong, Zaleski & Leach, 2015) finds challenge–skill balance reliably relates to flow. **Moderate.**
- Boredom is a signal to seek something new, and too much difficulty leads to anxiety and quitting. The feeling of the app should sit on that ridge.

**→ In the app:** each activity targets **70–85% success**. Above 85% over a set, it offers the harder variation; under 50%, the easier one. Chess puzzles use a rating that moves toward your level. Memory drills add or remove items. The user can always override ("too easy", "too hard") because control over pacing also keeps people engaged.

## 3. Retrieval, spacing and interleaving (for anything with knowledge in it)

- **Retrieval practice** (testing yourself) beats re-reading. Adesope et al. (2017) meta-analysis: g ≈ 0.6. Rowland (2014): g ≈ 0.5. **Strong.**
- **Spacing**: the same practice spread over days beats massing it (Cepeda et al., 2006). The best gap grows with how long you want to remember. **Strong.**
- **Pretesting** (guessing before being taught) improves learning of the taught material even when the guess is wrong (Richland et al., 2009; Pan & Carpenter, 2023 review). It also opens a curiosity gap. **Moderate–strong.**
- **Interleaving** (mixing problem types): Brunmair & Richter (2019) meta-analysis, g ≈ 0.42 overall, larger when the categories look alike and are hard to tell apart (paintings, maths problem types), and *negative* for word lists. **Moderate, depends on material.**
- **Contextual interference** in motor learning (Shea & Morgan, 1979): random/varied practice feels worse during practice but transfers better. Effect is clearer in labs than in sport. **Moderate.**
- Dunlosky et al. (2013): practice testing and distributed practice are the only two techniques rated "high utility".

**→ In the app:** each skill's key facts and patterns become cards in an **FSRS spaced-repetition** queue (the same scheduler as Retain), and each session **opens with a short warm-up of due cards**. New concepts start with a **"predict first"** question. Drills appear in **varied, mixed order** once the basics are in place.

## 4. Physical skills: motor learning

- **Mental practice / imagery** helps, and works best combined with real practice. Driskell, Copper & Moran (1994) meta-analysis: d ≈ 0.53 for mental practice versus none, larger for tasks with a thinking component. **Moderate–strong.**
- **Feedback**: knowing the result after each attempt is essential, but constant guidance can create dependence (the "guidance hypothesis"). Reduced or summary feedback is often argued for, though recent meta-analyses find that effect weak. **Moderate for feedback itself, weak for "less is better".**
- **Attentional focus**: telling people to focus on the effect of a movement ("swish the net") instead of their body ("snap your wrist") was long thought to help (Wulf; Chua et al., 2021 meta-analyses). A 2024 robust Bayesian re-analysis (McKay et al., "Reporting bias, not external focus") concluded the published effect is largely explained by reporting bias. **Contested.** It costs nothing, so the app uses external cues, but it doesn't promise anything from them.
- **Self-controlled practice** (letting the learner choose when to get feedback): McKay et al. (2022) meta-analysis found the literature "underpowered, biased and lacking evidential value". **Weak** as a learning booster, but autonomy still matters for *motivation* (see §6).
- **Quiet eye** (a longer steady final look at the target before the movement, e.g. the rim before a free throw): Lebeau et al. (2016) meta-analysis links a longer quiet eye to better performance, and quiet-eye training studies in basketball show gains. **Moderate.**
- **Sleep** consolidates motor sequences (Walker et al., 2002) and memories in general (Diekelmann & Born, 2010). **Moderate–strong.**
- Video self-review and counting makes/attempts is how real coaches close the feedback loop when no coach is present.

**→ In the app:** physical drills are built as **rep logs** (you record makes/attempts), with one **external cue**, a **success criterion**, an easier and a harder variation, and an optional **60-second imagery rehearsal** before the set. Basketball shooting uses a **quiet-eye routine**. Sessions end with a note that sleep is when much of the gain is locked in.

## 5. Attention and concentration

- Minds wander about half the time (Killingsworth & Gilbert, 2010), and wandering rises when a task is too easy or too unclear. **Moderate.**
- Task switching has a measurable cost, and heavy media multitaskers do worse on some attention tasks (Ophir et al., 2009; later work mixed). **Moderate.**
- The "phone nearby drains your brain" result (Ward et al., 2017) has **not replicated well**. Removing notifications and the urge to check is still sensible; the app doesn't overclaim.
- **Implementation intentions** ("when I sit down after dinner, I'll do 10 minutes of puzzles"): Gollwitzer & Sheeran (2006) meta-analysis, d ≈ 0.65 for goal attainment. **Moderate–strong.**
- Short planned breaks reduce fatigue; Pomodoro specifically has weak evidence (see Retain's brief).
- Cognitive load: novices need short, worked steps; experts are slowed by over-explanation (expertise reversal, Kalyuga). **Strong.**

**→ In the app:** a **session is a focus mode**: no navigation, one thing on screen, a progress line instead of menus. Sessions are **short by default (10–20 min)**. Explanations are capped at about 60 words and hidden behind "Why?" once you've seen them. Setting a **"when and where"** for the next session is offered at the end (one tap, optional).

## 6. Motivation and genuine engagement (not compulsion)

- **Self-determination theory** (Deci & Ryan): lasting motivation comes from **autonomy** (I chose this), **competence** (I can see myself getting better) and **relatedness**. Large evidence base. **Strong.**
- Expected, tangible rewards for an activity reduce intrinsic interest in it (Deci, Koestner & Ryan, 1999 meta-analysis). **Strong.** Informational feedback ("you're now finding forks twice as fast") does not.
- **Gamification**: Sailer & Homner (2020) meta-analysis finds small positive effects on learning, with high variability; points/badges/streaks mostly drive *usage*, and streak loss-aversion can turn practice into a chore. **Weak–moderate.**
- **Curiosity** improves memory, even for unrelated things learned while curious (Gruber, Gelman & Ranganath, 2014). An *information gap* (a question you almost know the answer to) is what triggers it (Loewenstein, 1994). **Moderate.**
- Surprise and **prediction error** drive dopamine-linked learning signals. In practice: ask for a prediction, then reveal. **Moderate (neuroscience), practical use is inference.**
- **Goal-gradient**: people speed up as a visible goal gets close (Kivetz et al., 2006). **Moderate.**
- **Peak–end**: an experience is remembered largely by its best moment and its end (Kahneman). **Moderate.** Ending a session on a success makes coming back easier.
- **Growth-mindset interventions** have small average effects (Sisk et al., 2018). Not worth lecturing about; better to *show* growth with real numbers.

**→ In the app:** **no points, coins, badges or streak-loss guilt.** Motivation comes from **choice** (discover/shuffle/search; skip anything), **visible competence** (your own numbers: puzzle rating, digits recalled, free-throw %), **curiosity** (predict-then-reveal, "random skill" with a one-line hook), and a **short visible finish line** for each session. Sessions **end on something you can do**. A gentle "days practised this week" count exists, with no streak to lose.

## 7. Memory training, and the truth about photographic memory

- **Photographic (eidetic) memory, the honest answer:** *eidetic imagery* (a vivid afterimage you can "scan" for a few seconds) shows up in a small share of young children and almost never in adults (Haber, 1979 review). There is **no verified case of an adult who can photograph a page and read it back later**. The famous "Elizabeth" case (Stromeyer, 1970) was never replicated. Extreme autobiographical memory (HSAM) exists but is rare, covers personal life events, and isn't trainable. **Strong that it's not a trainable skill.**
- **What the memory champions actually do:** Maguire et al. (2003): top memorisers have ordinary IQ and ordinary brain structure; they use the **method of loci** (memory palace). Ericsson & Chase (1980): a student trained digit span from **7 to 79** using chunking and meaning, with no change in general memory. **Strong.**
- **It's trainable in weeks:** Dresler et al. (2017, *Neuron*): ordinary people did 30 min/day of method-of-loci training for 6 weeks and went from about **26 to 62** words recalled out of 72, still kept most of it 4 months later, and their brain connectivity shifted toward the champions' pattern. **Strong.**
- **What doesn't transfer:** working-memory "brain training" (n-back, Cogmed) improves the trained task but not general intelligence or everyday memory (Melby-Lervåg & Hulme, 2013/2016; Sala & Gobet, 2019). Same for chess and music training: no far transfer to general cognition (Sala & Gobet, 2017). **Strong.**
- So "photographic-like" performance is reachable for **specific material** through **visualisation + locations + chunking + codes** (the Major system for numbers, PAO for cards), plus spaced review.

**→ In the app:** the memory skill is honest about this up front, then trains the real thing: **build your own memory palace**, **word lists through the palace**, **the Major system for numbers**, and a **"snapshot" drill** (a brief look at a grid, then rebuild it) that trains visual chunking and attention and is framed as such, not as photography. Progress is shown as your own record (items recalled, time per item).

## 8. Chess specifically

- Chess skill is mostly **pattern knowledge** ("chunks") built from many positions (Chase & Simon, 1973; Gobet & Simon template theory). **Strong.**
- The best predictor of rating is **serious solo study** (tactics, analysing positions), more than tournament games played (Charness et al., 2005). **Moderate–strong.**
- So the fastest path for a beginner: rules → checks/captures/threats habit → **lots of rated tactics** (forks, pins, mates) at the right difficulty → play and review.

**→ In the app:** chess has an interactive board, a **"checks, captures, threats" habit prompt**, **tactics puzzles that are machine-verified** (every solution is checked move by move), adaptive puzzle rating, and **play against a simple computer** that you can ask for a hint.

---

## UI: the balance between empty and overwhelming

- **Choice overload** (Iyengar & Lepper, 2000) is real in some settings but the average effect across studies is near zero (Scheibehenne et al., 2010 meta-analysis). It bites when options are hard to compare and the person has no clear preference, which is exactly a bored person picking a skill. **Moderate.**
- **Hick's law**: decision time grows with the number of choices. **Strong** for simple choices.
- **Progressive disclosure** and **one primary action per screen** reduce load without making the app feel empty.
- Empty screens feel like nothing is happening; busy screens feel like work. The fix is **one clear next action plus a little life**: a hook line, a hint of what's next, gentle motion on feedback.
- Calm visual design: one accent colour, muted surfaces, generous spacing, no badges or red dots, motion only to confirm an action (≤ 200 ms), and reduced-motion support.

**→ In the app:** Home shows **one "continue" card**, **up to three discovery picks**, and a search box. Discover shows **one skill at a time** with a shuffle. A session shows **one activity at a time** with a thin progress line. Details ("why this works", settings) are one tap away, never on screen by default.

---

## Sources

- Ericsson, Krampe & Tesch-Römer (1993). The role of deliberate practice. *Psychological Review*.
- Macnamara, Hambrick & Oswald (2014). Deliberate practice and performance… a meta-analysis. *Psychological Science*.
- Guadagnoli & Lee (2004). Challenge point. *Journal of Motor Behavior*.
- Wilson et al. (2019). The Eighty Five Percent Rule for optimal learning. *Nature Communications*.
- Fong, Zaleski & Leach (2015). The challenge–skill balance and antecedents of flow: a meta-analytic investigation. *Journal of Positive Psychology*.
- Adesope, Trevisan & Sundararajan (2017). Rethinking the use of tests: a meta-analysis of practice testing. *Review of Educational Research*.
- Cepeda et al. (2006). Distributed practice in verbal recall tasks. *Psychological Bulletin*.
- Pan & Carpenter (2023). Prequestioning and pretesting effects: a review. *Educational Psychology Review*.
- Brunmair & Richter (2019). Similarity matters: a meta-analysis of interleaved learning. *Psychological Bulletin*. https://pubmed.ncbi.nlm.nih.gov/31556629/
- Dunlosky et al. (2013). Improving students' learning with effective learning techniques. *Psychological Science in the Public Interest*.
- Driskell, Copper & Moran (1994). Does mental practice enhance performance? *Journal of Applied Psychology*.
- Chua et al. (2021). Superiority of external attentional focus… meta-analyses. *Psychological Bulletin*. https://digitalscholarship.unlv.edu/kns_fac_articles/424
- McKay et al. (2024). Reporting bias, not external focus: a robust Bayesian meta-analysis. https://sportrxiv.org/index.php/server/preprint/download/304/826
- McKay et al. (2022). Meta-analytic findings of the self-controlled motor learning literature. *Meta-Psychology*. https://conferences.lnu.se/index.php/metapsychology/article/view/2803
- Lebeau et al. (2016). Quiet eye and performance in sport: a meta-analysis. *Journal of Sport & Exercise Psychology*. https://core.ac.uk/download/80296211.pdf
- Walker et al. (2002). Practice with sleep makes perfect. *Neuron*. Diekelmann & Born (2010). The memory function of sleep. *Nature Reviews Neuroscience*.
- Killingsworth & Gilbert (2010). A wandering mind is an unhappy mind. *Science*.
- Gollwitzer & Sheeran (2006). Implementation intentions and goal achievement: a meta-analysis. *Advances in Experimental Social Psychology*.
- Deci, Koestner & Ryan (1999). A meta-analytic review of experiments examining the effects of extrinsic rewards on intrinsic motivation. *Psychological Bulletin*.
- Sailer & Homner (2020). The gamification of learning: a meta-analysis. *Educational Psychology Review*.
- Gruber, Gelman & Ranganath (2014). States of curiosity modulate hippocampus-dependent learning. *Neuron*.
- Kivetz, Urminsky & Zheng (2006). The goal-gradient hypothesis resurrected. *Journal of Marketing Research*.
- Sisk et al. (2018). To what extent and under which circumstances are growth mind-sets important? *Psychological Science*.
- Haber (1979). Twenty years of haunting eidetic imagery. *Behavioral and Brain Sciences*.
- Maguire et al. (2003). Routes to remembering: the brains behind superior memory. *Nature Neuroscience*.
- Ericsson & Chase (1980). Acquisition of a memory skill. *Science*.
- Dresler et al. (2017). Mnemonic training reshapes brain networks to support superior memory. *Neuron*. https://pmc.ncbi.nlm.nih.gov/articles/PMC5439266
- Melby-Lervåg, Redick & Hulme (2016). Working memory training does not improve performance on measures of intelligence or other measures of "far transfer". *Perspectives on Psychological Science*.
- Sala & Gobet (2017). Does far transfer exist? Negative evidence from chess, music, and working memory training. *Current Directions in Psychological Science*.
- Chase & Simon (1973). Perception in chess. *Cognitive Psychology*. Charness et al. (2005). The role of deliberate practice in chess expertise. *Applied Cognitive Psychology*.
- Scheibehenne, Greifeneder & Todd (2010). Can there ever be too many options? A meta-analytic review of choice overload. *Journal of Consumer Research*.

Want a second opinion? Every claim above can be checked in Consensus (consensus.app) by pasting the bolded finding as a question.
