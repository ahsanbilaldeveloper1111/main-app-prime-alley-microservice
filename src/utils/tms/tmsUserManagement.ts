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