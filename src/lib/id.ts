export function generateId(prefix: string = "") {
  const id = `${prefix}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  return id;
}
