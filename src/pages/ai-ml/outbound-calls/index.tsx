import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useCallback, useMemo, useRef } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";

import { Column } from "@components/CustomDataTable";
import { Button, Card, Form, Row, Col, Table } from "react-bootstrap";
import { useSession } from "next-auth/react";
import PageHeader from "@components/PageHeader";
import { Plus, Phone } from "lucide-react";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import axiosInstance from "@utils/axios";
import { toast } from "react-toastify";
import ConfirmModal from "@pages/partial/ConfirmModal";
import FormModal from "@pages/partial/FormModal";

interface Trunk {
      sip_trunk_id: string;
      name: string;
      address: string;
      numbers: string[];
    }
    
interface DispatchResult {
      phone_number: string;
      stdout: string;
      stderr: string;
    }
    
const normalizeTrunkList = (items: Trunk[]) =>
      items.map((trunk) => ({
        ...trunk,
        numbers: Array.isArray(trunk.numbers) ? trunk.numbers : [],
      }));

const DEFAULT_VBOT_CONTEXT =
  'You are an AI assistant representing RingEdge Limited. Start the call politely and explain our AI voicebot services.';

const METADATA_REGEX = /metadata:"((?:\\.|[^"\\])*)"/;

const getLogSections = (text?: string) =>
  (text ?? "")
    .split(/\n\s*\n+/)
    .map((section) => section.trim())
    .filter(Boolean);

