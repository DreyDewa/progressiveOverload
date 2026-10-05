import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose';

const exerciseSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true },
    nameLower: { type: String, required: true },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true },
);
exerciseSchema.index({ userId: 1, nameLower: 1 }, { unique: true });

export type ExerciseDoc = InferSchemaType<typeof exerciseSchema>;
export const Exercise: Model<ExerciseDoc> =
  (models.Exercise as Model<ExerciseDoc>) || model<ExerciseDoc>('Exercise', exerciseSchema);
