import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { spawn } from "node:child_process";
import type { SwaggerToApiCliRunner } from "./types";
import { SwaggerToApiCliError } from "./types";

export const createNodeCliRunner = (
  cwd = process.cwd(),
): SwaggerToApiCliRunner => ({
  cwd,
  readTextFile: async (path) => readFile(path, "utf8"),
  writeTextFile: async (path, content, options) => {
    if (!options.overwrite && (await fileExists(path))) {
      throw new SwaggerToApiCliError(`文件已存在，已跳过写入：${path}`);
    }

    await mkdir(dirname(path), {
      recursive: true,
    });
    await writeFile(path, content, "utf8");
  },
  runCommand: async (command, args) =>
    new Promise<void>((resolve, reject) => {
      const child = spawn(command, [...args], {
        cwd,
        shell: false,
        stdio: "inherit",
      });

      child.on("error", (error) => {
        reject(error);
      });

      child.on("exit", (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(
          new SwaggerToApiCliError(
            `命令执行失败：${command} ${args.join(" ")}`,
          ),
        );
      });
    }),
});

const fileExists = async (path: string): Promise<boolean> => {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};
