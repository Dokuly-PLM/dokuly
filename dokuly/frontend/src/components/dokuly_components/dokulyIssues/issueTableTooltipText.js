export const issueTableTooltipText =
  "- Issues that are not closed are copied to the next revision.\n\
- Closing an issue that exists in both revision A and B:\n\
  - If closed in revision A, it will close the issue in revision B as well.\n\
  - If closed in revision B, it will not close the issue in revision A, but the issue will have a remark about being closed in revision B.\n\
- Creating new issues:\n\
  - Creating a new issue in revision A, if revision A and B exists, will create an issue in A and B.\n\
  - Creating a new issue in the latest revision will only create an issue in that revision.\n\
- Issues flow upwards in items that has BOM:\n\
  - The issue can only be closed on the related bom item";
