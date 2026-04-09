import React from "react";
import {
  buildCrmListPageScopedLayoutCss,
  type CrmListPageScopedLayoutStylesConfig,
} from "@crm/shared/crmListPageScopedLayoutCss";

export type { CrmListPageScopedLayoutStylesConfig } from "@crm/shared/crmListPageScopedLayoutCss";

export function CrmListPageScopedLayoutStyles({
  config,
}: Readonly<{ config: CrmListPageScopedLayoutStylesConfig }>) {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: buildCrmListPageScopedLayoutCss(config),
      }}
    />
  );
}
