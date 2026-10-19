/**
 * Date and Time utilities for Daybook
 */

export function getTodayDate() {
  return new Date();
}

export function formatISODate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayString() {
  return formatISODate(new Date());
}

export function parseISODate(str) {
  if (!str) return new Date();
  const [year, month, day] = str.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDisplayDate(date, options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) {
  const d = typeof date === 'string' ? parseISODate(date) : new Date(date);
  return d.toLocaleDateString('en-US', options);
}

export function formatShortDate(date) {
  const d = typeof date === 'string' ? parseISODate(date) : new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatMonthYear(year, monthIndex) {
  const d = new Date(year, monthIndex, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function getGreeting(date = new Date()) {
  const details = getGreetingDetails(date);
  return details.greeting;
}

export function getGreetingDetails(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) {
    return {
      period: 'morning',
      greeting: 'Good morning',
      icon: '☀️',
      message: 'Plan your intentions, embrace the morning stillness, and make today count.'
    };
  }
  if (hour >= 12 && hour < 17) {
    return {
      period: 'afternoon',
      greeting: 'Good afternoon',
      icon: '🌤️',
      message: 'Keep your momentum steady, take mindful breaks, and stay present.'
    };
  }
  if (hour >= 17 && hour < 22) {
    return {
      period: 'evening',
      greeting: 'Good evening',
      icon: '🌆',
      message: 'Wind down, reflect on what went well, and celebrate today’s progress.'
    };
  }
  return {
    period: 'night',
    greeting: 'Good night',
    icon: '🌙',
    message: 'Rest your mind, let go of the day, and recharge for tomorrow.'
  };
}

export function formatLiveClock(date = new Date(), includeSeconds = true) {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  if (includeSeconds) {
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${displayHours}:${minutes}:${seconds} ${period}`;
  }
  return `${displayHours}:${minutes} ${period}`;
}

export function isSameDay(date1, date2) {
  const d1 = typeof date1 === 'string' ? parseISODate(date1) : new Date(date1);
  const d2 = typeof date2 === 'string' ? parseISODate(date2) : new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function isPastDay(dateStr) {
  const today = getTodayString();
  return dateStr < today;
}

export function isToday(dateStr) {
  return dateStr === getTodayString();
}

export function isFutureDay(dateStr) {
  const today = getTodayString();
  return dateStr > today;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getWeekDaysFor(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  const monday = new Date(d.setDate(diff));
  
  const week = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday);
    nextDay.setDate(monday.getDate() + i);
    week.push(nextDay);
  }
  return week;
}

export function getCalendarGrid(year, monthIndex) {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0);
  
  // Day of week: 0 (Sun) to 6 (Sat). We'll start on Sunday for standard calendar, or Monday.
  // Starting on Monday is standard for planners:
  let startingDay = firstDayOfMonth.getDay();
  // Adjust so Monday is 0, Sunday is 6:
  startingDay = startingDay === 0 ? 6 : startingDay - 1;

  const totalDays = lastDayOfMonth.getDate();
  const prevMonthLastDay = new Date(year, monthIndex, 0).getDate();

  const days = [];

  // Previous month trailing days
  for (let i = startingDay - 1; i >= 0; i--) {
    const prevDate = new Date(year, monthIndex - 1, prevMonthLastDay - i);
    days.push({
      date: prevDate,
      dateString: formatISODate(prevDate),
      dayNumber: prevMonthLastDay - i,
      isCurrentMonth: false,
      isPrevMonth: true,
      isNextMonth: false
    });
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    const curDate = new Date(year, monthIndex, i);
    days.push({
      date: curDate,
      dateString: formatISODate(curDate),
      dayNumber: i,
      isCurrentMonth: true,
      isPrevMonth: false,
      isNextMonth: false
    });
  }

  // Next month leading days (to fill 35 or 42 grid slots)
  const remainingSlots = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remainingSlots; i++) {
    const nextDate = new Date(year, monthIndex + 1, i);
    days.push({
      date: nextDate,
      dateString: formatISODate(nextDate),
      dayNumber: i,
      isCurrentMonth: false,
      isPrevMonth: false,
      isNextMonth: true
    });
  }

  return days;
}

/**
 * Calculates current and longest writing/activity streak
 * @param {string[]} dateStringsArray - Array of YYYY-MM-DD
 */
export function calculateStreak(dateStringsArray) {
  if (!dateStringsArray || dateStringsArray.length === 0) {
    return { current: 0, longest: 0, total: 0 };
  }

  const uniqueSortedDates = Array.from(new Set(dateStringsArray)).sort().reverse();
  const todayStr = getTodayString();
  const yesterdayStr = formatISODate(addDays(new Date(), -1));

  let currentStreak = 0;
  let checkDate = uniqueSortedDates.includes(todayStr) 
    ? new Date() 
    : uniqueSortedDates.includes(yesterdayStr) 
      ? addDays(new Date(), -1) 
      : null;

  if (checkDate) {
    let curr = checkDate;
    while (true) {
      const s = formatISODate(curr);
      if (uniqueSortedDates.includes(s)) {
        currentStreak++;
        curr = addDays(curr, -1);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  const chronological = [...uniqueSortedDates].sort();
  let maxStreak = 0;
  let tempStreak = 0;
  let prevDate = null;

  for (const dateStr of chronological) {
    const d = parseISODate(dateStr);
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffTime = Math.abs(d - prevDate);
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    if (tempStreak > maxStreak) {
      maxStreak = tempStreak;
    }
    prevDate = d;
  }

  return {
    current: currentStreak,
    longest: maxStreak,
    total: uniqueSortedDates.length
  };
}
