export function rankColor(rating) {
  const r = rating || 0;
  if (r === 0) return "#9490b8";
  if (r < 1200) return "#9aa0a6";
  if (r < 1400) return "#22c55e";
  if (r < 1600) return "#06b6d4";
  if (r < 1900) return "#3b82f6";
  if (r < 2100) return "#a855f7";
  if (r < 2400) return "#f59e0b";
  return "#ef4444";
}

export function rankName(rating) {
  const r = rating || 0;
  if (r === 0) return "unrated";
  if (r < 1200) return "newbie";
  if (r < 1400) return "pupil";
  if (r < 1600) return "specialist";
  if (r < 1900) return "expert";
  if (r < 2100) return "candidate master";
  if (r < 2400) return "master";
  if (r < 2600) return "grandmaster";
  return "legendary grandmaster";
}
