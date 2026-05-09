/**
 * Capitalizes the first letter of each word in a string.
 * Example: "john doe" -> "John Doe", "SAN FRANCISCO" -> "San Francisco"
 */
export const capitalizeProperNoun = (str: string): string => {
    if (!str) return str;
    return str
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
