type DisplayFormat = "text" | "short";

export function convertDateTime(
  isoString: string,
  format: DisplayFormat = "text",
): {
  date: string;
  time: string;
  datetime: string;
} {
  const date = new Date(isoString);

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");

  // Dạng chữ
  const dateText = `Ngày ${day} tháng ${month} năm ${year}`;
  const timeText = `${hours} giờ ${minutes} phút ${seconds} giây`;

  // Dạng số ngắn
  const dateShort = `${day}/${month}/${year}`;
  const timeShort = `${hours}:${minutes}:${seconds}`;

  if (format === "short") {
    return {
      date: dateShort,
      time: timeShort,
      datetime: `${dateShort} ${timeShort}`,
    };
  }

  return {
    date: dateText,
    time: timeText,
    datetime: `${dateText} ${timeText}`,
  };
}
