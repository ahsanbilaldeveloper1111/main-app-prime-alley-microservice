import { useCallback, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { NextRouter } from "next/router";

interface UseCrmListNavigationHandlersParams {
  sidebarFetchTokenRef: RefObject<number>;
  setShowSidebar: Dispatch<SetStateAction<boolean>>;
  setSelectedRecord: Dispatch<SetStateAction<any>>;
  setShowFiltersSidebar: Dispatch<SetStateAction<boolean>>;
  openSidebar: (record: any) => void;
  router: NextRouter;
  buildDetailUrl: (record: any) => string;
}

export function useCrmListNavigationHandlers({
  sidebarFetchTokenRef,
  setShowSidebar,
  setSelectedRecord,
  setShowFiltersSidebar,
  openSidebar,
  router,
  buildDetailUrl,
}: UseCrmListNavigationHandlersParams) {
  const handleCloseSidebar = useCallback(() => {
    sidebarFetchTokenRef.current += 1;
    setShowSidebar(false);
    setSelectedRecord(null);
  }, []);

  const handleOpenFiltersSidebar = useCallback(() => {
    setShowFiltersSidebar(true);
  }, []);

  const handleCloseFiltersSidebar = useCallback(() => {
    setShowFiltersSidebar(false);
  }, []);

  const handlePreviewClick = useCallback(
    (record: any) => {
      openSidebar(record);
    },
    [openSidebar],
  );

  const handleFirstColumnClick = useCallback(
    (record: any) => {
      router.push(buildDetailUrl(record));
    },
    [router, buildDetailUrl],
  );

  return {
    handleCloseSidebar,
    handleOpenFiltersSidebar,
    handleCloseFiltersSidebar,
    handlePreviewClick,
    handleFirstColumnClick,
  };
}
