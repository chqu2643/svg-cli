const HELP_LINES = [
  "Document: init [w h] | read <file.svg> | save [file.svg] | canvas [w h]",
  "Create:   create rect <id> <x> <y> <w> <h> [fill] [in <gid>]",
  "          create circle <id> <cx> <cy> <r> [fill] [in <gid>]",
  "          create ellipse <id> <cx> <cy> <rx> <ry> [fill] [in <gid>]",
  "          create line <id> <x1> <y1> <x2> <y2> [stroke] [in <gid>]",
  '          create text <id> <x> <y> "content" [in <gid>] | create g <id> [in <gid>]',
  "Edit:     delete <id> | move <id> <dx> <dy> | scale <id> <factor>",
  "          set <id> <attr> <value> | group <gid> <id...> | ungroup <gid>",
  "          addto <gid> <id> | front <id> | back <id>",
  "Display:  tree [id] | show <id> | help",
  "History:  undo | redo",
] as const;

export class HelpFormatter {
  public format(): string {
    return HELP_LINES.join("\n");
  }
}
