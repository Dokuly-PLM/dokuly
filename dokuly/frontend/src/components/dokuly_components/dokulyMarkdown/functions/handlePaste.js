import { toast } from "react-toastify";
import { uploadImage } from "../../../admin/functions/queries";

export async function handlePaste(
  event,
  projectId,
  currentText,
  selectionStart,
  selectionEnd,
  updateMarkdown,
  updateCursorPosition,
  processPastedText = true,
) {
  event.preventDefault(); // Prevent the default paste behavior at the start

  const items = event.clipboardData.items;
  let pastedText = event.clipboardData.getData("Text");

  // Split pasted text into rows and filter out empty strings
  const rows = pastedText.split(/\r?\n/).filter(Boolean);

  // Check if there's any data and if the pasted text is consistently tab-separated across multiple lines, indicating Excel data
  const isExcelData = rows.length > 0 && rows.every(row => {
    const columns = row.split("\t");
    return columns.length === rows[0].split("\t").length && columns.length > 1;
  });

  if (processPastedText && isExcelData) {
    // Create a Markdown table from tab-separated values
    const formattedTable = rows.map(row => `| ${row.split("\t").join(" | ")} |`).join("\n");
    const headerSeparator = `| ${rows[0].split("\t").map(() => "---").join(" | ")} |`;
    pastedText = `${formattedTable.split("\n")[0]}\n${headerSeparator}\n${formattedTable.split("\n").slice(1).join("\n")}`;

    const before = currentText.substring(0, selectionStart);
    const after = currentText.substring(selectionEnd);
    const newValue = `${before}${pastedText}${after}`;

    updateMarkdown(newValue);
    const newCursorPosition = selectionStart + pastedText.length;
    updateCursorPosition(newCursorPosition, newCursorPosition);

    return; // Exit the function early, since we've handled the paste as a table
  }

  // Continue with the existing logic for images and non-tabular text...
  // If no tab-separated content, process the image if it exists
  for (const index in items) {
    const item = items[index];
    if (item.kind === "file" && item.type.indexOf("image") >= 0) {
      const file = item.getAsFile();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("display_name", "markdown-image");
      if (projectId !== -1) {
        formData.append("project", projectId);
      }

      try {
        toast.info("Uploading image...");
        const response = await uploadImage(formData);

        const imageId = response.data.imageData.id;
        const imageUrl = `/api/files/images/download/${imageId}/`;
        const fileUrl = `![uploaded image](${imageUrl} "width:700px")`;

        const before = currentText.substring(0, selectionStart);
        const after = currentText.substring(selectionEnd);
        const newValue = `${before}${fileUrl}${after}`;

        updateMarkdown(newValue);
        const newCursorPosition = before.length + fileUrl.length;
        updateCursorPosition(newCursorPosition, newCursorPosition);
      } catch (error) {
        toast.error(`Error uploading file: ${error}`);
      }
      return; // Ensure function exits after processing an image
    }
  }

  if (processPastedText) {
    // Handle bullet points or markdown tables if not a tab-separated table
    const isTable = /^(\s*\|.*\|(\r?\n|\r))+/.test(pastedText.trim());

    if (!isTable) {
      pastedText = pastedText.replace(
        /^[\s\u00A0]*[\u2022\u2023\u25E6\u2043\u2219\u25AA\u25D8\u25CF\uF0B7\uF0A7\uF076\uF0D8•]+/gm,
        "-",
      );
      pastedText = pastedText.replace(/-\s*/g, "- "); // Ensure consistent spacing for bullets
    }
  }

  const before = currentText.substring(0, selectionStart);
  const after = currentText.substring(selectionEnd);
  const newValue = `${before}${pastedText}${after}`;

  updateMarkdown(newValue);
  const newCursorPosition = selectionStart + pastedText.length;
  updateCursorPosition(newCursorPosition, newCursorPosition);
}
