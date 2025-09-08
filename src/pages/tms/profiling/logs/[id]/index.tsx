import React,{ReactElement, useEffect, useState,useMemo} from 'react'
import Layout from '@layout/index'
import BreadcrumbItem from '@common/BreadcrumbItem'
import { Button, Card, Col, Form, Modal, ProgressBar, Row, Tab, Table, Tabs, Spinner } from 'react-bootstrap'
import Swal from 'sweetalert2'
import { toast } from 'react-toastify'
import { useSession } from 'next-auth/react'

import { useRouter } from 'next/router'
import { ListCustomerProfilingLogs } from "@utils/tms/tmsProfiling";
import { iErrorDetails, UserProfilingErrorLogStatus } from '@models/tms/UnfidiedOp'
import '@assets/scss/profiling-error-log.scss';


import ProgressTracker, {
      ProgressStep,
  } from "./ProgressTracker";

  import { useProgressTracker } from "@hooks/tms/useProgressTracker";
import { useUserProfile } from "@hooks/tms/UserProfile";

const UserProfileErrorDetails = () => {

    const { data: session, status } = useSession();
    const router = useRouter();
    const { id } = router.query;

    const [userProfileErrorLog, setUserProfileErrorLog] = useState<any>(null);

    const [errorDetailsList, setErrorDetailsList] = useState<any>(null);
    const [applicantDetails, setApplicantDetails] =
        useState<any | null>(null);

    const [currentStep, setCurrentStep] = useState(1);
    const [progressViewMode, setProgressViewMode] = useState<
        "vertical" | "horizontal"
    >("vertical");

    useEffect(() => {
        if (id) {
            fetchUserProfileErrorLog();
        }
    }, [id]);

    const fetchUserProfileErrorLog = async (page = 1, perPage = 15, search = "") => {
      const response = await ListCustomerProfilingLogs({page, perPage, search, filters: {id: Number(id)}});
      const dataList = response?.dataList?.[0] || response?.dataList;
      console.log(dataList, "dataList");

      if(dataList){
        setErrorDetailsList(dataList?.error_details || null);
        setApplicantDetails(dataList?.applicant_details || null);
        setCurrentStep(1);
      }
      setUserProfileErrorLog(dataList);
    }

    // Helper function to check if a step is completed
    const isStepCompleted = (stepKey: string): boolean => {
      if (!errorDetailsList?.sync_user_steps || !Array.isArray(errorDetailsList.sync_user_steps)) {
          return false;
      }
      const step = errorDetailsList.sync_user_steps.find((step: any) => step[stepKey] !== undefined);
      return step ? step[stepKey] === true : false;
  };

  // Get verification progress from error details
  const verificationProgress = useMemo(() => {
      if (!errorDetailsList?.sync_user_steps || !Array.isArray(errorDetailsList.sync_user_steps)) {
          return {};
      }

      // Dynamically build progress object based on what exists
      const progress: Record<string, boolean | number | string> = {};

      // Check each error and mark corresponding verification as true if it exists
      // Add verification steps that exist in sync_user_steps array
      errorDetailsList.sync_user_steps.forEach((step: any) => {
          Object.entries(step).forEach(([key, value]) => {
              // Skip execution_time_ms as it's not a verification step
              if (key !== 'execution_time_ms') {
                  progress[key] = value as boolean | number | string;
              }
          });
      });

      return progress;
  }, [errorDetailsList?.sync_user_steps]);

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
      const totalSteps = Object.keys(verificationProgress).length;
      if (totalSteps === 0) return 0;

      // Count completed steps (where value is true)
      const completedSteps = Object.values(verificationProgress).filter(value => value === true).length;
      return Math.round((completedSteps / totalSteps) * 100);
  }, [verificationProgress]);

// Progress tracking using common hook
const {
      progress: apiProgress,
      currentStep: currentApiStep,
      isProcessing: isProcessingRequest,
      updateProgress,
      resetProgress,
      startProcessing,
      stopProcessing,
      getProgressSteps,
  } = useProgressTracker();

// User Profile operations hook
const {
      addLine,
      addPhone,
      updateAppUser,
      updateUser,
      updateLine,
      updatePhone,
      addRemoteDestination,
      addRemoteDestinationProfile,
      updateDNCR,
      updateUserInfo,
      addUserInfo,
      updateOnlyLdapUser,
      removeLine,
      removePhone,
      syncPBX,
      runLdapSync,
      updateUserProfilingErrorLog,
  } = useUserProfile();

  // Define only the progress steps that are actually used in processUserRequest
  const progressSteps = getProgressSteps({
      // Update mode steps used in processUserRequest
      updateLdapUser: "Update LDAP User",
      removeMobileLine: "Remove Mobile Line",
      removeMobilePhone: "Remove Mobile Phone",
      addMobileLine: "Add Mobile Line",
      addMobilePhone: "Add Mobile Phone",
      updateMobileAppUser: "Update Mobile App User",
      updateMobileUser: "Update Mobile User",
      updateLine: "Update Line",
      updatePhone: "Update Phone",
      updateUserDevices: "Update User Devices",
      addRemoteDestinationProfile: "Add Remote Destination Profile",
      addRemoteDestination: "Add Remote Destination",

      // Create mode core steps (only if used inside processUserRequest)
      addLine: "Add Line",
      addPhone: "Add Phone",
      updateAppUser: "Update App User",
      updateUser: "Update User",

      // Optional
      updateErrorLog: "Update Error Log",
  });

  // Enhanced progress steps with more detailed information
  const enhancedProgressSteps = useMemo(() => {
      if (Object.keys(apiProgress).length === 0) return [];

      return Object.entries(apiProgress).map(([key, progress]) => ({
          key,
          title: progressSteps.find((step) => step.key === key)?.title || key,
          status: progress.status,
          message: progress.message,
      }));
  }, [apiProgress, progressSteps]);

  // Only show steps that are not completed
  const incompleteSteps = useMemo(() => {
      return enhancedProgressSteps.filter((step) => step.status !== "completed");
  }, [enhancedProgressSteps]);

