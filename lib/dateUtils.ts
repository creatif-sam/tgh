export function getYearStats(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 1)
  const end = new Date(date.getFullYear(), 11, 31)

  const dayMs = 24 * 60 * 60 * 1000

  const daysPassed =
    Math.floor((date.getTime() - start.getTime()) / dayMs) + 1

  const totalDays =
    Math.floor((end.getTime() - start.getTime()) / dayMs) + 1

  return {
    daysPassed,
    daysLeft: totalDays - daysPassed,
    totalDays,
  }
}