const parseMetadataFromLog = (text?: string): Record<string, unknown> | undefined => {
  if (!text) {
    return undefined;
  }

  const match = text.match(METADATA_REGEX);
  if (!match || !match[1]) {
    return undefined;
  }

  try {
    const normalized = match[1].replace(/\\"/g, '"');
    return JSON.parse(normalized);
  } catch {
    return undefined;
  }
};

const FormattedLogCell = ({ text }: { text?: string }) => {
  const sections = getLogSections(text);
  const metadata = parseMetadataFromLog(text);

  return (
    <div className="text-break" style={{ whiteSpace: "pre-line" }}>
      {sections.length ? (
        sections.map((section, index) => (
          <div key={index} className="mb-1 text-dark">
            {section}
          </div>
        ))
      ) : (
        <span className="text-muted small">No output</span>
      )}

      {metadata && (
        <div className="border rounded bg-light px-2 py-1 mt-2 small">
          <div className="fw-bold text-uppercase mb-1">Metadata</div>
          <dl className="row mb-0">
            {Object.entries(metadata).map(([key, value]) => (
              <React.Fragment key={key}>
                <dt className="col-auto text-muted mb-0 me-1 text-capitalize">{key}</dt>
                <dd className="col mb-0">
                  <span className="text-break">{String(value)}</span>
                </dd>
              </React.Fragment>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
};

const AimlOutboundCalls = () => {
  const { data: session, status } = useSession();
  const [bulkUploading, setBulkUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const columns: Column[] = useMemo(
    () => [
      {
        key: "name",
        name: "Trunk Name",
        selector: (row: any) => row.name,
        sortable: true
      },
      {
        key: "address",
        name: "Trunk Address",
        selector: (row: any) => row.address,
        sortable: true
      },
      {
        key: "numbers",
        name: "Numbers",
        selector: (row: any) => row.numbers,
        sortable: true,
        cell: (props: any) => {
          const numbers = props.numbers;
          return <span className="text-muted">{numbers}</span>;
        }
      },
      // {
      //   key: "Action",
      //   name: "ACTION",
      //   selector: (row: any) => row.id,
      //   sortable: false,
      //   cell: (props: any) => (
          
      //     <div className="d-flex gap-2">
           
      //       {session?.user?.permissions?.includes('delete-trunk-aiml') && (
      //         <Button variant="light" size="sm" className="btn-action-style-2 p-1 text-danger" title="Delete">
      //           <Trash2 size={16}  onClick={() => handleDeleteTrunk(props.sip_trunk_id)} />
      //         </Button>
      //       )}
      //     </div>
      //   ),
      // },
    ],
    [session?.user?.permissions]
  );

  const [showDeleteTrunkModal, setShowDeleteTrunkModal] = useState<boolean>(false);
  const [selectedTrunkId, setSelectedTrunkId] = useState<string>('');
  const handleDeleteTrunk = useCallback((sip_trunk_id: string) => {
    setShowDeleteTrunkModal(true);
    setSelectedTrunkId(sip_trunk_id);
  }, []);

  const handleConfirmDeleteTrunk = useCallback(() => {
    axiosInstance.post('aiml/delete-trunk', {
      trunk_id: selectedTrunkId
    }).then((response) => {
      toast.success('Trunk deleted successfully');
      setRefreshKey(prev => prev + 1);
      setShowDeleteTrunkModal(false);
      setSelectedTrunkId('');
    }).catch((error) => {
      toast.error('Failed to delete trunk');
      setShowDeleteTrunkModal(false);
      setSelectedTrunkId('');
    });
  }, [selectedTrunkId]);

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});
  const [trunks, setTrunks] = useState<Trunk[]>([]);


  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchOutboundCalls = useCallback(
      async () => {
        const response = await axiosInstance.get('aiml/list-trunks');
        const received = normalizeTrunkList(response?.data?.trunks ?? []);
        setTrunks(received);
        
        return {
          draw: 1,
          recordsTotal: received.length,
          recordsFiltered: received.length,
          dataList: received,
          meta: {
            total: received.length,
            limit: 100,
            page: 1,
            current_page: 1,
            last_page: 0,
            from: 1,
            to: received.length,
            next_page_url: '',
            prev_page_url: '',
            per_page:100
          }
        };
      },
      []
  );

  const [showAddTrunkModal, setShowAddTrunkModal] = useState<boolean>(false);
  const [newTrunkName, setNewTrunkName] = useState<string>('');
  const [newTrunkAddress, setNewTrunkAddress] = useState<string>('');
  const [newTrunkNumbers, setNewTrunkNumbers] = useState<string>('');
  const handleSubmitAddTrunk = useCallback(() => {
    axiosInstance.post('aiml/add-trunk', {
      name: newTrunkName,
      address: newTrunkAddress,
      numbers: newTrunkNumbers
    }).then((response) => {
      toast.success('Trunk added successfully');
      setShowAddTrunkModal(false);
      setNewTrunkName('');
      setNewTrunkAddress('');
      setNewTrunkNumbers('');
      setRefreshKey(prev => prev + 1);
    }).catch((error) => {
      toast.error('Failed to add trunk');
      
    });
  }, [newTrunkName, newTrunkAddress, newTrunkNumbers]);
  const handleCloseAddTrunkModal = useCallback(() => {
    setShowAddTrunkModal(false);
    setNewTrunkName('');
    setNewTrunkAddress('');
    setNewTrunkNumbers('');
  }, []);

  const handleBulkFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) {
        return;
      }
      await uploadCsv(file);
    };

  const uploadCsv = async (file: File) => {
    setBulkUploading(true);
    const formData = new FormData();
    formData.append('csv_file', file);
    const response = await axiosInstance.post('aiml/upload-csv', formData);
    setBulkUploading(false);
  };

  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchResults, setDispatchResults] = useState<DispatchResult[]>([]);
  const [dispatchPhoneNumbers, setDispatchPhoneNumbers] = useState('');
  const [dispatchClientInfo, setDispatchClientInfo] = useState('3');
  const [dispatchTrunkId, setDispatchTrunkId] = useState('');
  const [dispatchVbotContext, setDispatchVbotContext] = useState(DEFAULT_VBOT_CONTEXT);



  const handleSubmitDispatch = useCallback(async () => {
    setDispatchLoading(true);
    const response = await axiosInstance.post('aiml/dispatch-call', {
      phone_numbers: dispatchPhoneNumbers,
      client_info: dispatchClientInfo,
      trunk_id: dispatchTrunkId,
      vbot_context: dispatchVbotContext
    });
    if(response.status === 200){
      setDispatchLoading(false);
      toast.success('Call dispatched successfully');
      // setDispatchModalOpen(false);
      // setDispatchPhoneNumbers('');
      // setDispatchClientInfo('3');
      // setDispatchTrunkId('');
      // setDispatchVbotContext(DEFAULT_VBOT_CONTEXT);
      setDispatchResults(response.data.results);
    }else{
      setDispatchLoading(false);
      toast.error('Failed to dispatch call');
      setDispatchModalOpen(false);
      setDispatchPhoneNumbers('');
      setDispatchClientInfo('3');
      setDispatchTrunkId('');
      setDispatchVbotContext(DEFAULT_VBOT_CONTEXT);
      setDispatchResults([]);
    }
  }, [dispatchPhoneNumbers, dispatchClientInfo, dispatchVbotContext, dispatchTrunkId]);
 



  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="AI-ML"
        mainLink="/ai-ml/outbound-calls"
        subTitle="Outbound Calls"
      />



      <PageHeader
        title="Outbound Calls"
        description="Manage outbound calls and their properties"
        showSearch={false}
        buttons={
          <>
          {session?.user?.permissions?.includes('add-trunk-aiml') && (
            <>
            <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="d-none"
                  onChange={handleBulkFileChange}
                  />
            {/* <Button
        variant="info"
       
        disabled={bulkUploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {bulkUploading ? (
          <>
            <Spinner animation="border" size="sm" className="me-2" />
            Uploading CSV
          </>
        ) : (
          'Bulk Upload (.csv)'
        )}
      </Button> */}
      
          <Button variant="primary" onClick={() => setShowAddTrunkModal(true)}>Add Trunk</Button>
          <Button variant="danger" 
          onClick={() => 
            {setDispatchModalOpen(true);
            setDispatchTrunkId('') 
            setDispatchPhoneNumbers('0561870089')
            setDispatchClientInfo('3')
            setDispatchVbotContext(DEFAULT_VBOT_CONTEXT)
            setDispatchResults([])
          }
      }
          >
            Dispatch Call</Button>
          </>
          )}
          </>
        }
      />

      
        <GenericListPage
          columns={columns}
          fetchData={fetchOutboundCalls}
          title="Outbound Calls"
          searchPlaceholder="Search outbound calls..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={false}
          tableStyle="table-style-2"
        />

        <ConfirmModal
          show={showDeleteTrunkModal}
          onHide={() => setShowDeleteTrunkModal(false)}
          title="Delete Trunk"
          description={`Are you sure you want to delete the trunk?`}
          targetName={selectedTrunkId}
          onConfirm={handleConfirmDeleteTrunk}
          onCancel={() => setShowDeleteTrunkModal(false)}
          confirmButtonText="Delete"
          confirmButtonVariant="danger"
          requireTextConfirmation={true}
          requiredConfirmationText="delete"
        />

        <FormModal
          show={showAddTrunkModal}
          onHide={handleCloseAddTrunkModal}
          title="Add Trunk"
          onSubmit={handleSubmitAddTrunk}
          onCancel={handleCloseAddTrunkModal}
          cancelButtonText="Cancel"
          desc="Please fill in the details below to add a new trunk"
          submitButtonText="Add Trunk"
          isSubmitDisabled={!newTrunkName || !newTrunkAddress || !newTrunkNumbers}
          submitButtonVariant="primary"
          cancelButtonVariant="secondary"
          showGuidelines={true}
          guidelines={<p>Please fill in the details below to add a new trunk</p>}
          size="lg"
          titleIcon={<Plus size={20} className="text-primary" />}
          formHtml={
            <>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={newTrunkName}
                onChange={(event) => setNewTrunkName(event.target.value)}
                placeholder="Campaign A Trunk"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                type="text"
                value={newTrunkAddress}
                onChange={(event) => setNewTrunkAddress(event.target.value)}
                placeholder="90.250.8.96:5069"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Numbers (comma or newline separated)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newTrunkNumbers}
                onChange={(event) => setNewTrunkNumbers(event.target.value)}
                placeholder="303100,303101"
                required
              />
            </Form.Group>
            </>
            }
        />


        <FormModal
          show={dispatchModalOpen}
          onHide={() => setDispatchModalOpen(false)}
          title="Dispatch Call"
            desc="Please fill in the details below to dispatch a call"
            formHtml={
                  <>
                  <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="selectTrunk">
                  <Form.Label>Select Trunk <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={dispatchTrunkId}
                    onChange={(event) => setDispatchTrunkId(event.target.value)}
                  >
                    <option value="">-- Select existing trunk --</option>
                    {trunks.map((trunk) => (
                      <option key={trunk.sip_trunk_id} value={trunk.sip_trunk_id}>
                        {trunk.name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text muted>Manual trunk ID overrides this selection.</Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="clientInfo">
                  <Form.Label>Client Info <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={dispatchClientInfo}
                    onChange={(event) => setDispatchClientInfo(event.target.value)}
                    placeholder="3"
                  />
                </Form.Group>
              </Col>
              
            </Row>
            <Row className="mb-3">
              
              <Col md={12}>
                <Form.Group controlId="phoneNumbers">
                  <Form.Label>Phone Numbers <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="input"
                    value={dispatchPhoneNumbers}
                    onChange={(event) => setDispatchPhoneNumbers(event.target.value)}
                    placeholder="0509380627,00923704024928"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Context <span className="text-danger">*</span>
                  </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={dispatchVbotContext}
                onChange={(event) => setDispatchVbotContext(event.target.value)}
              />
            </Form.Group>
            {dispatchResults.length > 0 ? (
              <Card className="mb-0">
                <Card.Header className="px-3 py-2">Dispatch Call results</Card.Header>
                <Card.Body className="p-0 table-responsive">
                  <Table bordered hover size="sm" className="mb-0">
                    <thead>
                      <tr>
                        <th>Phone Number</th>
                        <th>Stdout</th>
                        <th>Stderr</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dispatchResults.map((result) => (
                        <tr key={result.phone_number}>
                          <td>{result.phone_number}</td>
                          <td>
                            <pre>
                              {result.stdout}
                            </pre>
                          </td>
                          <td>
                            <pre>
                              {result.stderr}
                            </pre>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            ) : (
              <p className="text-muted small mb-0">Dispatch call results will appear after submission.</p>
            )}
                  </>
            }
            isSubmitDisabled={!dispatchPhoneNumbers || !dispatchClientInfo || !dispatchTrunkId || dispatchLoading}
            onSubmit={handleSubmitDispatch}
            submitButtonVariant="primary"
            cancelButtonVariant="secondary"
            showGuidelines={false}
            guidelines={<p>Please fill in the details below to dispatch a call</p>}
            size="lg"
            titleIcon={<Phone size={20} className="text-primary" />}
          onCancel={() => {
            setDispatchModalOpen(false);
            setDispatchLoading(false);
            setDispatchResults([]);
            setDispatchPhoneNumbers('');
            setDispatchClientInfo('3');
            setDispatchTrunkId('');
            setDispatchVbotContext(DEFAULT_VBOT_CONTEXT);
          }}
          cancelButtonText="Cancel"
          submitButtonText={dispatchLoading ? 'Dispatching call...' : 'Dispatch Call'}
        />
     
    </React.Fragment>
  );
};

AimlOutboundCalls.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AimlOutboundCalls;
