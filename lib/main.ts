import * as vscode from "vscode";
import { COMMAND_LABELS, changeCaseCommands, runCommand } from "./commands";

export function activate() {
  vscode.commands.registerCommand(
    "extension.changeCaseExtends.commands",
    changeCaseCommands
  );
  vscode.commands.registerCommand("extension.changeCaseExtends.camelCase", () =>
    runCommand(COMMAND_LABELS.camelCase)
  );
  vscode.commands.registerCommand(
    "extension.changeCaseExtends.capitalCase",
    () => runCommand(COMMAND_LABELS.capitalCase)
  );
  vscode.commands.registerCommand(
    "extension.changeCaseExtends.constantCase",
    () => runCommand(COMMAND_LABELS.constantCase)
  );
  vscode.commands.registerCommand("extension.changeCaseExtends.dotCase", () =>
    runCommand(COMMAND_LABELS.dotCase)
  );
  vscode.commands.registerCommand("extension.changeCaseExtends.kebabCase", () =>
    runCommand(COMMAND_LABELS.kebabCase)
  );
  vscode.commands.registerCommand("extension.changeCaseExtends.noCase", () =>
    runCommand(COMMAND_LABELS.noCase)
  );
  vscode.commands.registerCommand(
    "extension.changeCaseExtends.pascalCase",
    () => runCommand(COMMAND_LABELS.pascalCase)
  );
  vscode.commands.registerCommand(
    "extension.changeCaseExtends.pascalSnakeCase",
    () => runCommand(COMMAND_LABELS.pascalSnakeCase)
  );
  vscode.commands.registerCommand("extension.changeCaseExtends.pathCase", () =>
    runCommand(COMMAND_LABELS.pathCase)
  );
  vscode.commands.registerCommand(
    "extension.changeCaseExtends.sentenceCase",
    () => runCommand(COMMAND_LABELS.sentenceCase)
  );
  vscode.commands.registerCommand("extension.changeCaseExtends.snakeCase", () =>
    runCommand(COMMAND_LABELS.snakeCase)
  );
  vscode.commands.registerCommand("extension.changeCaseExtends.trainCase", () =>
    runCommand(COMMAND_LABELS.trainCase)
  );
  vscode.commands.registerCommand(
    "extension.changeCaseExtends.removeAccents",
    () => runCommand(COMMAND_LABELS.removeAccents)
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
