
export const getCiscoPbxUsers = async () => {
      const response = {
            "success": true,
            "message": "Success",
            "action": "view",
            "data": [
                {
                    "ClusterName": "SIPZON",
                    "firstName": "DICO",
                    "middleName": "",
                    "lastName": "User 100",
                    "emMaxLoginTime": null,
                    "userid": "100",
                    "mailid": "",
                    "department": "",
                    "manager": "",
                    "userLocale": "",
                    "primaryExtensionPattern": "",
                    "routePartitionName": "",
                    "associatedPc": "",
                    "enableCti": "true",
                    "subscribeCallingSearchSpaceName": "",
                    "enableMobility": "false",
                    "remoteDestinationLimit": "4",
                    "status": "1",
                    "homeCluster": "false",
                    "imAndPresenceEnable": "false",
                    "serviceProfile": ""
                }
            ],
            "pagination": {
                "total": 3917,
                "limit": 10,
                "page": 1,
                "last_page": 392,
                "from": 1,
                "to": 10
            }
      };
     const requiredResponse = {
        "draw": 1,
        "recordsTotal": response.pagination.total,
        "recordsFiltered": response.pagination.total,
        "dataList": response.data,
        "meta": response.pagination
    }
    return requiredResponse;
}

export const getCiscoPbxUsersDirectory = async () => {
      const response = {
            "success": true,
            "message": "Success",
            "action": "view",
            "data": [
                {
                    "id": 10,
                    "ClusterName": "SIPZON.MOBI",
                    "name": "SIPZON6",
                    "ldapDn": "ldap@sipzon.com",
                    "userSearchBase": "ou=toyota, ou=customers, dc=sipzon, dc=com",
                    "repeatable": "1",
                    "intervalValue": "6",
                    "scheduleUnit": "HOUR",
                    "nextExecTime": "2025-08-12 00:00:00.0000000",
                    "accessControlGroup": "",
                    "CreatedDate": "2025-08-04 18:36:17.2500000",
                    "ModifiedDate": "2025-08-04 18:36:17.2500000",
                    "IsActive": "1"
                }
            ],
            "pagination": {
                "total": 10,
                "limit": 10,
                "page": 1,
                "last_page": 1,
                "from": 1,
                "to": 10
            }
        };
      const requiredResponse = {
        "draw": 1,
        "recordsTotal": response.pagination.total,
        "recordsFiltered": response.pagination.total,
        "dataList": response.data,
        "meta": response.pagination
    }
    return requiredResponse;
}

export const ListAppUsers = async () => {
      const response = {
            "success": true,
            "message": "Success",
            "action": "view",
            "data": [
                {
                    "ClusterName": "SIPZON",
                    "userid": "webdialerauth",
                    "presenceGroupName": "Standard Presence group",
                    "acceptPresenceSubscription": "false",
                    "acceptOutOfDialogRefer": "false",
                    "acceptUnsolicitedNotification": "false",
                    "allowReplaceHeader": "false",
                    "isStandard": "false"
                }
            ],
            "pagination": {
                "total": 40,
                "limit": 10,
                "page": 1,
                "last_page": 4,
                "from": 1,
                "to": 10
            }
        };
      const requiredResponse = {
        "draw": 1,
        "recordsTotal": response.pagination.total,
        "recordsFiltered": response.pagination.total,
        "dataList": response.data,
        "meta": response.pagination
    }
    return requiredResponse;
}

export const ListCustomUsers = async () => {
      const response = {
            "success": true,
            "message": "Success",
            "action": "view",
            "data": [
                {
                    "ClusterName": "SIPZON.MOBI",
                    "userid": "5gtech43",
                    "firstname": "5Gtech",
                    "lastname": "Agent 43",
                    "controlledDevice": null,
                    "associatedDevice": null,
                    "PermissionGroup": null,
                    "ownedDevice": null,
                    "directoryNumber": null,
                    "partition": null,
                    "controlledDevice_DN": null,
                    "controlledDevice_Partition": null,
                    "associatedDevice_DN": null,
                    "associatedDevice_Partition": null,
                    "ownedDeviceDN": null,
                    "ownedDevicePartition": null
                }
            ],
            "pagination": {
                "total": 7956,
                "limit": 10,
                "page": 1,
                "last_page": 796,
                "from": 1,
                "to": 10
            }
        };
      const requiredResponse = {
        "draw": 1,
        "recordsTotal": response.pagination.total,
        "recordsFiltered": response.pagination.total,
        "dataList": response.data,
        "meta": response.pagination
    }
    return requiredResponse;
}

