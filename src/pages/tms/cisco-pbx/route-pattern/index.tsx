import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import { Column } from "@components/CustomDataTable";
import { Button, Modal, Row } from "react-bootstrap";
import { Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { useTokenService } from "src/hooks/useTokenService";
import { useSession } from "next-auth/react";
import moment from "moment";
import Select from "react-select";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "@pages/partial/FormModal";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import PageSummaryGrid, { SummaryCard } from '@components/PageSummaryGrid';
import DatatableActionButton from "@components/DatatableActionButton";
import { FiEdit, FiTrash2, FiEye,FiPlus } from "react-icons/fi";

import { ListRoutePattern } from "@utils/tms/List";

interface SelectOption {
  value: number;
  label: string;
}

const CiscoPbxListRoutePattern = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState<any>({});

  const handleFiltersChange = (filters: any) => {
    setCurrentFilters(filters);
  };

  const columns: Column[] = useMemo(
    () => [
      {key: "ClusterName",name: "Cluster Name",selector: (row: any) => row.ClusterName,sortable: true},
      {key: "pattern",name: "Pattern",selector: (row: any) => row.pattern,sortable: true},
      {key: "description",name: "Description",selector: (row: any) => row.description,sortable: true},
      {key: "usage",name: "Usage",selector: (row: any) => row.usage,sortable: true},
      {key: "routePartitionName",name: "Route Partition Name",selector: (row: any) => row.routePartitionName,sortable: true},
      {key: "blockEnable",name: "Block Enable",selector: (row: any) => row.blockEnable,sortable: true},
      {key: "calledPartyTransformationMask",name: "Called Party Transformation Mask",selector: (row: any) => row.calledPartyTransformationMask,sortable: true},
      {key: "callingPartyTransformationMask",name: "Calling Party Transformation Mask",selector: (row: any) => row.callingPartyTransformationMask,sortable: true},
      {key: "useCallingPartyPhoneMask",name: "Use Calling Party Phone Mask",selector: (row: any) => row.useCallingPartyPhoneMask,sortable: true},
      {key: "callingPartyPrefixDigits",name: "Calling Party Prefix Digits",selector: (row: any) => row.callingPartyPrefixDigits,sortable: true},
      {key: "digitDiscardInstructionName",name: "Digit Discard Instruction Name",selector: (row: any) => row.digitDiscardInstructionName,sortable: true},
      {key: "patternUrgency",name: "Pattern Urgency",selector: (row: any) => row.patternUrgency,sortable: true},
      {key: "prefixDigitsOut",name: "Prefix Digits Out",selector: (row: any) => row.prefixDigitsOut,sortable: true},
      {key: "routeFilterName",name: "Route Filter Name",selector: (row: any) => row.routeFilterName,sortable: true},
      {key: "provideOutsideDialtone",name: "Provide Outside Dialtone",selector: (row: any) => row.provideOutsideDialtone,sortable: true},
      {key: "callingPartyNumberingPlan",name: "Calling Party Numbering Plan",selector: (row: any) => row.callingPartyNumberingPlan,sortable: true},
      {key: "callingPartyNumberType",name: "Calling Party Number Type",selector: (row: any) => row.callingPartyNumberType,sortable: true},
      {key: "calledPartyNumberingPlan",name: "Called Party Numbering Plan",selector: (row: any) => row.calledPartyNumberingPlan,sortable: true},
      {key: "calledPartyNumberType",name: "Called Party Number Type",selector: (row: any) => row.calledPartyNumberType,sortable: true},
      {key: "authorizationCodeRequired",name: "Authorization Code Required",selector: (row: any) => row.authorizationCodeRequired,sortable: true},
      {key: "authorizationLevelRequired",name: "Authorization Level Required",selector: (row: any) => row.authorizationLevelRequired,sortable: true},
      {key: "clientCodeRequired",name: "Client Code Required",selector: (row: any) => row.clientCodeRequired,sortable: true},
      {key: "externalCallControl",name: "External Call Control",selector: (row: any) => row.externalCallControl,sortable: true},
    ],
    []
  );

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchRoutePattern = useCallback(
      
      async (page = 1, perPage = 15, search = "") => {
        return await ListRoutePattern({ page, perPage, search, filters: currentFilters });
      },
      [memoizedFilters]
    );


  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Cisco PBX"
        mainLink="/tms/cisco-pbx/route-pattern"
        subTitle="Cisco PBX Route Pattern"
      />
    

      <PageHeader
        title="Cisco PBX Route Pattern"
        showSearch={true}
        searchPlaceholder="Search Route Pattern..."
        searchValue={currentFilters?.search || ""}
        onSearchChange={(value: any) => handleFiltersChange({...currentFilters, search: value})}
      />

        <GenericListPage
          columns={columns}
          fetchData={fetchRoutePattern}
          title="Cisco PBX Route Pattern"
          searchPlaceholder="Search Route Pattern..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={false}
          tableStyle="table-style-2"
        />
      

    </React.Fragment>
  );
};

CiscoPbxListRoutePattern.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CiscoPbxListRoutePattern;