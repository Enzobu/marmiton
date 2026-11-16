export type PlannedMeal = {
  id: string;
  date: string;
  recipeId: string | number;
  title: string;
  servings: number;
};

export function localDateKey(date: Date) {
  return [String(date.getFullYear()).padStart(4, '0'), String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')].join('-');
}

export function weekDays(date: Date, offset = 0) {
  const monday = new Date(date);
  monday.setDate(date.getDate() - (date.getDay() + 6) % 7 + offset * 7);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return day;
  });
}
