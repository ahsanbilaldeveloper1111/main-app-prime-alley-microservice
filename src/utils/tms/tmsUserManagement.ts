export const ListUsers = async () => {
  const response = {
      "success": true,
      "message": "Success",
      "action": "view",
      "data": [
          {
              "name": "testyou testme",
              "email": "testmenow25_S99@sipzon.com",
              "user_type": "partner",
              "guid": "2a633217-8998-49ed-961d-1eda38ef8a99",
              "imagicle": null,
              "status": "1",
              "username": "testmenow25_S99",
              "phone_no": "20184",
              "id": 2437,
              "company": "XYZ FZ LLC",
              "user_access_info": {
                  "permissions": []
              },
              "blocked_permissions": [],
              "extended_permissions": [],
              "ranks": []
          },
          {
              "name": "testmenow 8",
              "email": "testmenowahsan_S99@sipzon.com",
              "user_type": "partner",
              "guid": "ab1b771e-901f-4cae-8cbf-f3848e54fc21",
              "imagicle": null,
              "status": "1",
              "username": "testmenowahsan_S99",
              "phone_no": "20182",
              "id": 2436,
              "company": "XYZ FZ LLC",
              "user_access_info": {
                  "permissions": []
              },
              "blocked_permissions": [],
              "extended_permissions": [],
              "ranks": []
          },
          {
              "name": "ahsantest now4",
              "email": "ahsanow4_S99@sipzon.com",
              "user_type": "partner",
              "guid": "fda2489b-116c-4ee1-9117-69a43cfef47f",
              "imagicle": null,
              "status": "1",
              "username": "ahsanow4_S99",
              "phone_no": "20181",
              "id": 2435,
              "company": "XYZ FZ LLC",
              "user_access_info": {
                  "permissions": []
              },
              "blocked_permissions": [],
              "extended_permissions": [],
              "ranks": []
          },
          {
              "name": "ahsannewtest me",
              "email": "ahsannewtest1_S99@sipzon.com",
              "user_type": "partner",
              "guid": "4c5ffd84-d406-424c-b9ff-1b6dc7e6af48",
              "imagicle": null,
              "status": "1",
              "username": "ahsannewtest1_S99",
              "phone_no": "20183",
              "id": 2434,
              "company": "XYZ FZ LLC",
              "user_access_info": {
                  "permissions": []
              },
              "blocked_permissions": [],
              "extended_permissions": [],
              "ranks": []
          },
          {
              "name": "test usman case",
              "email": "testusmancase_S99@sipzon.com",
              "user_type": "partner",
              "guid": "8a7cdf60-00e9-4c6f-9d94-cea2b134eb87",
              "imagicle": null,
              "status": "1",
              "username": "testusmancase_S99",
              "phone_no": "20179",
              "id": 2433,
              "company": "XYZ FZ LLC",
              "user_access_info": {
                  "permissions": []
              },
              "blocked_permissions": [],
              "extended_permissions": [],
              "ranks": []
          },
          {
              "name": "testme now 22",
              "email": "testmenow22_S99@sipzon.com",
              "user_type": "partner",
              "guid": "bea2d3a4-2de6-4a55-8049-2134a56316fd",
              "imagicle": null,
              "status": "1",
              "username": "testmenow22_S99",
              "phone_no": "20177",
              "id": 2432,
              "company": "XYZ FZ LLC",
              "user_access_info": {
                  "permissions": []
              },
              "blocked_permissions": [],
              "extended_permissions": [],
              "ranks": []
          },
          {
              "name": "testnow 21",
              "email": "testnnow21_S99@sipzon.com",
              "user_type": "partner",
              "guid": "72d4ceb1-d7f9-4c9a-bb08-c88a5a5b238a",
              "imagicle": null,
              "status": "1",
              "username": "testnnow21_S99",
              "phone_no": "20175",
              "id": 2431,
              "company": "XYZ FZ LLC",
              "user_access_info": {
                  "permissions": []
              },
              "blocked_permissions": [],
              "extended_permissions": [],
              "ranks": []
          },
          {
              "name": "ahsantest new20",
              "email": "ahsantest20_S99@sipzon.com",
              "user_type": "partner",
              "guid": "060801dc-47dc-4596-8ce5-b33de396d56f",
              "imagicle": null,
              "status": "1",
              "username": "ahsantest20_S99",
              "phone_no": "20176",
              "id": 2430,
              "company": "XYZ FZ LLC",
              "user_access_info": {
                  "permissions": []
              },
              "blocked_permissions": [],
              "extended_permissions": [],
              "ranks": []
          },
          {
              "name": "testme now 19",
              "email": "testmenow19_S99@sipzon.com",
              "user_type": "partner",
              "guid": "770971a2-5c0c-4f13-b1be-c9dbe7252a5c",
              "imagicle": null,
              "status": "1",
              "username": "testmenow19_S99",
              "phone_no": "20173",
              "id": 2429,
              "company": "XYZ FZ LLC",
              "user_access_info": {
                  "permissions": []
              },
              "blocked_permissions": [],
              "extended_permissions": [],
              "ranks": []
          },
          {
              "name": "test me now3",
              "email": "testmenow3_S99@sipzon.com",
              "user_type": "partner",
              "guid": "a4b72617-fa52-4304-be9b-b1fd50ad1442",
              "imagicle": null,
              "status": "1",
              "username": "testmenow3_S99",
              "phone_no": "20126",
              "id": 2428,
              "company": "XYZ FZ LLC",
              "user_access_info": {
                  "permissions": []
              },
              "blocked_permissions": [],
              "extended_permissions": [],
              "ranks": []
          }
      ],
      "pagination": {
          "total": 2391,
          "limit": 10,
          "page": 1,
          "last_page": 240,
          "from": 1,
          "to": 10
      }
  }
  const requiredResponse = {
    "draw": 1,
    "recordsTotal": response.pagination.total,
    "recordsFiltered": response.pagination.total,
    "dataList": response.data,
    "meta": response.pagination
  }
  return requiredResponse;
}

