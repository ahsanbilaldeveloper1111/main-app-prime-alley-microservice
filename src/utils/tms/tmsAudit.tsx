export const getAuditLogs = async () => {
  const response = {
      "success": true,
      "message": "Success",
      "action": "view",
      "data": [
          {
              "id": 280,
              "company_id": "98",
              "user_id": "2436",
              "action": "update",
              "resource_type": "user_profiling",
              "old_values": [],
              "new_values": {
                  "extensionNumber": "20182",
                  "company_id": 98,
                  "displayName": "testmenow 8",
                  "iccid_number": null,
                  "company": null,
                  "update_user": true,
                  "shareLineAppearanceCssName": "CSS-PA-DXB",
                  "call_repetition": null,
                  "call_repetition_weekly": null,
                  "display": null,
                  "call_repetition_daily": null,
                  "allow_dncr": "0",
                  "allow_fac_info": "0",
                  "verify": true,
                  "mobile_user": "No",
                  "device_type": "CSF",
                  "client_transactionid": "tms-4cde8487de0448f49a19",
                  "userId": "testmenowahsan_S99",
                  "country": "Pakistan",
                  "department": "testmenoa",
                  "jobTitle": "testmenoa",
                  "companyName": null,
                  "firstName": "testmenow",
                  "lastName": "8",
                  "email": "ahsanbilal11@gmail.com",
                  "company_iccid_id": null,
                  "user_id": "2436"
              },
              "message": null,
              "ip_address": "192.168.30.134",
              "user_agent": "Mozilla\/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\/537.36 (KHTML, like Gecko) Chrome\/138.0.0.0 Safari\/537.36",
              "created_at": "2025-08-28T00:39:34.300000Z",
              "updated_at": "2025-08-28T00:39:34.300000Z",
              "user": {
                  "id": 2436,
                  "name": "testmenow 8",
                  "username": "testmenowahsan_S99",
                  "company": "XYZ FZ LLC",
                  "company_id": "98",
                  "phone_no": "20182",
                  "imagicle": null,
                  "notify_email": "ahsanbilal11@gmail.com",
                  "status": "1",
                  "blocked_permissions": null,
                  "extended_permissions": null,
                  "email": "testmenowahsan_S99@sipzon.com",
                  "email_verified_at": null,
                  "created_at": "2025-08-27T13:35:27.207000Z",
                  "updated_at": "2025-08-28T08:00:59.697000Z",
                  "guid": "ab1b771e-901f-4cae-8cbf-f3848e54fc21",
                  "domain": "default",
                  "user_type": "partner",
                  "job_title": "testmenoa",
                  "description": null,
                  "first_name": "testmenow",
                  "last_name": "8",
                  "country": "Pakistan",
                  "department": "testmenoa",
                  "password_changed_at": "2025-08-27 13:35:26.000",
                  "google2fa_secret": null,
                  "user_access_info": {
                      "permissions": []
                  }
              },
              "company": {
                  "id": 98,
                  "name": "XYZ FZ LLC",
                  "parent_id": null,
                  "created_at": "2025-07-23T11:48:47.443000Z",
                  "updated_at": "2025-07-23T15:04:55.887000Z",
                  "organization_unit": "OU=xyzllc,OU=customers,DC=sipzon,DC=com"
              }
          },
      ],
      "pagination": {
                "total": 3917,
                "limit": 10,
                "page": 1,
                "last_page": 392,
                "from": 1,
                "to": 10
            }
  }
  const requiredResponse = {
    "draw": 1,
    "recordsTotal": response?.pagination?.total || 0,
    "recordsFiltered": response?.pagination?.total || 0,
    "dataList": response?.data || [],
    "meta": response?.pagination || {}
  }
  return requiredResponse;
}