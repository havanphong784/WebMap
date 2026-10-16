import {fileURLToPath} from "node:url";
import {dirname, resolve} from "node:path";
import {writeFile} from "node:fs/promises";
import {build, loadEnv} from "vite";
import {getRuntimeConfig} from "../src/config/runtimeConfig.js";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(scriptDirectory, "..");
const env = {...loadEnv("android", frontendRoot, ""), ...process.env};

const config = getRuntimeConfig(env, {release: true});
await build({root: frontendRoot, mode: "android"});
await writeFile(resolve(frontendRoot, "dist", "aether-android-release.json"), JSON.stringify({
  schemaVersion: 1,
  apiBaseUrl: config.apiBaseUrl,
  publicWebUrl: config.publicWebUrl,
}));
