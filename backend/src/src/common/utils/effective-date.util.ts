export function calculateEffectiveDate(firstCirculationDate: Date): Date {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sunday, 5=Friday, 6=Saturday
  const hour = now.getHours();
  
  // Rule 1: Weekend constraint
  // If subscription is Friday after 16:00, Saturday, or Sunday -> next Monday
  if ((dayOfWeek === 5 && hour >= 16) || dayOfWeek === 6 || dayOfWeek === 0) {
    const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(0, 0, 0, 0);
    return nextMonday;
  }
  
  // Rule 2: Date de première mise en circulation
  const circulation = new Date(firstCirculationDate);
  const daysDiff = Math.floor((now.getTime() - circulation.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff <= 15) {
    // Effective date = today (J)
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    return today;
  } else {
    // Effective date = today + 1 (J+1)
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }
}
