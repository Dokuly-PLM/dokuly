import fileTypes from "./fileTypes";

export function mapExtensionToLanguage(extension) {
  const ext = extension.toLowerCase();
  for (const languageName in fileTypes) {
    const language = fileTypes[languageName];
    if (language.extensions.includes(ext) || language.aliases.includes(ext)) {
      return {
        name: languageName,
        alias: language.aliases[0], // Assuming there's always at least one alias
        extensions: language.extensions,
      };
    }
  }
  return { name: "plaintext", alias: "plaintext", extensions: ["txt"] };
}
