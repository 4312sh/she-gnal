/** 마지막 접속 표기 (yyyy.m.d) — 캐릭터 화면 "마지막 접속" 칸 */
export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}
