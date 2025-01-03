import BlurPage from "../../../../../components/global/blur-page";
import React from "react";

type Props = {
  params: { subaccountId: string };
};

const Automations = async ({ params }: Props) => {
  return (
    <BlurPage>
      <p>
        This file is here only to ignore the error that is thrown when the file
        is not found.<br></br>This is a temporary solution until the file is
        created for adding automations using gemini we need to create a folder
        under components as:<br></br>
        gemini-&gt;automations-&gt;automation.tsx and page.tsx.
        <br></br>Also we need to add a query and automation handler in the lib folder
        under queries.ts
      </p>
    </BlurPage>
  );
};

export default Automations;

// This file is here only to ignore the error that is thrown when the file is not found
// This is a temporary solution until the file is created
// For adding automations using gemini we need to create a folder under components as gemini->automations->automation.tsx and page.tsx
// Also we need to add a query and query handler in the lib folder under queries.ts