export const ListFacilitiesInfo = async () => {
      const response = {
            "success": true,
            "message": "Success",
            "action": "view",
            "data": [
                {
                    "ClusterName": "SIPZON.MOBI",
                    "name": "Mob-Cluster-FAC",
                    "code": "12345",
                    "authorizationLevel": "1"
                }
            ],
            "pagination": {
                "total": 22,
                "limit": 10,
                "page": 1,
                "last_page": 3,
                "from": 1,
                "to": 10
            }
        };
      const requiredResponse = {
        "draw": 1,
        "recordsTotal": response.pagination.total,
        "recordsFiltered": response.pagination.total,
        "dataList": response.data,
        "meta": response.pagination
    }
    return requiredResponse;
}

export const ListRecordingProfile = async () => {
      const response = {
            "success": true,
            "message": "Success",
            "action": "view",
            "data": [
                {
                    "id": 6,
                    "ClusterName": "SIPZON.MOBI",
                    "name": "Imagicle_Recording_Profile",
                    "recordingCssName": "",
                    "recorderDestination": "8500",
                    "created_at": "2025-07-07T17:56:12.703000Z",
                    "updated_at": "2025-07-07T17:56:12.703000Z"
                }
            ],
            "pagination": {
                "total": 6,
                "limit": 10,
                "page": 1,
                "last_page": 1,
                "from": 1,
                "to": 6
            }
        };
      const requiredResponse = {
        "draw": 1,
        "recordsTotal": response.pagination.total,
        "recordsFiltered": response.pagination.total,
        "dataList": response.data,
        "meta": response.pagination
    }
    return requiredResponse;
}

export const ListRemoteDestination = async () => {
      const response = {
        "success": true,
        "message": "Success",
        "action": "view",
        "data": [
            {
                "ClusterName": "SIPZON",
                "name": "RD_Rizwan",
                "destination": "##01511",
                "answerTooSoonTimer": "1500",
                "answerTooLateTimer": "19000",
                "delayBeforeRingingCell": "0",
                "remoteDestinationProfileName": "RDP_Rizwan",
                "ctiRemoteDeviceName": "",
                "dualModeDeviceName": "",
                "isMobilePhone": "true",
                "enableMobileConnect": "true",
                "timeZone": "Etc\/GMT",
                "todAccessName": "TOD-RD-8c8984b6-39ef-792d-e382-07dd4aaf4a1b",
                "mobileSmartClientName": "",
                "mobilityProfileName": "",
                "singleNumberReachVoicemail": "Use System Default",
                "dialViaOfficeReverseVoicemail": "Use System Default",
                "created_at": "2025-06-29T14:03:16.617000Z",
                "updated_at": "2025-06-29T14:03:16.617000Z"
            }
        ],
        "pagination": {
            "total": 3,
            "limit": 10,
            "page": 1,
            "last_page": 1,
            "from": 1,
            "to": 3
        }
    };
      const requiredResponse = {
        "draw": 1,
        "recordsTotal": response.pagination.total,
        "recordsFiltered": response.pagination.total,
        "dataList": response.data,
        "meta": response.pagination
    }
    return requiredResponse;
}

