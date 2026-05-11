import { toast } from "react-toastify";
import axiosInstance from "./axios";


  export const GetTranscriptions = async (uuid: string) => {
    try {
        
      const response = await axiosInstance.post(
        `aiml/transcriptions`,
        {
          uuid
        }
      );

      
      if(response.data){
        const responseData = response.data;
        return responseData;
      }else{
        toast.error('Failed to get transcriptions');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };

export const GetTranslations = async (uuid: string, target_lang?: string) => {
  try {
    const response = await axiosInstance.post(`aiml/translations`, {
      uuid,
      ...(target_lang && { target_lang })
    });

    if(response.data){
      const responseData = response.data;
    return responseData;
    }else{
      toast.error('Failed to get translations');
      return false;
    }
  } catch (error) {
    console.log(error, "error get translations");
    throw error;
  }
};


export const GetCallAnalysis = async (date: string, localPartyNumber: string, ownerUsername: string, uuid: string) => {
  try {
    const response = await axiosInstance.post(`aiml/transcriptions-analysis`, {
      date,
      localPartyNumber,
      ownerUsername,
      uuid
    });

    if(response.data){
      const responseData = response.data;
      return responseData;
    }else{
      toast.error('Failed to get call analysis');
      return false;
    }
  } catch (error) {
    throw error;
  }
};

export const GetFilteredData = async (params: any) => {
  const { page = 1, perPage = 15, search = "", ...filters } = params;

  const sampleResponse ={
    "draw": 1,
    "recordsTotal": 132,
    "recordsFiltered": 132,
    "dataList": [
      {
        "id": 132,
        "uuid": "a9ca9474-0070-4d7f-9cd1-23047c58a184",
        "recording_date": "2025-10-28",
        "transcription": " Hello, good afternoon.  Good afternoon.  This is Mehreen from Trimely Technology.  How are you doing?  Not bad.  How are you?  I'm good.  Thank you for asking.  We are an IT-based company, and I'm  reaching out to discuss a business proposal regarding  cloud-based calling solutions.  No, we don't need that right now.  I think I had a call with you some time back also.  Sorry?  I think we spoke some time back also.  I don't think we need this service right now.  All right, no problem.  If you could please provide the email address.  I can share the details there in case you may need in future.  No, I can reach out to you guys.  What's the company name?  It's Trimely.  P-R-I-M-E-Prime-L-A.  Yeah, or if you need, we'd definitely reach out to you.  All right.  Thank you so much.  Have a good day.  No problem.  All right, bye-bye.  Bye.",
        "transcript_chunks": null,
        "analysis": {
          "sentiment": "neutral",
          "customer_intent": "Declining a business proposal",
          "key_topics": [
            "business proposal",
            "cloud-based calling solutions",
            "previous interaction"
          ],
          "action_items": [
            "No follow-up required as the client declined the proposal."
          ],
          "entities_customer": [
            {
              "name": null,
              "email": null,
              "phone": null
            }
          ],
          "customer_emotions": [
            "disinterest"
          ],
          "operator_emotions": [
            "professional",
            "polite"
          ],
          "call_categories": [
            "Sales",
            "Inquiry"
          ],
          "resolution_status": "resolved",
          "follow_up_required": false,
          "summary": "The operator introduced a business proposal for cloud-based calling solutions, but the client declined the offer, stating they do not need the service at this time. The conversation ended politely with no follow-up required.",
          "domain_specific_analysis": {
            "localPartyNumber": "pa21",
            "ownerUsername": "554",
            "transcription": [
              {
                "speaker": "Operator",
                "text": "Hello, good afternoon.",
                "start": "0.24",
                "end": "2.24"
              },
              {
                "speaker": "Client",
                "text": "Good afternoon.",
                "start": "2.24",
                "end": "3.84"
              },
              {
                "speaker": "Operator",
                "text": "This is Mehreen from Trimely Technology.",
                "start": "3.84",
                "end": "6.12"
              },
              {
                "speaker": "Operator",
                "text": "How are you doing?",
                "start": "6.12",
                "end": "7.63"
              },
              {
                "speaker": "Client",
                "text": "Not bad.",
                "start": "7.63",
                "end": "8.13"
              },
              {
                "speaker": "Operator",
                "text": "How are you?",
                "start": "8.13",
                "end": "10.35"
              },
              {
                "speaker": "Client",
                "text": "I'm good.",
                "start": "10.35",
                "end": "10.87"
              },
              {
                "speaker": "Client",
                "text": "Thank you for asking.",
                "start": "10.87",
                "end": "11.83"
              },
              {
                "speaker": "Operator",
                "text": "We are an IT-based company, and I'm reaching out to discuss a business proposal regarding",
                "start": "11.83",
                "end": "13.87"
              },
              {
                "speaker": "Operator",
                "text": "cloud-based calling solutions.",
                "start": "13.87",
                "end": "16.93"
              },
              {
                "speaker": "Client",
                "text": "No, we don't need that right now.",
                "start": "16.93",
                "end": "20.18"
              },
              {
                "speaker": "Client",
                "text": "I think I had a call with you some time back also.",
                "start": "20.18",
                "end": "22.46"
              },
              {
                "speaker": "Operator",
                "text": "Sorry?",
                "start": "22.46",
                "end": "27.51"
              },
              {
                "speaker": "Client",
                "text": "I think we spoke some time back also.",
                "start": "27.51",
                "end": "28.9"
              },
              {
                "speaker": "Client",
                "text": "I don't think we need this service right now.",
                "start": "28.9",
                "end": "30.82"
              },
              {
                "speaker": "Operator",
                "text": "All right, no problem.",
                "start": "30.82",
                "end": "34.31"
              },
              {
                "speaker": "Operator",
                "text": "If you could please provide the email address.",
                "start": "34.31",
                "end": "35.87"
              },
              {
                "speaker": "Operator",
                "text": "I can share the details there in case you may need in future.",
                "start": "35.87",
                "end": "38.55"
              },
              {
                "speaker": "Client",
                "text": "No, I can reach out to you guys.",
                "start": "38.55",
                "end": "43.19"
              },
              {
                "speaker": "Client",
                "text": "What's the company name?",
                "start": "43.19",
                "end": "44.59"
              },
              {
                "speaker": "Operator",
                "text": "It's Trimely.",
                "start": "44.59",
                "end": "46.92"
              },
              {
                "speaker": "Operator",
                "text": "P-R-I-M-E-Prime-L-A.",
                "start": "46.92",
                "end": "48.52"
              },
              {
                "speaker": "Operator",
                "text": "Yeah, or if you need, we'd definitely reach out to you.",
                "start": "48.52",
                "end": "51.24"
              },
              {
                "speaker": "Operator",
                "text": "All right.",
                "start": "51.24",
                "end": "55.32"
              },
              {
                "speaker": "Operator",
                "text": "Thank you so much.",
                "start": "55.32",
                "end": "56.76"
              },
              {
                "speaker": "Operator",
                "text": "Have a good day.",
                "start": "56.76",
                "end": "57.8"
              },
              {
                "speaker": "Client",
                "text": "No problem.",
                "start": "57.8",
                "end": "58.68"
              },
              {
                "speaker": "Operator",
                "text": "All right, bye-bye.",
                "start": "58.68",
                "end": "59.18"
              },
              {
                "speaker": "Client",
                "text": "Bye.",
                "start": "59.18",
                "end": "60.8"
              }
            ],
            "extracted_qualification_fields": {
              "Need Description": "cloud-based calling solutions",
              "Budget or Cost Expectation": "null",
              "Timeline or Urgency": "null",
              "Use Case or Purpose": "null",
              "New vs Existing Solution": "null",
              "Decision Maker Status": "null",
              "Competitor Consideration": "null",
              "Support or Service Expectations": "null",
              "Preferred Communication Channel": "null",
              "Follow-up Interest": "no"
            },
            "qualified": false,
            "matched_fields_count": 2,
            "completion_percent": 20,
            "summary_data": {
              "summary": "Mehreen from Trimely Technology reached out to discuss cloud-based calling solutions, but the contact expressed that they do not currently need such services and also mentioned having spoken previously. Mehreen offered to email the details for future reference, but the contact insisted they would reach out if needed.",
              "interaction_type": "Follow-up",
              "main_topic": "Cloud-based calling solutions",
              "tags": [
                {
                  "good_lead": false,
                  "good_lead_percentage": "0",
                  "good_lead_description": "The contact declined the proposal outright, stating 'No, we don't need that right now.'"
                },
                {
                  "fast_buyer": false,
                  "fast_buyer_percentage": "0",
                  "fast_buyer_description": "There was no indication of urgency or intent to purchase, as the contact said they did not need the service now and had no plans to engage."
                },
                {
                  "big_budget_buyer": false,
                  "big_budget_buyer_percentage": "0",
                  "big_budget_buyer_description": "The contact did not express any interest in premium models or high-budget solutions, simply stating they don't need the service."
                },
                {
                  "negative_feedback": false,
                  "negative_feedback_percentage": "0",
                  "negative_feedback_description": "The contact did not provide critical feedback but rather noted they had no need for the service at this time."
                },
                {
                  "not_a_lead": true,
                  "not_a_lead_percentage": "100",
                  "not_a_lead_description": "The contact stated they would not require the service and preferred to reach out if necessary."
                }
              ]
            },
            "domain_specific_duration": 36.81,
            "transcription_exec_time": 2.54
          }
        },
        "created_at": "2025-10-28T15:20:27.952663Z",
        "local_party": 39
      }
    ],
    "meta": {
      "current_page": 1,
      "total": 132,
      "per_page": 1,
      "last_page": 132,
      "next_page_url": "http://192.168.26.20:8000/api/analysis-filteration/filter/?page=2&per_page=1",
      "prev_page_url": null,
      "from": 1,
      "to": 1
    }
  };
  // TODO: Remove this sample response when API is ready
  // return sampleResponse;

  try {
    const requestParams = {
      page,
      per_page: perPage,
      ...(search && { search }),
      ...filters
    };

    return sampleResponse;
    const response = await axiosInstance.post(`aiml/filter`, requestParams);

    if(response.data){
      const responseData = response.data;
      // Transform response to match GenericListPage expected format if needed
      if (responseData.dataList && responseData.meta) {
        return responseData;
      }
      // If response has different structure, transform it
      return {
        dataList: responseData.dataList || responseData.data || [],
        meta: responseData.meta || {
          current_page: page,
          total: responseData.total || responseData.recordsTotal || 0,
          per_page: perPage,
          last_page: responseData.last_page || Math.ceil((responseData.total || responseData.recordsTotal || 0) / perPage)
        },
        total: responseData.total || responseData.recordsTotal || 0,
        last_page: responseData.last_page || Math.ceil((responseData.total || responseData.recordsTotal || 0) / perPage),
        current_page: responseData.current_page || page,
        per_page: responseData.per_page || perPage
      };
    }else{
      toast.error('Failed to get filtered data');
      return {
        dataList: [],
        meta: {
          current_page: page,
          total: 0,
          per_page: perPage,
          last_page: 0
        }
      };
    }
  } catch (error) {
    console.error('GetFilteredData error:', error);
    throw error;
  }
};



interface PaginationParams {
  page?: number;
  perPage?: number;
  search?: string;
  draw?: number;
  filters?: any;
  isExport?: boolean;
  exportType?: string;
  reportType?: string;
  moduleSlug?: string;
}

export const ListCallLogs = async (params: PaginationParams = {}, endpoint: string) => {
  try {
    const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, isExport = false, exportType = '', reportType = '', moduleSlug = '' } = params;
    
    // Create base query parameters
    const queryParams = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
      search: search,
      draw: draw.toString(),
      isExport: isExport.toString(),
      exportType: exportType,
      reportType: reportType,
      moduleSlug: moduleSlug
    });
    
    // Flatten filters and add each key-value pair as separate query parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Handle arrays by converting them to JSON strings for proper format
        if (Array.isArray(value)) {
          queryParams.append(key, JSON.stringify(value));
        }
        // Handle objects by converting them to JSON strings
        else if (typeof value === 'object') {
          queryParams.append(key, JSON.stringify(value));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    if(isExport === true){
      const response = await axiosInstance.get(`${endpoint}?${queryParams.toString()}`, {
        responseType: 'blob',
        headers: {
          'Accept': exportType === 'xlsx' 
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/octet-stream, */*'
            : 'audio/*, application/octet-stream, */*'
        }
      });

      return response.data;
    } else {
      const response = await axiosInstance.get(`${endpoint}?${queryParams.toString()}`);
      //console.log('response call logs:', response);
      return response.data;
     
    }
  } catch (error) {
    throw error;
  }
};


