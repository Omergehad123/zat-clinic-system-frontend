// Currency formatting for EGP (جنيه مصري)
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 جنيه';
  const formattedNumber = new Intl.NumberFormat('ar-EG', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(amount);
  return `${formattedNumber} جنيه`;
};

// Format plain numbers with Arabic numerals locale
export const formatNumber = (num) => {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('ar-EG').format(num);
};

// Date formatting utility in Arabic
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(d);
  } catch (e) {
    return dateString;
  }
};

// Short ISO Date (YYYY-MM-DD)
export const formatShortDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toISOString().split('T')[0];
  } catch (e) {
    return dateString;
  }
};

// Get Arabic month name
export const getArabicMonthName = (monthNumber) => {
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  return months[monthNumber - 1] || '';
};