export const GetModule = async () => {
  const response = {
      "success": true,
      "message": "Success",
      "action": "view",
      "data": [
          {
              "id": 12,
              "name": "user_setting",
              "description": null,
              "created_at": "2025-08-16T16:36:39.233000Z",
              "updated_at": "2025-08-16T16:36:39.233000Z",
              "permissions": [
                  {
                      "id": 40,
                      "action": "view",
                      "module_id": "12",
                      "created_at": "2025-08-16T16:36:39.243000Z",
                      "updated_at": "2025-08-16T16:36:39.243000Z"
                  },
                  {
                      "id": 41,
                      "action": "update",
                      "module_id": "12",
                      "created_at": "2025-08-16T16:36:39.257000Z",
                      "updated_at": "2025-08-16T16:36:39.257000Z"
                  }
              ]
          },
          {
              "id": 11,
              "name": "audit_log",
              "description": null,
              "created_at": "2025-07-26T12:31:57.883000Z",
              "updated_at": "2025-07-26T12:31:57.883000Z",
              "permissions": [
                  {
                      "id": 35,
                      "action": "view",
                      "module_id": "11",
                      "created_at": "2025-07-26T12:31:57.890000Z",
                      "updated_at": "2025-07-26T12:31:57.890000Z"
                  },
                  {
                      "id": 36,
                      "action": "create",
                      "module_id": "11",
                      "created_at": "2025-07-26T12:31:57.903000Z",
                      "updated_at": "2025-07-26T12:31:57.903000Z"
                  },
                  {
                      "id": 37,
                      "action": "update",
                      "module_id": "11",
                      "created_at": "2025-07-26T12:31:57.913000Z",
                      "updated_at": "2025-07-26T12:31:57.913000Z"
                  },
                  {
                      "id": 38,
                      "action": "delete",
                      "module_id": "11",
                      "created_at": "2025-07-26T12:31:57.927000Z",
                      "updated_at": "2025-07-26T12:31:57.927000Z"
                  },
                  {
                      "id": 39,
                      "action": "admin",
                      "module_id": "11",
                      "created_at": "2025-07-26T12:31:57.937000Z",
                      "updated_at": "2025-07-26T12:31:57.937000Z"
                  }
              ]
          },
          {
              "id": 10,
              "name": "user_profiling_error_log",
              "description": null,
              "created_at": "2025-07-15T15:11:09.197000Z",
              "updated_at": "2025-07-15T15:11:09.197000Z",
              "permissions": [
                  {
                      "id": 33,
                      "action": "view",
                      "module_id": "10",
                      "created_at": "2025-07-15T15:11:09.203000Z",
                      "updated_at": "2025-07-15T15:11:09.203000Z"
                  },
                  {
                      "id": 34,
                      "action": "update",
                      "module_id": "10",
                      "created_at": "2025-07-18T13:35:15.610000Z",
                      "updated_at": "2025-07-18T13:35:15.610000Z"
                  }
              ]
          },
          {
              "id": 9,
              "name": "dashboard",
              "description": null,
              "created_at": "2025-06-19T10:56:35.103000Z",
              "updated_at": "2025-06-19T10:56:35.103000Z",
              "permissions": [
                  {
                      "id": 32,
                      "action": "view",
                      "module_id": "9",
                      "created_at": "2025-06-19T10:56:35.110000Z",
                      "updated_at": "2025-06-19T10:56:35.110000Z"
                  }
              ]
          },
          {
              "id": 8,
              "name": "company",
              "description": null,
              "created_at": "2025-06-15T09:51:05.203000Z",
              "updated_at": "2025-06-15T09:51:05.203000Z",
              "permissions": [
                  {
                      "id": 28,
                      "action": "view",
                      "module_id": "8",
                      "created_at": "2025-06-15T09:51:05.213000Z",
                      "updated_at": "2025-06-15T09:51:05.213000Z"
                  },
                  {
                      "id": 29,
                      "action": "update",
                      "module_id": "8",
                      "created_at": "2025-06-15T09:51:05.217000Z",
                      "updated_at": "2025-06-15T09:51:05.217000Z"
                  },
                  {
                      "id": 30,
                      "action": "delete",
                      "module_id": "8",
                      "created_at": "2025-06-15T09:51:05.227000Z",
                      "updated_at": "2025-06-15T09:51:05.227000Z"
                  },
                  {
                      "id": 31,
                      "action": "admin",
                      "module_id": "8",
                      "created_at": "2025-06-15T09:51:05.233000Z",
                      "updated_at": "2025-06-15T09:51:05.233000Z"
                  }
              ]
          },
          {
              "id": 7,
              "name": "customer_profiling",
              "description": null,
              "created_at": "2025-06-14T12:20:26.403000Z",
              "updated_at": "2025-06-14T12:20:26.403000Z",
              "permissions": [
                  {
                      "id": 23,
                      "action": "view",
                      "module_id": "7",
                      "created_at": "2025-06-14T12:20:26.417000Z",
                      "updated_at": "2025-06-14T12:20:26.417000Z"
                  },
                  {
                      "id": 24,
                      "action": "create",
                      "module_id": "7",
                      "created_at": "2025-06-14T12:20:26.423000Z",
                      "updated_at": "2025-06-14T12:20:26.423000Z"
                  },
                  {
                      "id": 25,
                      "action": "update",
                      "module_id": "7",
                      "created_at": "2025-06-14T12:20:26.430000Z",
                      "updated_at": "2025-06-14T12:20:26.430000Z"
                  },
                  {
                      "id": 26,
                      "action": "delete",
                      "module_id": "7",
                      "created_at": "2025-06-14T12:20:26.440000Z",
                      "updated_at": "2025-06-14T12:20:26.440000Z"
                  },
                  {
                      "id": 27,
                      "action": "admin",
                      "module_id": "7",
                      "created_at": "2025-06-14T12:20:26.447000Z",
                      "updated_at": "2025-06-14T12:20:26.447000Z"
                  }
              ]
          },
          {
              "id": 6,
              "name": "unified_op",
              "description": null,
              "created_at": "2025-06-12T05:34:12.240000Z",
              "updated_at": "2025-06-12T05:34:12.240000Z",
              "permissions": [
                  {
                      "id": 18,
                      "action": "view",
                      "module_id": "6",
                      "created_at": "2025-06-12T05:34:12.253000Z",
                      "updated_at": "2025-06-12T05:34:12.253000Z"
                  },
                  {
                      "id": 19,
                      "action": "create",
                      "module_id": "6",
                      "created_at": "2025-06-12T05:34:12.263000Z",
                      "updated_at": "2025-06-12T05:34:12.263000Z"
                  },
                  {
                      "id": 20,
                      "action": "update",
                      "module_id": "6",
                      "created_at": "2025-06-12T05:34:12.273000Z",
                      "updated_at": "2025-06-12T05:34:12.273000Z"
                  },
                  {
                      "id": 21,
                      "action": "delete",
                      "module_id": "6",
                      "created_at": "2025-06-12T05:34:12.283000Z",
                      "updated_at": "2025-06-12T05:34:12.283000Z"
                  },
                  {
                      "id": 22,
                      "action": "admin",
                      "module_id": "6",
                      "created_at": "2025-06-12T05:34:12.293000Z",
                      "updated_at": "2025-06-12T05:34:12.293000Z"
                  }
              ]
          },
          {
              "id": 5,
              "name": "cisco_db",
              "description": null,
              "created_at": "2025-06-12T05:34:12.217000Z",
              "updated_at": "2025-06-12T05:34:12.217000Z",
              "permissions": [
                  {
                      "id": 17,
                      "action": "view",
                      "module_id": "5",
                      "created_at": "2025-06-12T05:34:12.227000Z",
                      "updated_at": "2025-06-12T05:34:12.227000Z"
                  }
              ]
          },
          {
              "id": 3,
              "name": "permission",
              "description": null,
              "created_at": "2025-05-17T11:59:10.133000Z",
              "updated_at": "2025-05-17T11:59:10.133000Z",
              "permissions": [
                  {
                      "id": 11,
                      "action": "create",
                      "module_id": "3",
                      "created_at": "2025-05-17T11:59:10.137000Z",
                      "updated_at": "2025-05-17T11:59:10.137000Z"
                  },
                  {
                      "id": 12,
                      "action": "view",
                      "module_id": "3",
                      "created_at": "2025-05-17T11:59:10.143000Z",
                      "updated_at": "2025-05-17T11:59:10.143000Z"
                  },
                  {
                      "id": 13,
                      "action": "update",
                      "module_id": "3",
                      "created_at": "2025-05-17T11:59:10.147000Z",
                      "updated_at": "2025-05-17T11:59:10.147000Z"
                  },
                  {
                      "id": 14,
                      "action": "delete",
                      "module_id": "3",
                      "created_at": "2025-05-17T11:59:10.150000Z",
                      "updated_at": "2025-05-17T11:59:10.150000Z"
                  },
                  {
                      "id": 15,
                      "action": "admin",
                      "module_id": "3",
                      "created_at": "2025-05-17T11:59:10.157000Z",
                      "updated_at": "2025-05-17T11:59:10.157000Z"
                  }
              ]
          },
          {
              "id": 2,
              "name": "rank",
              "description": null,
              "created_at": "2025-05-17T11:59:10.103000Z",
              "updated_at": "2025-05-17T11:59:10.103000Z",
              "permissions": [
                  {
                      "id": 6,
                      "action": "create",
                      "module_id": "2",
                      "created_at": "2025-05-17T11:59:10.110000Z",
                      "updated_at": "2025-05-17T11:59:10.110000Z"
                  },
                  {
                      "id": 7,
                      "action": "view",
                      "module_id": "2",
                      "created_at": "2025-05-17T11:59:10.113000Z",
                      "updated_at": "2025-05-17T11:59:10.113000Z"
                  },
                  {
                      "id": 8,
                      "action": "update",
                      "module_id": "2",
                      "created_at": "2025-05-17T11:59:10.120000Z",
                      "updated_at": "2025-05-17T11:59:10.120000Z"
                  },
                  {
                      "id": 9,
                      "action": "delete",
                      "module_id": "2",
                      "created_at": "2025-05-17T11:59:10.123000Z",
                      "updated_at": "2025-05-17T11:59:10.123000Z"
                  },
                  {
                      "id": 10,
                      "action": "admin",
                      "module_id": "2",
                      "created_at": "2025-05-17T11:59:10.127000Z",
                      "updated_at": "2025-05-17T11:59:10.127000Z"
                  }
              ]
          }
      ],
      "pagination": {
          "total": 11,
          "limit": 10,
          "page": 1,
          "last_page": 2,
          "from": 1,
          "to": 10
      }
  }
  const requiredResponse = {
      "draw": 1,
      "recordsTotal": response.pagination.total,
      "recordsFiltered": response.pagination.total,
      "dataList": response.data,
      "meta": response.pagination
    }
    return requiredResponse;
}