export const GetImagicalTranscriptions = async (params: any = {}) => {
  try {
    const { page = 1, limit = 15, search = "", start_datetime = '', end_datetime = '', filters = {} } = params;

    // Build query parameters manually to handle arrays correctly
    // Use a Map to ensure each key appears only once
    const paramsMap = new Map<string, string>();
    
    // Add base parameters
    paramsMap.set('page', page.toString());
    paramsMap.set('limit', limit.toString());
    if (search) paramsMap.set('search', search);
    // Always include datetime parameters (they have fallback values in the calling function)
    if (start_datetime) paramsMap.set('start_datetime', start_datetime);
    if (end_datetime) paramsMap.set('end_datetime', end_datetime);
    
    // Handle filters - convert arrays to JSON strings
    // Skip keys that are already in the base parameters
    const baseKeys = new Set(['page', 'perPage', 'search', 'start_datetime', 'end_datetime']);
    
    Object.entries(filters).forEach(([key, value]) => {
      // Skip if already in base parameters
      if (baseKeys.has(key)) {
        return;
      }
      
      // Skip if value is invalid (but allow empty strings for some fields if needed)
      if (value === undefined || value === null) {
        return;
      }
      
      // Skip if it's an empty array
      if (Array.isArray(value) && value.length === 0) {
        return;
      }
      
      // Skip empty strings (but this should not affect local_parties or direction if they have values)
      if (typeof value === 'string' && value.trim() === '') {
        return;
      }
      
      // Handle arrays by converting them to JSON strings for proper format
      if (Array.isArray(value)) {
        paramsMap.set(key, JSON.stringify(value));
      }
      // Handle objects by converting them to JSON strings
      else if (typeof value === 'object') {
        paramsMap.set(key, JSON.stringify(value));
      } else {
        paramsMap.set(key, value.toString());
      }
    });
    
    // Convert Map to URLSearchParams (this ensures no duplicates)
    const queryParams = new URLSearchParams();
    paramsMap.forEach((value, key) => {
      queryParams.set(key, value);
    });

    const response = await axiosInstance.get(`aiml/imagical-transcriptions?${queryParams.toString()}`);
    if(response.data){
      const responseData = response.data;
      return responseData;
    }else{
      toast.error('Failed to get transcriptions');
      return false;
    }
    
  } catch (error) {
    throw error;
  }
};

// ==================== Imagicle Trigger ====================

/**
 * GET imagicle-trigger/extensions?imagicles=node1,node2
 * @param imagicles - Array of node names e.g. ["node1", "node2"]
 */
export const getImagicleTriggerExtensions = async (imagicles: string[]) => {
  const imagiclesQuery = Array.isArray(imagicles) ? imagicles.join(',') : '';
  const response = await axiosInstance.get('aiml/imagicle-trigger/extensions', {
    params: { imagicles: imagiclesQuery }
  });
  return response.data;
};

/**
 * POST imagicle-trigger/update
 * @param payload - { imagicles: string[], extension_numbers: number[] }
 */
export const updateImagicleTrigger = async (payload: {
  imagicles: string[];
  extension_numbers: number[];
}) => {
  const response = await axiosInstance.post('aiml/imagicle-trigger/update', payload);
  return response.data;
};
