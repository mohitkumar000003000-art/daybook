/**
 * SVG-based Charting Utilities for Daybook Progress & Insights
 * Zero dependencies, high performance, fully theme-aware.
 */

export function renderWeeklyTaskChart(daysData) {
  // daysData: array of { dateLabel, total, completed } (7 days)
  const width = 600;
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(4, ...daysData.map(d => d.total));
  const barGroupWidth = chartWidth / daysData.length;
  const barWidth = Math.min(28, barGroupWidth * 0.45);

  let gridLines = '';
  const yTicks = 4;
  for (let i = 0; i <= yTicks; i++) {
    const val = Math.round((maxVal / yTicks) * i);
    const y = padding.top + chartHeight - (val / maxVal) * chartHeight;
    gridLines += `
      <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="var(--border-subtle)" stroke-dasharray="3,3" />
      <text x="${padding.left - 10}" y="${y + 4}" fill="var(--text-muted)" font-size="11" text-anchor="end">${val}</text>
    `;
  }

  let barsHtml = '';
  daysData.forEach((d, idx) => {
    const centerX = padding.left + idx * barGroupWidth + barGroupWidth / 2;
    const totalHeight = (d.total / maxVal) * chartHeight;
    const completedHeight = (d.completed / maxVal) * chartHeight;

    const totalY = padding.top + chartHeight - totalHeight;
    const completedY = padding.top + chartHeight - completedHeight;

    // Remaining bar (total background bar)
    const delay = idx * 65;
    const remainingBar = d.total > 0 ? `
      <rect x="${centerX - barWidth / 2}" y="${totalY}" width="${barWidth}" height="${totalHeight}" 
            rx="4" fill="var(--color-bar-bg)" class="chart-bar chart-bar-grow" 
            style="transform-origin: ${centerX}px ${padding.top + chartHeight}px; animation-delay: ${delay}ms;" />
    ` : '';

    // Completed bar (filled in front)
    const completedBar = d.completed > 0 ? `
      <rect x="${centerX - barWidth / 2}" y="${completedY}" width="${barWidth}" height="${completedHeight}" 
            rx="4" fill="var(--accent)" class="chart-bar chart-bar-grow" 
            style="transform-origin: ${centerX}px ${padding.top + chartHeight}px; animation-delay: ${delay + 30}ms;" />
    ` : '';

    barsHtml += `
      <g class="chart-group" tabindex="0">
        <title>${d.dateLabel}: ${d.completed} of ${d.total} tasks completed</title>
        ${remainingBar}
        ${completedBar}
        <text x="${centerX}" y="${height - padding.bottom + 20}" fill="var(--text-muted)" font-size="12" text-anchor="middle" font-weight="500">${d.dateLabel}</text>
      </g>
    `;
  });

  return `
    <div class="svg-chart-container">
      <svg viewBox="0 0 ${width} ${height}" class="daybook-svg-chart" role="img" aria-label="Weekly Task Completion Chart">
        ${gridLines}
        ${barsHtml}
      </svg>
      <div class="chart-legend">
        <span class="legend-item"><span class="legend-dot" style="background: var(--accent);"></span> Completed</span>
        <span class="legend-item"><span class="legend-dot" style="background: var(--color-bar-bg);"></span> Planned</span>
      </div>
    </div>
  `;
}

export function renderWritingActivityTrend(daysData) {
  // daysData: array of { dateLabel, wordCount, hasEntry } (14 days)
  const width = 600;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 35, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(300, ...daysData.map(d => d.wordCount));
  const stepX = chartWidth / (daysData.length - 1);

  const points = daysData.map((d, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + chartHeight - (d.wordCount / maxVal) * chartHeight;
    return { x, y, ...d };
  });

  // Build path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    // Smooth bezier curve
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    pathD += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  // Area fill path
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  let dotsHtml = '';
  points.forEach((p, idx) => {
    // Only label every second point for clean mobile & desktop look
    const showLabel = idx % 2 === 0 || idx === points.length - 1;
    const label = showLabel ? `<text x="${p.x}" y="${height - 10}" fill="var(--text-muted)" font-size="11" text-anchor="middle">${p.dateLabel}</text>` : '';
    
    dotsHtml += `
      <g class="chart-dot-group">
        <title>${p.dateLabel}: ${p.wordCount} words written</title>
        <circle cx="${p.x}" cy="${p.y}" r="${p.hasEntry ? 5 : 3}" fill="${p.hasEntry ? 'var(--accent)' : 'var(--border)'}" stroke="var(--surface)" stroke-width="2" />
        ${label}
      </g>
    `;
  });

  return `
    <div class="svg-chart-container">
      <svg viewBox="0 0 ${width} ${height}" class="daybook-svg-chart" role="img" aria-label="14-day Writing Word Count Trend">
        <defs>
          <linearGradient id="writingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.25" />
            <stop offset="100%" stop-color="var(--accent)" stop-opacity="0.0" />
          </linearGradient>
        </defs>
        <!-- Horizontal base line -->
        <line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${width - padding.right}" y2="${padding.top + chartHeight}" stroke="var(--border)" />
        <path d="${areaD}" fill="url(#writingGrad)" />
        <path d="${pathD}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" />
        ${dotsHtml}
      </svg>
    </div>
  `;
}

export function renderCategoryBreakdown(categoriesWithCounts) {
  // categoriesWithCounts: array of { name, count, color, percentage }
  const total = categoriesWithCounts.reduce((acc, c) => acc + c.count, 0);

  if (total === 0) {
    return `<p class="empty-hint">No tasks categorized yet.</p>`;
  }

  const bars = categoriesWithCounts.map(cat => {
    const pct = total === 0 ? 0 : Math.round((cat.count / total) * 100);
    return `
      <div class="category-stat-row">
        <div class="category-stat-header">
          <span class="category-pill-label">
            <span class="category-color-pip" style="background: ${cat.color || 'var(--accent)'}"></span>
            ${cat.name}
          </span>
          <span class="category-stat-count">${cat.count} (${pct}%)</span>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" style="width: ${pct}%; background: ${cat.color || 'var(--accent)'}"></div>
        </div>
      </div>
    `;
  }).join('');

  return `<div class="category-breakdown-list">${bars}</div>`;
}
