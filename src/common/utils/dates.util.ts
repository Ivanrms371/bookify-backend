export const generateEndDate = (months: number = 12) => {
  const today = new Date();
  const endDate = new Date(today.setMonth(today.getMonth() + months));
  return endDate;
};

export const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export function getYesterday(): Date {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  return yesterday;
}
