import { PrismaClient } from "@prisma/client";
import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";
import { firebaseConfig } from "../lib/firebase/config.js";

const prisma = new PrismaClient();
const DEFAULT_EMAIL = "kumarvignesh865@gmail.com";

function ask(question, defaultValue = "") {
  const reader = createInterface({ input: stdin, output: stdout });
  return new Promise((resolve) => {
    reader.question(`${question}${defaultValue ? ` (${defaultValue})` : ""}: `, (answer) => {
      reader.close();
      resolve(answer.trim() || defaultValue);
    });
  });
}

function askPassword() {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error("Run this command in an interactive terminal to enter the password safely.");
  }

  return new Promise((resolve, reject) => {
    let password = "";
    stdout.write("Firebase password (input hidden): ");
    stdin.setEncoding("utf8");
    stdin.setRawMode(true);
    stdin.resume();

    function finish(error) {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdout.write("\n");
      if (error) reject(error);
      else resolve(password);
    }

    function onData(chunk) {
      for (const character of chunk) {
        if (character === "\u0003") {
          finish(new Error("Cancelled."));
          return;
        }
        if (character === "\r" || character === "\n") {
          finish();
          return;
        }
        if (character === "\u007f" || character === "\b") {
          if (password.length) {
            password = password.slice(0, -1);
            stdout.write("\b \b");
          }
          continue;
        }
        password += character;
        stdout.write("*");
      }
    }

    stdin.on("data", onData);
  });
}

async function firebaseRequest(method, email, password) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:${method}?key=${firebaseConfig.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: false }),
    }
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || "Firebase Auth request failed.");
  return result.localId;
}

async function getFirebaseUid(email, password) {
  try {
    return await firebaseRequest("signUp", email, password);
  } catch (error) {
    if (error.message !== "EMAIL_EXISTS") throw error;
    return firebaseRequest("signInWithPassword", email, password);
  }
}

async function main() {
  const email = (await ask("Super-admin email", DEFAULT_EMAIL)).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  const password = await askPassword();
  if (password.length < 6) throw new Error("Firebase passwords must be at least 6 characters.");

  const authUid = await getFirebaseUid(email, password);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing && existing.role !== "SUPER_ADMIN") {
    throw new Error("That email already belongs to a non-super-admin Postgres user.");
  }
  if (existing?.authUid && existing.authUid !== authUid && !existing.authUid.startsWith("dev-")) {
    throw new Error("That Postgres user is linked to a different Firebase account.");
  }

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: email.split("@")[0],
      authUid,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
    update: {
      authUid,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });

  console.log(`Super-admin account is ready in Firebase and Postgres: ${email}`);
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}