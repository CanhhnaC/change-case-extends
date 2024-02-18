import * as vscode from "vscode";
import { EOL } from "os";
import * as changeCase from "change-case";
import lodashUniq from "lodash.uniq";

function removeAccents(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export const COMMAND_LABELS = {
  camelCase: "camelCase",
  capitalCase: "capitalCase",
  constantCase: "constantCase",
  dotCase: "dotCase",
  kebabCase: "kebabCase",
  noCase: "noCase",
  pascalCase: "pascalCase",
  pascalSnakeCase: "pascalSnakeCase",
  pathCase: "pathCase",
  sentenceCase: "sentenceCase",
  snakeCase: "snakeCase",
  trainCase: "trainCase",
  removeAccents: "removeAccents",
};

const COMMAND_DEFINITIONS = [
  {
    label: COMMAND_LABELS.camelCase,
    description:
      "Convert to a string with the separators denoted by having the next letter capitalized",
    func: changeCase.camelCase,
  },
  {
    label: COMMAND_LABELS.capitalCase,
    description:
      "Convert to a string with the first letter of each word capitalized",
    func: changeCase.capitalCase,
  },
  {
    label: COMMAND_LABELS.constantCase,
    description:
      "Convert to a string with all the words capitalized and separated by an underscore",
    func: changeCase.constantCase,
  },
  {
    label: COMMAND_LABELS.dotCase,
    description: "Convert to a string with all the words separated by a dot",
    func: changeCase.dotCase,
  },
  {
    label: COMMAND_LABELS.kebabCase,
    description: "Convert to a string with all the words separated by a hyphen",
    func: changeCase.kebabCase,
  },
  {
    label: COMMAND_LABELS.noCase,
    description: "Convert to a string with all the words separated by a space",
    func: changeCase.noCase,
  },
  {
    label: COMMAND_LABELS.pascalCase,
    description:
      "Convert to a string with all the words capitalized and concatenated",
    func: changeCase.pascalCase,
  },
  {
    label: COMMAND_LABELS.pascalSnakeCase,
    description:
      "Convert to a string with all the words capitalized and separated by an underscore",
    func: changeCase.pascalSnakeCase,
  },
  {
    label: COMMAND_LABELS.pathCase,
    description:
      "Convert to a string with all the words separated by a forward slash",
    func: changeCase.pathCase,
  },
  {
    label: COMMAND_LABELS.sentenceCase,
    description:
      "Convert to a string with the first letter of the first word capitalized",
    func: changeCase.sentenceCase,
  },
  {
    label: COMMAND_LABELS.snakeCase,
    description:
      "Convert to a string with all the words separated by an underscore",
    func: changeCase.snakeCase,
  },
  {
    label: COMMAND_LABELS.trainCase,
    description: "Convert to a string with all the words separated by a hyphen",
    func: changeCase.trainCase,
  },
  {
    label: COMMAND_LABELS.removeAccents,
    description: "Remove accents from the string",
    func: removeAccents,
  },
];

export function changeCaseCommands() {
  const firstSelectedText = getSelectedTextIfOnlyOneSelection();

  // if there's only one selection, show a preview of what it will look like after conversion in the QuickPickOptions,
  // otherwise use the description used in COMMAND_DEFINITIONS
  const items: vscode.QuickPickItem[] = COMMAND_DEFINITIONS.map((c) => ({
    label: c.label,
    description: firstSelectedText
      ? `Convert to ${c.func(firstSelectedText)}`
      : c.description,
  }));

  vscode.window
    .showQuickPick(items)
    .then((command) => runCommand(command!.label));
}

export function runCommand(commandLabel: string) {
  const commandDefinition = COMMAND_DEFINITIONS.filter(
    (c) => c.label === commandLabel
  )[0];
  if (!commandDefinition) {
    return;
  }

  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const { document, selections } = editor;

  let replacementActions: any[] = [];

  editor
    .edit((editBuilder) => {
      replacementActions = selections.map((selection) => {
        const { text, range } = getSelectedText(selection, document);

        let replacement;
        let offset;

        if (selection.isSingleLine) {
          replacement = commandDefinition.func(text);

          // it's possible that the replacement string is shorter or longer than the original,
          // so calculate the offsets and new selection coordinates appropriately
          offset = replacement.length - text.length;
        } else {
          const lines = document.getText(range).split(EOL);

          const replacementLines = lines.map((x) => commandDefinition.func(x));
          replacement = replacementLines.join(EOL);
          offset =
            replacementLines[replacementLines.length - 1].length -
            lines[lines.length - 1].length;
        }

        return {
          text,
          range,
          replacement,
          offset,
          newRange: isRangeSimplyCursorPosition(range)
            ? range
            : new vscode.Range(
                range.start.line,
                range.start.character,
                range.end.line,
                range.end.character + offset
              ),
        };
      });

      replacementActions
        .filter((x) => x.replacement !== x.text)
        .forEach((x) => {
          editBuilder.replace(x.range, x.replacement);
        });
    })
    .then(() => {
      const sortedActions = replacementActions.sort((a, b) =>
        compareByEndPosition(a.newRange, b.newRange)
      );

      // in order to maintain the selections based on possible new replacement lengths, calculate the new
      // range coordinates, taking into account possible edits earlier in the line
      const lineRunningOffsets = lodashUniq(
        sortedActions.map((s) => s.range.end.line)
      ).map((lineNumber) => ({ lineNumber, runningOffset: 0 }));

      const adjustedSelectionCoordinateList = sortedActions.map((s) => {
        const lineRunningOffset = lineRunningOffsets.filter(
          (lro) => lro.lineNumber === s.range.end.line
        )[0];
        const range = new vscode.Range(
          s.newRange.start.line,
          s.newRange.start.character + lineRunningOffset.runningOffset,
          s.newRange.end.line,
          s.newRange.end.character + lineRunningOffset.runningOffset
        );
        lineRunningOffset.runningOffset += s.offset;
        return range;
      });

      // now finally set the newly created selections
      editor.selections = adjustedSelectionCoordinateList.map((r) =>
        toSelection(r)
      );
    });
}

function getSelectedTextIfOnlyOneSelection(): string | undefined {
  const editor = vscode.window.activeTextEditor;

  const { document, selection, selections } = editor!;

  // check if there's only one selection or if the selection spans multiple lines
  if (selections.length > 1 || selection.start.line !== selection.end.line) {
    return undefined;
  }

  return getSelectedText(selections[0], document).text;
}

function getSelectedText(
  selection: vscode.Selection,
  document: vscode.TextDocument
): { text: string; range: vscode.Range } {
  let range: vscode.Range;

  if (isRangeSimplyCursorPosition(selection)) {
    range =
      getChangeCaseWordRangeAtPosition(document, selection.end) || selection;
  } else {
    range = new vscode.Range(selection.start, selection.end);
  }

  return {
    text: range ? document.getText(range) : "",
    range,
  };
}

const CHANGE_CASE_WORD_CHARACTER_REGEX = /([\w_\.\-\/$]+)/;
const CHANGE_CASE_WORD_CHARACTER_REGEX_WITHOUT_DOT = /([\w_\-\/$]+)/;

// Change Case has a special definition of a word: it can contain special characters like dots, dashes and slashes
function getChangeCaseWordRangeAtPosition(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  const configuration = vscode.workspace.getConfiguration("changeCase");
  const includeDotInCurrentWord = configuration
    ? configuration.get("includeDotInCurrentWord", false)
    : false;
  const regex = includeDotInCurrentWord
    ? CHANGE_CASE_WORD_CHARACTER_REGEX
    : CHANGE_CASE_WORD_CHARACTER_REGEX_WITHOUT_DOT;

  const range = document.getWordRangeAtPosition(position);
  if (!range) {
    return undefined;
  }

  let startCharacterIndex = range.start.character - 1;
  while (startCharacterIndex >= 0) {
    const charRange = new vscode.Range(
      range.start.line,
      startCharacterIndex,
      range.start.line,
      startCharacterIndex + 1
    );
    const character = document.getText(charRange);
    if (character.search(regex) === -1) {
      // no match
      break;
    }
    startCharacterIndex--;
  }

  const lineMaxColumn = document.lineAt(range.end.line).range.end.character;
  let endCharacterIndex = range.end.character;
  while (endCharacterIndex < lineMaxColumn) {
    const charRange = new vscode.Range(
      range.end.line,
      endCharacterIndex,
      range.end.line,
      endCharacterIndex + 1
    );
    const character = document.getText(charRange);
    if (character.search(regex) === -1) {
      // no match
      break;
    }
    endCharacterIndex++;
  }

  return new vscode.Range(
    range.start.line,
    startCharacterIndex + 1,
    range.end.line,
    endCharacterIndex
  );
}

function isRangeSimplyCursorPosition(range: vscode.Range): boolean {
  return (
    range.start.line === range.end.line &&
    range.start.character === range.end.character
  );
}

function toSelection(range: vscode.Range): vscode.Selection {
  return new vscode.Selection(
    range.start.line,
    range.start.character,
    range.end.line,
    range.end.character
  );
}

function compareByEndPosition(
  a: vscode.Range | vscode.Selection,
  b: vscode.Range | vscode.Selection
): number {
  if (a.end.line < b.end.line) {
    return -1;
  }
  if (a.end.line > b.end.line) {
    return 1;
  }
  if (a.end.character < b.end.character) {
    return -1;
  }
  if (a.end.character > b.end.character) {
    return 1;
  }
  return 0;
}
