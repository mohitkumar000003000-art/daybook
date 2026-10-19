/**
 * Realistic demo seed data for Daybook
 * Dynamically anchors to the user's current date so it always feels fresh.
 */
import { formatISODate, addDays, getTodayString } from './dateUtils.js';

export function getDemoData() {
  const today = new Date();
  const todayStr = formatISODate(today);
  const yesterdayStr = formatISODate(addDays(today, -1));
  const twoDaysAgoStr = formatISODate(addDays(today, -2));
  const threeDaysAgoStr = formatISODate(addDays(today, -3));
  const fourDaysAgoStr = formatISODate(addDays(today, -4));
  const tomorrowStr = formatISODate(addDays(today, 1));
  const inThreeDaysStr = formatISODate(addDays(today, 3));
  const nextWeekStr = formatISODate(addDays(today, 7));

  return {
    user: {
      name: "Alex",
      theme: "light",
      dailyQuote: true,
      hasSeenDemoNotice: true,
      isDemoLoaded: true
    },
    categories: [
      { id: "work", name: "Work", color: "#455A64" },
      { id: "personal", name: "Personal", color: "#9E472A" },
      { id: "study", name: "Study", color: "#2B5B84" },
      { id: "health", name: "Health", color: "#436A57" },
      { id: "creative", name: "Creative", color: "#8E44AD" }
    ],
    tasks: [
      {
        id: "task-1",
        title: "Review quarterly roadmap draft",
        dueDate: todayStr,
        dueTime: "10:00",
        priority: "high",
        category: "work",
        notes: "Check section 3 for engineering dependencies and timeline adjustments.",
        completed: true,
        completedAt: `${todayStr}T10:45:00`,
        createdAt: `${twoDaysAgoStr}T09:00:00`,
        order: 1
      },
      {
        id: "task-2",
        title: "Finalize weekly budget review & savings plan",
        dueDate: todayStr,
        dueTime: "16:00",
        priority: "high",
        category: "personal",
        notes: "Categorize receipts from weekend grocery market trip.",
        completed: false,
        completedAt: null,
        createdAt: `${yesterdayStr}T14:00:00`,
        order: 2
      },
      {
        id: "task-3",
        title: "Send feedback on design system tokens",
        dueDate: todayStr,
        dueTime: "11:30",
        priority: "medium",
        category: "work",
        notes: "Review typography scale and contrast ratios for dark theme.",
        completed: true,
        completedAt: `${todayStr}T12:15:00`,
        createdAt: `${twoDaysAgoStr}T11:00:00`,
        order: 3
      },
      {
        id: "task-4",
        title: "Afternoon mindfulness walk & stretch",
        dueDate: todayStr,
        dueTime: "14:30",
        priority: "medium",
        category: "health",
        notes: "Step away from screens for at least 30 minutes. Listen to the bird calls in the park.",
        completed: false,
        completedAt: null,
        createdAt: `${todayStr}T08:00:00`,
        order: 4
      },
      {
        id: "task-5",
        title: "Read 2 chapters of 'Four Thousand Weeks'",
        dueDate: todayStr,
        dueTime: "20:30",
        priority: "low",
        category: "study",
        notes: "Reflect on how to embrace limitation and finite time.",
        completed: false,
        completedAt: null,
        createdAt: `${todayStr}T08:15:00`,
        order: 5
      },
      // Upcoming
      {
        id: "task-6",
        title: "Weekly team alignment sync",
        dueDate: tomorrowStr,
        dueTime: "09:30",
        priority: "high",
        category: "work",
        notes: "Present key milestones for sprint release.",
        completed: false,
        completedAt: null,
        createdAt: `${yesterdayStr}T10:00:00`,
        order: 6
      },
      {
        id: "task-7",
        title: "Restock loose-leaf tea and fresh sourdough",
        dueDate: tomorrowStr,
        dueTime: "17:30",
        priority: "low",
        category: "personal",
        notes: "Local bakery closes at 6pm.",
        completed: false,
        completedAt: null,
        createdAt: `${yesterdayStr}T18:00:00`,
        order: 7
      },
      {
        id: "task-8",
        title: "Dentist routine dental checkup",
        dueDate: inThreeDaysStr,
        dueTime: "15:00",
        priority: "medium",
        category: "health",
        notes: "Dr. Evans clinic, 4th floor.",
        completed: false,
        completedAt: null,
        createdAt: `${threeDaysAgoStr}T09:00:00`,
        order: 8
      },
      {
        id: "task-9",
        title: "Complete module 3 of Information Architecture course",
        dueDate: nextWeekStr,
        dueTime: "18:00",
        priority: "medium",
        category: "study",
        notes: "Card sorting exercise and tree testing analysis.",
        completed: false,
        completedAt: null,
        createdAt: `${twoDaysAgoStr}T16:00:00`,
        order: 9
      },
      // Overdue
      {
        id: "task-10",
        title: "Organize desk stationery & notebook archive",
        dueDate: yesterdayStr,
        dueTime: "18:00",
        priority: "low",
        category: "personal",
        notes: "Put away loose fountain pen ink bottles and paper receipts.",
        completed: false,
        completedAt: null,
        createdAt: `${threeDaysAgoStr}T12:00:00`,
        order: 10
      },
      // Past completed tasks for history and analytics
      {
        id: "task-11",
        title: "Plan healthy meal prep for the coming week",
        dueDate: yesterdayStr,
        dueTime: "11:00",
        priority: "medium",
        category: "health",
        notes: "Roasted squash, lentil stew, and greens.",
        completed: true,
        completedAt: `${yesterdayStr}T12:30:00`,
        createdAt: `${twoDaysAgoStr}T09:00:00`,
        order: 11
      },
      {
        id: "task-12",
        title: "Quarterly portfolio rebalancing check",
        dueDate: twoDaysAgoStr,
        dueTime: "15:00",
        priority: "high",
        category: "personal",
        notes: "Index fund contributions and emergency fund interest check.",
        completed: true,
        completedAt: `${twoDaysAgoStr}T15:45:00`,
        createdAt: `${fourDaysAgoStr}T10:00:00`,
        order: 12
      },
      {
        id: "task-13",
        title: "Publish article on modern CSS layout primitives",
        dueDate: threeDaysAgoStr,
        dueTime: "14:00",
        priority: "high",
        category: "creative",
        notes: "Cover subgrid, container queries, and logical properties.",
        completed: true,
        completedAt: `${threeDaysAgoStr}T16:10:00`,
        createdAt: `${fourDaysAgoStr}T11:00:00`,
        order: 13
      },
      {
        id: "task-14",
        title: "30-minute morning interval jog",
        dueDate: fourDaysAgoStr,
        dueTime: "07:00",
        priority: "medium",
        category: "health",
        notes: "5k loop around the lake.",
        completed: true,
        completedAt: `${fourDaysAgoStr}T07:45:00`,
        createdAt: `${fourDaysAgoStr}T06:30:00`,
        order: 14
      }
    ],
    journalEntries: [
      {
        id: "entry-1",
        title: "A Quiet Monday and the Rhythm of Intentional Work",
        date: todayStr,
        time: "08:30",
        mood: "peaceful", // peaceful, productive, thoughtful, energetic, low
        tags: ["Focus", "Morning", "Deep Work"],
        photoUrl: "",
        content: `<h2>Setting the Intention for the Week</h2>
<p>There is a particular clarity that comes with a quiet morning before emails start cascading in. Made a pour-over coffee with Ethiopian Yirgacheffe beans, watched the gentle autumn light spread across the wooden desk, and deliberately decided not to rush.</p>

<p>Today is about doing fewer things, but doing them thoroughly. The quarterly roadmap needs real focus, not fragmented multitasking. As Seneca observed:</p>
<blockquote>“To be everywhere is to be nowhere.”</blockquote>

<h3>Guided Reflections</h3>
<ul>
  <li><strong>What went well today?</strong> Kept the morning free of rapid notifications; completed deep reading of the roadmap draft without distraction.</li>
  <li><strong>What did I learn?</strong> When I write out my thoughts in prose before editing spreadsheets, the decisions become tenfold clearer.</li>
  <li><strong>What am I grateful for?</strong> The silence of an early morning, hot coffee, and having work that challenges me to think rigorously.</li>
</ul>`,
        wordCount: 154,
        readingTime: 1,
        createdAt: `${todayStr}T08:30:00`,
        updatedAt: `${todayStr}T08:45:00`
      },
      {
        id: "entry-2",
        title: "Sunday Reset: Long Walks and Slow Cooking",
        date: yesterdayStr,
        time: "20:15",
        mood: "peaceful",
        tags: ["Weekend", "Cooking", "Nature"],
        photoUrl: "",
        content: `<h2>The Sunday Reset</h2>
<p>Spent three hours outdoors today walking through the forest trails. The crisp autumn air always seems to untangle the knotted thoughts of the workweek. There is something grounding about noticing the subtle color changes on the beech leaves.</p>

<p>Came home and simmered a hearty lentil and roasted root vegetable soup. Cooked slowly with fresh rosemary and garlic. The whole kitchen smelled like warmth and comfort.</p>

<p>Prepared the planner for the week ahead. Set my three main priorities, dusted the bookshelf, and left the notebook open on tomorrow’s page with a fresh fountain pen. Ready for the days ahead with an easy mind.</p>`,
        wordCount: 122,
        readingTime: 1,
        createdAt: `${yesterdayStr}T20:15:00`,
        updatedAt: `${yesterdayStr}T20:25:00`
      },
      {
        id: "entry-3",
        title: "Lessons in Pacing During High-Output Cycles",
        date: twoDaysAgoStr,
        time: "19:00",
        mood: "thoughtful",
        tags: ["Work", "Reflections", "Pacing"],
        photoUrl: "",
        content: `<h2>Finding Equilibrium</h2>
<p>Felt a bit of mental fatigue setting in around 3 PM today. In the past, my instinctive reaction was to reach for a second espresso and force another two hours of strained output. Today, I did something different: I closed the laptop, laced up my walking shoes, and walked around the neighborhood without headphones.</p>

<p>Within twenty minutes, the mental fog lifted. By the time I sat back down, the problem that had felt insurmountable resolved itself in about fifteen minutes of clean, calm thinking.</p>

<blockquote>Energy management, not time management, is the true constraint of creative work.</blockquote>`,
        wordCount: 108,
        readingTime: 1,
        createdAt: `${twoDaysAgoStr}T19:00:00`,
        updatedAt: `${twoDaysAgoStr}T19:15:00`
      },
      {
        id: "entry-4",
        title: "Notebooks, Fountain Pens, and the Joy of Tactility",
        date: fourDaysAgoStr,
        time: "21:30",
        mood: "productive",
        tags: ["Stationery", "Creativity", "Habits"],
        photoUrl: "",
        content: `<h2>The Value of Tangible Records</h2>
<p>Reflecting on why keeping a daily record matters so much to me. In an era where everything is ephemeral—fleeting chat messages, temporary browser tabs, auto-expiring stories—taking ten quiet minutes to record the honest truth of a day creates an anchor.</p>

<p>Looking back at notes from six months ago, I can see how many things I used to worry about that turned out just fine. Keeping a daybook is essentially giving yourself perspective across time.</p>`,
        wordCount: 88,
        readingTime: 1,
        createdAt: `${fourDaysAgoStr}T21:30:00`,
        updatedAt: `${fourDaysAgoStr}T21:40:00`
      }
    ],
    dailyPlans: {
      [todayStr]: {
        date: todayStr,
        topThree: [
          { id: "mit-1", text: "Finalize weekly budget review & savings plan", taskId: "task-2", completed: false },
          { id: "mit-2", text: "Review quarterly roadmap draft", taskId: "task-1", completed: true },
          { id: "mit-3", text: "Send feedback on design system tokens", taskId: "task-3", completed: true }
        ],
        morningIntention: "Stay grounded and focused on deep work before lunch. Resist context switching and respect my attention.",
        focusWord: "Clarity",
        energyLevel: 4,
        timeBlocks: [
          { id: "tb-1", startTime: "09:00", endTime: "10:30", title: "Deep Work: Quarterly roadmap review", category: "work" },
          { id: "tb-2", startTime: "11:00", endTime: "12:00", title: "Design tokens feedback & team check", category: "work" },
          { id: "tb-3", startTime: "14:00", endTime: "15:30", title: "Personal finance & budget reconciliation", category: "personal" },
          { id: "tb-4", startTime: "17:00", endTime: "18:00", title: "Evening walk, reading & journal reflection", category: "health" }
        ],
        eveningReflection: {
          wins: "Finished the roadmap review with thoughtful annotations and enjoyed a distraction-free morning.",
          lessons: "Block notification sounds when doing deep analytical work to preserve momentum.",
          gratitude: "Warm autumn sunlight through the window and a quiet morning coffee."
        }
      }
    },
    quotes: [
      { text: "Dwell on the beauty of life. Watch the stars, and see yourself running with them.", author: "Marcus Aurelius" },
      { text: "Arrange whatever pieces come your way with grace and presence.", author: "Virginia Woolf" },
      { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
      { text: "The days are long, but the years are short.", author: "Gretchen Rubin" },
      { text: "How we spend our days is, of course, how we spend our lives.", author: "Annie Dillard" },
      { text: "Simplicity is about subtracting the obvious and adding the meaningful.", author: "John Maeda" },
      { text: "Peace is the result of retraining your mind to process life as it is, rather than as you think it should be.", author: "Wayne Dyer" }
    ]
  };
}
