function Skeleton({ className }) {
  let merged = "skeleton";
  if (className) {
    merged = merged + " " + className;
  }
  return <div className={merged} />;
}

export default Skeleton;
