export const parseDBDate = (dateStr) => {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;

  const normalized = dateStr.includes('Z') || dateStr.includes('+')
    ? dateStr
    : `${dateStr.replace(' ', 'T')}Z`;

  const date = new Date(normalized);
  return isNaN(date.getTime()) ? new Date() : date;
};

export const formatFullTime = (dateStr) => {
  const d = parseDBDate(dateStr);
  if (isNaN(d.getTime())) return 'Vừa xong';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes} ${day}/${month}/${year}`;
};
