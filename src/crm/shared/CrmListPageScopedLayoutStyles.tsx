import React from "react";
import {
  buildCrmListPageScopedLayoutCss,
  type CrmListPageScopedLayoutStylesConfig,
} from "@crm/shared/crmListPageScopedLayoutCss";

export type { CrmListPageScopedLayoutStylesConfig };

export function CrmListPageScopedLayoutStyles({
  config,
}: {
  config: CrmListPageScopedLayoutStylesConfig;
}) {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: buildCrmListPageScopedLayoutCss(config),
      }}
    />
  );
}
