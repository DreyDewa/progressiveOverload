import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose';

const setSchema = new Schema(
  {
    weight: { type: Number, required: true, min: 0 },
    reps: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const entrySchema = new Schema(
  {
    exerciseId: { type: Schema.Types.ObjectId, required: true },
    sets: [setSchema],
  },
  { _id: false },
);

const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    dayId: { type: Schema.Types.ObjectId, required: true },
    dayName: { type: String, required: true },
    startedAt: { type: Date, required: true },
    finishedAt: { type: Date, default: null },
    entries: [entrySchema],
  },
  { timestamps: true },
);
sessionSchema.index({ userId: 1, startedAt: -1 });

export type SessionDoc = InferSchemaType<typeof sessionSchema>;
export const Session: Model<SessionDoc> =
  (models.Session as Model<SessionDoc>) || model<SessionDoc>('Session', sessionSchema);
