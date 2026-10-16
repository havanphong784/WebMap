import {fileURLToPath} from "node:url";
import {dirname, resolve} from "node:path";
import {build, loadEnv} from "vite";
import {getRuntimeConfig} from "../src/config/runtimeConfig.js";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(scriptDirectory, "..");
const env = {...loadEnv("android", frontendRoot, ""), ...process.env};

getRuntimeConfig(env, {release: true});
await build({root: frontendRoot, mode: "android"});
