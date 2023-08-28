export const getNotEmptyArrayOrNull = (arr: unknown) => {
  if (!Array.isArray(arr)) {
    return null;
  }

  if (arr.length <= 0) {
    return null;
  }

  return arr;
};
