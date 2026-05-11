import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { Row, Col } from "react-bootstrap";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import { GetUserById } from "@utils/tms/tmsUserManagement";
import CreateUserProfile from "@page-modules/tms/profiling/user/create/CreateUserProfile";

const TmsUserEdit = () => {
  const router = useRouter();
  const { id } = router.query;
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return;
      
      // Handle id as string or string array
      const userId = Array.isArray(id) ? id[0] : id;
      if (!userId) return;

      try {
        setLoading(true);
        const response = await GetUserById(userId);
        
        if (response && response.success === true) {
          setUserData(response.data);
        } else {
          const errorMessage = response?.message || 'Failed to fetch user data';
          toast.error(errorMessage);
        }
      } catch (error: any) {
        console.error('Error fetching user:', error);
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch user data';
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  if (loading) {
    return (
      <React.Fragment>
        <BreadcrumbItem
          mainTitle="Management"
          mainLink="/tms/management"
          subTitle="Users"
          subLink="/tms/management/users"
          currentTitle="Edit User"
        />
        <Row className="mb-3">
          <Col md={12}>
            <div className="page-header-title d-flex align-items-center justify-content-between">
              <h2 className="mb-0 d-flex align-items-center">
                Edit User Profile
              </h2>
            </div>
          </Col>
        </Row>
        <div className="text-center p-5">
          <p>Loading user data...</p>
        </div>
      </React.Fragment>
    );
  }

  if (!userData) {
    return (
      <React.Fragment>
        <BreadcrumbItem
          mainTitle="Management"
          mainLink="/tms/management"
          subTitle="Users"
          subLink="/tms/management/users"
          currentTitle="Edit User"
        />
        <Row className="mb-3">
          <Col md={12}>
            <div className="page-header-title d-flex align-items-center justify-content-between">
              <h2 className="mb-0 d-flex align-items-center">
                Edit User Profile
              </h2>
            </div>
          </Col>
        </Row>
        <div className="text-center p-5">
          <p>No user data available</p>
        </div>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="Management"
        mainLink="/tms/management"
        subTitle="Users"
        subLink="/tms/management/users"
        currentTitle="Edit User"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title d-flex align-items-center justify-content-between">
            <h2 className="mb-0 d-flex align-items-center">
              Edit User Profile
            </h2>
          </div>
        </Col>
      </Row>
      
      <CreateUserProfile initialUserData={userData} />
    </React.Fragment>
  );
};

TmsUserEdit.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default TmsUserEdit;