export const ListRemoteDestinationProfile = async () => {
      const response = {
        "success": true,
        "message": "Success",
        "action": "view",
        "data": [
            {
                "ClusterName": "SIPZON",
                "name": "RDP_Rizwan",
                "description": "Rizwan Haider - RDP",
                "product": "Remote Destination Profile",
                "model": "Remote Destination Profile",
                "class": "Remote Destination Profile",
                "protocol": "Remote Destination",
                "protocolSide": "User",
                "callingSearchSpaceName": "",
                "devicePoolName": "Default",
                "networkHoldMohAudioSourceId": "",
                "userHoldMohAudioSourceId": "",
                "callInfoPrivacyStatus": "Default",
                "userId": "rizwan",
                "ignorePresentationIndicators": "false",
                "rerouteCallingSearchSpaceName": "CSS-CUCM-To-Teams",
                "cgpnTransformationCssName": "",
                "automatedAlternateRoutingCssName": "",
                "useDevicePoolCgpnTransformCss": "true",
                "userLocale": "",
                "networkLocale": "",
                "primaryPhoneName": "",
                "dndOption": "Call Reject",
                "dndStatus": "false",
                "mobileSmartClientProfileName": "",
                "created_at": "2025-06-29T14:03:23.487000Z",
                "updated_at": "2025-06-29T14:03:23.487000Z"
            }
        ],
        "pagination": {
            "total": 3,
            "limit": 10,
            "page": 1,
            "last_page": 1,
            "from": 1,
            "to": 3
        }
    };
      const requiredResponse = {
        "draw": 1,
        "recordsTotal": response.pagination.total,
        "recordsFiltered": response.pagination.total,
        "dataList": response.data,
        "meta": response.pagination
    }
    return requiredResponse;
}

export const ListLine = async () => {
      const response = {
        "success": true,
        "message": "Success",
        "action": "view",
        "data": [
            {
                "ClusterName": "SIPZON.MOBI",
                "pattern": "511",
                "description": "",
                "usage": "Device",
                "routePartitionName": "",
                "autoAnswer": "Auto Answer Off",
                "networkHoldMohAudioSourceId": null,
                "userHoldMohAudioSourceId": null,
                "alertingName": "",
                "asciiAlertingName": "",
                "presenceGroupName": "Standard Presence group",
                "shareLineAppearanceCssName": "",
                "voiceMailProfileName": "",
                "partyEntranceTone": "Default",
                "allowCtiControlFlag": null,
                "rejectAnonymousCall": null,
                "externalCallControlProfile": null
            }
        ],
        "pagination": {
            "total": 6916,
            "limit": 10,
            "page": 1,
            "last_page": 692,
            "from": 1,
            "to": 10
        }
    };
      const requiredResponse = {
        "draw": 1,
        "recordsTotal": response.pagination.total,
        "recordsFiltered": response.pagination.total,
        "dataList": response.data,
        "meta": response.pagination
    }
    return requiredResponse;
}

export const ListPhone = async () => {
      const response = {
        "success": true,
        "message": "Success",
        "action": "view",
        "data": [
            {
                "ClusterName": "SIPZON.MOBI",
                "name": "TCT-TAX",
                "description": "stalwart - Ext - 6601",
                "product": "Cisco Dual Mode for iPhone",
                "model": "Cisco Dual Mode for iPhone",
                "class": "Phone",
                "protocol": "SIP",
                "protocolSide": "User",
                "callingSearchSpaceName": "",
                "devicePoolName": "Default",
                "commonDeviceConfigName": "",
                "commonPhoneConfigName": "Standard Common Phone Profile",
                "networkLocation": "Use System Default",
                "locationName": "Hub_None",
                "mediaResourceListName": "",
                "networkHoldMohAudioSourceId": "",
                "userHoldMohAudioSourceId": "",
                "securityProfileName": "Cisco Dual Mode for iPhone - Standard SIP Non-Secure Profile",
                "sipProfileName": "Standard SIP Profile",
                "cgpnTransformationCssName": "",
                "useDevicePoolCgpnTransformCss": "true",
                "phoneTemplateName": "Standard Dual Mode for iPhone",
                "userLocale": "",
                "networkLocale": "",
                "softkeyTemplateName": "",
                "loginUserId": "",
                "enableExtensionMobility": "false",
                "currentProfileName": "",
                "loginTime": "",
                "loginDuration": "",
                "builtInBridgeStatus": "On",
                "ownerUserName": "",
                "subscribeCallingSearchSpaceName": "",
                "rerouteCallingSearchSpaceName": "",
                "allowCtiControlFlag": "true",
                "digestUser": "",
                "mraServiceDomain": "",
                "allowMraMode": "false"
            }
        ],
        "pagination": {
            "total": 6011,
            "limit": 10,
            "page": 1,
            "last_page": 602,
            "from": 1,
            "to": 10
        }
    };
    const requiredResponse = {
        "draw": 1,
        "recordsTotal": response.pagination.total,
        "recordsFiltered": response.pagination.total,
        "dataList": response.data,
        "meta": response.pagination
    }
    return requiredResponse;
    
}

