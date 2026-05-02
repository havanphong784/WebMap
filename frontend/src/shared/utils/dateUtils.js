/**
 * Chuyển đổi chuỗi thời gian từ DB (thường là UTC) sang đối tượng Date của JS
 * Đảm bảo xử lý đúng múi giờ dù chuỗi có hay không có hậu tố Z/+
 */
export const parseDBDate = (dateStr) => {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  
  // Nếu chuỗi không có thông tin múi giờ, coi nó là UTC (Z)
  const normalized = dateStr.includes('Z') || dateStr.includes('+')
    ? dateStr
    : `${dateStr.replace(' ', 'T')}Z`;
    
  return new Date(normalized);
};

/**
 * Định dạng ngày tháng năm giờ phút thân thiện (Việt Nam)
 */
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
