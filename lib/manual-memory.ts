// lib/manual-memory.ts
const MANUAL_MEMORY_KEY = 'manual_memory';

export function getManualMemory(): string[] {
  const raw = localStorage.getItem(MANUAL_MEMORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function setManualMemory(memories: string[]) {
  localStorage.setItem(MANUAL_MEMORY_KEY, JSON.stringify(memories));
}

export function addManualMemory(text: string) {
  const mem = getManualMemory();
  mem.push(text);
  setManualMemory(mem);
}

export function removeManualMemory(index: number) {
  const mem = getManualMemory();
  mem.splice(index, 1);
  setManualMemory(mem);
}
