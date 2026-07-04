// Utility Functions
export const formatPhoneNumber = (phone) => {
  let p = phone.toString().replace(/\D/g, '');
  if (p.startsWith('0')) return '254' + p.substring(1);
  if (p.startsWith('7') || p.startsWith('1')) return '254' + p;
  if (p.startsWith('254')) return p;
  return p;
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
  }).format(amount);
};

export const calculateRepayment = (amount, interestRate = 0.1) => {
  return amount + amount * interestRate;
};

export const maskPhoneNumber = (phone) => {
  const str = phone.toString();
  return str.slice(0, -4).replace(/\d/g, '*') + str.slice(-4);
};
