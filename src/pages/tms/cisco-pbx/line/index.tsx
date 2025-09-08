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

import { ListLine } from "@utils/tms/List";
import { Truculenta } from "next/font/google";

interface SelectOption {
  value: number;
  label: string;
}

const CiscoPbxListLine = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});

  const columns: Column[] = useMemo(
    () => [
      {key: "ClusterName",name: "Cluster Name",selector: (row: any) => row.ClusterName,sortable: true},
      {key: "pattern",name: "Pattern",selector: (row: any) => row.pattern,sortable: true},
      {key: "description",name: "Description",selector: (row: any) => row.description,sortable: true},
      {key: "usage",name: "Usage",selector: (row: any) => row.usage,sortable: true},
      {key: "routePartitionName",name: "Route Partition Name",selector: (row: any) => row.routePartitionName,sortable: true},
      {key: "autoAnswer",name: "Auto Answer",selector: (row: any) => row.autoAnswer,sortable: true},
      {key: "networkHoldMohAudioSourceId",name: "Network Hold MOH Audio Source ID",selector: (row: any) => row.networkHoldMohAudioSourceId,sortable: true},
      {key: "userHoldMohAudioSourceId",name: "User Hold MOH Audio Source ID",selector: (row: any) => row.userHoldMohAudioSourceId,sortable: true},
      {key: "alertingName",name: "Alerting Name",selector: (row: any) => row.alertingName,sortable: true},
      {key: "asciiAlertingName",name: "ASCII Alerting Name",selector: (row: any) => row.asciiAlertingName,sortable: true},
      {key: "presenceGroupName",name: "Presence Group Name",selector: (row: any) => row.presenceGroupName,sortable: true},
      {key: "shareLineAppearanceCssName",name: "Share Line Appearance CSS Name",selector: (row: any) => row.shareLineAppearanceCssName,sortable: true},
      {key: "voiceMailProfileName",name: "Voice Mail Profile Name",selector: (row: any) => row.voiceMailProfileName,sortable: true},
      {key: "partyEntranceTone",name: "Party Entrance Tone",selector: (row: any) => row.partyEntranceTone,sortable: true},
      {key: "allowCtiControlFlag",name: "Allow CTI Control Flag",selector: (row: any) => row.allowCtiControlFlag,sortable: true},
      {key: "rejectAnonymousCall",name: "Reject Anonymous Call",selector: (row: any) => row.rejectAnonymousCall,sortable: true},
      {key: "externalCallControlProfile",name: "External Call Control Profile",selector: (row: any) => row.externalCallControlProfile,sortable: true},
      
    ],
    []
  );

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchLine = useCallback(
      
      async (page = 1, perPage = 15, search = "") => {
        return await ListLine({ page, perPage, search, filters: currentFilters });
      },
      [memoizedFilters]
    );

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Cisco PBX"
        mainLink="/tms/cisco-pbx/line"
        subTitle="Cisco PBX Line"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">
              List Line
            </h2>
          </div>
        </Col>
      </Row>

      
        <GenericListPage
          columns={columns}
          fetchData={fetchLine}
          title="Cisco PBX Line"
          searchPlaceholder="Search line..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={true}
        />
      

    </React.Fragment>
  );
};

CiscoPbxListLine.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CiscoPbxListLine;