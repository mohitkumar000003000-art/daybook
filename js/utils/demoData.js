/**
 * Default starter dataset for Daybook.
 * Clean, empty workspace with core categories and inspirational quotes.
 * Zero demo tasks, zero sample reflections, zero pre-filled profile data.
 */

export function getDemoData() {
  return {
    user: {
      name: "",
      theme: "light",
      dailyQuote: true,
      hasSeenDemoNotice: true,
      isDemoLoaded: false
    },
    categories: [
      { id: "work", name: "Work", color: "#455A64" },
      { id: "personal", name: "Personal", color: "#9E472A" },
      { id: "study", name: "Study", color: "#2B5B84" },
      { id: "health", name: "Health", color: "#436A57" },
      { id: "creative", name: "Creative", color: "#8E44AD" }
    ],
    tasks: [],
    journalEntries: [],
    dailyPlans: {},
    quotes: [
      { text: "Dwell on the beauty of life. Watch the stars, and see yourself running with them.", author: "Marcus Aurelius" },
      { text: "Arrange whatever pieces come your way with grace and presence.", author: "Virginia Woolf" },
      { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
      { text: "The days are long, but the years are short.", author: "Gretchen Rubin" },
      { text: "How we spend our days is, of course, how we spend our lives.", author: "Annie Dillard" },
      { text: "Simplicity is about subtracting the obvious and adding the meaningful.", author: "John Maeda" },
      { text: "Peace is the result of retraining your mind to process life as it is, rather than as you think it should be.", author: "Wayne Dyer" },
      { text: "Make each day your masterpiece.", author: "John Wooden" }
    ]
  };
}
