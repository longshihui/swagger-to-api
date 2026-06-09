#!/usr/bin/env node
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, {
  interopDefault: true,
});

const { createCliHelpText, createNodeCliRunner, runSwaggerToApiCli } =
  await jiti.import("../src/index.ts");

runSwaggerToApiCli(process.argv.slice(2), createNodeCliRunner())
  .then((result) => {
    if (result.command === "help") {
      console.log(createCliHelpText());
    }
  })
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  });
