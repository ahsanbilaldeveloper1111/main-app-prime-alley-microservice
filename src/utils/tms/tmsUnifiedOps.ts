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