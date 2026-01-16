// Hàm helper để lọc các giá trị null/undefined
export function cleanParams<T extends Record<string, any>>(
  params: T,
): Partial<T> {
  return Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      acc[key as keyof T] = value;
    }
    return acc;
  }, {} as Partial<T>);
}
