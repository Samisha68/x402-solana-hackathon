import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file in project root
// Go up two levels from app/server to project root
const envPath = resolve(__dirname, "../../.env");
config({ path: envPath });

// Required environment variables
const requiredEnvVars = {
  ADDRESS: process.env.ADDRESS,
  FACILITATOR_URL: process.env.FACILITATOR_URL,
  NETWORK: process.env.NETWORK,
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL,
} as const;

// Optional environment variables
const optionalEnvVars = {
  CREATOR_NAME: process.env.CREATOR_NAME,
  CREATOR_AVATAR_URL: process.env.CREATOR_AVATAR_URL,
  CREATOR_DESCRIPTION: process.env.CREATOR_DESCRIPTION,
  LOCKED_CONTENT_URL: process.env.LOCKED_CONTENT_URL,
} as const;

// Validate required environment variables
function validateEnv(): void {
  const missing: string[] = [];

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value || value.trim() === "") {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error("\nPlease set these variables in your .env file or environment.");
    console.error("See .env.example for reference.");
    process.exit(1);
  }
}

// Validate and export environment variables
validateEnv();

export const env = {
  // Required
  address: requiredEnvVars.ADDRESS as `0x${string}`,
  facilitatorUrl: requiredEnvVars.FACILITATOR_URL as string,
  network: requiredEnvVars.NETWORK as string,
  solanaRpcUrl: requiredEnvVars.SOLANA_RPC_URL as string,
  
  // Optional
  creatorName: optionalEnvVars.CREATOR_NAME || "Creator",
  creatorAvatarUrl: optionalEnvVars.CREATOR_AVATAR_URL || undefined,
  creatorDescription: optionalEnvVars.CREATOR_DESCRIPTION || undefined,
  lockedContentUrl: optionalEnvVars.LOCKED_CONTENT_URL || undefined,
} as const;

