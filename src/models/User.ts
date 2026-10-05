import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    unit: { type: String, enum: ['kg', 'lb'], default: 'kg' },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User: Model<UserDoc> = (models.User as Model<UserDoc>) || model<UserDoc>('User', userSchema);
