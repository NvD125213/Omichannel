export function convertDateTime(isoString: string): [string, string] {
  const date = new Date(isoString);

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");

  const dateText = `Ngày ${day} tháng ${month} năm ${year}`;
  const timeText = `${hours} giờ ${minutes} phút ${seconds} giây`;

  return [dateText, timeText];
}
