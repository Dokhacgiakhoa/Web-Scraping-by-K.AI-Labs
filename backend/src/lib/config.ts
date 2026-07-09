import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: required("JWT_SECRET"),
  masterKey: required("MASTER_KEY"),
  appBaseUrl: process.env.APP_BASE_URL ?? "http://localhost:3000",
};
