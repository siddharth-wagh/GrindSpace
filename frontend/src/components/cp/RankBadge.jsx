import { rankColor, rankName } from "@/utils/rankColor";

function RankBadge({ rating, rank, handle, size }) {
  const numericRating = Number(rating) || 0;
  const isSmall = size === "sm";

  if (!numericRating) {
    let mutedClass = "font-code text-[var(--text-muted)] ";
    if (isSmall) {
      mutedClass = mutedClass + "text-[10px]";
    } else {
      mutedClass = mutedClass + "text-xs";
    }
    return <span className={mutedClass}>unrated</span>;
  }

  const color = rankColor(numericRating);
  const title = rankName(numericRating);

  let ratingClass = "font-code font-bold ";
  if (isSmall) {
    ratingClass = ratingClass + "text-[10px]";
  } else {
    ratingClass = ratingClass + "text-sm";
  }

  let gap = "0.35rem";
  if (isSmall) {
    gap = "0.25rem";
  }

  return (
    <span
      title={title}
      className="inline-flex items-center align-middle"
      style={{ gap }}
    >
      <span className={ratingClass} style={{ color }}>
        {numericRating}
      </span>
      {handle ? (
        <span className={ratingClass} style={{ color }}>
          {handle}
        </span>
      ) : null}
    </span>
  );
}

export default RankBadge;
