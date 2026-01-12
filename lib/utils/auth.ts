import bcrypt from 'bcryptjs';

/**
 * PIN 코드를 해싱합니다
 * @param pin 4자리 PIN 코드
 * @returns 해싱된 PIN
 */
export async function hashPin(pin: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(pin, saltRounds);
}

/**
 * PIN 코드를 검증합니다
 * @param pin 입력된 PIN 코드
 * @param hashedPin 저장된 해싱된 PIN
 * @returns 일치 여부
 */
export async function verifyPin(pin: string, hashedPin: string): Promise<boolean> {
  return await bcrypt.compare(pin, hashedPin);
}
