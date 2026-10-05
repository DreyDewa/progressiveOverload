export function toDay(doc: {
  _id: { toString(): string };
  name: string;
  order: number;
  exerciseIds?: { toString(): string }[];
}) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    order: doc.order,
    exerciseIds: (doc.exerciseIds ?? []).map(String),
  };
}
