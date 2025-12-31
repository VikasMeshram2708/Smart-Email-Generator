import { Groq } from "groq-sdk";
import { env } from "../env";

const API_KEY = env.GROQ_API_KEY;

export const groq = new Groq({
  apiKey: API_KEY,
});
