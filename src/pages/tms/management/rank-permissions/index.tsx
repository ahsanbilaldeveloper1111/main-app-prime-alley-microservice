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

import { getRanks, AddRank, EditRank,DeleteRank } from "@utils/tms/tmsUserManagement";
import Link from "next/link";

interface SelectOption {
  value: number;
  label: string;
}

const TmsRankPermissions = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});

  const columns: Column[] = useMemo(
    () => [
      // {key: "id",name: "ID",selector: (row: any) => row.id,sortable: true},
      {key: "name",name: "Name",selector: (row: any) => row.name,sortable: true},
      // {key: "description",name: "Description",selector: (row: any) => row.description,sortable: true},
      {key: "company_id",name: "Company",selector: (row: any) => row.company_id,sortable: true},
      {key: "users_count",name: "Users Count",selector: (row: any) => row.users_count,sortable: true},
      {key: "created_at",name: "Created At",selector: (row: any) => row.created_at,sortable: true,
        cell: (props: any) => (
            <span>{moment(props.created_at).format('YYYY-MM-DD HH:mm:ss A')}</span>
        )
      },
      {key: "updated_at",name: "Updated At",selector: (row: any) => row.updated_at,sortable: true,
        cell: (props: any) => (
            <span>{moment(props.updated_at).format('YYYY-MM-DD HH:mm:ss A')}</span>
        )
      },
      {
        key: 'Action',
        name: 'ACTION',
        selector: (row: any) => row.id,
        sortable: false,
        cell: (props: any) => (
            
            <div className="action-buttons-container">

               
                    <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditRank(props)}>Edit Rank</button>
              

                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteRank(props)}>Delete Rank</button>

                    <Link href={`/tms/management/rank-permissions/${props.id}`} className="btn btn-sm btn-outline-primary">Permissions</Link>
              

                
            </div>
        ),
    },
    ],
    []
  );

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchData = useCallback(
      
      async (page = 1, perPage = 15, search = "") => {
        const response = await getRanks({page, perPage, search, filters: currentFilters});
        console.log('response', response);
        return response;
      },
      [memoizedFilters]
    );


    const [selectedRank, setSelectedRank] = useState<any>(null);
    const [selectedRankName, setSelectedRankName] = useState<any>(null);
    const [selectedRankDescription, setSelectedRankDescription] = useState<any>(null);
    const [showEditRankModal, setShowEditRankModal] = useState<boolean>(false);

    const handleEditRank = (props: any) => {
        setSelectedRank(props.id);
        setSelectedRankName(props.name);
        setSelectedRankDescription(props.description);
        setShowEditRankModal(true);
    };

    const handleSubmitEditRank = async () => {
        const response = await EditRank({id: selectedRank, name: selectedRankName, description: selectedRankDescription});
        if(response){
            setSelectedRank(null);
            setSelectedRankName(null);
            setSelectedRankDescription(null);
            setShowEditRankModal(false);
            setRefreshKey(prev => prev + 1);
            toast.success('Rank updated successfully');
        }
    };

    const [showDeleteRankModal, setShowDeleteRankModal] = useState<boolean>(false);
    const [confirmDelete, setConfirmDelete] = useState<string>("");

    const handleDeleteRank = (props: any) => {
        setSelectedRank(props.id);
        setSelectedRankName(props.name);
        setShowDeleteRankModal(true);
    };

    const handleSubmitDeleteRank = async () => {
        const confirmDeleteValue = confirmDelete.trim().toLowerCase();
        if(confirmDeleteValue == "delete"){
            const response = await DeleteRank(selectedRank);
            setSelectedRank(null);
                setSelectedRankName(null);
                setShowDeleteRankModal(false);
                setConfirmDelete("");
                setRefreshKey(prev => prev + 1);
                toast.success('Rank deleted successfully');
                fetchData();
        }else{
            toast.error('Please type the word delete to confirm');
        }
    };

    const [showCreateRnkModal, setShowCreateRankModal] = useState<boolean>(false);
    const [newRankName, setNewRankName] = useState<string>("");
    const [newRankDescription, setNewRankDescription] = useState<string>("");

    const handleSubmitCreateRank = async () => {
        const response = await AddRank({name: newRankName, description: newRankDescription});
        if(response){
            setNewRankName("");
            setNewRankDescription("");
            setShowCreateRankModal(false);
            setRefreshKey(prev => prev + 1);
            toast.success('Rank created successfully');
        }
    };


  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Management"
        mainLink="/tms/management"
        subTitle="Rank Permissions"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title d-flex justify-content-between align-items-center">
            <h2 className="mb-0">
            List Rank Permissions
            </h2>
            <button className="btn btn-sm btn-outline-primary" onClick={() => setShowCreateRankModal(true)}>Create Rank</button>
          </div>
        </Col>
      </Row>

      
        <GenericListPage
          columns={columns}
          fetchData={fetchData}
          title="Rank Permissions"
          searchPlaceholder="Search Rank Permissions..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={false}
        />

{showEditRankModal && (
                <Modal
                    show={showEditRankModal}
                    onHide={() => setShowEditRankModal(false)}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Edit Rank</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>

                      <div className="form-group mb-2">
                      <label>Name</label>
                        <input className="form-control" type="text" value={selectedRankName} onChange={(e) => setSelectedRankName(e.target.value)} />
                      </div>

                      <div className="form-group mb-2">
                        <label>Description</label>
                        <input className="form-control" type="text" value={selectedRankDescription} onChange={(e) => setSelectedRankDescription(e.target.value)} />
                      </div>


                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEditRankModal(false)}>Close</Button>
                        <Button variant="primary" onClick={() => handleSubmitEditRank()}>Save changes</Button>
                    </Modal.Footer>
                </Modal>
            )}

            {showDeleteRankModal && (
                <Modal
                    show={showDeleteRankModal}
                    onHide={() => setShowDeleteRankModal(false)}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Delete Rank?</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>
                            Are you sure you want to delete this <b className="text-danger">{selectedRankName}</b> rank?
                        </p>
                        <p>
                            Type the word <b className="text-danger">delete</b> to confirm
                        </p>
                        <input type="text" className="form-control" id="confirmDelete" value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} placeholder="Type the word delete to confirm" />

                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowDeleteRankModal(false)}>Close</Button>
                        <Button variant="danger" onClick={() => handleSubmitDeleteRank()}>Delete</Button>
                    </Modal.Footer>
                    
                </Modal>
            )}

            {showCreateRnkModal && (
                <Modal
                    show={showCreateRnkModal}
                    onHide={() => setShowCreateRankModal(false)}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>New Rank</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>

                      <div className="form-group mb-2">
                        <label>Name</label>
                        <input type="text" className="form-control" id="newRankName"  value={newRankName} onChange={(e) => setNewRankName(e.target.value)} placeholder="Rank Name" />
                      </div>

                      <div className="form-group mb-2">
                        <label>Description</label>
                        <input type="text" className="form-control" id="newRankDescription"  value={newRankDescription} onChange={(e) => setNewRankDescription(e.target.value)} placeholder="Rank Description" />
                      </div>
                       

                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCreateRankModal(false)}>Close</Button>
                        <Button variant="primary" onClick={() => handleSubmitCreateRank()}>Create</Button>
                    </Modal.Footer>
                </Modal>
            )}
      

    </React.Fragment>
  );
};

TmsRankPermissions.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default TmsRankPermissions;