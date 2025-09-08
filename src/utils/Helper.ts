import { v4 as uuidv4 } from 'uuid';

export const generateCustomId = (prefix = '', length = 12) => {
  
  const id = uuidv4().replace(/-/g, ''); // Remove dashes to make it shorter
  return prefix + id.substring(0, length);
};

export const generateComplexId = (length = 12) => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  // Ensure at least one of each type
  let result = '';
  result += upper.charAt(Math.floor(Math.random() * upper.length));
  result += lower.charAt(Math.floor(Math.random() * lower.length));
  result += digits.charAt(Math.floor(Math.random() * digits.length));
  result += special.charAt(Math.floor(Math.random() * special.length));

  // Fill remaining length with random chars from all types
  const allChars = upper + lower + digits + special;
  const remainingLength = length - result.length;
  for (let i = 0; i < remainingLength; i++) {
    result += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Shuffle the result
  result = result.split('').sort(() => Math.random() - 0.5).join('');
  
  return result;
};
