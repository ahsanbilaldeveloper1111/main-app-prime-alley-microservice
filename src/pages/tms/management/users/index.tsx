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
import { Button, Modal, Row, Form } from "react-bootstrap";
import { Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { useTokenService } from "src/hooks/useTokenService";
import { useSession } from "next-auth/react";
import moment from "moment";
import Select from "react-select";

import { ListUsers, UpdateUserTms,getRanks,DeleteUser } from "@utils/tms/tmsUserManagement";

interface SelectOption {
  value: number;
  label: string;
}

interface UserTypeOption {
  value: string;
  label: string;
}

const TmsUserManagement = () => {
  const { data: session, status } = useSession();

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState({});
  const [updatingUsers, setUpdatingUsers] = useState<Set<number>>(new Set());

  // User type options
  const userTypeOptions: UserTypeOption[] = [
    { value: 'admin', label: 'Admin' },
    { value: 'partner', label: 'Partner' },
    { value: 'customer', label: 'Customer' }
  ];

  // Handle user type change
  const handleUserTypeChange = useCallback(async (userId: number, newUserType: string, currentUserType: string) => {
    // Only call API if user_type matches any of the options
    const validUserTypes = ['admin', 'partner', 'customer'];
    if (!validUserTypes.includes(currentUserType)) {
      toast.warning(`Cannot update user type. Current type "${currentUserType}" is not supported.`);
      return;
    }

    try {
      setUpdatingUsers(prev => new Set(prev).add(userId));
      
      const payload = {
        user_id: userId,
        user_type: newUserType
      };

      const response = await UpdateUserTms(payload);
      
      if (response) {
        toast.success(`User type updated to ${newUserType} successfully!`);
        setRefreshKey(prev => prev + 1); // Refresh the table
      }
    } catch (error) {
      console.error('Error updating user type:', error);
      toast.error('Failed to update user type');
    } finally {
      setUpdatingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  }, []);

  const [ListRanks, setListRanks] = useState<any[]>([]);
  const [ranksLoading, setRanksLoading] = useState<boolean>(true);

  // Handle user rank change
  const handleUserRankChange = useCallback(async (userId: number, newUserRank: string, currentUserRank: string) => {
    // Only call API if rank matches any of the available options
    const validRanks = ListRanks.map((rank: any) => rank.value);
    if (!validRanks.includes(newUserRank)) {
      toast.warning(`Cannot update user rank. Selected rank "${newUserRank}" is not supported.`);
      return;
    }

    try {
      setUpdatingUsers(prev => new Set(prev).add(userId));
      
      const payload = {
        user_id: userId,
        rank_ids: [newUserRank]
      };

      const response = await UpdateUserTms(payload);
      
      if (response) {
        const selectedRank = ListRanks.find(rank => rank.value === newUserRank);
        toast.success(`User rank updated to ${selectedRank?.label || newUserRank} successfully!`);
        setRefreshKey(prev => prev + 1); // Refresh the table
      }
    } catch (error) {
      console.error('Error updating user rank:', error);
      toast.error('Failed to update user rank');
    } finally {
      setUpdatingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  }, [ListRanks]);

  const fetchRanks = useCallback(async () => {
    try {
      setRanksLoading(true);
      const ranks = await getRanks({page: 1, perPage: 1000, search: ''});
      const rankList = ranks?.dataList?.map((rank: any) => ({
        value: rank.id,
        label: rank.name
      })) || [];
      setListRanks(rankList);
      console.log('rankList', rankList);
    } catch (error) {
      console.error('Error fetching ranks:', error);
      toast.error('Failed to load ranks');
    } finally {
      setRanksLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRanks();
  }, [fetchRanks]);

  const columns: Column[] = useMemo(
    () => [
      {key: "username",name: "User Name",selector: (row: any) => row.username,sortable: true},
      {key: "name",name: "Name",selector: (row: any) => row.name,sortable: true},
      {key: "phone_no",name: "Extension",selector: (row: any) => row.phone_no,sortable: true},
      {key: "company",name: "Company",selector: (row: any) => row.company,sortable: true},
      {key: "email",name: "Email",selector: (row: any) => row.email,sortable: true},
      {
        key: "rank_dropdown",
        name: "Rank",
        selector: (row: any) => row.rank?.name || row.rank?.id || '-', // Required by interface
        cell: (row: any) => (
          <div style={{ minWidth: '150px' }}>
            <Select
              value={ListRanks.find(option => option.value === row?.rank?.id) || null}
              onChange={(selectedOption) => {
                if (selectedOption) {
                  handleUserRankChange(row.id, selectedOption.value, row?.rank?.id);
                }
              }}
              isDisabled={updatingUsers.has(row.id) || ranksLoading}
              isLoading={ranksLoading}
              options={ListRanks?.map((option) => ({
                value: option.value,
                label: option.label
              }))}
              placeholder={ranksLoading ? "Loading ranks..." : "Select Rank"}
              isClearable={false}
              styles={{
                control: (provided) => ({
                  ...provided,
                  minHeight: '32px',
                  fontSize: '14px'
                }),
                option: (provided) => ({
                  ...provided,
                  fontSize: '14px'
                })
              }}
            />
            
            {updatingUsers.has(row.id) && (
              <small className="text-muted">Updating...</small>
            )}
          </div>
        ),
        sortable: false
      },
      {
        key: "user_type_dropdown",
        name: "Type",
        selector: (row: any) => row.user_type, // Required by interface
        cell: (row: any) => (
          <div style={{ minWidth: '150px' }}>
            <Select
              value={userTypeOptions.find(option => option.value === row.user_type) || null}
              onChange={(selectedOption) => {
                if (selectedOption) {
                  handleUserTypeChange(row.id, selectedOption.value, row.user_type);
                }
              }}
              isDisabled={updatingUsers.has(row.id)}
              options={userTypeOptions?.map((option) => ({
                value: option.value,
                label: option.label
              }))}
              placeholder="Select Type"
              isClearable={false}
              styles={{
                control: (provided) => ({
                  ...provided,
                  minHeight: '32px',
                  fontSize: '14px'
                }),
                option: (provided) => ({
                  ...provided,
                  fontSize: '14px'
                })
              }}
            />
            
            {/* {updatingUsers.has(row.id) && (
              <small className="text-muted">Updating...</small>
            )} */}
          </div>
        ),
        sortable: false
      },
      {
        key: "actions",
        name: "Actions",
        selector: (row: any) => row.id,
        cell: (row: any) => (
          <Button variant="danger"onClick={() => handleDelete(row)}>Delete</Button>
        )
      }
      
    ],
    [handleUserTypeChange, userTypeOptions, updatingUsers, handleUserRankChange, ListRanks, ranksLoading]
  );

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const fetchData = useCallback(
      
      async (page = 1, perPage = 15, search = "") => {
        return await ListUsers({page, perPage, search, filters: currentFilters});
      },
      [memoizedFilters]
    );

    const [selectedUserId, setSelectedUserId] = useState<any>(null);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [confirmDelete, setConfirmDelete] = useState<string>("");
    const [confirmDeleteUser, setConfirmDeleteUser] = useState<string>("");

    const handleDelete = (props: any) => {
        setSelectedUserId(props.id);
        setConfirmDelete(props.name);
        setShowDeleteModal(true);
    };

    const handleSubmitDeleteUser = async () => {
      const confirmDeleteValue = confirmDeleteUser.trim().toLowerCase();
      if(confirmDeleteValue == "delete"){
          const response = await DeleteUser(selectedUserId);
          if(response){
              setSelectedUserId(null);
              setConfirmDelete("");
              setShowDeleteModal(false);
              setConfirmDeleteUser("");
              setRefreshKey(prev => prev + 1); // Trigger refresh
              toast.success('User deleted successfully');
          }
      }else{
          toast.error('Please type the word delete to confirm');
      }
    };


  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Management"
        mainLink="/tms/management"
        subTitle="Users"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title">
            <h2 className="mb-0 d-flex align-items-center">
            List Users
            </h2>
          </div>
        </Col>
      </Row>

      
        <GenericListPage
          columns={columns}
          fetchData={fetchData}
          title="Users"
          searchPlaceholder="Search Users..."
          defaultPageSize={15}
          filters={memoizedFilters}
          refreshKey={refreshKey}
          search={true}
        />

{showDeleteModal && (
                <Modal
                    show={showDeleteModal}
                    onHide={() => setShowDeleteModal(false)}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Delete User?</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>
                            Are you sure you want to delete this <b className="text-danger">{confirmDelete}</b> user?
                        </p>
                        <p>
                            Type the word <b className="text-danger">delete</b> to confirm
                        </p>
                        <input type="text" className="form-control" id="confirmDelete" value={confirmDeleteUser} onChange={(e) => setConfirmDeleteUser(e.target.value)} placeholder="Type the word delete to confirm" />

                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Close</Button>
                        <Button variant="danger" onClick={() => handleSubmitDeleteUser()}>Delete</Button>
                    </Modal.Footer>
                    
                </Modal>
            )}
      

    </React.Fragment>
  );
};

TmsUserManagement.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default TmsUserManagement;