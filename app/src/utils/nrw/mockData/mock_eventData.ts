import { type EventResponseDto } from '../shared-dtos';

// eslint-disable-next-line import/prefer-default-export
export const mockKenyaEvents: EventResponseDto[] = JSON.parse(`
[
  {
    "eventId": 122,
    "eventName": "KEN_floods_awash-metehara",
    "eventLabel": "awash-metehara",
    "hazardType": "floods",
    "forecastSources": [
      "glofas"
    ],
    "alertClass": "high",
    "trigger": true,
    "centroid": {
      "latitude": 8.9,
      "longitude": 39.9
    },
    "startAt": "2026-06-24T11:12:57.652Z",
    "reachesPeakAlertClassAt": "2026-06-24T11:12:57.652Z",
    "endAt": "2026-07-02T11:12:57.652Z",
    "firstIssuedAt": "2026-06-23T11:12:57.652Z",
    "lastUpdatedAt": "2026-06-23T11:12:57.652Z",
    "isOngoing": true,
    "exposedAdminAreas": [
      {
        "placeCode": "KE0040180088",
        "adminLevel": 3,
        "name": "KE0040180088",
        "exposure": [
          {
            "type": "population_exposed",
            "total": null,
            "exposed": 12400
          }
        ]
      },
      {
        "placeCode": "KE0040180089",
        "adminLevel": 3,
        "name": "KE0040180089",
        "exposure": [
          {
            "type": "population_exposed",
            "total": null,
            "exposed": 8300
          }
        ]
      },
      {
        "placeCode": "KE0040180091",
        "adminLevel": 3,
        "name": "KE0040180091",
        "exposure": [
          {
            "type": "population_exposed",
            "total": null,
            "exposed": 5600
          }
        ]
      },
      {
        "placeCode": "KE0040190092",
        "adminLevel": 3,
        "name": "KE0040190092",
        "exposure": [
          {
            "type": "population_exposed",
            "total": null,
            "exposed": 15200
          }
        ]
      },
      {
        "placeCode": "KE0040190093",
        "adminLevel": 3,
        "name": "KE0040190093",
        "exposure": [
          {
            "type": "population_exposed",
            "total": null,
            "exposed": 9100
          }
        ]
      },
      {
        "placeCode": "KE0040190094",
        "adminLevel": 3,
        "name": "KE0040190094",
        "exposure": [
          {
            "type": "population_exposed",
            "total": null,
            "exposed": 3400
          }
        ]
      },
      {
        "placeCode": "KE0040200096",
        "adminLevel": 3,
        "name": "KE0040200096",
        "exposure": [
          {
            "type": "population_exposed",
            "total": null,
            "exposed": 7800
          }
        ]
      },
      {
        "placeCode": "KE004018",
        "adminLevel": 2,
        "name": "KE004018",
        "exposure": [
          {
            "type": "population_exposed",
            "total": null,
            "exposed": 26300
          }
        ]
      },
      {
        "placeCode": "KE004019",
        "adminLevel": 2,
        "name": "KE004019",
        "exposure": [
          {
            "type": "population_exposed",
            "total": null,
            "exposed": 27700
          }
        ]
      },
      {
        "placeCode": "KE004020",
        "adminLevel": 2,
        "name": "KE004020",
        "exposure": [
          {
            "type": "population_exposed",
            "total": null,
            "exposed": 7800
          }
        ]
      },
      {
        "placeCode": "KE004",
        "adminLevel": 1,
        "name": "KE004",
        "exposure": [
          {
            "type": "population_exposed",
            "total": null,
            "exposed": 61800
          }
        ]
      },
      {
        "placeCode": "KE",
        "adminLevel": 0,
        "name": "Kenya",
        "exposure": [
          {
            "type": "population_exposed",
            "total": null,
            "exposed": 61800
          }
        ]
      }
    ],
    "availableLayers": [
      {
        "resourceId": "1",
        "dataType": "flood_depth",
        "displayType": "raster"
      }
    ]
  },
  {
    "eventId": 222,
    "eventName": "KEN_floods_baro-gambella",
    "eventLabel": "baro-gambella",
    "hazardType": "floods",
    "forecastSources": [
      "glofas"
    ],
    "alertClass": "low",
    "trigger": false,
    "centroid": {
      "latitude": 8.25,
      "longitude": 34.59
    },
    "startAt": "2026-06-26T11:12:57.652Z",
    "reachesPeakAlertClassAt": "2026-06-26T11:12:57.652Z",
    "endAt": "2026-07-03T11:12:57.652Z",
    "firstIssuedAt": "2026-06-23T11:12:57.652Z",
    "lastUpdatedAt": "2026-06-23T11:12:57.652Z",
    "isOngoing": false,
    "exposedAdminAreas": [
      {
        "placeCode": "KE0402301149",
        "adminLevel": 3,
        "name": "KE0402301149",
        "exposure": [
          {
            "type": "population_exposed",
            "total": null,
            "exposed": 4200
          }
        ]
      },
      {
        "placeCode": "KE0402301150",
        "adminLevel": 3,
        "name": "KE0402301150",
        "exposure": [
          {
            "type": "population_exposed",
            "total": null,
            "exposed": 3100
          }
        ]
      },
      {
        "placeCode": "KE040230",
        "adminLevel": 2,
        "name": "KE040230",
        "exposure": [
          {
            "type": "population_exposed",
            "total": null,
            "exposed": 7300
          }
        ]
      },
      {
        "placeCode": "KE040",
        "adminLevel": 1,
        "name": "KE040",
        "exposure": [
          {
            "type": "population_exposed",
            "total": null,
            "exposed": 7300
          }
        ]
      },
      {
        "placeCode": "KE",
        "adminLevel": 0,
        "name": "Ethiopia",
        "exposure": [
          {
            "type": "population_exposed",
            "total": null,
            "exposed": 7300
          }
        ]
      }
    ],
    "availableLayers": [
      {
        "resourceId": "2",
        "dataType": "flood_depth",
        "displayType": "raster"
      }
    ]
  }
]
    `) as EventResponseDto[];
