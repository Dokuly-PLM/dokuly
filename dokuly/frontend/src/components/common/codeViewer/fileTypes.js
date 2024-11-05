/**
 * Supported languages with file extensions. From https://prismjs.com/
 */
const fileTypes = {
  Markup: {
    aliases: ["markup", "html", "xml", "svg", "mathml", "ssml", "atom", "rss"],
    extensions: [],
  },
  CSS: {
    aliases: ["css"],
    extensions: ["css"],
  },
  "C-like": {
    aliases: ["clike"],
    extensions: [],
  },
  JavaScript: {
    aliases: ["javascript", "js"],
    extensions: ["js"],
  },
  ABAP: {
    aliases: ["abap"],
    extensions: [],
  },
  ABNF: {
    aliases: ["abnf"],
    extensions: [],
  },
  ActionScript: {
    aliases: ["actionscript"],
    extensions: [],
  },
  Ada: {
    aliases: ["ada"],
    extensions: [],
  },
  Agda: {
    aliases: ["agda"],
    extensions: [],
  },
  AL: {
    aliases: ["al"],
    extensions: [],
  },
  ANTLR4: {
    aliases: ["antlr4", "g4"],
    extensions: [],
  },
  "Apache Configuration": {
    aliases: ["apacheconf"],
    extensions: [],
  },
  Apex: {
    aliases: ["apex"],
    extensions: [],
  },
  APL: {
    aliases: ["apl"],
    extensions: [],
  },
  AppleScript: {
    aliases: ["applescript"],
    extensions: [],
  },
  AQL: {
    aliases: ["aql"],
    extensions: [],
  },
  Arduino: {
    aliases: ["arduino", "ino"],
    extensions: ["ino"],
  },
  ARFF: {
    aliases: ["arff"],
    extensions: [],
  },
  "ARM Assembly": {
    aliases: ["armasm", "arm-asm"],
    extensions: [],
  },
  Arturo: {
    aliases: ["arturo", "art"],
    extensions: [],
  },
  AsciiDoc: {
    aliases: ["asciidoc", "adoc"],
    extensions: ["adoc"],
  },
  "ASP.NET (C#)": {
    aliases: ["aspnet"],
    extensions: [],
  },
  "6502 Assembly": {
    aliases: ["asm6502"],
    extensions: [],
  },
  "Atmel AVR Assembly": {
    aliases: ["asmatmel"],
    extensions: [],
  },
  AutoHotkey: {
    aliases: ["autohotkey"],
    extensions: [],
  },
  AutoIt: {
    aliases: ["autoit"],
    extensions: [],
  },
  AviSynth: {
    aliases: ["avisynth", "avs"],
    extensions: ["avs"],
  },
  "Avro IDL": {
    aliases: ["avro-idl", "avdl"],
    extensions: ["avdl"],
  },
  AWK: {
    aliases: ["awk", "gawk"],
    extensions: [],
  },
  Bash: {
    aliases: ["bash", "sh", "shell"],
    extensions: ["sh", "bash"],
  },
  BASIC: {
    aliases: ["basic"],
    extensions: [],
  },
  Batch: {
    aliases: ["batch"],
    extensions: [],
  },
  BBcode: {
    aliases: ["bbcode", "shortcode"],
    extensions: [],
  },
  BBj: {
    aliases: ["bbj"],
    extensions: [],
  },
  Bicep: {
    aliases: ["bicep"],
    extensions: [],
  },
  Birb: {
    aliases: ["birb"],
    extensions: [],
  },
  Bison: {
    aliases: ["bison"],
    extensions: [],
  },
  BNF: {
    aliases: ["bnf", "rbnf"],
    extensions: [],
  },
  BQN: {
    aliases: ["bqn"],
    extensions: [],
  },
  Brainfuck: {
    aliases: ["brainfuck"],
    extensions: [],
  },
  BrightScript: {
    aliases: ["brightscript"],
    extensions: [],
  },
  Bro: {
    aliases: ["bro"],
    extensions: [],
  },
  "BSL (1C:Enterprise)": {
    aliases: ["bsl", "oscript"],
    extensions: [],
  },
  C: {
    aliases: ["c"],
    extensions: ["c", "h"],
  },
  "C#": {
    aliases: ["csharp", "cs", "dotnet"],
    extensions: ["cs"],
  },
  "C++": {
    aliases: ["cpp"],
    extensions: ["cpp", "hpp", "h"],
  },
  CFScript: {
    aliases: ["cfscript", "cfc"],
    extensions: ["cfscript", "cfc"],
  },
  ChaiScript: {
    aliases: ["chaiscript"],
    extensions: [],
  },
  CIL: {
    aliases: ["cil"],
    extensions: [],
  },
  "Cilk/C": {
    aliases: ["cilkc", "cilk-c"],
    extensions: [],
  },
  "Cilk/C++": {
    aliases: ["cilkcpp", "cilk-cpp", "cilk"],
    extensions: [],
  },
  Clojure: {
    aliases: ["clojure"],
    extensions: ["clj", "cljs", "cljc", "edn"],
  },
  CMake: {
    aliases: ["cmake"],
    extensions: ["cmake", "cmake.in"],
  },
  COBOL: {
    aliases: ["cobol"],
    extensions: ["cob", "cbl"],
  },
  CoffeeScript: {
    aliases: ["coffeescript", "coffee"],
    extensions: ["coffee"],
  },
  Concurnas: {
    aliases: ["concurnas", "conc"],
    extensions: [],
  },
  "Content-Security-Policy": {
    aliases: ["csp"],
    extensions: [],
  },
  Cooklang: {
    aliases: ["cooklang"],
    extensions: [],
  },
  Coq: {
    aliases: ["coq"],
    extensions: [],
  },
  Crystal: {
    aliases: ["crystal"],
    extensions: ["cr"],
  },
  "CSS Extras": {
    aliases: ["css-extras"],
    extensions: [],
  },
  CSV: {
    aliases: ["csv"],
    extensions: ["csv"],
  },
  CUE: {
    aliases: ["cue"],
    extensions: [],
  },
  Cypher: {
    aliases: ["cypher"],
    extensions: [],
  },
  D: {
    aliases: ["d"],
    extensions: ["d"],
  },
  Dart: {
    aliases: ["dart"],
    extensions: ["dart"],
  },
  DataWeave: {
    aliases: ["dataweave"],
    extensions: [],
  },
  DAX: {
    aliases: ["dax"],
    extensions: [],
  },
  Dhall: {
    aliases: ["dhall"],
    extensions: [],
  },
  Diff: {
    aliases: ["diff"],
    extensions: ["diff", "patch"],
  },
  "Django/Jinja2": {
    aliases: ["django", "jinja2"],
    extensions: [],
  },
  "DNS zone file": {
    aliases: ["dns-zone-file", "dns-zone"],
    extensions: [],
  },
  Docker: {
    aliases: ["docker", "dockerfile"],
    extensions: ["Dockerfile"],
  },
  "DOT (Graphviz)": {
    aliases: ["dot", "gv"],
    extensions: ["dot", "gv"],
  },
  EBNF: {
    aliases: ["ebnf"],
    extensions: [],
  },
  EditorConfig: {
    aliases: ["editorconfig"],
    extensions: [],
  },
  Eiffel: {
    aliases: ["eiffel"],
    extensions: ["e"],
  },
  EJS: {
    aliases: ["ejs", "eta"],
    extensions: ["ejs"],
  },
  Elixir: {
    aliases: ["elixir"],
    extensions: ["ex", "exs"],
  },
  Elm: {
    aliases: ["elm"],
    extensions: ["elm"],
  },
  "Embedded Lua templating": {
    aliases: ["etlua"],
    extensions: [],
  },
  ERB: {
    aliases: ["erb"],
    extensions: ["erb"],
  },
  Erlang: {
    aliases: ["erlang"],
    extensions: ["erl", "hrl"],
  },
  "Excel Formula": {
    aliases: ["excel-formula", "xlsx", "xls"],
    extensions: ["xls", "xlsx"],
  },
  "F#": {
    aliases: ["fsharp"],
    extensions: ["fs", "fsx"],
  },
  Factor: {
    aliases: ["factor"],
    extensions: [],
  },
  False: {
    aliases: ["false"],
    extensions: [],
  },
  "Firestore security rules": {
    aliases: ["firestore-security-rules"],
    extensions: [],
  },
  Flow: {
    aliases: ["flow"],
    extensions: [],
  },
  Fortran: {
    aliases: ["fortran"],
    extensions: ["f", "f90", "f95"],
  },
  "FreeMarker Template Language": {
    aliases: ["ftl"],
    extensions: ["ftl"],
  },
  "GameMaker Language": {
    aliases: ["gml", "gamemakerlanguage"],
    extensions: ["gml"],
  },
  "GAP (CAS)": {
    aliases: ["gap"],
    extensions: [],
  },
  "G-code": {
    aliases: ["gcode"],
    extensions: ["gcode", "nc"],
  },
  GDScript: {
    aliases: ["gdscript"],
    extensions: ["gd"],
  },
  GEDCOM: {
    aliases: ["gedcom"],
    extensions: ["ged"],
  },
  gettext: {
    aliases: ["gettext", "po"],
    extensions: ["po", "pot"],
  },
  Gherkin: {
    aliases: ["gherkin"],
    extensions: [],
  },
  Git: {
    aliases: ["git"],
    extensions: [],
  },
  GLSL: {
    aliases: ["glsl"],
    extensions: ["glsl", "frag", "vert"],
  },
  GN: {
    aliases: ["gn", "gni"],
    extensions: ["gn", "gni"],
  },
  "GNU Linker Script": {
    aliases: ["linker-script", "ld"],
    extensions: [],
  },
  Go: {
    aliases: ["go"],
    extensions: ["go"],
  },
  "Go module": {
    aliases: ["go-module", "go-mod"],
    extensions: ["mod", "sum"],
  },
  Gradle: {
    aliases: ["gradle"],
    extensions: ["gradle"],
  },
  GraphQL: {
    aliases: ["graphql"],
    extensions: ["graphql", "gql"],
  },
  Groovy: {
    aliases: ["groovy"],
    extensions: ["groovy", "gradle"],
  },
  Haml: {
    aliases: ["haml"],
    extensions: ["haml"],
  },
  Handlebars: {
    aliases: ["handlebars", "hbs", "mustache"],
    extensions: ["hbs", "handlebars", "mustache"],
  },
  Haskell: {
    aliases: ["haskell", "hs"],
    extensions: ["hs", "lhs"],
  },
  Haxe: {
    aliases: ["haxe"],
    extensions: ["hx"],
  },
  HCL: {
    aliases: ["hcl"],
    extensions: ["hcl"],
  },
  HLSL: {
    aliases: ["hlsl"],
    extensions: ["hlsl", "fx", "hlsli"],
  },
  Hoon: {
    aliases: ["hoon"],
    extensions: [],
  },
  HTTP: {
    aliases: ["http"],
    extensions: [],
  },
  "HTTP Public-Key-Pins": {
    aliases: ["hpkp"],
    extensions: [],
  },
  "HTTP Strict-Transport-Security": {
    aliases: ["hsts"],
    extensions: [],
  },
  IchigoJam: {
    aliases: ["ichigojam"],
    extensions: [],
  },
  Icon: {
    aliases: ["icon"],
    extensions: ["icn"],
  },
  "ICU Message Format": {
    aliases: ["icu-message-format"],
    extensions: [],
  },
  Idris: {
    aliases: ["idris", "idr"],
    extensions: ["idr"],
  },
  ".ignore": {
    aliases: ["ignore", "gitignore", "hgignore", "npmignore"],
    extensions: ["gitignore", "hgignore", "npmignore"],
  },
  "Inform 7": {
    aliases: ["inform7"],
    extensions: [],
  },
  Ini: {
    aliases: ["ini"],
    extensions: ["ini"],
  },
  Io: {
    aliases: ["io"],
    extensions: ["io"],
  },
  J: {
    aliases: ["j"],
    extensions: [],
  },
  Java: {
    aliases: ["java"],
    extensions: ["java"],
  },
  JavaDoc: {
    aliases: ["javadoc"],
    extensions: [],
  },
  "JavaDoc-like": {
    aliases: ["javadoclike"],
    extensions: [],
  },
  "Java stack trace": {
    aliases: ["javastacktrace"],
    extensions: [],
  },
  Jexl: {
    aliases: ["jexl"],
    extensions: [],
  },
  Jolie: {
    aliases: ["jolie"],
    extensions: ["ol"],
  },
  JQ: {
    aliases: ["jq"],
    extensions: [],
  },
  JSDoc: {
    aliases: ["jsdoc"],
    extensions: [],
  },
  "JS Extras": {
    aliases: ["js-extras"],
    extensions: [],
  },
  JSON: {
    aliases: ["json", "webmanifest"],
    extensions: ["json", "webmanifest"],
  },
  JSON5: {
    aliases: ["json5"],
    extensions: ["json5"],
  },
  JSONP: {
    aliases: ["jsonp"],
    extensions: [],
  },
  "JS stack trace": {
    aliases: ["jsstacktrace"],
    extensions: [],
  },
  "JS Templates": {
    aliases: ["js-templates"],
    extensions: [],
  },
  Julia: {
    aliases: ["julia"],
    extensions: ["jl"],
  },
  "Keepalived Configure": {
    aliases: ["keepalived"],
    extensions: [],
  },
  Keyman: {
    aliases: ["keyman"],
    extensions: [],
  },
  Kotlin: {
    aliases: ["kotlin", "kt", "kts"],
    extensions: ["kt", "kts"],
  },
  "KuMir (КуМир)": {
    aliases: ["kumir", "kum"],
    extensions: [],
  },
  Kusto: {
    aliases: ["kusto"],
    extensions: [],
  },
  LaTeX: {
    aliases: ["latex", "tex", "context"],
    extensions: ["tex", "cls", "sty"],
  },
  Latte: {
    aliases: ["latte"],
    extensions: [],
  },
  Less: {
    aliases: ["less"],
    extensions: ["less"],
  },
  LilyPond: {
    aliases: ["lilypond", "ly"],
    extensions: ["ly"],
  },
  Liquid: {
    aliases: ["liquid"],
    extensions: [],
  },
  Lisp: {
    aliases: ["lisp", "emacs", "elisp", "emacs-lisp"],
    extensions: ["lisp", "el", "lsp"],
  },
  LiveScript: {
    aliases: ["livescript"],
    extensions: ["ls"],
  },
  "LLVM IR": {
    aliases: ["llvm"],
    extensions: [],
  },
  "Log file": {
    aliases: ["log"],
    extensions: ["log"],
  },
  LOLCODE: {
    aliases: ["lolcode"],
    extensions: [],
  },
  Lua: {
    aliases: ["lua"],
    extensions: ["lua"],
  },
  Magma: {
    aliases: ["magma"],
    extensions: [],
  },
  Makefile: {
    aliases: ["makefile"],
    extensions: ["mk", "make"],
  },
  Markdown: {
    aliases: ["markdown", "md"],
    extensions: ["md"],
  },
  "Markup templating": {
    aliases: ["markup-templating"],
    extensions: [],
  },
  Mata: {
    aliases: ["mata"],
    extensions: [],
  },
  MATLAB: {
    aliases: ["matlab"],
    extensions: ["m"],
  },
  MAXScript: {
    aliases: ["maxscript"],
    extensions: ["ms", "mcr"],
  },
  MEL: {
    aliases: ["mel"],
    extensions: [],
  },
  Mermaid: {
    aliases: ["mermaid"],
    extensions: [],
  },
  METAFONT: {
    aliases: ["metafont"],
    extensions: [],
  },
  Mizar: {
    aliases: ["mizar"],
    extensions: [],
  },
  MongoDB: {
    aliases: ["mongodb"],
    extensions: [],
  },
  Monkey: {
    aliases: ["monkey"],
    extensions: [],
  },
  MoonScript: {
    aliases: ["moonscript", "moon"],
    extensions: ["moon"],
  },
  N1QL: {
    aliases: ["n1ql"],
    extensions: [],
  },
  N4JS: {
    aliases: ["n4js", "n4jsd"],
    extensions: ["n4js", "n4jsd"],
  },
  "Nand To Tetris HDL": {
    aliases: ["nand2tetris-hdl"],
    extensions: [],
  },
  "Naninovel Script": {
    aliases: ["naniscript", "nani"],
    extensions: [],
  },
  NASM: {
    aliases: ["nasm"],
    extensions: ["asm"],
  },
  NEON: {
    aliases: ["neon"],
    extensions: [],
  },
  Nevod: {
    aliases: ["nevod"],
    extensions: [],
  },
  nginx: {
    aliases: ["nginx"],
    extensions: ["conf"],
  },
  Nim: {
    aliases: ["nim"],
    extensions: ["nim"],
  },
  Nix: {
    aliases: ["nix"],
    extensions: ["nix"],
  },
  NSIS: {
    aliases: ["nsis"],
    extensions: [],
  },
  "Objective-C": {
    aliases: ["objectivec", "objc"],
    extensions: ["m", "h"],
  },
  OCaml: {
    aliases: ["ocaml"],
    extensions: ["ml", "mli"],
  },
  Odin: {
    aliases: ["odin"],
    extensions: [],
  },
  OpenCL: {
    aliases: ["opencl"],
    extensions: ["cl", "ocl"],
  },
  OpenQasm: {
    aliases: ["openqasm", "qasm"],
    extensions: ["qasm"],
  },
  Oz: {
    aliases: ["oz"],
    extensions: [],
  },
  "PARI/GP": {
    aliases: ["parigp"],
    extensions: [],
  },
  Parser: {
    aliases: ["parser"],
    extensions: [],
  },
  Pascal: {
    aliases: ["pascal", "objectpascal"],
    extensions: ["pas"],
  },
  Pascaligo: {
    aliases: ["pascaligo"],
    extensions: [],
  },
  "PATROL Scripting Language": {
    aliases: ["psl"],
    extensions: [],
  },
  "PC-Axis": {
    aliases: ["pcaxis", "px"],
    extensions: [],
  },
  PeopleCode: {
    aliases: ["peoplecode", "pcode"],
    extensions: [],
  },
  Perl: {
    aliases: ["perl"],
    extensions: ["pl", "pm"],
  },
  PHP: {
    aliases: ["php"],
    extensions: ["php", "php5", "php7", "php8"],
  },
  PHPDoc: {
    aliases: ["phpdoc"],
    extensions: [],
  },
  "PHP Extras": {
    aliases: ["php-extras"],
    extensions: [],
  },
  PlantUML: {
    aliases: ["plant-uml", "plantuml"],
    extensions: [],
  },
  "PL/SQL": {
    aliases: ["plsql"],
    extensions: [],
  },
  PowerQuery: {
    aliases: ["powerquery", "pq", "mscript"],
    extensions: [],
  },
  PowerShell: {
    aliases: ["powershell"],
    extensions: ["ps1", "psm1", "psd1"],
  },
  Processing: {
    aliases: ["processing"],
    extensions: ["pde"],
  },
  Prolog: {
    aliases: ["prolog"],
    extensions: ["pl", "pro"],
  },
  PromQL: {
    aliases: ["promql"],
    extensions: [],
  },
  ".properties": {
    aliases: ["properties"],
    extensions: ["properties"],
  },
  "Protocol Buffers": {
    aliases: ["protobuf"],
    extensions: ["proto"],
  },
  Pug: {
    aliases: ["pug"],
    extensions: ["pug"],
  },
  Puppet: {
    aliases: ["puppet"],
    extensions: ["pp"],
  },
  Pure: {
    aliases: ["pure"],
    extensions: [],
  },
  PureBasic: {
    aliases: ["purebasic", "pbfasm"],
    extensions: [],
  },
  PureScript: {
    aliases: ["purescript", "purs"],
    extensions: ["purs"],
  },
  Python: {
    aliases: ["python", "py"],
    extensions: ["py", "pyw"],
  },
  "Q#": {
    aliases: ["qsharp", "qs"],
    extensions: ["qs"],
  },
  "Q (kdb+ database)": {
    aliases: ["q"],
    extensions: [],
  },
  QML: {
    aliases: ["qml"],
    extensions: ["qml"],
  },
  Qore: {
    aliases: ["qore"],
    extensions: [],
  },
  R: {
    aliases: ["r"],
    extensions: ["r"],
  },
  Racket: {
    aliases: ["racket", "rkt"],
    extensions: ["rkt"],
  },
  "Razor C#": {
    aliases: ["cshtml", "razor"],
    extensions: ["cshtml"],
  },
  "React JSX": {
    aliases: ["jsx"],
    extensions: ["jsx"],
  },
  "React TSX": {
    aliases: ["tsx"],
    extensions: ["tsx"],
  },
  Reason: {
    aliases: ["reason"],
    extensions: ["re", "rei"],
  },
  Regex: {
    aliases: ["regex"],
    extensions: [],
  },
  Rego: {
    aliases: ["rego"],
    extensions: [],
  },
  "Ren'py": {
    aliases: ["renpy", "rpy"],
    extensions: ["rpy"],
  },
  ReScript: {
    aliases: ["rescript", "res"],
    extensions: ["res"],
  },
  "reST (reStructuredText)": {
    aliases: ["rest"],
    extensions: ["rst"],
  },
  Rip: {
    aliases: ["rip"],
    extensions: [],
  },
  Roboconf: {
    aliases: ["roboconf"],
    extensions: [],
  },
  "Robot Framework": {
    aliases: ["robotframework", "robot"],
    extensions: ["robot"],
  },
  Ruby: {
    aliases: ["ruby", "rb"],
    extensions: ["rb"],
  },
  Rust: {
    aliases: ["rust"],
    extensions: ["rs"],
  },
  SAS: {
    aliases: ["sas"],
    extensions: ["sas"],
  },
  "Sass (Sass)": {
    aliases: ["sass"],
    extensions: ["sass"],
  },
  "Sass (SCSS)": {
    aliases: ["scss"],
    extensions: ["scss"],
  },
  Scala: {
    aliases: ["scala"],
    extensions: ["scala"],
  },
  Scheme: {
    aliases: ["scheme"],
    extensions: ["scm", "ss"],
  },
  "Shell session": {
    aliases: ["shell-session", "sh-session", "shellsession"],
    extensions: [],
  },
  Smali: {
    aliases: ["smali"],
    extensions: ["smali"],
  },
  Smalltalk: {
    aliases: ["smalltalk"],
    extensions: [],
  },
  Smarty: {
    aliases: ["smarty"],
    extensions: ["tpl"],
  },
  SML: {
    aliases: ["sml", "smlnj"],
    extensions: ["sml"],
  },
  "Solidity (Ethereum)": {
    aliases: ["solidity", "sol"],
    extensions: ["sol"],
  },
  "Solution file": {
    aliases: ["solution-file", "sln"],
    extensions: ["sln"],
  },
  "Soy (Closure Template)": {
    aliases: ["soy"],
    extensions: [],
  },
  SPARQL: {
    aliases: ["sparql", "rq"],
    extensions: ["rq"],
  },
  "Splunk SPL": {
    aliases: ["splunk-spl"],
    extensions: [],
  },
  "SQF: Status Quo Function (Arma 3)": {
    aliases: ["sqf"],
    extensions: [],
  },
  SQL: {
    aliases: ["sql"],
    extensions: ["sql"],
  },
  Squirrel: {
    aliases: ["squirrel"],
    extensions: [],
  },
  Stan: {
    aliases: ["stan"],
    extensions: [],
  },
  "Stata Ado": {
    aliases: ["stata"],
    extensions: ["ado"],
  },
  "Structured Text (IEC 61131-3)": {
    aliases: ["iecst"],
    extensions: [],
  },
  Stylus: {
    aliases: ["stylus"],
    extensions: ["styl"],
  },
  SuperCollider: {
    aliases: ["supercollider", "sclang"],
    extensions: [],
  },
  Swift: {
    aliases: ["swift"],
    extensions: ["swift"],
  },
  "Systemd configuration file": {
    aliases: ["systemd"],
    extensions: [],
  },
  "T4 templating": {
    aliases: ["t4-templating"],
    extensions: [],
  },
  "T4 Text Templates (C#)": {
    aliases: ["t4-cs", "t4"],
    extensions: [],
  },
  "T4 Text Templates (VB)": {
    aliases: ["t4-vb"],
    extensions: [],
  },
  TAP: {
    aliases: ["tap"],
    extensions: [],
  },
  Tcl: {
    aliases: ["tcl"],
    extensions: ["tcl"],
  },
  "Template Toolkit 2": {
    aliases: ["tt2"],
    extensions: [],
  },
  Textile: {
    aliases: ["textile"],
    extensions: [],
  },
  TOML: {
    aliases: ["toml"],
    extensions: ["toml"],
  },
  Tremor: {
    aliases: ["tremor", "trickle", "troy"],
    extensions: [],
  },
  Turtle: {
    aliases: ["turtle", "trig"],
    extensions: [],
  },
  Twig: {
    aliases: ["twig"],
    extensions: ["twig"],
  },
  TypeScript: {
    aliases: ["typescript", "ts"],
    extensions: ["ts"],
  },
  TypoScript: {
    aliases: ["typoscript", "tsconfig"],
    extensions: [],
  },
  UnrealScript: {
    aliases: ["unrealscript", "uscript", "uc"],
    extensions: ["uc"],
  },
  "UO Razor Script": {
    aliases: ["uorazor"],
    extensions: [],
  },
  URI: {
    aliases: ["uri", "url"],
    extensions: [],
  },
  V: {
    aliases: ["v"],
    extensions: ["v"],
  },
  Vala: {
    aliases: ["vala"],
    extensions: ["vala"],
  },
  VBNet: {
    aliases: ["vbnet"],
    extensions: ["vb"],
  },
  Velocity: {
    aliases: ["velocity"],
    extensions: [],
  },
  Verilog: {
    aliases: ["verilog"],
    extensions: ["v"],
  },
  VHDL: {
    aliases: ["vhdl"],
    extensions: ["vhd", "vhdl"],
  },
  vim: {
    aliases: ["vim"],
    extensions: [],
  },
  "Visual Basic": {
    aliases: ["visual-basic", "vb", "vba"],
    extensions: ["vb"],
  },
  WarpScript: {
    aliases: ["warpscript"],
    extensions: [],
  },
  WebAssembly: {
    aliases: ["wasm"],
    extensions: ["wasm"],
  },
  "Web IDL": {
    aliases: ["web-idl", "webidl"],
    extensions: [],
  },
  WGSL: {
    aliases: ["wgsl"],
    extensions: [],
  },
  "Wiki markup": {
    aliases: ["wiki"],
    extensions: [],
  },
  "Wolfram language": {
    aliases: ["wolfram", "mathematica", "nb", "wl"],
    extensions: ["nb", "wl"],
  },
  Wren: {
    aliases: ["wren"],
    extensions: [],
  },
  Xeora: {
    aliases: ["xeora", "xeoracube"],
    extensions: [],
  },
  "XML doc (.net)": {
    aliases: ["xml-doc"],
    extensions: [],
  },
  "Xojo (REALbasic)": {
    aliases: ["xojo"],
    extensions: [],
  },
  XQuery: {
    aliases: ["xquery"],
    extensions: ["xq", "xquery"],
  },
  YAML: {
    aliases: ["yaml", "yml"],
    extensions: ["yml", "yaml"],
  },
  YANG: {
    aliases: ["yang"],
    extensions: ["yang"],
  },
  Zig: {
    aliases: ["zig"],
    extensions: ["zig"],
  },
};

export default fileTypes;
