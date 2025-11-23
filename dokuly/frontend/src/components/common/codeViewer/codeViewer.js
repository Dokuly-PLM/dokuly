import React, { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "react-toastify";

import fileTypes from "./fileTypes";
import { mapExtensionToLanguage } from "./fileExtensionLanguageMapper";

export default function CodeViewer({ extension, fileUri }) {
  const [fileContent, setFileContent] = useState(null);

  // Set the selected language based on the file extension
  // Initialize selectedLanguage with default values
  const [selectedLanguage, setSelectedLanguage] = useState({
    name: "DefaultLanguageName",
    alias: "DefaultAlias",
  });

  useEffect(() => {
    // Map the provided extension to a language
    const mappedLanguage = mapExtensionToLanguage(extension) || {};

    setSelectedLanguage({
      name: mappedLanguage.name || "DefaultLanguageName",
      alias: mappedLanguage.alias ? mappedLanguage.alias : "DefaultAlias",
    });
  }, []);

  const [availableLanguages, setAvailableLanguages] = useState([]);

  useEffect(() => {
    if (fileUri) {
      fetch(fileUri)
        .then((response) => response.text())
        .then((data) => {
          setFileContent(data);
        })
        .catch((error) => {
          toast.error("Error fetching file content:", error);
        });
    }

    const languages = Object.keys(fileTypes);
    setAvailableLanguages(languages);
  }, [fileUri]);

  const handleLanguageChange = (event) => {
    const selectedAlias = event.target.value;
    // Find the corresponding language for the selected alias
    const correspondingLanguageKey = Object.keys(fileTypes).find((key) => {
      return fileTypes[key]?.aliases?.includes(selectedAlias);
    });

    const correspondingLanguage = fileTypes[correspondingLanguageKey];

    if (correspondingLanguage) {
      setSelectedLanguage({
        name: correspondingLanguage.name,
        alias: selectedAlias,
      });
    } else {
      toast.error(
        `No corresponding language found for alias: ${selectedAlias}`,
      );
    }
  };

  return (
    <div>
      <div>
        <label htmlFor="languageDropdown">Select Language: </label>
        <select
          id="languageDropdown"
          value={selectedLanguage.alias}
          onChange={handleLanguageChange}
        >
          {availableLanguages.map((language) => {
            const languageDetails = fileTypes[language];
            return (
              <option key={language} value={languageDetails?.aliases?.[0]}>
                {language}
              </option>
            );
          })}
        </select>
      </div>
      {fileContent ? (
        <SyntaxHighlighter
          key={selectedLanguage.alias}
          language={selectedLanguage.alias}
          style={atomDark}
          customStyle={{
            fontSize: '11px',
            lineHeight: '1.4'
          }}
        >
          {fileContent}
        </SyntaxHighlighter>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