// Progress management functions for Process Request
const processUserRequest = async (applicantDetails: any) => {
      if (!applicantDetails) return;

      startProcessing();

      // Check if this is an update or create operation
      const isUpdateMode = applicantDetails.update_user == true;

      if (isUpdateMode) {
          applicantDetails.verify = true;
          // UPDATE MODE - Same order as CreateUserProfile.tsx update logic

          // Step 1: Update LDAP User
          updateProgress(
              "updateLdapUser",
              "in_progress",
              "Updating LDAP User...",
          );

          try {
              const updateLdapUserParams = {
                  userId: applicantDetails.userId?.toString() || "",
                  extensionNumber: applicantDetails.extensionNumber || null,
                  companyName: applicantDetails.companyName || "",
                  country: applicantDetails.country,
                  department: applicantDetails.department,
                  jobTitle: applicantDetails.jobTitle,
                  email: applicantDetails.email,
                  firstName: applicantDetails.firstName,
                  lastName: applicantDetails.lastName,
                  password: applicantDetails.password,
                  client_transactionid: applicantDetails.client_transactionid,
                  displayName: `${applicantDetails.firstName} ${applicantDetails.lastName}`,
                  company_id: applicantDetails.company_id,
                  user_id: applicantDetails.user_id || 0,
                  update_user: true,
                  verify: applicantDetails.verify,
              };

              await updateOnlyLdapUser(updateLdapUserParams);

              updateProgress(
                  "updateLdapUser",
                  "completed",
                  "LDAP User updated successfully",
              );
          } catch (error) {
              applicantDetails.verify = false;
                  Swal.fire({
                        title: "Creation Failed",   
                        text: "Failed to update LDAP user. Please check the form and try again.",
                        icon: "error",
                  });
              toast.error("Failed to update LDAP user. Please check the form and try again.");
              throw error;
              console.error("Failed to update LDAP User:", error);
              updateProgress(
                  "updateLdapUser",
                  "failed",
                  "Failed to update LDAP User",
              );
          }

          // Step 2: Remove existing mobile items if switching from mobile to non-mobile
          if (
              applicantDetails.mobile_user === "No" &&
              applicantDetails.previous_mobile_user === "Yes"
          ) {
              // Remove mobile line
              updateProgress(
                  "removeMobileLine",
                  "in_progress",
                  "Removing mobile line...",
              );
              if (!isStepCompleted(`remove_line_SIPZON.MOBI`)) {
                  try {
                      await removeLine({
                          ClusterName: "SIPZON.MOBI",
                          extensionNumber:
                              applicantDetails.extensionNumber?.toString() ||
                              "",
                          client_transactionid:
                              applicantDetails.client_transactionid || "",
                          userId: applicantDetails.userId?.toString() || "",
                          company_id: applicantDetails.company_id,
                          update_user: true,
                          user_id: applicantDetails.user_id || 0,
                          verify: applicantDetails.verify,
                      });
                      updateProgress(
                          "removeMobileLine",
                          "completed",
                          "Mobile line removed",
                      );
                  } catch (error) {
                      applicantDetails.verify = false;
                      Swal.fire({
                          title: "Creation Failed",
                          text: "Failed to remove mobile line. Please check the form and try again.",
                          icon: "error",
                      });
                      toast.error("Failed to remove mobile line. Please check the form and try again.");
                      throw error;
                      
                  }
              }
              // Remove mobile phone
              updateProgress(
                  "removeMobilePhone",
                  "in_progress",
                  "Removing mobile phone...",
              );
              if (!isStepCompleted(`remove_phone_SIPZON.MOBI`)) {
                  try {
                      await removePhone({
                          ClusterName: "SIPZON.MOBI",
                          extensionNumber:
                              applicantDetails.extensionNumber?.toString() ||
                              "",
                          client_transactionid:
                              applicantDetails.client_transactionid || "",
                          userId: applicantDetails.userId?.toString() || "",
                          device_type: applicantDetails.device_type,
                          company_id: applicantDetails.company_id,
                          update_user: true,
                          user_id: applicantDetails.user_id || 0,
                          verify: applicantDetails.verify,
                      });
                      updateProgress(
                          "removeMobilePhone",
                          "completed",
                          "Mobile phone removed",
                      );
                  } catch (error) {
                      applicantDetails.verify = false;
                      Swal.fire({
                          title: "Creation Failed",
                          text: "Failed to remove mobile phone. Please check the form and try again.",
                          icon: "error",
                      });
                      throw error;
                   
                  }
              }
          }

          // Step 3: Process clusters for updates
          const clusters =
              applicantDetails.mobile_user === "Yes"
                  ? [
                       "SIPZON",
                        "SIPZON.MOBI",
                    ]
                  : ["SIPZON"];

          for (const cluster of clusters) {
              console.log(`Processing ${cluster} cluster: ${cluster}`);

              // Handle new    mobile user addition (same as PHP logic)
              if (
                  applicantDetails.mobile_user == "Yes" &&
                  applicantDetails.previous_mobile_user == "No" &&
                  cluster == "SIPZON.MOBI"
              ) {
                  // Add new mobile cluster items
                  updateProgress(
                      "addMobileLine",
                      "in_progress",
                      `Adding line for ${cluster} cluster...`,
                  );
                  if (!isStepCompleted(`add_line_${cluster}`)) {
                      try {
                          const lineParams = {
                              ClusterName: cluster,
                              extensionNumber:
                                  applicantDetails.extensionNumber?.toString() ||
                                  "",
                              client_transactionid:
                                  applicantDetails.client_transactionid,
                              shareLineAppearanceCssName:
                                  applicantDetails.shareLineAppearanceCssName,
                              displayName: applicantDetails.displayName,
                              userId: applicantDetails.userId,
                              company_id: applicantDetails.company_id,
                              update_user: true,
                              verify: applicantDetails.verify,
                          };
                          await addLine(lineParams);
                          console.log(
                              `Line added successfully for ${cluster} cluster`,
                          );
                          updateProgress(
                              "addMobileLine",
                              "completed",
                              `Line added for ${cluster} cluster`,
                          );
                      } catch (error) {
                          applicantDetails.verify = false;
                          Swal.fire({
                              title: "Creation Failed",
                              text: `Failed to add line for ${cluster} cluster. Please check the form and try again.`,
                              icon: "error",
                          });
                          toast.error(`Failed to add line for ${cluster} cluster. Please check the form and try again.`);
                          throw error;
                          console.error(
                              `Failed to add line for ${cluster} cluster:`,
                              error,
                          );
                          updateProgress(
                              "addMobileLine",
                              "failed",
                              `Failed to add line for ${cluster} cluster`,
                          );
                          throw error;
                      }
                  }
                  updateProgress(
                      "addMobilePhone",
                      "in_progress",
                      `Adding phone for ${cluster} cluster...`,
                  );
                  if (!isStepCompleted(`add_phone_${cluster}`)) {
                      try {
                          const phoneParams = {
                              ClusterName: cluster,
                              extensionNumber:
                                  applicantDetails.extensionNumber?.toString() ||
                                  "",
                              client_transactionid:
                                  applicantDetails.client_transactionid,
                              device_type: applicantDetails.device_type,
                              displayName: applicantDetails.displayName,
                              userId: applicantDetails.userId,
                              company_id: applicantDetails.company_id,
                              update_user: true,
                              verify: applicantDetails.verify,
                          };
                          await addPhone(phoneParams);
                          console.log(
                              `Phone added successfully for ${cluster} cluster`,
                          );
                          updateProgress(
                              "addMobilePhone",
                              "completed",
                              `Phone added for ${cluster} cluster`,
                          );
                      } catch (error) {
                          applicantDetails.verify = false;
                          Swal.fire({
                              title: "Creation Failed",
                              text: `Failed to add phone for ${cluster} cluster. Please check the form and try again.`,
                              icon: "error",
                          });
                          toast.error(`Failed to add phone for ${cluster} cluster. Please check the form and try again.`);
                          throw error;
                          console.error(
                              `Failed to add phone for ${cluster} cluster:`,
                              error,
                          );
                          updateProgress(
                              "addMobilePhone",
                              "failed",
                              `Failed to add phone for ${cluster} cluster`,
                          );
                          throw error;
                      }
                  }
                  updateProgress(
                      "updateMobileAppUser",
                      "in_progress",
                      `Updating app user for ${cluster} cluster...`,
                  );
                  if (
                      errorDetailsList?.sync_user_steps?.find((step: any) => step[`update_app_user_${cluster}`] != undefined)
                  ?.[`update_app_user_${cluster}`] != true)
                  
                    
                   {
                      try {
                          const appUserParams = {
                              ClusterName: cluster,
                              client_transactionid:
                                  applicantDetails.client_transactionid,
                              userId: applicantDetails.userId,
                              extensionNumber:
                                  applicantDetails.extensionNumber?.toString() ||
                                  "",
                              device_type: applicantDetails.device_type,
                              company_id: applicantDetails.company_id,
                              update_user: true,
                              verify: applicantDetails.verify,
                          };
                          await updateAppUser(appUserParams);
                          console.log(
                              `App user updated successfully for ${cluster} cluster`,
                          );
                          updateProgress(
                              "updateMobileAppUser",
                              "completed",
                              `App user updated for ${cluster} cluster`,
                          );
                      } catch (error) {
                          applicantDetails.verify = false;
                          Swal.fire({
                              title: "Creation Failed",
                              text: `Failed to update app user for ${cluster} cluster. Please check the form and try again.`,
                              icon: "error",
                          });
                          toast.error(`Failed to update app user for ${cluster} cluster. Please check the form and try again.`);
                          throw error;
                          console.error(
                              `Failed to update app user for ${cluster} cluster:`,
                              error,
                          );
                          updateProgress(
                              "updateMobileAppUser",
                              "failed",
                              `Failed to update app user for ${cluster} cluster`,
                          );
                      }
                  }
                  updateProgress(
                      "updateMobileUser",
                      "in_progress",
                      `Updating user for ${cluster} cluster...`,
                  );
                  if (
                          errorDetailsList?.sync_user_steps?.find((step: any) => step[`update_user_${cluster}`] != undefined)
                  ?.[`update_user_${cluster}`] != true


                  
                  ) {
                      try {
                          const userParams = {
                              ClusterName: cluster,
                              userId: applicantDetails.userId,
                              client_transactionid:
                                  applicantDetails.client_transactionid,
                              extensionNumber:
                                  applicantDetails.extensionNumber?.toString() ||
                                  "",
                              device_type: applicantDetails.device_type,
                              company_id: applicantDetails.company_id,
                              update_user: true,
                              verify: applicantDetails.verify,
                          };
                          await updateUser(userParams);
                          console.log(
                              `User updated successfully for ${cluster} cluster`,
                          );
                          updateProgress(
                              "updateMobileUser",
                              "completed",
                              `User updated for ${cluster} cluster`,
                          );
                      } catch (error) {
                          applicantDetails.verify = false;
                          Swal.fire({
                              title: "Creation Failed",
                              text: `Failed to update user for ${cluster} cluster. Please check the form and try again.`,
                              icon: "error",
                          });
                          throw error;
                          console.error(
                              `Failed to update user for ${cluster} cluster:`,
                              error,
                          );
                          updateProgress(
                              "updateMobileUser",
                              "failed",
                              `Failed to update user for ${cluster} cluster`,
                          );
                      }
                  }
                  // Add remote destination profile and destination (same as PHP)
                  updateProgress(
                      "addRemoteDestinationProfile",
                      "in_progress",
                      "Adding remote destination profile...",
                  );
                  if (
                      errorDetailsList?.sync_user_steps?.find((step: any) => step[`add_remote_destination_profile_${cluster}`] != undefined)
                  ?.[`add_remote_destination_profile_${cluster}`] != true

                     
                  ) {
                      try {
                          const remoteProfileParams = {
                              ClusterName:
                                  "SIPZON",
                              userId: applicantDetails.userId,
                              shareLineAppearanceCssName:
                                  applicantDetails.shareLineAppearanceCssName,
                              extensionNumber:
                                  applicantDetails.extensionNumber?.toString() ||
                                  "",
                              client_transactionid:
                                  applicantDetails.client_transactionid,
                              company_id: applicantDetails.company_id,
                              update_user: true,
                              verify: applicantDetails.verify,
                          };
                          await addRemoteDestinationProfile(
                              remoteProfileParams,
                          );
                          console.log(
                              "Remote destination profile added successfully",
                          );
                          updateProgress(
                              "addRemoteDestinationProfile",
                              "completed",
                              "Remote destination profile added",
                          );
                      } catch (error) {
                          applicantDetails.verify = false;
                          Swal.fire({
                              title: "Creation Failed",
                              text: "Failed to add remote destination profile. Please check the form and try again.",
                              icon: "error",
                          });
                          toast.error("Failed to add remote destination profile. Please check the form and try again.");
                          throw error;
                          console.error(
                              "Failed to add remote destination profile:",
                              error,
                          );
                          updateProgress(
                              "addRemoteDestinationProfile",
                              "failed",
                              "Failed to add remote destination profile",
                          );
                          throw error;
                      }
                  }
                  updateProgress(
                      "addRemoteDestination",
                      "in_progress",
                      "Adding remote destination...",
                  );
                  if (
                      errorDetailsList?.sync_user_steps?.find((step: any) => step[`add_remote_destination_${cluster}`] != undefined) 
                      ?.[`add_remote_destination_${cluster}`] != true   

                  ) {
                      try {
                          const remoteDestParams = {
                              ClusterName:
                                  "SIPZON",
                              extensionNumber:
                                  applicantDetails.extensionNumber?.toString() ||
                                  "",
                              displayName: applicantDetails.displayName,
                              userId: applicantDetails.userId,
                              client_transactionid:
                                  applicantDetails.client_transactionid,
                              company_id: applicantDetails.company_id,
                              update_user: true,
                              verify: applicantDetails.verify,
                          };
                          await addRemoteDestination(remoteDestParams);
                          console.log(
                              "Remote destination added successfully",
                          );
                          updateProgress(
                              "addRemoteDestination",
                              "completed",
                              "Remote destination added",
                          );
                      } catch (error) {
                          applicantDetails.verify = false;
                          Swal.fire({
                              title: "Creation Failed",
                              text: "Failed to add remote destination. Please check the form and try again.",
                              icon: "error",
                          });
                          toast.error("Failed to add remote destination. Please check the form and try again.");
                          throw error;
                              console.error(
                              "Failed to add remote destination:",
                              error,
                          );
                          updateProgress(
                              "addRemoteDestination",
                              "failed",
                              "Failed to add remote destination",
                          );
                          throw error;
                      }
                  }
              } else {
                  // Update existing items (same as PHP logic)
                  updateProgress(
                      "updateLine",
                      "in_progress",
                      `Updating line for ${cluster} cluster...`,
                  );
                  if (
                          errorDetailsList?.sync_user_steps?.find((step: any) => step[`update_line_${cluster}`] != undefined)
                  ?.[`update_line_${cluster}`] != true

                  ) {
                      try {
                          const lineParams = {
                              ClusterName: cluster,
                              client_transactionid:
                                  applicantDetails.client_transactionid,
                              displayName: applicantDetails.displayName,
                              extensionNumber:
                                  applicantDetails.extensionNumber?.toString() ||
                                  "",
                              shareLineAppearanceCssName:
                                  applicantDetails.shareLineAppearanceCssName,
                              userId: applicantDetails.userId,
                              company_id: applicantDetails.company_id,
                              update_user: true,
                              verify: applicantDetails.verify,
                          };
                          await updateLine(lineParams);
                          console.log(
                              `Line updated successfully for ${cluster} cluster`,
                          );
                          updateProgress(
                              "updateLine",
                              "completed",
                              `Line updated for ${cluster} cluster`,
                          );
                      } catch (error) {
                          applicantDetails.verify = false;
                          Swal.fire({
                              title: "Creation Failed",
                              text: `Failed to update line for ${cluster} cluster. Please check the form and try again.`,
                              icon: "error",
                          });
                          toast.error(`Failed to update line for ${cluster} cluster. Please check the form and try again.`);
                          throw error;
                          console.error(
                              `Failed to update line for ${cluster} cluster:`,
                              error,
                          );
                          updateProgress(
                              "updateLine",
                              "failed",
                              `Failed to update line for ${cluster} cluster`,
                          );
                          throw error;
                      }
                  }
                  // Handle device type changes for mobile cluster (same as PHP logic)
                  if (
                      cluster == "SIPZON.MOBI" &&
                      applicantDetails.device_type !=
                          applicantDetails.previous_device_type &&
                      ["TCT", "BOT"].includes(
                          applicantDetails.device_type,
                      )
                  ) {
                      updateProgress(
                          "addNewPhone",
                          "in_progress",
                          `Adding new phone for ${cluster} cluster...`,
                      );
                      if (
                          errorDetailsList?.sync_user_steps?.find((step: any) => step[`add_new_phone_${cluster}`] != undefined)
                      ?.[`add_new_phone_${cluster}`] != true

                      ) {
                          try {
                              const phoneParams = {
                                  ClusterName: cluster,
                                  userId: applicantDetails.userId,
                                  extensionNumber:
                                      applicantDetails.extensionNumber?.toString() ||
                                      "",
                                  client_transactionid:
                                      applicantDetails.client_transactionid,
                                  displayName: applicantDetails.displayName,
                                  device_type: applicantDetails.device_type,
                                  company_id: applicantDetails.company_id,
                                  update_user: true,
                                  user_id: applicantDetails.user_id,
                                  verify: applicantDetails.verify,
                              };
                              await addPhone(phoneParams);
                              console.log(
                                  `New phone added successfully for ${cluster} cluster`,
                              );
                              updateProgress(
                                  "addNewPhone",
                                  "completed",
                                  `New phone added for ${cluster} cluster`,
                              );
                          } catch (error) {
                              applicantDetails.verify = false;
                              Swal.fire({
                                  title: "Creation Failed",
                                  text: `Failed to add new phone for ${cluster} cluster. Please check the form and try again.`,
                                  icon: "error",
                              });
                              toast.error(`Failed to add new phone for ${cluster} cluster. Please check the form and try again.`);
                              throw error;
                              console.error(
                                  `Failed to add new phone for ${cluster} cluster:`,
                                  error,
                              );
                              updateProgress(
                                  "addNewPhone",
                                  "failed",
                                  `Failed to add new phone for ${cluster} cluster`,
                              );
                              throw error;
                          }
                      }
                      updateProgress(
                          "updateUserDevices",
                          "in_progress",
                          `Updating user devices for ${cluster} cluster...`,
                      );
                      if (
                          errorDetailsList?.sync_user_steps?.find((step: any) => step[`update_user_devices_${cluster}`] != undefined)
                      ?.[`update_user_devices_${cluster}`] != true


                      ) {
                          try {
                              const userParams = {
                                  ClusterName: cluster,
                                  userId: applicantDetails.userId,
                                  client_transactionid:
                                      applicantDetails.client_transactionid,
                                  associatedDevices:
                                      applicantDetails.associatedDevices,
                                  extensionNumber:
                                      applicantDetails.extensionNumber?.toString() ||
                                      "",
                                  device_type: applicantDetails.device_type,
                                  company_id: applicantDetails.company_id,
                                  update_user: true,
                                  user_id: applicantDetails.user_id,
                                  verify: applicantDetails.verify,
                              };
                              await updateUser(userParams);
                              console.log(
                                  `User devices updated successfully for ${cluster} cluster`,
                              );
                              updateProgress(
                                  "updateUserDevices",
                                  "completed",
                                  `User devices updated for ${cluster} cluster`,
                              );
                          } catch (error) {
                              applicantDetails.verify = false;
                              Swal.fire({
                                  title: "Creation Failed",
                                  text: `Failed to update user devices for ${cluster} cluster. Please check the form and try again.`,
                                  icon: "error",
                              });
                              toast.error(`Failed to update user devices for ${cluster} cluster. Please check the form and try again.`);
                              throw error;
                              console.error(
                                  `Failed to update user devices for ${cluster} cluster:`,
                                  error,
                              );
                              updateProgress(
                                  "updateUserDevices",
                                  "failed",
                                  `Failed to update user devices for ${cluster} cluster`,
                              );
                              throw error;
                          }
                      }
                      updateProgress(
                          "updateAppUser",
                          "in_progress",
                          `Updating App User for ${cluster} cluster...`,
                      );
                      if (
                          errorDetailsList?.sync_user_steps?.find((step: any) => step[`update_app_user_${cluster}`] != undefined)
                      ?.[`update_app_user_${cluster}`] != true


                      
                      ) {
                          const appUserParams = {
                              ClusterName: cluster,
                              client_transactionid:
                                  applicantDetails.client_transactionid,
                              userId: applicantDetails.userId,
                              extensionNumber:
                                  applicantDetails.extensionNumber?.toString() ||
                                  "",
                              company_id: applicantDetails.company_id,
                              device_type: applicantDetails.device_type,
                              verify: applicantDetails.verify,
                              update_user: applicantDetails.update_user,
                              user_id: applicantDetails.user_id,
                          };

                          // Actual API call for updateAppUser (same as PHP)
                          try {
                              await updateAppUser(appUserParams);
                              console.log(
                                  `App User updated successfully for ${cluster} cluster`,
                              );
                          } catch (error) {
                              applicantDetails.verify = false;
                              Swal.fire({
                                  title: "Creation Failed",
                                  text: `Failed to update app user for ${cluster} cluster. Please check the form and try again.`,
                                  icon: "error",
                              });
                              toast.error(`Failed to update app user for ${cluster} cluster. Please check the form and try again.`);
                              throw error;
                              console.error(
                                  `Failed to update app user for ${cluster} cluster:`,
                                  error,
                              );
                              updateProgress(
                                  "updateAppUser",
                                  "failed",
                                  `Failed to update app user for ${cluster} cluster`,
                              );
                              throw error;
                          }
                      }
                  } else {
                      updateProgress(
                          "updatePhone",
                          "in_progress",
                          `Updating phone for ${cluster} cluster...`,
                      );
                      if (
                          errorDetailsList?.sync_user_steps?.find((step: any) => step[`update_phone_${cluster}`] != undefined)
                      ?.[`update_phone_${cluster}`] != true


                      
                      ) { 
                          try {
                              const phoneParams = {
                                  ClusterName: cluster,
                                  client_transactionid:
                                      applicantDetails.client_transactionid,
                                  displayName: applicantDetails.displayName,
                                  extensionNumber:
                                      applicantDetails.extensionNumber?.toString() ||
                                      "",
                                  shareLineAppearanceCssName:
                                      applicantDetails.shareLineAppearanceCssName,
                                  userId: applicantDetails.userId,
                                  company_id: applicantDetails.company_id,
                                  device_type: applicantDetails.device_type,
                                  update_user: true,
                                  verify: applicantDetails.verify,
                              };
                              await updatePhone(phoneParams);
                              console.log(
                                  `Phone updated successfully for ${cluster} cluster`,
                              );
                              updateProgress(
                                  "updatePhone",
                                  "completed",
                                  `Phone updated for ${cluster} cluster`,
                              );
                          } catch (error) {
                              applicantDetails.verify = false;
                              Swal.fire({
                                  title: "Creation Failed",
                                  text: `Failed to update phone for ${cluster} cluster. Please check the form and try again.`,
                                  icon: "error",
                              });
                              toast.error(`Failed to update phone for ${cluster} cluster. Please check the form and try again.`);
                              throw error;
                              console.error(
                                  `Failed to update phone for ${cluster} cluster:`,
                                  error,
                              );
                              updateProgress(
                                  "updatePhone",
                                  "failed",
                                  `Failed to update phone for ${cluster} cluster`,
                              );
                              throw error;
                          }
                      }
                  }
              }
          }
          updateProgress(
              "updateDNCR",
              "in_progress",
              "Updating DNCR Settings...",
          );
          // Step 4: Update DNCR Settings
          if (
              applicantDetails.allow_dncr === 1 ||
              applicantDetails.call_repetition
          ) {
              if (
                  errorDetailsList?.sync_user_steps?.find((step: any) => step[`update_dncr`] != undefined)
              ?.[`update_dncr`] != true


              
              ) {
                  try {
                      const dncrParams = {
                          company_id: applicantDetails.company_id,

                          UserID: applicantDetails.userId?.toString() || "",

                          TelephoneNumber:
                              applicantDetails.extensionNumber?.toString() ||
                              "",
                          Company: applicantDetails.companyName || "",
                          Department: applicantDetails.department || "",
                          AllowLocalDNCLCalls: "True",
                          AllowApiDNCLCalls: "True",

                          ...(applicantDetails.call_repetition ===
                              "individual" && {
                              IndividualRepetitiveCallsAllowDaily:
                                  applicantDetails.call_repetition_daily,
                              IndividualRepetitiveCallsAllowWeekly:
                                  applicantDetails.call_repetition_weekly,
                              AllowRepetitiveCalls: "True",
                          }),
                          ...(applicantDetails.call_repetition ===
                              "company" && {
                              CompanyRepetitiveCallsAllowDaily:
                                  applicantDetails.call_repetition_daily,
                              CompanyRepetitiveCallsAllowWeekly:
                                  applicantDetails.call_repetition_weekly,
                              CallRepFollowCompSettings: "True",
                              AllowRepetitiveCalls: "True",
                          }),
                          client_transactionid:
                              applicantDetails.client_transactionid || "",
                          verify: applicantDetails.verify,
                          update_user: true,
                      };

                      await updateDNCR(dncrParams);

                      updateProgress(
                          "updateDNCR",
                          "completed",
                          "DNCR Settings updated",
                      );
                  } catch (error) {
                      applicantDetails.verify = false;
                      Swal.fire({
                          title: "Creation Failed",
                          text: "Failed to update DNCR settings. Please check the form and try again.",
                          icon: "error",
                      });
                      toast.error("Failed to update DNCR settings. Please check the form and try again.");
                      throw error;
                      console.error("Failed to update DNCR settings:", error);
                      updateProgress(
                          "updateDNCR",
                          "failed",
                          "Failed to update DNCR settings",
                      );
                      throw error;
                  }
              }
          }
          try {
              await updateUserInfo({
                  ...applicantDetails,
                  client_transactionid:
                      applicantDetails.client_transactionid || "",
                  verify: applicantDetails.verify,
                  user_id: applicantDetails.user_id || 0,
                  userId: applicantDetails.userId?.toString() || "",
                  company_id: applicantDetails.company_id,
                  update_user: true,
                  self_app: true,
              });
          } catch (error) {
              applicantDetails.verify = false;
              Swal.fire({
                  title: "Creation Failed",
                  text: "Failed to update user. Please check the form and try again.",
                  icon: "error",
              });
              toast.error("Failed to update user. Please check the form and try again.");
              throw error;
              console.error("User update failed:", error);
              toast.error("Update failed. Please try again.");
              stopProcessing();
              return;
          }

          try {
              await updateUserProfilingErrorLog({
                  id: applicantDetails.id,
                  status: UserProfilingErrorLogStatus.PROCESSED,
              });

              updateProgress(
                  "updateErrorLog",
                  "completed",
                  "Error log status updated",
              );
          } catch (error) {
              console.error("Failed to update error log status:", error);
              updateProgress(
                  "updateErrorLog",
                  "failed",
                  "Failed to update error log status",
              );
          }
      } else {
          // CREATE MODE - Same order as CreateUserProfile.tsx create logic

          applicantDetails.verify = true;
          // Step 2: Create Local User (database user)
          updateProgress(
              "createLocalUser",
              "in_progress",
              "Creating Local User...",
          );
          if (
              errorDetailsList?.sync_user_steps?.find((step: any) => step[`create_local_user`] != undefined)
          ?.[`create_local_user`] != true


          
          ) {
              try {
                  const syncPBXParams = {
                      client_transactionid:
                          applicantDetails.client_transactionid || "",
                      userId: applicantDetails.userId?.toString() || "",
                      displayName: applicantDetails.displayName || "",
                      password: applicantDetails.password || "",
                      firstName: applicantDetails.firstName || "",
                      lastName: applicantDetails.lastName || "",
                      company_id: applicantDetails.company_id,
                      user_id: applicantDetails?.userId,
                      verify: applicantDetails.verify,
                      update_user: false,
                  };

                  // Sync with both clusters
                  for (const cluster of [
                      "SIPZON",
                      "SIPZON.MOBI",
                  ]) {
                      await syncPBX({
                          ...syncPBXParams,
                          ClusterName: cluster,
                      });
                  }

                  updateProgress(
                      "createLocalUser",
                      "completed",
                      "Local User created successfully",
                  );
              } catch (error) {
                  applicantDetails.verify = false;
                  Swal.fire({
                      title: "Creation Failed",
                      text: "Failed to create local user. Please check the form and try again.",
                      icon: "error",
                  });
                  toast.error("Failed to create local user. Please check the form and try again.");
                  throw error;
                      console.error("Failed to create Local User:", error);
                  updateProgress(
                      "createLocalUser",
                      "failed",
                      "Failed to create Local User",
                  );
              }
          }
          // Step 3: Run LDAP Sync
          updateProgress(
              "runLdapSync",
              "in_progress",
              "Running LDAP Sync...",
          );
          if (errorDetailsList?.sync_user_steps?.find((step: any) => step[`run_ldap_sync`] != undefined)
          ?.[`run_ldap_sync`] != true


          
          ) {
              try {
                  await runLdapSync({
                      client_transactionid:
                          applicantDetails.client_transactionid || "",
                      company_id: applicantDetails.company_id,
                      user_id: applicantDetails.id,
                      update_user: false,
                      verify: applicantDetails.verify,
                  });

                  updateProgress(
                      "runLdapSync",
                      "completed",
                      "LDAP Sync completed",
                  );
              } catch (error) {
                  applicantDetails.verify = false;
                  Swal.fire({
                      title: "Creation Failed",
                      text: "Failed to run LDAP sync. Please check the form and try again.",
                      icon: "error",
                  });
                  toast.error("Failed to run LDAP sync. Please check the form and try again.");
                  throw error;
                  console.error("Failed to run LDAP Sync:", error);
                  updateProgress(
                      "runLdapSync",
                      "failed",
                      "Failed to run LDAP Sync",
                  );
              }
          }
          // Step 4-7: Process each cluster
          const clusters =
              applicantDetails.mobile_user === "Yes"
                  ? [
                        "SIPZON",
                        "SIPZON.MOBI",
                    ]
                  : ["SIPZON"];

          for (const cluster of clusters) {
              // Step 4: Add Line for this cluster
              updateProgress(
                  "addLine",
                  "in_progress",
                  `Adding Line for ${cluster} cluster...`,
              );
              if (
                  errorDetailsList?.sync_user_steps?.find((step: any) => step[`add_line_${cluster}`] != undefined)
              ?.[`add_line_${cluster}`] != true


                  
              ) {
                  try {
                      const lineParams = {
                          ClusterName: cluster,
                          extensionNumber:
                              applicantDetails.extensionNumber?.toString() ||
                              "",
                          displayName: applicantDetails.displayName || "",
                          client_transactionid:
                              applicantDetails.client_transactionid || "",
                          shareLineAppearanceCssName:
                              applicantDetails.shareLineAppearanceCssName ||
                              "",
                          company_id: applicantDetails.company_id,
                          userId: applicantDetails.userId?.toString() || "",
                          verify: applicantDetails.verify,
                          update_user: false,
                      };

                      await addLine(lineParams);
                      updateProgress(
                          "addLine",
                          "completed",
                          `Line added for ${cluster} cluster`,
                      );
                  } catch (error) {
                      applicantDetails.verify = false;
                      Swal.fire({
                          title: "Creation Failed",
                          text: `Failed to add line for ${cluster} cluster. Please check the form and try again.`,
                          icon: "error",
                      });
                      toast.error(`Failed to add line for ${cluster} cluster. Please check the form and try again.`);
                      throw error;
                      console.error(
                          `Failed to add line for ${cluster} cluster:`,
                          error,
                      );
                      updateProgress(
                          "addLine",
                          "failed",
                          `Failed to add line for ${cluster} cluster`,
                      );
                      throw error;
                  }
              }
              // Step 5: Add Phone for this cluster
              updateProgress(
                  "addPhone",
                  "in_progress",
                  `Adding Phone for ${cluster} cluster...`,
              );
              if (
                  errorDetailsList?.sync_user_steps?.find((step: any) => step[`add_phone_${cluster}`] != undefined)
              ?.[`add_phone_${cluster}`] != true  ) {
                  try {
                      const deviceType =
                          cluster === "SIPZON.MOBI"
                              ? applicantDetails.device_type || "TCT"
                              : "TCT";

                      const phoneParams = {
                          ClusterName: cluster,
                          displayName: applicantDetails.displayName || "",
                          client_transactionid:
                              applicantDetails.client_transactionid || "",
                          userId: applicantDetails.userId?.toString() || "",
                          extensionNumber:
                              applicantDetails.extensionNumber?.toString() ||
                              "",
                          company_id: applicantDetails.company_id,
                          device_type: deviceType,
                          verify: applicantDetails.verify,
                          update_user: false,
                      };

                      await addPhone(phoneParams);
                      updateProgress(
                          "addPhone",
                          "completed",
                          `Phone added for ${cluster} cluster`,
                      );
                  } catch (error) {
                      applicantDetails.verify = false;
                      Swal.fire({
                          title: "Creation Failed",
                          text: `Failed to add phone for ${cluster} cluster. Please check the form and try again.`,
                          icon: "error",
                      });
                      toast.error(`Failed to add phone for ${cluster} cluster. Please check the form and try again.`);
                      throw error;
                      console.error(
                          `Failed to add phone for ${cluster} cluster:`,
                          error,
                      );
                      updateProgress(
                          "addPhone",
                          "failed",
                          `Failed to add phone for ${cluster} cluster`,
                      );
                  }
              }
              // Step 6: Update App User for this cluster
              updateProgress(
                  "updateAppUser",
                  "in_progress",
                  `Updating App User for ${cluster} cluster...`,
              );
              if (
                  errorDetailsList?.sync_user_steps?.find((step: any) => step[`update_app_user_${cluster}`] != undefined)
              ?.[`update_app_user_${cluster}`] != true  
              )  {
                  try {
                      const appUserParams = {
                          ClusterName: cluster,
                          client_transactionid:
                              applicantDetails.client_transactionid || "",
                          userId: applicantDetails.userId?.toString() || "",
                          extensionNumber:
                              applicantDetails.extensionNumber?.toString() ||
                              "",
                          company_id: applicantDetails.company_id,
                          device_type: applicantDetails.device_type,
                          verify: applicantDetails.verify,
                          update_user: false,
                      };

                      await updateAppUser(appUserParams);
                      updateProgress(
                          "updateAppUser",
                          "completed",
                          `App User updated for ${cluster} cluster`,
                      );
                  } catch (error) {
                      applicantDetails.verify = false;
                      Swal.fire({
                          title: "Creation Failed",
                          text: `Failed to update app user for ${cluster} cluster. Please check the form and try again.`,
                          icon: "error",
                      });
                      toast.error(`Failed to update app user for ${cluster} cluster. Please check the form and try again.`);
                      throw error;
                      console.error(
                          `Failed to update app user for ${cluster} cluster:`,
                          error,
                      );
                      updateProgress(
                          "updateAppUser",
                          "failed",
                          `Failed to update app user for ${cluster} cluster`,
                      );
                  }
              }
              // Step 7: Update User for this cluster
              updateProgress(
                  "updateUser",
                  "in_progress",
                  `Updating User for ${cluster} cluster...`,
              );
              if (
                  errorDetailsList?.sync_user_steps?.find((step: any) => step[`update_user_${cluster}`] != undefined)
              ?.[`update_user_${cluster}`] != true


                  
              ) {
          
                  
              try {
                      const userParams = {
                          ClusterName: cluster,
                          userId: applicantDetails.userId?.toString() || "",
                          client_transactionid:
                              applicantDetails.client_transactionid || "",
                          extensionNumber:
                              applicantDetails.extensionNumber?.toString() ||
                              "",
                          company_id: applicantDetails.company_id,
                          device_type: applicantDetails.device_type,
                          verify: applicantDetails.verify,
                          update_user: false,
                      };

                      await updateUser(userParams);
                      updateProgress(
                          "updateUser",
                          "completed",
                          `User updated for ${cluster} cluster`,
                      );
                  } catch (error) {
                      applicantDetails.verify = false;
                      Swal.fire({
                          title: "Creation Failed",
                          text: `Failed to update user for ${cluster} cluster. Please check the form and try again.`,
                          icon: "error",
                      });
                      toast.error(`Failed to update user for ${cluster} cluster. Please check the form and try again.`);
                      throw error;
                          console.error(
                          `Failed to update user for ${cluster} cluster:`,
                          error,
                      );
                      updateProgress(
                          "updateUser",
                          "failed",
                          `Failed to update user for ${cluster} cluster`,
                      );
                  }
              }
          }
          // Step 8: Add Remote Destination Profile (conditional for mobile users)
          if (applicantDetails.mobile_user === "Yes") {
              updateProgress(
                  "addRemoteDestinationProfile",
                  "in_progress",
                  "Adding Remote Destination Profile...",
              );
              if (
                  errorDetailsList?.sync_user_steps?.find((step: any) => step[`add_remote_destination_profile_SIPZON`] != undefined)
              ?.[`add_remote_destination_profile_SIPZON`] != true
              ) {
                  try {   
                      const remoteProfileParams = {
                          ClusterName:
                              "SIPZON",
                          description: `Remote profile for ${applicantDetails.displayName}`,
                          userId: applicantDetails.userId?.toString() || "",
                          client_transactionid:
                              applicantDetails.client_transactionid || "",
                          extensionNumber:
                              applicantDetails.extensionNumber?.toString() ||
                              "",
                          displayName: applicantDetails.displayName || "",
                          shareLineAppearanceCssName:
                              applicantDetails.shareLineAppearanceCssName ||
                              "",
                          company_id: applicantDetails.company_id,
                          verify: applicantDetails.verify,
                          update_user: false,
                      };

                      await addRemoteDestinationProfile(remoteProfileParams);
                      updateProgress(
                          "addRemoteDestinationProfile",
                          "completed",
                          "Remote Destination Profile added",
                      );
                  } catch (error) {
                      applicantDetails.verify = false;
                      Swal.fire({
                          title: "Creation Failed",
                          text: "Failed to add remote destination profile. Please check the form and try again.",
                          icon: "error",
                      });
                      toast.error("Failed to add remote destination profile. Please check the form and try again.");
                      throw error;
                      console.error(
                          "Failed to add remote destination profile:",
                          error,
                      );
                      updateProgress(
                          "addRemoteDestinationProfile",
                          "failed",
                          "Failed to add remote destination profile",
                      );
                  }
              }
              // Step 9: Add Remote Destination
              updateProgress(
                  "addRemoteDestination",
                  "in_progress",
                  "Adding Remote Destination...",
              );
              if (
                  errorDetailsList?.sync_user_steps?.find((step: any) => step[`add_remote_destination_SIPZON`] != undefined)
              ?.[`add_remote_destination_SIPZON`] != true
              ) {
                  try {
                      const remoteDestParams = {
                          ClusterName:
                              "SIPZON",
                          userId: applicantDetails.userId?.toString() || "",
                          extensionNumber:
                              applicantDetails.extensionNumber?.toString() ||
                              "",
                          displayName: applicantDetails.displayName || "",
                          client_transactionid:
                              applicantDetails.client_transactionid || "",
                          company_id: applicantDetails.company_id,
                          verify: applicantDetails.verify,
                          update_user: false,
                      };

                      await addRemoteDestination(remoteDestParams);
                      updateProgress(
                          "addRemoteDestination",
                          "completed",
                          "Remote Destination added",
                      );
                  } catch (error) {
                      applicantDetails.verify = false;
                      Swal.fire({
                          title: "Creation Failed",
                          text: "Failed to add remote destination. Please check the form and try again.",
                          icon: "error",
                      });
                      toast.error("Failed to add remote destination. Please check the form and try again.");
                      throw error;
                    
                      console.error(
                          "Failed to add remote destination:",
                          error,
                      );
                      updateProgress(
                          "addRemoteDestination",
                          "failed",
                          "Failed to add remote destination",
                      );
                  }
              }
          }
          // Step 10: Update DNCR Settings (conditional)
          if (
              applicantDetails.allow_dncr === 1 ||
              applicantDetails.call_repetition
          ) {
              updateProgress(
                  "updateDNCR",
                  "in_progress",
                  "Updating DNCR Settings...",
              );
              if (
                  errorDetailsList?.sync_user_steps?.find((step: any) => step[`update_dncr`] != undefined)
              ?.[`update_dncr`] != true
              ) {
                  try {
                      const dncrParams = {
                          company_id: applicantDetails.company_id,
                          telePhoneNumber:
                              applicantDetails.extensionNumber?.toString() ||
                              "",         
                          UserID: applicantDetails.userId?.toString() || "",
                          TelephoneNumber:
                              applicantDetails.extensionNumber?.toString() ||
                              "",
                          Company: applicantDetails.companyName || "",
                          Department: applicantDetails.department || "",
                          AllowLocalDNCLCalls: "True",
                          AllowApiDNCLCalls: "True",

                          ...(applicantDetails.call_repetition ===
                              "individual" && {
                              IndividualRepetitiveCallsAllowDaily:
                                  applicantDetails.call_repetition_daily,
                              IndividualRepetitiveCallsAllowWeekly:
                                  applicantDetails.call_repetition_weekly,
                              AllowRepetitiveCalls: "True",
                          }),
                          ...(applicantDetails.call_repetition ===
                              "company" && {
                              CompanyRepetitiveCallsAllowDaily:
                                  applicantDetails.call_repetition_daily,
                              CompanyRepetitiveCallsAllowWeekly:
                                  applicantDetails.call_repetition_weekly,
                              CallRepFollowCompSettings: "True",
                              AllowRepetitiveCalls: "True",
                          }),
                          client_transactionid:
                              applicantDetails.client_transactionid || "",
                          verify: applicantDetails.verify,
                          update_user: false,
                      };

                      await updateDNCR(dncrParams);
                      updateProgress(
                          "updateDNCR",
                          "completed",
                          "DNCR Settings updated",
                      );
                  } catch (error) {
                      applicantDetails.verify = false;
                      Swal.fire({
                          title: "Creation Failed",
                          text: "Failed to update DNCR settings. Please check the form and try again.",
                          icon: "error",
                      });
                      toast.error("Failed to update DNCR settings. Please check the form and try again.");
                      throw error;
                 
                  }
              }
          }

          addUserInfo({
              firstName: applicantDetails.firstName || "",
              lastName: applicantDetails.lastName || "",
              email: applicantDetails.email || "",
              displayName: applicantDetails.displayName || "",
              verify: applicantDetails.verify,
              update_user: false,
              userId: applicantDetails.userId?.toString() || "",
              company_id: applicantDetails.company_id,
              mobile_user: applicantDetails.mobile_user,
              device_type: applicantDetails.device_type || null,
              extensionNumber: applicantDetails.extensionNumber,
              client_transactionid:
                  applicantDetails.client_transactionid || "",
              iccid_number: applicantDetails.iccid_number || null,
              shareLineAppearanceCssName:
                  applicantDetails.shareLineAppearanceCssName || "",
              allow_dncr: applicantDetails.allow_dncr,
              call_repetition: applicantDetails.call_repetition,
              call_repetition_daily: applicantDetails.call_repetition_daily,
              call_repetition_weekly: applicantDetails.call_repetition_weekly,
              department: applicantDetails.department || "",
              jobTitle: applicantDetails.jobTitle || "",
              country: applicantDetails.country || "",
              companyName: applicantDetails.companyName || "",
              password: applicantDetails.password || "",
              allow_fac_info: applicantDetails.allow_fac_info,
              display: applicantDetails.displayName || null,
              allow_error: false,     
              self_app: true,
          });
          if (applicantDetails.verify) {
              try {
                  await updateUserProfilingErrorLog({
                      id: applicantDetails.id,
                      status: UserProfilingErrorLogStatus.PROCESSED,
                  });

                  updateProgress(
                      "updateErrorLog",
                      "completed",
                      "Error log status updated",
                  );
              } catch (error) {
                  console.error("Failed to update error log status:", error);
                  updateProgress(
                      "updateErrorLog",
                      "failed",
                      "Failed to update error log status",
                  );
              }
              // All steps completed successfully
          }
          resetProgress();
          toast.success("Request processed successfully");
          
          setApplicantDetails(null);
      }
  };














 
    


    return (
        <React.Fragment>
            
                <BreadcrumbItem
                    mainTitle="User Profile Error Details"
                    mainLink="/tms/profiling/logs"
                    subTitle="User Profile Error Details"
                />

                <Row className="mb-3">
                    <Col md={12}>
                        <div className="page-header-title">
                            <h2 className="mb-0 d-flex align-items-center">User Profile Error Details</h2>
                        </div>
                    </Col>
                </Row>

                <Row>
                    <Col md={12}>
{/* Verification Progress Bar */}
<Card className="mb-4">
                        <Card.Header className="bg-primary text-white">
                            <h6 className="mb-0">
                                <i className="ph-duotone ph-gear me-2"></i>
                                System Verification Progress
                            </h6>
                        </Card.Header>
                        <Card.Body>
                            <div className="mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="fw-bold">
                                        Overall Progress
                                    </span>
                                    <span className="text-primary fw-bold">
                                        {Math.round(progressPercentage)}%
                                    </span>
                                </div>
                                <ProgressBar
                                    now={progressPercentage}
                                    variant="primary"
                                    className="mb-3"
                                    style={{ height: "10px" }}
                                />
                            </div>

                            <div className="verification-flow-container">
                                {Object.keys(verificationProgress).length >
                                0 ? (
                                    Object.entries(verificationProgress).map(
                                        ([key, value], index) => {
                                            return (
                                                <div
                                                    key={key}
                                                    className="verification-flow-item"
                                                >
                                                    <div
                                                        className={`verification-item ${value ? "completed" : ""}`}
                                                    >
                                                        <i
                                                            className={`ph-duotone ${value ? "ph-check-circle text-success" : "ph-times-circle text-danger"}`}
                                                        ></i>
                                                        <span className="ms-2">
                                                            {key.replace(
                                                                "_",
                                                                " ",
                                                            )}
                                                        </span>
                                                    </div>
                                                    {value &&
                                                        index <
                                                            Object.keys(
                                                                verificationProgress,
                                                            ).length -
                                                                1 && (
                                                            <div className="flow-connector completed"></div>
                                                        )}
                                                </div>
                                            );
                                        },
                                    )
                                ) : (
                                    <div className="verification-flow-item">
                                        <div className="verification-item">
                                            <i className="ph-duotone ph-info-circle text-muted"></i>
                                            <span className="ms-2 text-muted">
                                                No verification data available
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                    
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12}>
                    {/* Step 1: Error Details */}

                    <Card>
                        <Card.Header className="bg-danger text-white">
                            <h5 className="mb-0 text-white">
                                <i className="ph-duotone ph-alert-circle me-2"></i>
                                Error Details
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            <table className="table table-striped table-bordered align-middle">
                                <thead className="table-dark">
                                    <tr>
                                        <th>User ID</th>
                                        <th>Error</th>
                                        <th>Cluster</th>
                                        <th>Execution Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(errorDetailsList?.caused_due_to || [])
                                        .length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="text-center text-muted"
                                            >
                                                No error details
                                            </td>
                                        </tr>
                                    ) : (
                                        (
                                            errorDetailsList?.caused_due_to ||
                                            []
                                        ).map((err: any, idx: any) => (
                                            <tr key={idx}>
                                                <td>{err.user_id}</td>
                                                <td
                                                    className="text-break"
                                                    style={{
                                                        maxWidth: "128px",
                                                        whiteSpace: "normal",
                                                        wordBreak: "break-word",
                                                        overflowWrap:
                                                            "break-word",
                                                    }}
                                                >
                                                    <span className="text-danger fw-bold">
                                                        {err.error}
                                                    </span>
                                                </td>
                                                <td>
                                                    {err.cluster ?? (
                                                        <span className="text-muted">
                                                            N/A
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {err.execution_time_ms &&
                                                    err.execution_time_ms > 0
                                                        ? `${Number(err.execution_time_ms / 1000).toFixed(2)} s`
                                                        : "N/A"}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </Card.Body>
                    </Card>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12}>
                    {/* Step 2: Error Summary */}

                    <Card>
                        <Card.Header className="bg-info text-white">
                            <h5 className="mb-0 text-white">
                                <i className="ph-duotone ph-info me-2"></i>
                                Error Summary
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="d-flex align-items-center mb-3">
                                <div>
                                    <h6 className="mb-1">Total Errors</h6>
                                    <span className="fs-5 fw-bold text-danger">
                                        {
                                            (
                                                errorDetailsList?.caused_due_to ||
                                                []
                                            ).length
                                        }
                                    </span>
                                </div>
                            </div>

                            <div className="alert alert-warning">
                                <i className="ph-duotone ph-info me-2"></i>
                                These errors occurred during user profiling
                                process. Please review and take necessary
                                actions.
                            </div>
                        </Card.Body>
                    </Card>
                    </Col>
                  </Row>


                  <Row>
                    <Col md={12}>
                    {/* Step 3: Applicant Information */}

                    <Card>
                        <Card.Header className="bg-primary text-white">
                            <h5 className="mb-0 text-white">
                                <i className="ph-duotone ph-user me-2"></i>
                                Applicant Information
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <div className="d-flex align-items-center p-3 bg-light rounded">
                                        <i className="ph-duotone ph-user-check text-primary me-3 fs-4"></i>
                                        <div>
                                            <small className="text-muted d-block">
                                                CSS Name
                                            </small>
                                            <strong>
                                                {applicantDetails?.shareLineAppearanceCssName ||
                                                    "N/A"}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="d-flex align-items-center p-3 bg-light rounded">
                                        <i className="ph-duotone ph-phone text-primary me-3 fs-4"></i>
                                        <div>
                                            <small className="text-muted d-block">
                                                Device Type
                                            </small>
                                            <strong>
                                                {applicantDetails?.device_type ||
                                                    "N/A"}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="d-flex align-items-center p-3 bg-light rounded">
                                        <i className="ph-duotone ph-user text-primary me-3 fs-4"></i>
                                        <div>
                                            <small className="text-muted d-block">
                                                Name
                                            </small>
                                            <strong>
                                                {applicantDetails?.displayName ||
                                                    "N/A"}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="d-flex align-items-center p-3 bg-light rounded">
                                        <i className="ph-duotone ph-phone text-primary me-3 fs-4"></i>
                                        <div>
                                            <small className="text-muted d-block">
                                                Extension
                                            </small>
                                            <strong>
                                                {applicantDetails?.extensionNumber ||
                                                    "N/A"}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="d-flex align-items-center p-3 bg-light rounded">
                                        <i className="ph-duotone ph-phone text-primary me-3 fs-4"></i>
                                        <div>
                                            <small className="text-muted d-block">
                                                Email
                                            </small>
                                            <strong>
                                                {applicantDetails?.email ||
                                                    "N/A"}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="d-flex align-items-center p-3 bg-light rounded">
                                        <i className="ph-duotone ph-phone text-primary me-3 fs-4"></i>
                                        <div>
                                            <small className="text-muted d-block">
                                                Mobile User
                                            </small>
                                            <strong>
                                                {applicantDetails?.mobile_user ||
                                                    "N/A"}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="d-flex align-items-center p-3 bg-light rounded">
                                        <i className="ph-duotone ph-hash text-primary me-3 fs-4"></i>
                                        <div>
                                            <small className="text-muted d-block">
                                                Transaction ID
                                            </small>
                                            <strong>
                                                {applicantDetails?.client_transactionid ||
                                                    "N/A"}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="d-flex align-items-center p-3 bg-light rounded">
                                        <i className="ph-duotone ph-hash text-primary me-3 fs-4"></i>
                                        <div>
                                            <small className="text-muted d-block">
                                                ICCID Number
                                            </small>
                                            <strong>
                                                {applicantDetails?.iccid_number ||
                                                    "N/A"}
                                            </strong>
                                        </div>
                                    </div>
                                </div>

                                {applicantDetails?.allow_dncr ==
                                    true && (
                                    <>
                                        <div className="col-12">
                                            <div className="d-flex align-items-center p-3 bg-light rounded">
                                                <i className="ph-duotone ph-check-circle text-primary me-3 fs-4"></i>
                                                <div>
                                                    <small className="text-muted d-block">
                                                        Allow DNCR
                                                    </small>
                                                    <strong>Yes</strong>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <div className="d-flex align-items-center p-3 bg-light rounded">
                                                <i className="ph-duotone ph-repeat text-primary me-3 fs-4"></i>
                                                <div>
                                                    <small className="text-muted d-block">
                                                        Call Repetition
                                                    </small>
                                                    <strong>
                                                        {applicantDetails?.call_repetition ||
                                                            "N/A"}
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <div className="d-flex align-items-center p-3 bg-light rounded">
                                                <i className="ph-duotone ph-repeat text-primary me-3 fs-4"></i>
                                                <div>
                                                    <small className="text-muted d-block">
                                                        Call Repetition Daily
                                                    </small>
                                                    <strong>
                                                        {applicantDetails?.call_repetition_daily ||
                                                            "N/A"}
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <div className="d-flex align-items-center p-3 bg-light rounded">
                                                <i className="ph-duotone ph-repeat text-primary me-3 fs-4"></i>
                                                <div>
                                                    <small className="text-muted d-block">
                                                        Call Repetition Weekly
                                                    </small>
                                                    <strong>
                                                        {applicantDetails?.call_repetition_weekly ||
                                                            "N/A"}
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {applicantDetails?.status !==
                                    "processed" && (
                                    <div className="col-12">
                                        {/* Progress View Toggle */}
                                        {incompleteSteps.length > 0 && (
                                            <div className="mb-3">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <h6 className="mb-0">
                                                        Progress Tracking
                                                    </h6>
                                                    <div
                                                        className="btn-group"
                                                        role="group"
                                                    >
                                                        <Button
                                                            variant={
                                                                progressViewMode ===
                                                                "vertical"
                                                                    ? "primary"
                                                                    : "outline-primary"
                                                            }
                                                            size="sm"
                                                            onClick={() =>
                                                                setProgressViewMode(
                                                                    "vertical",
                                                                )
                                                            }
                                                        >
                                                            <i className="ph-duotone ph-list me-1"></i>
                                                            Vertical
                                                        </Button>
                                                        <Button
                                                            variant={
                                                                progressViewMode ===
                                                                "horizontal"
                                                                    ? "primary"
                                                                    : "outline-primary"
                                                            }
                                                            size="sm"
                                                            onClick={() =>
                                                                setProgressViewMode(
                                                                    "horizontal",
                                                                )
                                                            }
                                                        >
                                                            <i className="ph-duotone ph-chart-line me-1"></i>
                                                            Horizontal
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Progress Tracker with Toggle */}
                                        {enhancedProgressSteps.length > 0 && (
                                            <ProgressTracker
                                                title="Processing Progress"
                                                steps={incompleteSteps}
                                                variant={progressViewMode}
                                                showProgress={true}
                                            />
                                        )}

                                        {/* Progress Summary */}
                                        {incompleteSteps.length > 0 && (
                                            <Card className="mb-4">
                                                <Card.Header className="bg-info text-white">
                                                    <h6 className="mb-0">
                                                        <i className="ph-duotone ph-chart-bar me-2"></i>
                                                        Progress Summary
                                                    </h6>
                                                </Card.Header>
                                                <Card.Body>
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <div className="d-flex align-items-center mb-3">
                                                                <div className="me-3">
                                                                    <div className="progress-circle">
                                                                        <span className="progress-text">
                                                                            {Math.round(
                                                                                (incompleteSteps.filter(
                                                                                    (
                                                                                        step,
                                                                                    ) =>
                                                                                        step.status ===
                                                                                        "completed",
                                                                                )
                                                                                    .length /
                                                                                    incompleteSteps.length) *
                                                                                    100,
                                                                            )}
                                                                            %
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <h6 className="mb-1">
                                                                        Overall
                                                                        Progress
                                                                    </h6>
                                                                    <small className="text-muted">
                                                                        {
                                                                            incompleteSteps.filter(
                                                                                (
                                                                                    step,
                                                                                ) =>
                                                                                    step.status ===
                                                                                    "completed",
                                                                            )
                                                                                .length
                                                                        }{" "}
                                                                        of{" "}
                                                                        {
                                                                            incompleteSteps.length
                                                                        }{" "}
                                                                        steps
                                                                        completed
                                                                    </small>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <div className="d-flex flex-column">
                                                                <div className="d-flex justify-content-between mb-2">
                                                                    <span>
                                                                        Completed
                                                                    </span>
                                                                    <span className="badge bg-success">
                                                                        {
                                                                            progressSteps.filter(
                                                                                (
                                                                                    step,
                                                                                ) =>
                                                                                    step.status ===
                                                                                    "completed",
                                                                            )
                                                                                .length
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="d-flex justify-content-between mb-2">
                                                                    <span>
                                                                        In
                                                                        Progress
                                                                    </span>
                                                                    <span className="badge bg-warning">
                                                                        {
                                                                            incompleteSteps.filter(
                                                                                (
                                                                                    step,
                                                                                ) =>
                                                                                    step.status ===
                                                                                    "in_progress",
                                                                            )
                                                                                .length
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="d-flex justify-content-between mb-2">
                                                                    <span>
                                                                        Failed
                                                                    </span>
                                                                    <span className="badge bg-danger">
                                                                        {
                                                                            incompleteSteps.filter(
                                                                                (
                                                                                    step,
                                                                                ) =>
                                                                                    step.status ===
                                                                                    "failed",
                                                                            )
                                                                                .length
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="d-flex justify-content-between">
                                                                    <span>
                                                                        Pending
                                                                    </span>
                                                                    <span className="badge bg-secondary">
                                                                        {
                                                                            enhancedProgressSteps.filter(
                                                                                (
                                                                                    step,
                                                                                ) =>
                                                                                    step.status ===
                                                                                    "pending",
                                                                            )
                                                                                .length
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        )}

                                        <div className="action-section-wrapper">
                                            <div className="action-header">
                                                <div className="action-icon">
                                                    <i className="ph-duotone ph-gear-six text-primary"></i>
                                                </div>
                                                <div className="action-content">
                                                    <h6 className="mb-1">
                                                        Ready to Process
                                                    </h6>
                                                    <p className="text-muted mb-0">
                                                        This request is ready to
                                                        be processed. Click
                                                        below to change the
                                                        status.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="action-button-container">
                                                <Button
                                                    className="action-button"
                                                    variant="primary"
                                                    size="lg"
                                                    onClick={() =>
                                                        processUserRequest(
                                                            applicantDetails,
                                                        )
                                                    }
                                                    disabled={
                                                        isProcessingRequest ||
                                                        !applicantDetails
                                                    }
                                                >
                                                    {isProcessingRequest ? (
                                                        <div className="button-content">
                                                            <div className="spinner-container">
                                                                <Spinner
                                                                    as="span"
                                                                    animation="border"
                                                                    size="sm"
                                                                    role="status"
                                                                    aria-hidden="true"
                                                                    className="me-2"
                                                                />
                                                            </div>
                                                            <span>
                                                                Processing
                                                                Request...
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="button-content">
                                                            <i className="ph-duotone ph-check-circle me-2"></i>
                                                            <span>
                                                                Process Request
                                                            </span>
                                                        </div>
                                                    )}
                                                </Button>
                                            </div>

                                            <div className="action-footer">
                                                <small className="text-muted">
                                                    <i className="ph-duotone ph-info me-1"></i>
                                                    This action will update the
                                                    request status to processed
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                    </Col>
                  </Row>
            
        </React.Fragment>
    )
}
UserProfileErrorDetails.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
  };
export default UserProfileErrorDetails
