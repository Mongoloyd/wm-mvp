// INPUT FORMATTERS
export const formatPhoneNumber = (value: string) => {
  if (!value) return '';
  const digits = value.replace(/[^\d]/g, '').slice(0, 10);
  const len = digits.length;
  if (len < 4) return digits;
  if (len < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

export const sanitizeZip = (value: string) => value.replace(/[^\d]/g, '').slice(0, 5);

// CONTACT MASKING — preserves privacy on the Verified Profile badge
export const maskPhone = (phone: string): string => {
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length !== 10) return phone;
  return `(${digits.slice(0, 3)}) ***-${digits.slice(6)}`;
};

export const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local}@${domain.charAt(0)}...`;
};
