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

import { ListTranslationPatterns } from "@utils/tmsCisxoPbx";

interface SelectOption {
  value: number;
  label: string;
}

const CiscoPbxListTranslationPatterns = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});

  ;

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
      {key: "callingLinePresentationBit",name: "Calling Line Presentation Bit",selector: (row: any) => row.callingLinePresentationBit,sortable: true},
      {key: "callingNamePresentationBit",name: "Calling Name Presentation Bit",selector: (row: any) => row.callingNamePresentationBit,sortable: true},
      {key: "connectedLinePresentationBit",name: "Connected Line Presentation Bit",selector: (row: any) => row.connectedLinePresentationBit,sortable: true},
      {key: "connectedNamePresentationBit",name: "Connected Name Presentation Bit",selector: (row: any) => row.connectedNamePresentationBit,sortable: true},
      {key: "provideOutsideDialtone",name: "Provide Outside Dialtone",selector: (row: any) => row.provideOutsideDialtone,sortable: true},
      {key: "callingPartyNumberingPlan",name: "Calling Party Numbering Plan",selector: (row: any) => row.callingPartyNumberingPlan,sortable: true},
      {key: "callingPartyNumberType",name: "Calling Party Number Type",selector: (row: any) => row.callingPartyNumberType,sortable: true},
      {key: "calledPartyNumberingPlan",name: "Called Party Numbering Plan",selector: (row: any) => row.calledPartyNumberingPlan,sortable: true},
      {key: "calledPartyNumberType",name: "Called Party Number Type",selector: (row: any) => row.calledPartyNumberType,sortable: true},
      {key: "callingSearchSpaceName",name: "Calling Search Space Name",selector: (row: any) => row.callingSearchSpaceName,sortable: true},
      {key: "routeNextHopByCgpn",name: "Route Next Hop By CGPN",selector: (row: any) => row.routeNextHopByCgpn,sortable: true},
      {key: "useOriginatorCss",name: "Use Originator CSS",selector: (row: any) => row.useOriginatorCss,sortable: true},
      
    ],
    []
  );

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchTranslationPatterns = useCallback(
      
      async (page = 1, perPage = 15, search = "") => {
        return await ListTranslationPatterns();
      },
      [memoizedFilters]
    );


      

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Cisco PBX"
        mainLink="/tms/cisco-pbx/translation-patterns"
        subTitle="Cisco PBX Translation Patterns"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">
              List Translation Patterns
            </h2>
          </div>
        </Col>
      </Row>

      
        <GenericListPage
          columns={columns}
          fetchData={fetchTranslationPatterns}
          title="Cisco PBX Translation Patterns"
          searchPlaceholder="Search translation patterns..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={false}
        />
      

    </React.Fragment>
  );
};

CiscoPbxListTranslationPatterns.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CiscoPbxListTranslationPatterns;