export const ListSipTrunks = async () => {
  const response = {
    "success": true,
    "message": "Success",
    "action": "view",
    "data": [
        {
            "ClusterName": "SIPZON.MOBI",
            "name": "Imagicle_Recording_Trunk",
            "description": "Imagicle Recording Trunk",
            "product": "SIP Trunk",
            "model": "SIP Trunk",
            "class": "Trunk",
            "protocol": "SIP",
            "protocolSide": "Network",
            "callingSearchSpaceName": "",
            "devicePoolName": "Default",
            "networkLocation": "OnNet",
            "locationName": "Hub_None",
            "mediaResourceListName": "",
            "networkHoldMohAudioSourceId": "0",
            "userHoldMohAudioSourceId": "0",
            "securityProfileName": "Imagicle Recording SIP Trunk Profile",
            "sipProfileName": "Imagicle Recording SIP Profile",
            "cgpnTransformationCssName": "",
            "useDevicePoolCgpnTransformCss": "1",
            "subscribeCallingSearchSpaceName": "",
            "rerouteCallingSearchSpaceName": "",
            "referCallingSearchSpaceName": "",
            "mtpRequired": "0",
            "dtmfSignalingMethod": "RFC 2833",
            "routeClassSignalling": "Default",
            "sipTrunkType": "None(Default)",
            "runOnEveryNode": "1"
        }
    ],
    "pagination": {
        "total": 85,
        "limit": 10,
        "page": 1,
        "last_page": 9,
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

export const ListTranslationPatterns = async () => {
  const response = {
    "success": true,
    "message": "Success",
    "action": "view",
    "data": [
        {
            "ClusterName": "SIPZON.MOBI",
            "pattern": "##5011XX.!",
            "description": "SIP or PRI",
            "usage": "Translation",
            "routePartitionName": "IN-CSF-Z",
            "blockEnable": "false",
            "calledPartyTransformationMask": "",
            "callingPartyTransformationMask": "",
            "useCallingPartyPhoneMask": "Off",
            "callingPartyPrefixDigits": "",
            "digitDiscardInstructionName": "PreDot",
            "patternUrgency": "true",
            "prefixDigitsOut": "",
            "callingLinePresentationBit": "Default",
            "callingNamePresentationBit": "Default",
            "connectedLinePresentationBit": "Default",
            "connectedNamePresentationBit": "Default",
            "provideOutsideDialtone": "false",
            "callingPartyNumberingPlan": "Cisco CallManager",
            "callingPartyNumberType": "Cisco CallManager",
            "calledPartyNumberingPlan": "Cisco CallManager",
            "calledPartyNumberType": "Cisco CallManager",
            "callingSearchSpaceName": "",
            "routeNextHopByCgpn": "false",
            "useOriginatorCss": "true"
        }
    ],
    "pagination": {
        "total": 17,
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

export const ListDeviePool = async () => {
  const response = {
    "success": true,
    "message": "Success",
    "action": "view",
    "data": [
        {
            "ClusterName": "SIPZON.MOBI",
            "name": "Default",
            "dateTimeSettingName": "CMLocal",
            "callManagerGroupName": "Default",
            "mediaResourceListName": "",
            "regionName": "Default",
            "networkLocale": "",
            "srstName": "Disable",
            "locationName": "",
            "cgpnTransformationCssName": "",
            "cdpnTransformationCssName": "",
            "localRouteGroupName": "",
            "mraServiceDomain": ""
        }
    ],
    "pagination": {
        "total": 8,
        "limit": 10,
        "page": 1,
        "last_page": 1,
        "from": 1,
        "to": 8
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

export const ListLocation = async () => {
  const response = {
    "success": true,
    "message": "Success",
    "action": "view",
    "data": [
        {
            "ClusterName": "SIPZON.MOBI",
            "name": "Shadow",
            "id": -2,
            "withinAudioBandwidth": "0",
            "withinVideoBandwidth": "0",
            "withinImmersiveKbits": "0"
        }
    ],
    "pagination": {
        "total": 9,
        "limit": 10,
        "page": 1,
        "last_page": 1,
        "from": 1,
        "to": 9
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

export const ListRoutePartition = async () => {
  const response = {
    "success": true,
    "message": "Success",
    "action": "view",
    "data": [
        {
            "ClusterName": "SIPZON.MOBI",
            "name": "ZMED-Z",
            "description": "ZAIN MEDICAL SUPPLIES TRADING LLC",
            "dialPlanWizardGenId": "",
            "timeScheduleIdName": "",
            "useOriginatingDeviceTimeZone": "true",
            "timeZone": "Etc\/GMT",
            "partitionUsage": "General"
        }
    ],
    "pagination": {
        "total": 581,
        "limit": 10,
        "page": 1,
        "last_page": 59,
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

export const ListCSS= async () => {
  const response = {
    "success": true,
    "message": "Success",
    "action": "view",
    "data": [
        {
            "id": 619,
            "ClusterName": "SIPZON.MOBI",
            "name": "CSS_Cust1_Line1_Out",
            "description": "",
            "partitionUsage": "General"
        }
    ],
    "pagination": {
        "total": 365,
        "limit": 10,
        "page": 1,
        "last_page": 37,
        "from": 1,
        "to": 10
    }
};
  const requiredResponse = {
    "draw": 1,
    "recordsTotal": response.pagination.total,
    "recordsFiltered": response.pagination.total,
    "dataList": response.data,
    "meta": response.pagination
  }
  return requiredResponse;
}

export const LisrRegion = async () => {
  const response = {
    "success": true,
    "message": "Success",
    "action": "view",
    "data": [
        {
            "ClusterName": "SIPZON.MOBI",
            "name": "Default",
            "defaultCodec": ""
        }
    ],
    "pagination": {
        "total": 4,
        "limit": 10,
        "page": 1,
        "last_page": 1,
        "from": 1,
        "to": 4
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

export const ListRoutePattern= async () => {
  const response = {
    "success": true,
    "message": "Success",
    "action": "view",
    "data": [
        {
            "ClusterName": "SIPZON.MOBI",
            "pattern": "8500",
            "description": "Imagicle Recording RP",
            "usage": "Route",
            "routePartitionName": "",
            "blockEnable": "false",
            "calledPartyTransformationMask": "",
            "callingPartyTransformationMask": "",
            "useCallingPartyPhoneMask": "Off",
            "callingPartyPrefixDigits": "",
            "digitDiscardInstructionName": "",
            "patternUrgency": "false",
            "prefixDigitsOut": "",
            "routeFilterName": "",
            "provideOutsideDialtone": "true",
            "callingPartyNumberingPlan": "Cisco CallManager",
            "callingPartyNumberType": "Cisco CallManager",
            "calledPartyNumberingPlan": "Cisco CallManager",
            "calledPartyNumberType": "Cisco CallManager",
            "authorizationCodeRequired": "false",
            "authorizationLevelRequired": "0",
            "clientCodeRequired": "false",
            "externalCallControl": ""
        }
    ],
    "pagination": {
        "total": 540,
        "limit": 10,
        "page": 1,
        "last_page": 54,
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