export  const getRanks = async () => {
  const response = {
      "success": true,
      "message": "Success",
      "action": "view",
      "data": [
          {
              "id": 17,
              "name": "RESTRICTED AGENT",
              "description": null,
              "company_id": null,
              "created_at": "2025-08-08T20:59:50.127000Z",
              "updated_at": "2025-08-08T20:59:50.127000Z",
              "users_count": "1",
              "permissions": [
                  {
                      "id": 29,
                      "action": "update",
                      "module_id": "8",
                      "created_at": "2025-06-15T09:51:05.217000Z",
                      "updated_at": "2025-06-15T09:51:05.217000Z",
                      "pivot": {
                          "rank_id": "17",
                          "permission_id": "29"
                      }
                  }
              ]
          },
          {
              "id": 16,
              "name": "prime",
              "description": null,
              "company_id": null,
              "created_at": "2025-08-08T20:28:20.343000Z",
              "updated_at": "2025-08-08T20:28:20.343000Z",
              "users_count": "7",
              "permissions": [
                  {
                      "id": 35,
                      "action": "view",
                      "module_id": "11",
                      "created_at": "2025-07-26T12:31:57.890000Z",
                      "updated_at": "2025-07-26T12:31:57.890000Z",
                      "pivot": {
                          "rank_id": "16",
                          "permission_id": "35"
                      }
                  },
                  {
                      "id": 33,
                      "action": "view",
                      "module_id": "10",
                      "created_at": "2025-07-15T15:11:09.203000Z",
                      "updated_at": "2025-07-15T15:11:09.203000Z",
                      "pivot": {
                          "rank_id": "16",
                          "permission_id": "33"
                      }
                  },
                  {
                      "id": 32,
                      "action": "view",
                      "module_id": "9",
                      "created_at": "2025-06-19T10:56:35.110000Z",
                      "updated_at": "2025-06-19T10:56:35.110000Z",
                      "pivot": {
                          "rank_id": "16",
                          "permission_id": "32"
                      }
                  },
                  {
                      "id": 28,
                      "action": "view",
                      "module_id": "8",
                      "created_at": "2025-06-15T09:51:05.213000Z",
                      "updated_at": "2025-06-15T09:51:05.213000Z",
                      "pivot": {
                          "rank_id": "16",
                          "permission_id": "28"
                      }
                  },
                  {
                      "id": 23,
                      "action": "view",
                      "module_id": "7",
                      "created_at": "2025-06-14T12:20:26.417000Z",
                      "updated_at": "2025-06-14T12:20:26.417000Z",
                      "pivot": {
                          "rank_id": "16",
                          "permission_id": "23"
                      }
                  },
                  {
                      "id": 18,
                      "action": "view",
                      "module_id": "6",
                      "created_at": "2025-06-12T05:34:12.253000Z",
                      "updated_at": "2025-06-12T05:34:12.253000Z",
                      "pivot": {
                          "rank_id": "16",
                          "permission_id": "18"
                      }
                  },
                  {
                      "id": 17,
                      "action": "view",
                      "module_id": "5",
                      "created_at": "2025-06-12T05:34:12.227000Z",
                      "updated_at": "2025-06-12T05:34:12.227000Z",
                      "pivot": {
                          "rank_id": "16",
                          "permission_id": "17"
                      }
                  },
                  {
                      "id": 12,
                      "action": "view",
                      "module_id": "3",
                      "created_at": "2025-05-17T11:59:10.143000Z",
                      "updated_at": "2025-05-17T11:59:10.143000Z",
                      "pivot": {
                          "rank_id": "16",
                          "permission_id": "12"
                      }
                  },
                  {
                      "id": 7,
                      "action": "view",
                      "module_id": "2",
                      "created_at": "2025-05-17T11:59:10.113000Z",
                      "updated_at": "2025-05-17T11:59:10.113000Z",
                      "pivot": {
                          "rank_id": "16",
                          "permission_id": "7"
                      }
                  },
                  {
                      "id": 2,
                      "action": "view",
                      "module_id": "1",
                      "created_at": "2025-05-17T11:59:10.083000Z",
                      "updated_at": "2025-05-17T11:59:10.083000Z",
                      "pivot": {
                          "rank_id": "16",
                          "permission_id": "2"
                      }
                  }
              ]
          },
          {
              "id": 15,
              "name": "New Rank Test 1",
              "description": null,
              "company_id": null,
              "created_at": "2025-08-07T08:46:27.697000Z",
              "updated_at": "2025-08-07T08:46:27.697000Z",
              "users_count": "1",
              "permissions": []
          },
          {
              "id": 14,
              "name": "New Rank Test",
              "description": null,
              "company_id": null,
              "created_at": "2025-08-07T08:34:39.133000Z",
              "updated_at": "2025-08-07T08:34:39.133000Z",
              "users_count": "3",
              "permissions": [
                  {
                      "id": 35,
                      "action": "view",
                      "module_id": "11",
                      "created_at": "2025-07-26T12:31:57.890000Z",
                      "updated_at": "2025-07-26T12:31:57.890000Z",
                      "pivot": {
                          "rank_id": "14",
                          "permission_id": "35"
                      }
                  },
                  {
                      "id": 28,
                      "action": "view",
                      "module_id": "8",
                      "created_at": "2025-06-15T09:51:05.213000Z",
                      "updated_at": "2025-06-15T09:51:05.213000Z",
                      "pivot": {
                          "rank_id": "14",
                          "permission_id": "28"
                      }
                  },
                  {
                      "id": 18,
                      "action": "view",
                      "module_id": "6",
                      "created_at": "2025-06-12T05:34:12.253000Z",
                      "updated_at": "2025-06-12T05:34:12.253000Z",
                      "pivot": {
                          "rank_id": "14",
                          "permission_id": "18"
                      }
                  },
                  {
                      "id": 32,
                      "action": "view",
                      "module_id": "9",
                      "created_at": "2025-06-19T10:56:35.110000Z",
                      "updated_at": "2025-06-19T10:56:35.110000Z",
                      "pivot": {
                          "rank_id": "14",
                          "permission_id": "32"
                      }
                  },
                  {
                      "id": 1,
                      "action": "create",
                      "module_id": "1",
                      "created_at": "2025-05-17T11:59:10.077000Z",
                      "updated_at": "2025-05-17T11:59:10.077000Z",
                      "pivot": {
                          "rank_id": "14",
                          "permission_id": "1"
                      }
                  },
                  {
                      "id": 3,
                      "action": "update",
                      "module_id": "1",
                      "created_at": "2025-05-17T11:59:10.090000Z",
                      "updated_at": "2025-05-17T11:59:10.090000Z",
                      "pivot": {
                          "rank_id": "14",
                          "permission_id": "3"
                      }
                  },
                  {
                      "id": 25,
                      "action": "update",
                      "module_id": "7",
                      "created_at": "2025-06-14T12:20:26.430000Z",
                      "updated_at": "2025-06-14T12:20:26.430000Z",
                      "pivot": {
                          "rank_id": "14",
                          "permission_id": "25"
                      }
                  },
                  {
                      "id": 41,
                      "action": "update",
                      "module_id": "12",
                      "created_at": "2025-08-16T16:36:39.257000Z",
                      "updated_at": "2025-08-16T16:36:39.257000Z",
                      "pivot": {
                          "rank_id": "14",
                          "permission_id": "41"
                      }
                  }
              ]
          },
          {
              "id": 13,
              "name": "asda",
              "description": null,
              "company_id": null,
              "created_at": "2025-06-15T10:25:03.653000Z",
              "updated_at": "2025-06-15T10:25:03.653000Z",
              "users_count": "0",
              "permissions": [
                  {
                      "id": 11,
                      "action": "create",
                      "module_id": "3",
                      "created_at": "2025-05-17T11:59:10.137000Z",
                      "updated_at": "2025-05-17T11:59:10.137000Z",
                      "pivot": {
                          "rank_id": "13",
                          "permission_id": "11"
                      }
                  },
                  {
                      "id": 6,
                      "action": "create",
                      "module_id": "2",
                      "created_at": "2025-05-17T11:59:10.110000Z",
                      "updated_at": "2025-05-17T11:59:10.110000Z",
                      "pivot": {
                          "rank_id": "13",
                          "permission_id": "6"
                      }
                  },
                  {
                      "id": 27,
                      "action": "admin",
                      "module_id": "7",
                      "created_at": "2025-06-14T12:20:26.447000Z",
                      "updated_at": "2025-06-14T12:20:26.447000Z",
                      "pivot": {
                          "rank_id": "13",
                          "permission_id": "27"
                      }
                  },
                  {
                      "id": 30,
                      "action": "delete",
                      "module_id": "8",
                      "created_at": "2025-06-15T09:51:05.227000Z",
                      "updated_at": "2025-06-15T09:51:05.227000Z",
                      "pivot": {
                          "rank_id": "13",
                          "permission_id": "30"
                      }
                  },
                  {
                      "id": 20,
                      "action": "update",
                      "module_id": "6",
                      "created_at": "2025-06-12T05:34:12.273000Z",
                      "updated_at": "2025-06-12T05:34:12.273000Z",
                      "pivot": {
                          "rank_id": "13",
                          "permission_id": "20"
                      }
                  },
                  {
                      "id": 22,
                      "action": "admin",
                      "module_id": "6",
                      "created_at": "2025-06-12T05:34:12.293000Z",
                      "updated_at": "2025-06-12T05:34:12.293000Z",
                      "pivot": {
                          "rank_id": "13",
                          "permission_id": "22"
                      }
                  },
                  {
                      "id": 21,
                      "action": "delete",
                      "module_id": "6",
                      "created_at": "2025-06-12T05:34:12.283000Z",
                      "updated_at": "2025-06-12T05:34:12.283000Z",
                      "pivot": {
                          "rank_id": "13",
                          "permission_id": "21"
                      }
                  },
                  {
                      "id": 2,
                      "action": "view",
                      "module_id": "1",
                      "created_at": "2025-05-17T11:59:10.083000Z",
                      "updated_at": "2025-05-17T11:59:10.083000Z",
                      "pivot": {
                          "rank_id": "13",
                          "permission_id": "2"
                      }
                  },
                  {
                      "id": 17,
                      "action": "view",
                      "module_id": "5",
                      "created_at": "2025-06-12T05:34:12.227000Z",
                      "updated_at": "2025-06-12T05:34:12.227000Z",
                      "pivot": {
                          "rank_id": "13",
                          "permission_id": "17"
                      }
                  },
                  {
                      "id": 3,
                      "action": "update",
                      "module_id": "1",
                      "created_at": "2025-05-17T11:59:10.090000Z",
                      "updated_at": "2025-05-17T11:59:10.090000Z",
                      "pivot": {
                          "rank_id": "13",
                          "permission_id": "3"
                      }
                  },
                  {
                      "id": 24,
                      "action": "create",
                      "module_id": "7",
                      "created_at": "2025-06-14T12:20:26.423000Z",
                      "updated_at": "2025-06-14T12:20:26.423000Z",
                      "pivot": {
                          "rank_id": "13",
                          "permission_id": "24"
                      }
                  },
                  {
                      "id": 31,
                      "action": "admin",
                      "module_id": "8",
                      "created_at": "2025-06-15T09:51:05.233000Z",
                      "updated_at": "2025-06-15T09:51:05.233000Z",
                      "pivot": {
                          "rank_id": "13",
                          "permission_id": "31"
                      }
                  },
                  {
                      "id": 14,
                      "action": "delete",
                      "module_id": "3",
                      "created_at": "2025-05-17T11:59:10.150000Z",
                      "updated_at": "2025-05-17T11:59:10.150000Z",
                      "pivot": {
                          "rank_id": "13",
                          "permission_id": "14"
                      }
                  },
                  {
                      "id": 26,
                      "action": "delete",
                      "module_id": "7",
                      "created_at": "2025-06-14T12:20:26.440000Z",
                      "updated_at": "2025-06-14T12:20:26.440000Z",
                      "pivot": {
                          "rank_id": "13",
                          "permission_id": "26"
                      }
                  },
                  {
                      "id": 4,
                      "action": "delete",
                      "module_id": "1",
                      "created_at": "2025-05-17T11:59:10.093000Z",
                      "updated_at": "2025-05-17T11:59:10.093000Z",
                      "pivot": {
                          "rank_id": "13",
                          "permission_id": "4"
                      }
                  },
                  {
                      "id": 25,
                      "action": "update",
                      "module_id": "7",
                      "created_at": "2025-06-14T12:20:26.430000Z",
                      "updated_at": "2025-06-14T12:20:26.430000Z",
                      "pivot": {
                          "rank_id": "13",
                          "permission_id": "25"
                      }
                  },
                  {
                      "id": 8,
                      "action": "update",
                      "module_id": "2",
                      "created_at": "2025-05-17T11:59:10.120000Z",
                      "updated_at": "2025-05-17T11:59:10.120000Z",
                      "pivot": {
                          "rank_id": "13",
                          "permission_id": "8"
                      }
                  },
                  {
                      "id": 23,
                      "action": "view",
                      "module_id": "7",
                      "created_at": "2025-06-14T12:20:26.417000Z",
                      "updated_at": "2025-06-14T12:20:26.417000Z",
                      "pivot": {
                          "rank_id": "13",
                          "permission_id": "23"
                      }
                  },
                  {
                      "id": 18,
                      "action": "view",
                      "module_id": "6",
                      "created_at": "2025-06-12T05:34:12.253000Z",
                      "updated_at": "2025-06-12T05:34:12.253000Z",
                      "pivot": {
                          "rank_id": "13",
                          "permission_id": "18"
                      }
                  },
                  {
                      "id": 5,
                      "action": "admin",
                      "module_id": "1",
                      "created_at": "2025-05-17T11:59:10.097000Z",
                      "updated_at": "2025-05-17T11:59:10.097000Z",
                      "pivot": {
                          "rank_id": "13",
                          "permission_id": "5"
                      }
                  },
                  {
                      "id": 15,
                      "action": "admin",
                      "module_id": "3",
                      "created_at": "2025-05-17T11:59:10.157000Z",
                      "updated_at": "2025-05-17T11:59:10.157000Z",
                      "pivot": {
                          "rank_id": "13",
                          "permission_id": "15"
                      }
                  },
                  {
                      "id": 12,
                      "action": "view",
                      "module_id": "3",
                      "created_at": "2025-05-17T11:59:10.143000Z",
                      "updated_at": "2025-05-17T11:59:10.143000Z",
                      "pivot": {
                          "rank_id": "13",
                          "permission_id": "12"
                      }
                  },
                  {
                      "id": 10,
                      "action": "admin",
                      "module_id": "2",
                      "created_at": "2025-05-17T11:59:10.127000Z",
                      "updated_at": "2025-05-17T11:59:10.127000Z",
                      "pivot": {
                          "rank_id": "13",
                          "permission_id": "10"
                      }
                  }
              ]
          },
          {
              "id": 12,
              "name": "Teraception Company Head",
              "description": "Teraception Company Head",
              "company_id": null,
              "created_at": "2025-05-24T18:43:28.447000Z",
              "updated_at": "2025-05-24T18:43:28.447000Z",
              "users_count": "6",
              "permissions": [
                  {
                      "id": 9,
                      "action": "delete",
                      "module_id": "2",
                      "created_at": "2025-05-17T11:59:10.123000Z",
                      "updated_at": "2025-05-17T11:59:10.123000Z",
                      "pivot": {
                          "rank_id": "12",
                          "permission_id": "9"
                      }
                  },
                  {
                      "id": 2,
                      "action": "view",
                      "module_id": "1",
                      "created_at": "2025-05-17T11:59:10.083000Z",
                      "updated_at": "2025-05-17T11:59:10.083000Z",
                      "pivot": {
                          "rank_id": "12",
                          "permission_id": "2"
                      }
                  },
                  {
                      "id": 25,
                      "action": "update",
                      "module_id": "7",
                      "created_at": "2025-06-14T12:20:26.430000Z",
                      "updated_at": "2025-06-14T12:20:26.430000Z",
                      "pivot": {
                          "rank_id": "12",
                          "permission_id": "25"
                      }
                  },
                  {
                      "id": 30,
                      "action": "delete",
                      "module_id": "8",
                      "created_at": "2025-06-15T09:51:05.227000Z",
                      "updated_at": "2025-06-15T09:51:05.227000Z",
                      "pivot": {
                          "rank_id": "12",
                          "permission_id": "30"
                      }
                  },
                  {
                      "id": 17,
                      "action": "view",
                      "module_id": "5",
                      "created_at": "2025-06-12T05:34:12.227000Z",
                      "updated_at": "2025-06-12T05:34:12.227000Z",
                      "pivot": {
                          "rank_id": "12",
                          "permission_id": "17"
                      }
                  },
                  {
                      "id": 22,
                      "action": "admin",
                      "module_id": "6",
                      "created_at": "2025-06-12T05:34:12.293000Z",
                      "updated_at": "2025-06-12T05:34:12.293000Z",
                      "pivot": {
                          "rank_id": "12",
                          "permission_id": "22"
                      }
                  },
                  {
                      "id": 33,
                      "action": "view",
                      "module_id": "10",
                      "created_at": "2025-07-15T15:11:09.203000Z",
                      "updated_at": "2025-07-15T15:11:09.203000Z",
                      "pivot": {
                          "rank_id": "12",
                          "permission_id": "33"
                      }
                  },
                  {
                      "id": 8,
                      "action": "update",
                      "module_id": "2",
                      "created_at": "2025-05-17T11:59:10.120000Z",
                      "updated_at": "2025-05-17T11:59:10.120000Z",
                      "pivot": {
                          "rank_id": "12",
                          "permission_id": "8"
                      }
                  },
                  {
                      "id": 20,
                      "action": "update",
                      "module_id": "6",
                      "created_at": "2025-06-12T05:34:12.273000Z",
                      "updated_at": "2025-06-12T05:34:12.273000Z",
                      "pivot": {
                          "rank_id": "12",
                          "permission_id": "20"
                      }
                  },
                  {
                      "id": 19,
                      "action": "create",
                      "module_id": "6",
                      "created_at": "2025-06-12T05:34:12.263000Z",
                      "updated_at": "2025-06-12T05:34:12.263000Z",
                      "pivot": {
                          "rank_id": "12",
                          "permission_id": "19"
                      }
                  },
                  {
                      "id": 14,
                      "action": "delete",
                      "module_id": "3",
                      "created_at": "2025-05-17T11:59:10.150000Z",
                      "updated_at": "2025-05-17T11:59:10.150000Z",
                      "pivot": {
                          "rank_id": "12",
                          "permission_id": "14"
                      }
                  },
                  {
                      "id": 13,
                      "action": "update",
                      "module_id": "3",
                      "created_at": "2025-05-17T11:59:10.147000Z",
                      "updated_at": "2025-05-17T11:59:10.147000Z",
                      "pivot": {
                          "rank_id": "12",
                          "permission_id": "13"
                      }
                  },
                  {
                      "id": 32,
                      "action": "view",
                      "module_id": "9",
                      "created_at": "2025-06-19T10:56:35.110000Z",
                      "updated_at": "2025-06-19T10:56:35.110000Z",
                      "pivot": {
                          "rank_id": "12",
                          "permission_id": "32"
                      }
                  },
                  {
                      "id": 3,
                      "action": "update",
                      "module_id": "1",
                      "created_at": "2025-05-17T11:59:10.090000Z",
                      "updated_at": "2025-05-17T11:59:10.090000Z",
                      "pivot": {
                          "rank_id": "12",
                          "permission_id": "3"
                      }
                  },
                  {
                      "id": 29,
                      "action": "update",
                      "module_id": "8",
                      "created_at": "2025-06-15T09:51:05.217000Z",
                      "updated_at": "2025-06-15T09:51:05.217000Z",
                      "pivot": {
                          "rank_id": "12",
                          "permission_id": "29"
                      }
                  },
                  {
                      "id": 11,
                      "action": "create",
                      "module_id": "3",
                      "created_at": "2025-05-17T11:59:10.137000Z",
                      "updated_at": "2025-05-17T11:59:10.137000Z",
                      "pivot": {
                          "rank_id": "12",
                          "permission_id": "11"
                      }
                  },
                  {
                      "id": 5,
                      "action": "admin",
                      "module_id": "1",
                      "created_at": "2025-05-17T11:59:10.097000Z",
                      "updated_at": "2025-05-17T11:59:10.097000Z",
                      "pivot": {
                          "rank_id": "12",
                          "permission_id": "5"
                      }
                  },
                  {
                      "id": 15,
                      "action": "admin",
                      "module_id": "3",
                      "created_at": "2025-05-17T11:59:10.157000Z",
                      "updated_at": "2025-05-17T11:59:10.157000Z",
                      "pivot": {
                          "rank_id": "12",
                          "permission_id": "15"
                      }
                  },
                  {
                      "id": 10,
                      "action": "admin",
                      "module_id": "2",
                      "created_at": "2025-05-17T11:59:10.127000Z",
                      "updated_at": "2025-05-17T11:59:10.127000Z",
                      "pivot": {
                          "rank_id": "12",
                          "permission_id": "10"
                      }
                  }
              ]
          },
          {
              "id": 10,
              "name": "Noww",
              "description": "dsfdsf",
              "company_id": null,
              "created_at": "2025-05-22T18:20:14.327000Z",
              "updated_at": "2025-05-22T20:45:04.490000Z",
              "users_count": "3",
              "permissions": [
                  {
                      "id": 8,
                      "action": "update",
                      "module_id": "2",
                      "created_at": "2025-05-17T11:59:10.120000Z",
                      "updated_at": "2025-05-17T11:59:10.120000Z",
                      "pivot": {
                          "rank_id": "10",
                          "permission_id": "8"
                      }
                  },
                  {
                      "id": 33,
                      "action": "view",
                      "module_id": "10",
                      "created_at": "2025-07-15T15:11:09.203000Z",
                      "updated_at": "2025-07-15T15:11:09.203000Z",
                      "pivot": {
                          "rank_id": "10",
                          "permission_id": "33"
                      }
                  },
                  {
                      "id": 2,
                      "action": "view",
                      "module_id": "1",
                      "created_at": "2025-05-17T11:59:10.083000Z",
                      "updated_at": "2025-05-17T11:59:10.083000Z",
                      "pivot": {
                          "rank_id": "10",
                          "permission_id": "2"
                      }
                  },
                  {
                      "id": 27,
                      "action": "admin",
                      "module_id": "7",
                      "created_at": "2025-06-14T12:20:26.447000Z",
                      "updated_at": "2025-06-14T12:20:26.447000Z",
                      "pivot": {
                          "rank_id": "10",
                          "permission_id": "27"
                      }
                  },
                  {
                      "id": 11,
                      "action": "create",
                      "module_id": "3",
                      "created_at": "2025-05-17T11:59:10.137000Z",
                      "updated_at": "2025-05-17T11:59:10.137000Z",
                      "pivot": {
                          "rank_id": "10",
                          "permission_id": "11"
                      }
                  },
                  {
                      "id": 22,
                      "action": "admin",
                      "module_id": "6",
                      "created_at": "2025-06-12T05:34:12.293000Z",
                      "updated_at": "2025-06-12T05:34:12.293000Z",
                      "pivot": {
                          "rank_id": "10",
                          "permission_id": "22"
                      }
                  },
                  {
                      "id": 30,
                      "action": "delete",
                      "module_id": "8",
                      "created_at": "2025-06-15T09:51:05.227000Z",
                      "updated_at": "2025-06-15T09:51:05.227000Z",
                      "pivot": {
                          "rank_id": "10",
                          "permission_id": "30"
                      }
                  },
                  {
                      "id": 31,
                      "action": "admin",
                      "module_id": "8",
                      "created_at": "2025-06-15T09:51:05.233000Z",
                      "updated_at": "2025-06-15T09:51:05.233000Z",
                      "pivot": {
                          "rank_id": "10",
                          "permission_id": "31"
                      }
                  },
                  {
                      "id": 29,
                      "action": "update",
                      "module_id": "8",
                      "created_at": "2025-06-15T09:51:05.217000Z",
                      "updated_at": "2025-06-15T09:51:05.217000Z",
                      "pivot": {
                          "rank_id": "10",
                          "permission_id": "29"
                      }
                  },
                  {
                      "id": 24,
                      "action": "create",
                      "module_id": "7",
                      "created_at": "2025-06-14T12:20:26.423000Z",
                      "updated_at": "2025-06-14T12:20:26.423000Z",
                      "pivot": {
                          "rank_id": "10",
                          "permission_id": "24"
                      }
                  },
                  {
                      "id": 3,
                      "action": "update",
                      "module_id": "1",
                      "created_at": "2025-05-17T11:59:10.090000Z",
                      "updated_at": "2025-05-17T11:59:10.090000Z",
                      "pivot": {
                          "rank_id": "10",
                          "permission_id": "3"
                      }
                  },
                  {
                      "id": 32,
                      "action": "view",
                      "module_id": "9",
                      "created_at": "2025-06-19T10:56:35.110000Z",
                      "updated_at": "2025-06-19T10:56:35.110000Z",
                      "pivot": {
                          "rank_id": "10",
                          "permission_id": "32"
                      }
                  },
                  {
                      "id": 20,
                      "action": "update",
                      "module_id": "6",
                      "created_at": "2025-06-12T05:34:12.273000Z",
                      "updated_at": "2025-06-12T05:34:12.273000Z",
                      "pivot": {
                          "rank_id": "10",
                          "permission_id": "20"
                      }
                  },
                  {
                      "id": 1,
                      "action": "create",
                      "module_id": "1",
                      "created_at": "2025-05-17T11:59:10.077000Z",
                      "updated_at": "2025-05-17T11:59:10.077000Z",
                      "pivot": {
                          "rank_id": "10",
                          "permission_id": "1"
                      }
                  },
                  {
                      "id": 5,
                      "action": "admin",
                      "module_id": "1",
                      "created_at": "2025-05-17T11:59:10.097000Z",
                      "updated_at": "2025-05-17T11:59:10.097000Z",
                      "pivot": {
                          "rank_id": "10",
                          "permission_id": "5"
                      }
                  }
              ]
          },
          {
              "id": 7,
              "name": "Testrtert",
              "description": "fsw",
              "company_id": null,
              "created_at": "2025-05-20T09:00:16.233000Z",
              "updated_at": "2025-05-20T09:00:16.233000Z",
              "users_count": "1",
              "permissions": [
                  {
                      "id": 11,
                      "action": "create",
                      "module_id": "3",
                      "created_at": "2025-05-17T11:59:10.137000Z",
                      "updated_at": "2025-05-17T11:59:10.137000Z",
                      "pivot": {
                          "rank_id": "7",
                          "permission_id": "11"
                      }
                  },
                  {
                      "id": 6,
                      "action": "create",
                      "module_id": "2",
                      "created_at": "2025-05-17T11:59:10.110000Z",
                      "updated_at": "2025-05-17T11:59:10.110000Z",
                      "pivot": {
                          "rank_id": "7",
                          "permission_id": "6"
                      }
                  },
                  {
                      "id": 9,
                      "action": "delete",
                      "module_id": "2",
                      "created_at": "2025-05-17T11:59:10.123000Z",
                      "updated_at": "2025-05-17T11:59:10.123000Z",
                      "pivot": {
                          "rank_id": "7",
                          "permission_id": "9"
                      }
                  },
                  {
                      "id": 3,
                      "action": "update",
                      "module_id": "1",
                      "created_at": "2025-05-17T11:59:10.090000Z",
                      "updated_at": "2025-05-17T11:59:10.090000Z",
                      "pivot": {
                          "rank_id": "7",
                          "permission_id": "3"
                      }
                  },
                  {
                      "id": 20,
                      "action": "update",
                      "module_id": "6",
                      "created_at": "2025-06-12T05:34:12.273000Z",
                      "updated_at": "2025-06-12T05:34:12.273000Z",
                      "pivot": {
                          "rank_id": "7",
                          "permission_id": "20"
                      }
                  },
                  {
                      "id": 33,
                      "action": "view",
                      "module_id": "10",
                      "created_at": "2025-07-15T15:11:09.203000Z",
                      "updated_at": "2025-07-15T15:11:09.203000Z",
                      "pivot": {
                          "rank_id": "7",
                          "permission_id": "33"
                      }
                  },
                  {
                      "id": 19,
                      "action": "create",
                      "module_id": "6",
                      "created_at": "2025-06-12T05:34:12.263000Z",
                      "updated_at": "2025-06-12T05:34:12.263000Z",
                      "pivot": {
                          "rank_id": "7",
                          "permission_id": "19"
                      }
                  },
                  {
                      "id": 5,
                      "action": "admin",
                      "module_id": "1",
                      "created_at": "2025-05-17T11:59:10.097000Z",
                      "updated_at": "2025-05-17T11:59:10.097000Z",
                      "pivot": {
                          "rank_id": "7",
                          "permission_id": "5"
                      }
                  }
              ]
          },
          {
              "id": 5,
              "name": "New Rank",
              "description": "Descrion about rank",
              "company_id": null,
              "created_at": "2025-05-20T00:46:40.587000Z",
              "updated_at": "2025-05-20T00:46:40.587000Z",
              "users_count": "1",
              "permissions": [
                  {
                      "id": 9,
                      "action": "delete",
                      "module_id": "2",
                      "created_at": "2025-05-17T11:59:10.123000Z",
                      "updated_at": "2025-05-17T11:59:10.123000Z",
                      "pivot": {
                          "rank_id": "5",
                          "permission_id": "9"
                      }
                  },
                  {
                      "id": 12,
                      "action": "view",
                      "module_id": "3",
                      "created_at": "2025-05-17T11:59:10.143000Z",
                      "updated_at": "2025-05-17T11:59:10.143000Z",
                      "pivot": {
                          "rank_id": "5",
                          "permission_id": "12"
                      }
                  },
                  {
                      "id": 11,
                      "action": "create",
                      "module_id": "3",
                      "created_at": "2025-05-17T11:59:10.137000Z",
                      "updated_at": "2025-05-17T11:59:10.137000Z",
                      "pivot": {
                          "rank_id": "5",
                          "permission_id": "11"
                      }
                  },
                  {
                      "id": 6,
                      "action": "create",
                      "module_id": "2",
                      "created_at": "2025-05-17T11:59:10.110000Z",
                      "updated_at": "2025-05-17T11:59:10.110000Z",
                      "pivot": {
                          "rank_id": "5",
                          "permission_id": "6"
                      }
                  },
                  {
                      "id": 1,
                      "action": "create",
                      "module_id": "1",
                      "created_at": "2025-05-17T11:59:10.077000Z",
                      "updated_at": "2025-05-17T11:59:10.077000Z",
                      "pivot": {
                          "rank_id": "5",
                          "permission_id": "1"
                      }
                  },
                  {
                      "id": 8,
                      "action": "update",
                      "module_id": "2",
                      "created_at": "2025-05-17T11:59:10.120000Z",
                      "updated_at": "2025-05-17T11:59:10.120000Z",
                      "pivot": {
                          "rank_id": "5",
                          "permission_id": "8"
                      }
                  },
                  {
                      "id": 21,
                      "action": "delete",
                      "module_id": "6",
                      "created_at": "2025-06-12T05:34:12.283000Z",
                      "updated_at": "2025-06-12T05:34:12.283000Z",
                      "pivot": {
                          "rank_id": "5",
                          "permission_id": "21"
                      }
                  },
                  {
                      "id": 25,
                      "action": "update",
                      "module_id": "7",
                      "created_at": "2025-06-14T12:20:26.430000Z",
                      "updated_at": "2025-06-14T12:20:26.430000Z",
                      "pivot": {
                          "rank_id": "5",
                          "permission_id": "25"
                      }
                  },
                  {
                      "id": 5,
                      "action": "admin",
                      "module_id": "1",
                      "created_at": "2025-05-17T11:59:10.097000Z",
                      "updated_at": "2025-05-17T11:59:10.097000Z",
                      "pivot": {
                          "rank_id": "5",
                          "permission_id": "5"
                      }
                  }
              ]
          },
          {
              "id": 1,
              "name": "Test",
              "description": "Test",
              "company_id": null,
              "created_at": null,
              "updated_at": null,
              "users_count": "0",
              "permissions": [
                  {
                      "id": 30,
                      "action": "delete",
                      "module_id": "8",
                      "created_at": "2025-06-15T09:51:05.227000Z",
                      "updated_at": "2025-06-15T09:51:05.227000Z",
                      "pivot": {
                          "rank_id": "1",
                          "permission_id": "30"
                      }
                  },
                  {
                      "id": 5,
                      "action": "admin",
                      "module_id": "1",
                      "created_at": "2025-05-17T11:59:10.097000Z",
                      "updated_at": "2025-05-17T11:59:10.097000Z",
                      "pivot": {
                          "rank_id": "1",
                          "permission_id": "5"
                      }
                  }
              ]
          }
      ],
      "pagination": {
          "total": 13,
          "limit": 10,
          "page": 1,
          "last_page": 2,
          "from": 1,
          "to": 10
      }
  }
  const requiredResponse = {
      "draw": 1,
      "recordsTotal": response.pagination.total,
      "recordsFiltered": response.pagination.total,
      "dataList": response.data,
      "meta": response.pagination
    }
    return requiredResponse; 
}