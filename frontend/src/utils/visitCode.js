// src/utils/visitCode.js

/**
 * Генерирует 4-значный код посещения
 * Формат: X123
 * X - номер первой буквы имени пользователя в алфавите (1-9)
 * 123 - последние 3 цифры timestamp создания бронирования
 */
export const generateVisitCode = (firstName, createdAt) => {
    try {
      // Получаем первую букву имени
      const firstLetter = firstName?.charAt(0)?.toUpperCase() || 'A';
      
      // Русский и английский алфавиты
      const russianAlphabet = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
      const englishAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      
      let letterNumber = 1;
      
      // Определяем номер буквы
      if (russianAlphabet.includes(firstLetter)) {
        letterNumber = russianAlphabet.indexOf(firstLetter) + 1;
      } else if (englishAlphabet.includes(firstLetter)) {
        letterNumber = englishAlphabet.indexOf(firstLetter) + 1;
      } else {
        // Для других символов (цифры, спецсимволы) используем ASCII код
        letterNumber = firstLetter.charCodeAt(0) % 9 + 1;
      }
      
      // Ограничиваем одной цифрой (1-9)
      const firstDigit = letterNumber > 9 ? (letterNumber % 9) + 1 : letterNumber;
      
      // Получаем timestamp и берем последние 3 цифры
      const timestamp = new Date(createdAt).getTime();
      const lastThreeDigits = timestamp.toString().slice(-3);
      
      const code = `${firstDigit}${lastThreeDigits}`;
      
      // Логирование для отладки (можно убрать в продакшене)
      console.log(`Генерация кода: ${firstName} -> ${firstLetter} -> ${letterNumber} -> ${firstDigit} + ${lastThreeDigits} = ${code}`);
      
      return code;
    } catch (error) {
      console.error('Ошибка генерации кода посещения:', error);
      // Fallback код с текущим временем
      const fallbackTime = Date.now().toString().slice(-3);
      const fallbackCode = `${Math.floor(Math.random() * 9) + 1}${fallbackTime}`;
      console.warn(`Использован fallback код: ${fallbackCode}`);
      return fallbackCode;
    }
};

/**
 * Проверяет валидность кода посещения
 */
export const validateVisitCode = (code) => {
  if (!code || typeof code !== 'string') return false;
  
  // Убираем пробелы и проверяем длину
  const cleanCode = code.replace(/\s/g, '');
  if (cleanCode.length !== 4) return false;
  
  // Проверяем что все символы - цифры
  return /^\d{4}$/.test(cleanCode);
};

/**
 * Расшифровывает код посещения для отладки
 */
export const decodeVisitCode = (code, firstName) => {
  if (!validateVisitCode(code)) return null;
  
  const cleanCode = code.replace(/\s/g, '');
  const firstDigit = cleanCode.charAt(0);
  const lastThreeDigits = cleanCode.slice(1);
  
  return {
    letterCode: firstDigit,
    timeCode: lastThreeDigits,
    expectedFirstLetter: firstName?.charAt(0)?.toUpperCase(),
    fullCode: cleanCode,
    isValid: true
  };
};

/**
 * Форматирует код для отображения (добавляет пробел)
 */
export const formatVisitCode = (code) => {
  if (!code) return '';
  
  const cleanCode = code.replace(/\s/g, '');
  if (cleanCode.length !== 4) return code;
  
  return `${cleanCode.charAt(0)} ${cleanCode.slice(1)}`;
};

/**
 * Убирает форматирование из кода (для сохранения в БД)
 */
export const cleanVisitCode = (code) => {
  if (!code) return '';
  return code.replace(/\s/g, '').toUpperCase();
};

/**
 * Генерирует код с дополнительной проверкой на уникальность
 */
export const generateUniqueVisitCode = (firstName, createdAt, existingCodes = []) => {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    // Добавляем небольшую задержку к timestamp для уникальности
    const adjustedTimestamp = new Date(createdAt).getTime() + attempts;
    const code = generateVisitCode(firstName, new Date(adjustedTimestamp).toISOString());
    
    if (!existingCodes.includes(code)) {
      return code;
    }
    
    attempts++;
  }
  
  // Если не удалось сгенерировать уникальный код, добавляем случайный суффикс
  const baseCode = generateVisitCode(firstName, createdAt);
  const randomSuffix = Math.floor(Math.random() * 10);
  return baseCode.slice(0, 3) + randomSuffix;
};

/**
 * Проверяет соответствие кода имени пользователя
 */
export const verifyCodeOwnership = (code, firstName) => {
  if (!validateVisitCode(code) || !firstName) return false;
  
  const decoded = decodeVisitCode(code, firstName);
  if (!decoded) return false;
  
  // Генерируем ожидаемый первый символ для данного имени
  const expectedCode = generateVisitCode(firstName, new Date().toISOString());
  const expectedFirstDigit = expectedCode.charAt(0);
  
  return decoded.letterCode === expectedFirstDigit;
};

// Экспорт всех функций как объект (для удобства импорта)
export const VisitCodeUtils = {
  generate: generateVisitCode,
  generateUnique: generateUniqueVisitCode,
  validate: validateVisitCode,
  decode: decodeVisitCode,
  format: formatVisitCode,
  clean: cleanVisitCode,
  verify: verifyCodeOwnership
};

export default VisitCodeUtils;