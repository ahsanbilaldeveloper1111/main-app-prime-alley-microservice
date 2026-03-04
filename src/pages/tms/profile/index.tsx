import React, { ReactElement, useState, useCallback, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Button, Card, Row, Form, Alert, Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { FaQrcode } from "react-icons/fa";

import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import { ClusterName } from "@models/tms/CiscoPBXResponse";
import Select from "@components/AppSelect";

import { User, UserSettingUpdate } from "@models/tms/User";
import axiosInstance from "@utils/axios";
import "@assets/scss/common.scss";

const TmsProfile = () => {
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [tmsSession, setTmsSession] = useState<any | null>(null);
  
  
  
  
    const [formData, setFormData] = useState<any>({});
    const [fac_code_mobile, setFacCodeMobile] = useState<number>(0);
    const [fac_code, setFacCode] = useState<number>(0);
    const [selectedCluster, setSelectedCluster] = useState<string>("SIPZON");

    const getUserDetails = useCallback(async (userData?: User) => {
      try {
        const response = await axiosInstance.get('tms/getTmsUsers',{params: {auth:true}});
        
        const fetchedUserData = response.data?.data?.data?.user as User;
        if (fetchedUserData) {
          setUser(fetchedUserData);
          return fetchedUserData;
        }
        //console.log("response getUserDetails", response?.data?.data?.data);
        //console.log("response getUserDetails", fetchedUserData);
        
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    }, []);

    const getCompanyDetails = useCallback(async () => {
      if (!user?.company_id) {
        console.log('No company_id available yet');
        return;
      }
      
      try {
        const response = await axiosInstance.get(`tms/getCompany?id=${user.company_id}`);
        console.log("response getCompanyDetails", response);
        const data= response?.data?.data;
        if(data?.success===true){
          setFacCode(data?.data?.profile?.fac_code);
          setFacCodeMobile(data?.data?.profile?.fac_code_mobile);
        }
        console.log("data getCompanyDetails", data);
      } catch (error) {
        console.error('Error fetching company details:', error);
      }
    }, [user?.company_id]);

// Initialize user data
useEffect(() => {
      const initializeUser = async () => {
        // TMS auth has been removed - initialize without session
        // Just fetch user details directly
        await getUserDetails();
      };
      initializeUser();
    }, []);

    // Fetch company details when user data is available
    useEffect(() => {
      if (user?.company_id) {
        getCompanyDetails();
      }
    }, [user?.company_id, getCompanyDetails]);



  const handleSubmit = async () => {
    try {
      const response = await axiosInstance.post('tms/company/createUpdateFacCode', {
        id: user?.company_id,
        fac_code: fac_code,
        fac_code_mobile: fac_code_mobile,
        ClusterName: selectedCluster,
      });
      toast.success('Company profile updated successfully');
      getCompanyDetails();
    } catch (error) {
      console.error('Error submitting company profile:', error);
      toast.error('Error submitting company profile');
    }
  };

  const generateFacCode = async () => {
    try {
      const response = await axiosInstance.post('tms/company/generate-fac-code', {
        company_id: user?.company_id,
      });
      getCompanyDetails();
    } catch (error) {
      console.error('Error generating fac code:', error);
    }
  };

  const clusterOptions = [
      {
          label: ClusterName.HARD_PHONE_AND_DESKTOP_CLUSTER,
          value: ClusterName.HARD_PHONE_AND_DESKTOP_CLUSTER,
      },
      {
          label: ClusterName.MOBILE_CLUSTER,
          value: ClusterName.MOBILE_CLUSTER,
      },
  ];

  

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="TMS Profile"
        mainLink="/tms/settings"
        subTitle="TMS Profile"
      />
      <Row className="mb-3">
        <Col md={12}>
          <div className="page-header-title d-flex align-items-center justify-content-between">
            <h2 className="mb-0">
              Manage Company Profile
            </h2>
            
          </div>
        </Col>
      </Row>

      
                <Card>
                    <Card.Body>
                        <Row>
                            {selectedCluster === ClusterName.HARD_PHONE_AND_DESKTOP_CLUSTER && <Col md={5}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Fac Info Code</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="fac_code"
                                        minLength={3}
                                        maxLength={5}
                                        value={fac_code || ""}
                                        onChange={(value) =>
                                            setFacCode(Number(value.target.value))
                                        }
                                        placeholder="Enter fac info code..."
                                    />
                                </Form.Group>
                            </Col>}
                            {selectedCluster ===ClusterName.MOBILE_CLUSTER && <Col md={5}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Fac Info Code Mobile</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="fac_code_mobile"
                                        value={fac_code_mobile  || ""}
                                        minLength={3}
                                        maxLength={5}
                                        onChange={(value: any) =>
                                            setFacCodeMobile(value.target.value)
                                        }
                                        placeholder="Enter fac info code mobile..."
                                    />
                                </Form.Group>
                            </Col>  }
                            {<Col md={5}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        Cluster Name
                                    </Form.Label>
                                    <Select
                                        name="ClusterName"
                                        styles={{
                                            control: (base, state) => ({
                                                ...base,
                                                minHeight: "48px",
                                                height: "48px",
                                               borderRadius: "8px",
                                               borderColor: state.isFocused ? "#667eea" : "#ced4da",
                                               boxShadow: state.isFocused ? "0 0 0 0.2rem rgba(102, 126, 234, 0.25)" : "none",
                                               "&:hover": {
                                                   borderColor: "#ced4da"
                                               }
                                            }),
                                        }}
                                        value={clusterOptions.find(option => option.value === selectedCluster)}
                                        options={clusterOptions}
                                        onChange={(selectedOption: any) => {
                                            setSelectedCluster(selectedOption?.value || '');
                                        }}
                                    />
                                </Form.Group>
                            </Col>}
                            <Col md={2}>
                                <Button
                                    variant="primary"
                                    className="app-button"
                                   
                                    style={{ marginTop: "30px" }}
                                          onClick={() => {generateFacCode()}}
                                >
                                    Generate Fac Code
                                </Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
                <div className="d-flex justify-content-end mt-4">
                    <Button variant="primary" onClick={() => handleSubmit()}>
                        Update Profile
                    </Button>
                </div>

      

    </React.Fragment>
  );
};

TmsProfile.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default TmsProfile;