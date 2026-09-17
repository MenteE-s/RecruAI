export const formatDate = (dateString, format = "year") => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  switch (format) {
    case "full":
      return date.toLocaleDateString();
    case "year":
    default:
      return date.getFullYear().toString();
  }
};
