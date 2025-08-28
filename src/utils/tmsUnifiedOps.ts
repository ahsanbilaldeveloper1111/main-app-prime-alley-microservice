export const ListUnifiedOps = async () => {
  const response = {
      "success": true,
      "message": "Success",
      "action": "view",
      "data": [
          {
              "UserID": "yousaf",
              "TelephoneNumber": "9499",
              "Company": null,
              "Department": null,
              "AllowLocalDNCLCalls": "True",
              "AllowApiDNCLCalls": "True",
              "AllowRepetitiveCalls": "True",
              "IndividualRepetitiveCallsAllowDaily": "34",
              "IndividualRepetitiveCallsAllowWeekly": "0",
              "CallRepFollowCompSettings": "False",
              "CompanyRepetitiveCallsAllowDaily": "10",
              "CompanyRepetitiveCallsAllowWeekly": "0"
          },
          {
              "UserID": "wasiq_S99",
              "TelephoneNumber": null,
              "Company": null,
              "Department": null,
              "AllowLocalDNCLCalls": "True",
              "AllowApiDNCLCalls": "True",
              "AllowRepetitiveCalls": null,
              "IndividualRepetitiveCallsAllowDaily": null,
              "IndividualRepetitiveCallsAllowWeekly": null,
              "CallRepFollowCompSettings": null,
              "CompanyRepetitiveCallsAllowDaily": null,
              "CompanyRepetitiveCallsAllowWeekly": null
          },
          {
              "UserID": "wafiq9",
              "TelephoneNumber": "9863",
              "Company": "AL WAFIQ ELECTRONICS TRADING",
              "Department": "WAFIQ-BPO",
              "AllowLocalDNCLCalls": "False",
              "AllowApiDNCLCalls": "False",
              "AllowRepetitiveCalls": "False",
              "IndividualRepetitiveCallsAllowDaily": "0",
              "IndividualRepetitiveCallsAllowWeekly": "2",
              "CallRepFollowCompSettings": "True",
              "CompanyRepetitiveCallsAllowDaily": "0",
              "CompanyRepetitiveCallsAllowWeekly": "0"
          },
          {
              "UserID": "wafiq87",
              "TelephoneNumber": "9625",
              "Company": "AL WAFIQ ELECTRONICS TRADING",
              "Department": "WAFIQ-KBO",
              "AllowLocalDNCLCalls": "False",
              "AllowApiDNCLCalls": "False",
              "AllowRepetitiveCalls": "False",
              "IndividualRepetitiveCallsAllowDaily": "0",
              "IndividualRepetitiveCallsAllowWeekly": "0",
              "CallRepFollowCompSettings": "False",
              "CompanyRepetitiveCallsAllowDaily": "0",
              "CompanyRepetitiveCallsAllowWeekly": "0"
          },
          {
              "UserID": "wafiq84",
              "TelephoneNumber": "9629",
              "Company": "AL WAFIQ ELECTRONICS TRADING",
              "Department": "WAFIQ-KAM",
              "AllowLocalDNCLCalls": "True",
              "AllowApiDNCLCalls": "False",
              "AllowRepetitiveCalls": "False",
              "IndividualRepetitiveCallsAllowDaily": "0",
              "IndividualRepetitiveCallsAllowWeekly": "0",
              "CallRepFollowCompSettings": "False",
              "CompanyRepetitiveCallsAllowDaily": "0",
              "CompanyRepetitiveCallsAllowWeekly": "0"
          },
          {
              "UserID": "wafiq8",
              "TelephoneNumber": "9868",
              "Company": "AL WAFIQ ELECTRONICS TRADING",
              "Department": "WAFIQ-BPO",
              "AllowLocalDNCLCalls": "False",
              "AllowApiDNCLCalls": "False",
              "AllowRepetitiveCalls": "False",
              "IndividualRepetitiveCallsAllowDaily": "0",
              "IndividualRepetitiveCallsAllowWeekly": "0",
              "CallRepFollowCompSettings": "False",
              "CompanyRepetitiveCallsAllowDaily": "0",
              "CompanyRepetitiveCallsAllowWeekly": "0"
          },
          {
              "UserID": "wafiq77",
              "TelephoneNumber": "9656",
              "Company": "NA",
              "Department": "NA",
              "AllowLocalDNCLCalls": "False",
              "AllowApiDNCLCalls": "False",
              "AllowRepetitiveCalls": "False",
              "IndividualRepetitiveCallsAllowDaily": "0",
              "IndividualRepetitiveCallsAllowWeekly": "0",
              "CallRepFollowCompSettings": "False",
              "CompanyRepetitiveCallsAllowDaily": "0",
              "CompanyRepetitiveCallsAllowWeekly": "0"
          },
          {
              "UserID": "wafiq71",
              "TelephoneNumber": "9667",
              "Company": "AL WAFIQ ELECTRONICS TRADING",
              "Department": "WAFIQ-KAM",
              "AllowLocalDNCLCalls": "False",
              "AllowApiDNCLCalls": "False",
              "AllowRepetitiveCalls": "False",
              "IndividualRepetitiveCallsAllowDaily": "0",
              "IndividualRepetitiveCallsAllowWeekly": "0",
              "CallRepFollowCompSettings": "False",
              "CompanyRepetitiveCallsAllowDaily": "0",
              "CompanyRepetitiveCallsAllowWeekly": "0"
          },
          {
              "UserID": "wafiq70",
              "TelephoneNumber": "9668",
              "Company": "AL WAFIQ ELECTRONICS TRADING",
              "Department": "WAFIQ-KBO",
              "AllowLocalDNCLCalls": "False",
              "AllowApiDNCLCalls": "False",
              "AllowRepetitiveCalls": "False",
              "IndividualRepetitiveCallsAllowDaily": "0",
              "IndividualRepetitiveCallsAllowWeekly": "0",
              "CallRepFollowCompSettings": "False",
              "CompanyRepetitiveCallsAllowDaily": "0",
              "CompanyRepetitiveCallsAllowWeekly": "0"
          },
          {
              "UserID": "wafiq7",
              "TelephoneNumber": "9871",
              "Company": "AL WAFIQ ELECTRONICS TRADING",
              "Department": "WAFIQ-MGMT",
              "AllowLocalDNCLCalls": "False",
              "AllowApiDNCLCalls": "False",
              "AllowRepetitiveCalls": "False",
              "IndividualRepetitiveCallsAllowDaily": "0",
              "IndividualRepetitiveCallsAllowWeekly": "0",
              "CallRepFollowCompSettings": "False",
              "CompanyRepetitiveCallsAllowDaily": "0",
              "CompanyRepetitiveCallsAllowWeekly": "0"
          }
      ],
      "pagination": {
          "total": 4552,
          "limit": 10,
          "page": 1,
          "last_page": 456,
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