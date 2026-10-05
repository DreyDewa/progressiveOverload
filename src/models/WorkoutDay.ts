import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose';

const workoutDaySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true },
    order: { type: Number, required: true },
    exerciseIds: [{ type: Schema.Types.ObjectId }],
  },
  { timestamps: true },
);

export type WorkoutDayDoc = InferSchemaType<typeof workoutDaySchema>;
export const WorkoutDay: Model<WorkoutDayDoc> =
  (models.WorkoutDay as Model<WorkoutDayDoc>) || model<WorkoutDayDoc>('WorkoutDay', workoutDaySchema);
