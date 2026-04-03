export interface NearbySensorSummary {
  total: number;
  typeCounts: Record<string, number>;
  tenants: { name: string; sensorCount: number; types: string[] }[];
  sensors: {
    source: string;
    sensorId: string;
    type: string;
    label: string;
    tenant: string;
    distanceMiles: number;
    isActive: boolean;
  }[];
}

export const nearbySensors: Record<string, NearbySensorSummary> = {
  "nyc": {
    "total": 232,
    "typeCounts": {
      "RF-360": 77,
      "RF-160": 23,
      "AA Cloud": 26,
      "Camera": 25,
      "EchoShield Radar": 12,
      "RF-560": 46,
      "AeroScope": 4,
      "RF-310": 14,
      "Link": 4,
      "WiFi": 1
    },
    "tenants": [
      {
        "name": "Nypd Ct",
        "sensorCount": 31,
        "types": [
          "AA Cloud",
          "RF-560",
          "RF-360",
          "Camera",
          "RF-160",
          "RF-310"
        ]
      },
      {
        "name": "Con Edison",
        "sensorCount": 17,
        "types": [
          "AA Cloud",
          "EchoShield Radar",
          "Camera",
          "RF-360",
          "RF-160",
          "AeroScope"
        ]
      },
      {
        "name": "Njdoc",
        "sensorCount": 17,
        "types": [
          "RF-360",
          "RF-160",
          "Camera"
        ]
      },
      {
        "name": "Metlife",
        "sensorCount": 13,
        "types": [
          "RF-360",
          "RF-160",
          "AA Cloud",
          "Camera"
        ]
      },
      {
        "name": "Ne C02",
        "sensorCount": 13,
        "types": [
          "RF-360",
          "Camera",
          "RF-560",
          "RF-160"
        ]
      },
      {
        "name": "Yourmachine",
        "sensorCount": 11,
        "types": [
          "RF-360",
          "RF-160",
          "AA Cloud",
          "Camera"
        ]
      },
      {
        "name": "Hudsonyards",
        "sensorCount": 11,
        "types": [
          "Camera",
          "AA Cloud",
          "RF-560"
        ]
      },
      {
        "name": "Coned",
        "sensorCount": 11,
        "types": [
          "RF-310",
          "AeroScope",
          "EchoShield Radar",
          "Camera"
        ]
      },
      {
        "name": "Njtpdtrailer2",
        "sensorCount": 9,
        "types": [
          "RF-310",
          "RF-560",
          "Camera"
        ]
      },
      {
        "name": "Nyc Oti Trailer 2",
        "sensorCount": 8,
        "types": [
          "EchoShield Radar",
          "RF-560",
          "Camera"
        ]
      },
      {
        "name": "Yankees",
        "sensorCount": 8,
        "types": [
          "Camera",
          "RF-360",
          "AeroScope",
          "RF-160"
        ]
      },
      {
        "name": "Njtpdtrailer1",
        "sensorCount": 8,
        "types": [
          "RF-560",
          "RF-310"
        ]
      },
      {
        "name": "Ne C01",
        "sensorCount": 8,
        "types": [
          "RF-560",
          "RF-360",
          "Camera",
          "RF-160"
        ]
      },
      {
        "name": "Nassaucounty",
        "sensorCount": 8,
        "types": [
          "AA Cloud",
          "Link",
          "RF-560",
          "RF-360"
        ]
      },
      {
        "name": "Flight3100 Poc",
        "sensorCount": 7,
        "types": [
          "RF-360",
          "RF-160",
          "RF-560"
        ]
      },
      {
        "name": "Mta",
        "sensorCount": 7,
        "types": [
          "RF-560",
          "AA Cloud"
        ]
      },
      {
        "name": "National Grid Greenpoint",
        "sensorCount": 6,
        "types": [
          "RF-360",
          "RF-160",
          "Camera"
        ]
      },
      {
        "name": "Union County",
        "sensorCount": 6,
        "types": [
          "RF-360"
        ]
      },
      {
        "name": "Morris County",
        "sensorCount": 6,
        "types": [
          "RF-560",
          "Camera"
        ]
      },
      {
        "name": "Fairfield PD",
        "sensorCount": 6,
        "types": [
          "Camera",
          "RF-560",
          "RF-310"
        ]
      },
      {
        "name": "Hudson County",
        "sensorCount": 4,
        "types": [
          "RF-360",
          "RF-160"
        ]
      },
      {
        "name": "Nysba",
        "sensorCount": 4,
        "types": [
          "RF-360",
          "RF-160"
        ]
      },
      {
        "name": "Nysdoccs Poc",
        "sensorCount": 4,
        "types": [
          "RF-560",
          "RF-360"
        ]
      },
      {
        "name": "Sentinel",
        "sensorCount": 2,
        "types": [
          "RF-160"
        ]
      },
      {
        "name": "Jpmc1",
        "sensorCount": 2,
        "types": [
          "RF-560"
        ]
      },
      {
        "name": "Bapsnj",
        "sensorCount": 2,
        "types": [
          "RF-560"
        ]
      },
      {
        "name": "Hw Dev",
        "sensorCount": 1,
        "types": [
          "WiFi"
        ]
      }
    ],
    "sensors": [
      {
        "source": "DTracker",
        "sensorId": "DR03602411P6002379WMirror",
        "type": "RF-360",
        "label": "NE RF360",
        "tenant": "Yourmachine",
        "distanceMiles": 0.1,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602409P6002294WMirror",
        "type": "RF-360",
        "label": "NW RF360",
        "tenant": "Yourmachine",
        "distanceMiles": 0.1,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602410A1001456WMirror",
        "type": "RF-160",
        "label": "NE RF160",
        "tenant": "Yourmachine",
        "distanceMiles": 0.1,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602411P6002379",
        "type": "RF-360",
        "label": "NE RF360",
        "tenant": "Metlife",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602410P6002344Mirror",
        "type": "RF-360",
        "label": "SW 360",
        "tenant": "Yourmachine",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602410P6002344WMirror",
        "type": "RF-360",
        "label": "SW 360",
        "tenant": "Yourmachine",
        "distanceMiles": 0.1,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602410P6002352WMirror",
        "type": "RF-360",
        "label": "SE RF360",
        "tenant": "Yourmachine",
        "distanceMiles": 0.1,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602410A1001456W",
        "type": "RF-160",
        "label": "NE RF160",
        "tenant": "Metlife",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602410A1001456",
        "type": "RF-160",
        "label": "NE RF160",
        "tenant": "Metlife",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602410P6002352",
        "type": "RF-360",
        "label": "SE RF360",
        "tenant": "Metlife",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602410P6002344W",
        "type": "RF-360",
        "label": "SW 360",
        "tenant": "Metlife",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_6tgid7oq",
        "type": "AA Cloud",
        "label": "AA Cloud Connector Sensor MetLifeAAIntegration",
        "tenant": "Metlife",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602410P6002344",
        "type": "RF-360",
        "label": "SW 360",
        "tenant": "Metlife",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602409P6002294",
        "type": "RF-360",
        "label": "NW RF360",
        "tenant": "Metlife",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_3pof5biv",
        "type": "Camera",
        "label": "50 PTZ",
        "tenant": "Metlife",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_oat49yiu",
        "type": "Camera",
        "label": "Verizon PTZ",
        "tenant": "Metlife",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602410P6002352W",
        "type": "RF-360",
        "label": "SE RF360",
        "tenant": "Metlife",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602411P6002379W",
        "type": "RF-360",
        "label": "NE RF360",
        "tenant": "Metlife",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602409P6002294W",
        "type": "RF-360",
        "label": "NW RF360",
        "tenant": "Metlife",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_6tgid7oqMirror",
        "type": "AA Cloud",
        "label": "AA Cloud Connector Sensor MetLifeAAIntegration",
        "tenant": "Yourmachine",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602410A1001456Mirror",
        "type": "RF-160",
        "label": "NE RF160",
        "tenant": "Yourmachine",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_oat49yiuMirror",
        "type": "Camera",
        "label": "Verizon PTZ",
        "tenant": "Yourmachine",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602411P6002379Mirror",
        "type": "RF-360",
        "label": "NE RF360",
        "tenant": "Yourmachine",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_3pof5bivMirror",
        "type": "Camera",
        "label": "50 PTZ",
        "tenant": "Yourmachine",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602444P6002891W",
        "type": "RF-360",
        "label": "Hudson 2",
        "tenant": "Hudson County",
        "distanceMiles": 3.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602444P6002891",
        "type": "RF-360",
        "label": "Hudson 2",
        "tenant": "Hudson County",
        "distanceMiles": 3.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_wde4i5tr",
        "type": "AA Cloud",
        "label": "ECC - Aeroscope",
        "tenant": "Con Edison",
        "distanceMiles": 5.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "ECHODYNE_jr6jqw7s",
        "type": "EchoShield Radar",
        "label": "ECC - Echo-B",
        "tenant": "Con Edison",
        "distanceMiles": 5.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_4wfw2l5i",
        "type": "Camera",
        "label": "ECC-SS",
        "tenant": "Con Edison",
        "distanceMiles": 5.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602438P6002795W",
        "type": "RF-360",
        "label": "ECC - RF-360-SW",
        "tenant": "Con Edison",
        "distanceMiles": 5.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "ECHODYNE_a6o8uyj7",
        "type": "EchoShield Radar",
        "label": "ECC - Echo-A",
        "tenant": "Con Edison",
        "distanceMiles": 5.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "ECHODYNE_bsxig24t",
        "type": "EchoShield Radar",
        "label": "ECC - Echo-D",
        "tenant": "Con Edison",
        "distanceMiles": 5.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DRT3602203P5001295W",
        "type": "RF-360",
        "label": "ECC - RF-360-SE",
        "tenant": "Con Edison",
        "distanceMiles": 5.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602436A1001607W",
        "type": "RF-160",
        "label": "ECC - RF-160",
        "tenant": "Con Edison",
        "distanceMiles": 5.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DRT3602203P5001297W",
        "type": "RF-360",
        "label": "ECC - RF-360-NE",
        "tenant": "Con Edison",
        "distanceMiles": 5.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602443P6002882W",
        "type": "RF-360",
        "label": "ECC - RF-360-NW",
        "tenant": "Con Edison",
        "distanceMiles": 5.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_9ro1i1sw",
        "type": "Camera",
        "label": "VSA Camera",
        "tenant": "Hudsonyards",
        "distanceMiles": 5.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_gpr9g9zn",
        "type": "AA Cloud",
        "label": "AACC - Hudson Yards Demo",
        "tenant": "Hudsonyards",
        "distanceMiles": 5.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602507A6001307",
        "type": "RF-560",
        "label": "DR05602507A6001307",
        "tenant": "Hudsonyards",
        "distanceMiles": 5.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602507A6001307W",
        "type": "RF-560",
        "label": "DR05602507A6001307",
        "tenant": "Hudsonyards",
        "distanceMiles": 5.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602435A6001157",
        "type": "RF-560",
        "label": "DR05602435A6001157",
        "tenant": "Hudsonyards",
        "distanceMiles": 5.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_nw0gpql7",
        "type": "Camera",
        "label": "20HY Camera",
        "tenant": "Hudsonyards",
        "distanceMiles": 5.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602415P6001076W",
        "type": "RF-560",
        "label": "DR05602415P6001076",
        "tenant": "Hudsonyards",
        "distanceMiles": 5.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602415P6001076",
        "type": "RF-560",
        "label": "DR05602415P6001076",
        "tenant": "Hudsonyards",
        "distanceMiles": 5.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602435A6001157W",
        "type": "RF-560",
        "label": "DR05602435A6001157",
        "tenant": "Hudsonyards",
        "distanceMiles": 5.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602409P6002315W",
        "type": "RF-360",
        "label": "360.2315-JW Marriott",
        "tenant": "Flight3100 Poc",
        "distanceMiles": 6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_qpqnomd7",
        "type": "AA Cloud",
        "label": "AA Cloud SPU 07",
        "tenant": "Hudsonyards",
        "distanceMiles": 6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602409P6002315",
        "type": "RF-360",
        "label": "360.2315-JW Marriott",
        "tenant": "Flight3100 Poc",
        "distanceMiles": 6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_6waq9xvh",
        "type": "AA Cloud",
        "label": "AACC - SPU 07",
        "tenant": "Nypd Ct",
        "distanceMiles": 6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_280xd72o",
        "type": "AA Cloud",
        "label": "AACC - SPU 04",
        "tenant": "Nypd Ct",
        "distanceMiles": 6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_xvs7m2ay",
        "type": "AA Cloud",
        "label": "AA Cloud SPU 14",
        "tenant": "Hudsonyards",
        "distanceMiles": 6.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602506A6001271W",
        "type": "RF-560",
        "label": "DR05602506A6001271",
        "tenant": "Nypd Ct",
        "distanceMiles": 6.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602506A6001271",
        "type": "RF-560",
        "label": "DR05602506A6001271",
        "tenant": "Nypd Ct",
        "distanceMiles": 6.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602510P6002969",
        "type": "RF-360",
        "label": "DR03602510P6002969",
        "tenant": "Nypd Ct",
        "distanceMiles": 6.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602510P6002969W",
        "type": "RF-360",
        "label": "DR03602510P6002969",
        "tenant": "Nypd Ct",
        "distanceMiles": 6.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602409P6002324",
        "type": "RF-360",
        "label": "360.2324-Met-SW",
        "tenant": "Flight3100 Poc",
        "distanceMiles": 6.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602411A1001477W",
        "type": "RF-160",
        "label": "160.1477-Met-NW",
        "tenant": "Flight3100 Poc",
        "distanceMiles": 6.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602409P6002324W",
        "type": "RF-360",
        "label": "360.2324-Met-SW",
        "tenant": "Flight3100 Poc",
        "distanceMiles": 6.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602411A1001477",
        "type": "RF-160",
        "label": "160.1477-Met-NW",
        "tenant": "Flight3100 Poc",
        "distanceMiles": 6.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "ECHODYNE_r2paipoq",
        "type": "EchoShield Radar",
        "label": "ECV - ECHO Aft",
        "tenant": "Nyc Oti Trailer 2",
        "distanceMiles": 6.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602521A6001552W",
        "type": "RF-560",
        "label": "ECV - 560 B",
        "tenant": "Nyc Oti Trailer 2",
        "distanceMiles": 6.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602521A6001552",
        "type": "RF-560",
        "label": "ECV - 560 B",
        "tenant": "Nyc Oti Trailer 2",
        "distanceMiles": 6.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602512A6001409",
        "type": "RF-560",
        "label": "ECV -560 A",
        "tenant": "Nyc Oti Trailer 2",
        "distanceMiles": 6.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602512A6001409W",
        "type": "RF-560",
        "label": "ECV -560 A",
        "tenant": "Nyc Oti Trailer 2",
        "distanceMiles": 6.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "ECHODYNE_86ljvfvl",
        "type": "EchoShield Radar",
        "label": "ECV - ECHO Starboard",
        "tenant": "Nyc Oti Trailer 2",
        "distanceMiles": 6.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "ECHODYNE_u77b3j98",
        "type": "EchoShield Radar",
        "label": "ECV - ECHO Fore",
        "tenant": "Nyc Oti Trailer 2",
        "distanceMiles": 6.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_pfzn4a33",
        "type": "Camera",
        "label": "ECV - PTZ",
        "tenant": "Nyc Oti Trailer 2",
        "distanceMiles": 6.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_bsr489ip",
        "type": "AA Cloud",
        "label": "AACC - SPU 15",
        "tenant": "Nypd Ct",
        "distanceMiles": 6.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_7s255q00",
        "type": "AA Cloud",
        "label": "AACC - SPU 03",
        "tenant": "Nypd Ct",
        "distanceMiles": 7.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602507A1001700",
        "type": "RF-160",
        "label": "Hudson A",
        "tenant": "Hudson County",
        "distanceMiles": 7.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602507A1001700W",
        "type": "RF-160",
        "label": "Hudson A",
        "tenant": "Hudson County",
        "distanceMiles": 7.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602423P6001099W",
        "type": "RF-560",
        "label": "560-1099",
        "tenant": "Nypd Ct",
        "distanceMiles": 7.7,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_4xpizng9",
        "type": "AA Cloud",
        "label": "AACC - SPU 06",
        "tenant": "Nypd Ct",
        "distanceMiles": 7.7,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602423P6001099",
        "type": "RF-560",
        "label": "560-1099",
        "tenant": "Nypd Ct",
        "distanceMiles": 7.7,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_4ltjrpjb",
        "type": "Camera",
        "label": "PTZ",
        "tenant": "Yankees",
        "distanceMiles": 7.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602520P6003062W",
        "type": "RF-360",
        "label": "DR03602520P6003062",
        "tenant": "Yankees",
        "distanceMiles": 7.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602520P6003062",
        "type": "RF-360",
        "label": "DR03602520P6003062",
        "tenant": "Yankees",
        "distanceMiles": 7.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AEROSCOPE_hn774b4p",
        "type": "AeroScope",
        "label": "Aeroscope",
        "tenant": "Yankees",
        "distanceMiles": 7.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602315P5001629",
        "type": "RF-360",
        "label": "Right Field 360",
        "tenant": "Yankees",
        "distanceMiles": 7.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602314A1001294W",
        "type": "RF-160",
        "label": "Right Field 160",
        "tenant": "Yankees",
        "distanceMiles": 7.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602314A1001294",
        "type": "RF-160",
        "label": "Right Field 160",
        "tenant": "Yankees",
        "distanceMiles": 7.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602315P5001629W",
        "type": "RF-360",
        "label": "Right Field 360",
        "tenant": "Yankees",
        "distanceMiles": 7.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602521A6001565",
        "type": "RF-560",
        "label": "DR05602521A6001565",
        "tenant": "Mta",
        "distanceMiles": 8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602521A6001565W",
        "type": "RF-560",
        "label": "DR05602521A6001565",
        "tenant": "Mta",
        "distanceMiles": 8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602510A6001369",
        "type": "RF-560",
        "label": "560 FORE",
        "tenant": "Njtpdtrailer1",
        "distanceMiles": 8.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602506A6001280W",
        "type": "RF-560",
        "label": "560 AFT",
        "tenant": "Njtpdtrailer1",
        "distanceMiles": 8.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102448P2001236W",
        "type": "RF-310",
        "label": "310 DF",
        "tenant": "Njtpdtrailer1",
        "distanceMiles": 8.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602510A6001369W",
        "type": "RF-560",
        "label": "560 FORE",
        "tenant": "Njtpdtrailer1",
        "distanceMiles": 8.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102417P2001106W",
        "type": "RF-310",
        "label": "RF Sensor (Scanning)",
        "tenant": "Njtpdtrailer2",
        "distanceMiles": 8.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102448P2001236",
        "type": "RF-310",
        "label": "310 DF",
        "tenant": "Njtpdtrailer1",
        "distanceMiles": 8.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102417P2001106",
        "type": "RF-310",
        "label": "RF Sensor (Scanning)",
        "tenant": "Njtpdtrailer2",
        "distanceMiles": 8.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602507A6001310W",
        "type": "RF-560",
        "label": "RF Sensor (Telemetry)",
        "tenant": "Njtpdtrailer2",
        "distanceMiles": 8.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_qycli4ns",
        "type": "AA Cloud",
        "label": "AACC - mta_MTA_2",
        "tenant": "Mta",
        "distanceMiles": 8.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102448P2001259W",
        "type": "RF-310",
        "label": "310 SCAN",
        "tenant": "Njtpdtrailer1",
        "distanceMiles": 8.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_8kdcit5c",
        "type": "Camera",
        "label": "Camera (Port)",
        "tenant": "Njtpdtrailer2",
        "distanceMiles": 8.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_hsnn9p3n",
        "type": "Camera",
        "label": "Camera (Starboard)",
        "tenant": "Njtpdtrailer2",
        "distanceMiles": 8.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102417P2001102W",
        "type": "RF-310",
        "label": "RF Sensor (DF)",
        "tenant": "Njtpdtrailer2",
        "distanceMiles": 8.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102448P2001259",
        "type": "RF-310",
        "label": "310 SCAN",
        "tenant": "Njtpdtrailer1",
        "distanceMiles": 8.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602506A6001280",
        "type": "RF-560",
        "label": "560 AFT",
        "tenant": "Njtpdtrailer1",
        "distanceMiles": 8.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102417P2001102",
        "type": "RF-310",
        "label": "RF Sensor (DF)",
        "tenant": "Njtpdtrailer2",
        "distanceMiles": 8.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602507A6001310",
        "type": "RF-560",
        "label": "RF Sensor (Telemetry)",
        "tenant": "Njtpdtrailer2",
        "distanceMiles": 8.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602506A6001277W",
        "type": "RF-560",
        "label": "RF Sensor (Telemetry)",
        "tenant": "Njtpdtrailer2",
        "distanceMiles": 8.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102238P2001021W",
        "type": "RF-310",
        "label": "RF310(DF)_A",
        "tenant": "Coned",
        "distanceMiles": 8.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AEROSCOPE_y90c2fz9",
        "type": "AeroScope",
        "label": "Aeroscope_A",
        "tenant": "Coned",
        "distanceMiles": 9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_z9o8080v",
        "type": "AA Cloud",
        "label": "AACC - SPU 10",
        "tenant": "Nypd Ct",
        "distanceMiles": 9.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_3126du9y",
        "type": "AA Cloud",
        "label": "AACC - mta_MTA_3",
        "tenant": "Mta",
        "distanceMiles": 9.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602346P6001058W",
        "type": "RF-560",
        "label": "560-48 Pct",
        "tenant": "Flight3100 Poc",
        "distanceMiles": 9.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602022P3001090",
        "type": "RF-160",
        "label": "DR01602022P3001090",
        "tenant": "Sentinel",
        "distanceMiles": 9.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602022P3001090W",
        "type": "RF-160",
        "label": "DR01602022P3001090",
        "tenant": "Sentinel",
        "distanceMiles": 9.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602228P5001441W",
        "type": "RF-360",
        "label": "Perimiter 1441",
        "tenant": "National Grid Greenpoint",
        "distanceMiles": 9.7,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602308P5001582W",
        "type": "RF-360",
        "label": "Meter Ops",
        "tenant": "National Grid Greenpoint",
        "distanceMiles": 9.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602308P5001586W",
        "type": "RF-360",
        "label": "Pipe Yard 1586",
        "tenant": "National Grid Greenpoint",
        "distanceMiles": 10,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602423A1001534W",
        "type": "RF-160",
        "label": "FCM-1534",
        "tenant": "National Grid Greenpoint",
        "distanceMiles": 10,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_qa5zn1ap",
        "type": "Camera",
        "label": "PTZ",
        "tenant": "National Grid Greenpoint",
        "distanceMiles": 10,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602308P5001583W",
        "type": "RF-360",
        "label": "FCM-1583",
        "tenant": "National Grid Greenpoint",
        "distanceMiles": 10,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602441A6001183",
        "type": "RF-560",
        "label": "RF560-1183",
        "tenant": "Ne C01",
        "distanceMiles": 10.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602441A6001183W",
        "type": "RF-560",
        "label": "RF560-1183",
        "tenant": "Ne C01",
        "distanceMiles": 10.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602431P6002731W",
        "type": "RF-360",
        "label": "RF360-2731",
        "tenant": "Ne C01",
        "distanceMiles": 10.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_b8rrbilr",
        "type": "Camera",
        "label": "PTZ",
        "tenant": "Ne C01",
        "distanceMiles": 10.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602431P6002729W",
        "type": "RF-360",
        "label": "RF360-2729",
        "tenant": "Ne C01",
        "distanceMiles": 10.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602425P6002677W",
        "type": "RF-360",
        "label": "RF360-2677",
        "tenant": "Ne C01",
        "distanceMiles": 10.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602436A1001603W",
        "type": "RF-160",
        "label": "RF160-1603",
        "tenant": "Ne C01",
        "distanceMiles": 10.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602424P6002633W",
        "type": "RF-360",
        "label": "RF360-2633",
        "tenant": "Ne C01",
        "distanceMiles": 10.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_5p6t6dt2",
        "type": "AA Cloud",
        "label": "AACC - SPU 02",
        "tenant": "Nypd Ct",
        "distanceMiles": 11.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_04u0aa24",
        "type": "AA Cloud",
        "label": "AACC - SPU 16",
        "tenant": "Nypd Ct",
        "distanceMiles": 11.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602531A6001676W",
        "type": "RF-560",
        "label": "DR05602531A6001676",
        "tenant": "Nypd Ct",
        "distanceMiles": 11.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602531A6001676",
        "type": "RF-560",
        "label": "DR05602531A6001676",
        "tenant": "Nypd Ct",
        "distanceMiles": 11.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_4qw1k3uh",
        "type": "AA Cloud",
        "label": "AACC - SPU 08",
        "tenant": "Nypd Ct",
        "distanceMiles": 11.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_j2dc5d8j",
        "type": "Camera",
        "label": "AECC - Camera E Rooftop",
        "tenant": "Con Edison",
        "distanceMiles": 11.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_aiwshoaa",
        "type": "Camera",
        "label": "Thermal Camera",
        "tenant": "Con Edison",
        "distanceMiles": 11.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AEROSCOPE_zb823qt5",
        "type": "AeroScope",
        "label": "Aeroscope  - AECC",
        "tenant": "Con Edison",
        "distanceMiles": 11.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "ECHODYNE_0amvbtur",
        "type": "EchoShield Radar",
        "label": "AECC - Echo-C",
        "tenant": "Con Edison",
        "distanceMiles": 11.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "ECHODYNE_r3j1g6jv",
        "type": "EchoShield Radar",
        "label": "AECC - Echo-D",
        "tenant": "Con Edison",
        "distanceMiles": 11.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_elheagli",
        "type": "Camera",
        "label": "AECC - Camera W Rooftop",
        "tenant": "Con Edison",
        "distanceMiles": 11.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602443P6002884W",
        "type": "RF-360",
        "label": "AECC - RF360",
        "tenant": "Con Edison",
        "distanceMiles": 11.5,
        "isActive": true
      },
      {
        "source": "DCity",
        "sensorId": "0QRDK7FR03TNQ6",
        "type": "Link",
        "label": "EWR",
        "tenant": "",
        "distanceMiles": 12.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_ulv4esl7",
        "type": "AA Cloud",
        "label": "AACC - NY Mets",
        "tenant": "Nypd Ct",
        "distanceMiles": 12.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602510P6002962W",
        "type": "RF-360",
        "label": "DR03602510P6002962",
        "tenant": "Nypd Ct",
        "distanceMiles": 12.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602510P6002962",
        "type": "RF-360",
        "label": "DR03602510P6002962",
        "tenant": "Nypd Ct",
        "distanceMiles": 12.5,
        "isActive": true
      },
      {
        "source": "DCity",
        "sensorId": "0QRDL5XR03397Z",
        "type": "Link",
        "label": "NY Mets",
        "tenant": "",
        "distanceMiles": 12.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_5vb4wace",
        "type": "AA Cloud",
        "label": "AACC - SPU 09",
        "tenant": "Nypd Ct",
        "distanceMiles": 12.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_oacd4e3d",
        "type": "Camera",
        "label": "PTZ",
        "tenant": "Nypd Ct",
        "distanceMiles": 12.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602510P6002963W",
        "type": "RF-360",
        "label": "DR03602510P6002963",
        "tenant": "Nypd Ct",
        "distanceMiles": 12.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602507A1001692W",
        "type": "RF-160",
        "label": "DR01602507A1001692",
        "tenant": "Nypd Ct",
        "distanceMiles": 12.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602507A1001692",
        "type": "RF-160",
        "label": "DR01602507A1001692",
        "tenant": "Nypd Ct",
        "distanceMiles": 12.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602510P6002963",
        "type": "RF-360",
        "label": "DR03602510P6002963",
        "tenant": "Nypd Ct",
        "distanceMiles": 12.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602417P6002537W",
        "type": "RF-360",
        "label": "DR03602417P6002537",
        "tenant": "Union County",
        "distanceMiles": 13.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DRU9002448P1001006W",
        "type": "WiFi",
        "label": "DRU9002448P1001006",
        "tenant": "Hw Dev",
        "distanceMiles": 13.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602417P6002537",
        "type": "RF-360",
        "label": "DR03602417P6002537",
        "tenant": "Union County",
        "distanceMiles": 13.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602520P6003067W",
        "type": "RF-360",
        "label": "DR03602520P6003067",
        "tenant": "Union County",
        "distanceMiles": 13.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602520P6003067",
        "type": "RF-360",
        "label": "DR03602520P6003067",
        "tenant": "Union County",
        "distanceMiles": 13.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_6955o1ha",
        "type": "AA Cloud",
        "label": "AACC - SPU 14",
        "tenant": "Nypd Ct",
        "distanceMiles": 14.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_7lrpcs8i",
        "type": "AA Cloud",
        "label": "AACC - mta_MTA_4",
        "tenant": "Mta",
        "distanceMiles": 14.7,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602439A6001180W",
        "type": "RF-560",
        "label": "560 Back",
        "tenant": "Nypd Ct",
        "distanceMiles": 15.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102417P2001089W",
        "type": "RF-310",
        "label": "RF-310 DF",
        "tenant": "Nypd Ct",
        "distanceMiles": 15.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602442A6001206W",
        "type": "RF-560",
        "label": "560 Front",
        "tenant": "Nypd Ct",
        "distanceMiles": 15.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_yjf0rn18",
        "type": "AA Cloud",
        "label": "AACC - mta_MTA_6",
        "tenant": "Mta",
        "distanceMiles": 16.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_4u7iq2u3",
        "type": "AA Cloud",
        "label": "AACC - SPU 05",
        "tenant": "Nypd Ct",
        "distanceMiles": 16.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "ECHODYNE_u1vws4p1",
        "type": "EchoShield Radar",
        "label": "Radar - Starboard Trailer B",
        "tenant": "Coned",
        "distanceMiles": 16.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "ECHODYNE_8k1zyeu5",
        "type": "EchoShield Radar",
        "label": "Radar - Fore Trailer B",
        "tenant": "Coned",
        "distanceMiles": 16.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "ECHODYNE_deu451hs",
        "type": "EchoShield Radar",
        "label": "Radar - Port Trailer B",
        "tenant": "Coned",
        "distanceMiles": 16.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AEROSCOPE_q7sgy5g8",
        "type": "AeroScope",
        "label": "Aeroscope_B",
        "tenant": "Coned",
        "distanceMiles": 16.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "ECHODYNE_2do0tt03",
        "type": "EchoShield Radar",
        "label": "Radar - Aft Trailer B",
        "tenant": "Coned",
        "distanceMiles": 16.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_xjs0a0my",
        "type": "Camera",
        "label": "Camera Port Trailer B",
        "tenant": "Coned",
        "distanceMiles": 16.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_9an2c14q",
        "type": "Camera",
        "label": "Camera Starboard Trailer B",
        "tenant": "Coned",
        "distanceMiles": 16.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102310P2001043W",
        "type": "RF-310",
        "label": "RF Sensor (DF) Trailer B",
        "tenant": "Coned",
        "distanceMiles": 16.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102417P2001098W",
        "type": "RF-310",
        "label": "RF sensors (Scanning) Trailer B",
        "tenant": "Coned",
        "distanceMiles": 16.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602424P6002650",
        "type": "RF-360",
        "label": "RF360-2650",
        "tenant": "Ne C02",
        "distanceMiles": 17.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602425P6002688",
        "type": "RF-360",
        "label": "RF360-2688",
        "tenant": "Ne C02",
        "distanceMiles": 17.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_u90m791g",
        "type": "Camera",
        "label": "Camera",
        "tenant": "Ne C02",
        "distanceMiles": 17.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602439A6001177W",
        "type": "RF-560",
        "label": "RF560-1177",
        "tenant": "Ne C02",
        "distanceMiles": 17.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602439A6001177",
        "type": "RF-560",
        "label": "RF560-1177",
        "tenant": "Ne C02",
        "distanceMiles": 17.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602424P6002650W",
        "type": "RF-360",
        "label": "RF360-2650",
        "tenant": "Ne C02",
        "distanceMiles": 17.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602425P6002688W",
        "type": "RF-360",
        "label": "RF360-2688",
        "tenant": "Ne C02",
        "distanceMiles": 17.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602424P6002631",
        "type": "RF-360",
        "label": "RF360-2631",
        "tenant": "Ne C02",
        "distanceMiles": 17.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602424P6002631W",
        "type": "RF-360",
        "label": "RF360-2631",
        "tenant": "Ne C02",
        "distanceMiles": 17.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602424A1001554",
        "type": "RF-160",
        "label": "RF160-1554",
        "tenant": "Ne C02",
        "distanceMiles": 17.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602424P6002652",
        "type": "RF-360",
        "label": "RF360-2652",
        "tenant": "Ne C02",
        "distanceMiles": 17.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602424A1001554W",
        "type": "RF-160",
        "label": "RF160-1554",
        "tenant": "Ne C02",
        "distanceMiles": 17.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602424P6002652W",
        "type": "RF-360",
        "label": "RF360-2652",
        "tenant": "Ne C02",
        "distanceMiles": 17.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602212P5001393W",
        "type": "RF-360",
        "label": "EJSP-Tower3-RF360 (North)",
        "tenant": "Njdoc",
        "distanceMiles": 18.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602417P6002522",
        "type": "RF-360",
        "label": "EJSP-Tower2-RF360 (Northeast)",
        "tenant": "Njdoc",
        "distanceMiles": 18.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602212P5001393",
        "type": "RF-360",
        "label": "EJSP-Tower3-RF360 (North)",
        "tenant": "Njdoc",
        "distanceMiles": 18.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602436A1001608",
        "type": "RF-160",
        "label": "STU-EAST-RF160",
        "tenant": "Njdoc",
        "distanceMiles": 18.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602212P5001389",
        "type": "RF-360",
        "label": "STU-East-RF360",
        "tenant": "Njdoc",
        "distanceMiles": 18.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602212P5001389W",
        "type": "RF-360",
        "label": "STU-East-RF360",
        "tenant": "Njdoc",
        "distanceMiles": 18.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602417P6002522W",
        "type": "RF-360",
        "label": "EJSP-Tower2-RF360 (Northeast)",
        "tenant": "Njdoc",
        "distanceMiles": 18.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602436A1001608W",
        "type": "RF-160",
        "label": "STU-EAST-RF160",
        "tenant": "Njdoc",
        "distanceMiles": 18.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602510P6002971",
        "type": "RF-360",
        "label": "STU-South-RF360",
        "tenant": "Njdoc",
        "distanceMiles": 18.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602417P6002517W",
        "type": "RF-360",
        "label": "STU - West - RF360",
        "tenant": "Njdoc",
        "distanceMiles": 18.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602417P6002517",
        "type": "RF-360",
        "label": "STU - West - RF360",
        "tenant": "Njdoc",
        "distanceMiles": 18.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_22vx1muk",
        "type": "Camera",
        "label": "PTZ",
        "tenant": "Njdoc",
        "distanceMiles": 18.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602510P6002971W",
        "type": "RF-360",
        "label": "STU-South-RF360",
        "tenant": "Njdoc",
        "distanceMiles": 18.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602510P6002975",
        "type": "RF-360",
        "label": "EJSP-Tower6-RF360 (South)",
        "tenant": "Njdoc",
        "distanceMiles": 18.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602510P6002975W",
        "type": "RF-360",
        "label": "EJSP-Tower6-RF360 (South)",
        "tenant": "Njdoc",
        "distanceMiles": 18.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602421P6002592",
        "type": "RF-360",
        "label": "EJSP-Tower5-RF360 (Southwest)",
        "tenant": "Njdoc",
        "distanceMiles": 18.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602421P6002592W",
        "type": "RF-360",
        "label": "EJSP-Tower5-RF360 (Southwest)",
        "tenant": "Njdoc",
        "distanceMiles": 18.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_xdhw86np",
        "type": "AA Cloud",
        "label": "AACC - mta_MTA_5",
        "tenant": "Mta",
        "distanceMiles": 19.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602510A6001358",
        "type": "RF-560",
        "label": "RF560-2 - Portable",
        "tenant": "Morris County",
        "distanceMiles": 21.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602510A6001358W",
        "type": "RF-560",
        "label": "RF560-2 - Portable",
        "tenant": "Morris County",
        "distanceMiles": 21.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_pxaac7k4",
        "type": "AA Cloud",
        "label": "AACC - Nassau_2",
        "tenant": "Nassaucounty",
        "distanceMiles": 23.2,
        "isActive": true
      },
      {
        "source": "DCity",
        "sensorId": "0QRDK2ER03UTN0",
        "type": "Link",
        "label": "Nassau_2",
        "tenant": "Nassaucounty",
        "distanceMiles": 23.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602441A6001194",
        "type": "RF-560",
        "label": "RF560-1 - Trailer 1",
        "tenant": "Morris County",
        "distanceMiles": 23.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_ux2ml9u0",
        "type": "Camera",
        "label": "Camera:10.34.123.31",
        "tenant": "Morris County",
        "distanceMiles": 23.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602510A6001388",
        "type": "RF-560",
        "label": "RF560-3 - Trailer 1",
        "tenant": "Morris County",
        "distanceMiles": 23.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_81eahfsi",
        "type": "Camera",
        "label": "Camera:10.34.123.30",
        "tenant": "Morris County",
        "distanceMiles": 23.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_1o7cy6bj",
        "type": "AA Cloud",
        "label": "AACC - Nassau_Conv1",
        "tenant": "Nassaucounty",
        "distanceMiles": 30.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602506A6001282",
        "type": "RF-560",
        "label": "DR05602506A6001282",
        "tenant": "Nassaucounty",
        "distanceMiles": 30.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602510P6002961",
        "type": "RF-360",
        "label": "DR03602510P6002961",
        "tenant": "Nassaucounty",
        "distanceMiles": 30.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602506A6001282W",
        "type": "RF-560",
        "label": "DR05602506A6001282",
        "tenant": "Nassaucounty",
        "distanceMiles": 30.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602510P6002961W",
        "type": "RF-360",
        "label": "DR03602510P6002961",
        "tenant": "Nassaucounty",
        "distanceMiles": 30.9,
        "isActive": true
      },
      {
        "source": "DCity",
        "sensorId": "0QRDF220010066",
        "type": "Link",
        "label": "Nassau_Conv1",
        "tenant": "Nassaucounty",
        "distanceMiles": 30.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602533A6001713W",
        "type": "RF-560",
        "label": "DR05602533A6001713",
        "tenant": "Jpmc1",
        "distanceMiles": 32.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602533A6001713",
        "type": "RF-560",
        "label": "DR05602533A6001713",
        "tenant": "Jpmc1",
        "distanceMiles": 32.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602517P6003045",
        "type": "RF-360",
        "label": "DR03602517P6003045",
        "tenant": "Union County",
        "distanceMiles": 32.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602517P6003045W",
        "type": "RF-360",
        "label": "DR03602517P6003045",
        "tenant": "Union County",
        "distanceMiles": 32.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602439A6001171",
        "type": "RF-560",
        "label": "DR05602439A6001171",
        "tenant": "Bapsnj",
        "distanceMiles": 46.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602439A6001171W",
        "type": "RF-560",
        "label": "DR05602439A6001171",
        "tenant": "Bapsnj",
        "distanceMiles": 46.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_f578mdft",
        "type": "Camera",
        "label": "Camera:10.34.123.31",
        "tenant": "Fairfield PD",
        "distanceMiles": 48.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602530A6001643W",
        "type": "RF-560",
        "label": "560 AFT",
        "tenant": "Fairfield PD",
        "distanceMiles": 48.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102531P2001586W",
        "type": "RF-310",
        "label": "310 SCAN",
        "tenant": "Fairfield PD",
        "distanceMiles": 48.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102531P2001564W",
        "type": "RF-310",
        "label": "310 DF",
        "tenant": "Fairfield PD",
        "distanceMiles": 48.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_ntsja8nt",
        "type": "Camera",
        "label": "Camera:10.23.123.30",
        "tenant": "Fairfield PD",
        "distanceMiles": 48.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602528A6001627W",
        "type": "RF-560",
        "label": "560 FORE",
        "tenant": "Fairfield PD",
        "distanceMiles": 48.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602444P6002890",
        "type": "RF-360",
        "label": "DR03602444P6002890",
        "tenant": "Nysba",
        "distanceMiles": 48.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602444P6002890W",
        "type": "RF-360",
        "label": "DR03602444P6002890",
        "tenant": "Nysba",
        "distanceMiles": 48.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602446A1001670",
        "type": "RF-160",
        "label": "DR01602446A1001670",
        "tenant": "Nysba",
        "distanceMiles": 49,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602446A1001670W",
        "type": "RF-160",
        "label": "DR01602446A1001670",
        "tenant": "Nysba",
        "distanceMiles": 49,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602533A6001694",
        "type": "RF-560",
        "label": "DR05602533A6001694",
        "tenant": "Nysdoccs Poc",
        "distanceMiles": 49.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602533A6001694W",
        "type": "RF-560",
        "label": "DR05602533A6001694",
        "tenant": "Nysdoccs Poc",
        "distanceMiles": 49.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602542H6003129",
        "type": "RF-360",
        "label": "DR03602542H6003129",
        "tenant": "Nysdoccs Poc",
        "distanceMiles": 49.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602542H6003129W",
        "type": "RF-360",
        "label": "DR03602542H6003129",
        "tenant": "Nysdoccs Poc",
        "distanceMiles": 49.8,
        "isActive": true
      }
    ]
  },
  "la": {
    "total": 98,
    "typeCounts": {
      "AA Cloud": 8,
      "RF-360": 48,
      "RF-560": 16,
      "RF-160": 14,
      "Camera": 10,
      "WiFi": 1,
      "Link": 1
    },
    "tenants": [
      {
        "name": "Ocprobation",
        "sensorCount": 19,
        "types": [
          "RF-360",
          "RF-560",
          "RF-160",
          "Camera"
        ]
      },
      {
        "name": "Ontariointl",
        "sensorCount": 18,
        "types": [
          "RF-360",
          "RF-160"
        ]
      },
      {
        "name": "Sofi",
        "sensorCount": 16,
        "types": [
          "AA Cloud",
          "RF-360",
          "RF-560",
          "RF-160",
          "Camera"
        ]
      },
      {
        "name": "Sce",
        "sensorCount": 14,
        "types": [
          "RF-360",
          "Camera",
          "RF-160"
        ]
      },
      {
        "name": "Disney",
        "sensorCount": 8,
        "types": [
          "AA Cloud",
          "RF-560"
        ]
      },
      {
        "name": "Church Of Scientology Ca",
        "sensorCount": 8,
        "types": [
          "RF-360",
          "RF-160"
        ]
      },
      {
        "name": "Cordelldrive",
        "sensorCount": 5,
        "types": [
          "RF-360",
          "Camera",
          "RF-560"
        ]
      },
      {
        "name": "Cacuastaskforce",
        "sensorCount": 4,
        "types": [
          "AA Cloud"
        ]
      },
      {
        "name": "Dodgers",
        "sensorCount": 3,
        "types": [
          "AA Cloud",
          "Camera",
          "WiFi"
        ]
      },
      {
        "name": "Splash9",
        "sensorCount": 2,
        "types": [
          "RF-560"
        ]
      }
    ],
    "sensors": [
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_mktbzyxa",
        "type": "AA Cloud",
        "label": "AACC - LA_4",
        "tenant": "Sofi",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602442P6002864",
        "type": "RF-360",
        "label": "RF360-2864_MU4",
        "tenant": "Sofi",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602510A6001392W",
        "type": "RF-560",
        "label": "RF560-1392_N-ROOF",
        "tenant": "Sofi",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602434A1001586W",
        "type": "RF-160",
        "label": "RF160-1586_SE-ROOF",
        "tenant": "Sofi",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602510A6001392",
        "type": "RF-560",
        "label": "RF560-1392_N-ROOF",
        "tenant": "Sofi",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602434A1001586",
        "type": "RF-160",
        "label": "RF160-1586_SE-ROOF",
        "tenant": "Sofi",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602442P6002864W",
        "type": "RF-360",
        "label": "RF360-2864_MU4",
        "tenant": "Sofi",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602442P6002862",
        "type": "RF-360",
        "label": "RF360-2862_DAS",
        "tenant": "Sofi",
        "distanceMiles": 0.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_u7vi133b",
        "type": "Camera",
        "label": "PTZ_DAS",
        "tenant": "Sofi",
        "distanceMiles": 0.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602442P6002862W",
        "type": "RF-360",
        "label": "RF360-2862_DAS",
        "tenant": "Sofi",
        "distanceMiles": 0.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602442P6002868",
        "type": "RF-360",
        "label": "RF360-2868_LOT-C",
        "tenant": "Sofi",
        "distanceMiles": 0.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_0z1edsxf",
        "type": "Camera",
        "label": "PTZ_LOT-C",
        "tenant": "Sofi",
        "distanceMiles": 0.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602442P6002868W",
        "type": "RF-360",
        "label": "RF360-2868_LOT-C",
        "tenant": "Sofi",
        "distanceMiles": 0.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602417P6002518",
        "type": "RF-360",
        "label": "RF360-2518_PS4",
        "tenant": "Sofi",
        "distanceMiles": 0.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_2yq3lo3e",
        "type": "Camera",
        "label": "PTZ_PS4",
        "tenant": "Sofi",
        "distanceMiles": 0.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602417P6002518W",
        "type": "RF-360",
        "label": "RF360-2518_PS4",
        "tenant": "Sofi",
        "distanceMiles": 0.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_p1flduh6",
        "type": "AA Cloud",
        "label": "AACC - LA_8",
        "tenant": "Disney",
        "distanceMiles": 7.7,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_cryyetbf",
        "type": "AA Cloud",
        "label": "AACC - LASD-SCSAP 1",
        "tenant": "Cacuastaskforce",
        "distanceMiles": 8.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_yug9w00d",
        "type": "AA Cloud",
        "label": "AACC - LASD-SCSAP 4",
        "tenant": "Cacuastaskforce",
        "distanceMiles": 9.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_c2grc8hn",
        "type": "AA Cloud",
        "label": "AACC dodgers-LA_10",
        "tenant": "Dodgers",
        "distanceMiles": 10,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_co2p4vat",
        "type": "Camera",
        "label": "Camera:192.168.40.232",
        "tenant": "Dodgers",
        "distanceMiles": 10,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DRU9002447P1001004W",
        "type": "WiFi",
        "label": "DRU9002447P1001004",
        "tenant": "Dodgers",
        "distanceMiles": 10,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602417P6002513",
        "type": "RF-360",
        "label": "East (H.I.) RF - 360",
        "tenant": "Church Of Scientology Ca",
        "distanceMiles": 10.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602417P6002513W",
        "type": "RF-360",
        "label": "East (H.I.) RF - 360",
        "tenant": "Church Of Scientology Ca",
        "distanceMiles": 10.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602418P6002564W",
        "type": "RF-360",
        "label": "RF360",
        "tenant": "Cordelldrive",
        "distanceMiles": 10.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602434P6002754",
        "type": "RF-360",
        "label": "South RF - 360",
        "tenant": "Church Of Scientology Ca",
        "distanceMiles": 10.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602434P6002754W",
        "type": "RF-360",
        "label": "South RF - 360",
        "tenant": "Church Of Scientology Ca",
        "distanceMiles": 10.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_zeehrnqs",
        "type": "Camera",
        "label": "AXIS-PTZ",
        "tenant": "Cordelldrive",
        "distanceMiles": 10.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602439A6001169W",
        "type": "RF-560",
        "label": "RF560",
        "tenant": "Cordelldrive",
        "distanceMiles": 10.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602418P6002564",
        "type": "RF-360",
        "label": "RF360",
        "tenant": "Cordelldrive",
        "distanceMiles": 10.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602439A6001169",
        "type": "RF-560",
        "label": "RF560",
        "tenant": "Cordelldrive",
        "distanceMiles": 10.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602418P6002542",
        "type": "RF-360",
        "label": "North RF - 360",
        "tenant": "Church Of Scientology Ca",
        "distanceMiles": 10.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602436A1001619W",
        "type": "RF-160",
        "label": "WEST RF - 160",
        "tenant": "Church Of Scientology Ca",
        "distanceMiles": 10.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602436A1001619",
        "type": "RF-160",
        "label": "WEST RF - 160",
        "tenant": "Church Of Scientology Ca",
        "distanceMiles": 10.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602418P6002542W",
        "type": "RF-360",
        "label": "North RF - 360",
        "tenant": "Church Of Scientology Ca",
        "distanceMiles": 10.3,
        "isActive": true
      },
      {
        "source": "DCity",
        "sensorId": "0QRDLB10034TUC",
        "type": "Link",
        "label": "LA_6",
        "tenant": "",
        "distanceMiles": 16.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_kjgrbavp",
        "type": "AA Cloud",
        "label": "AACC - RoseBowl",
        "tenant": "Cacuastaskforce",
        "distanceMiles": 17.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602506A6001279W",
        "type": "RF-560",
        "label": "DR05602506A6001279",
        "tenant": "Splash9",
        "distanceMiles": 17.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602506A6001279",
        "type": "RF-560",
        "label": "DR05602506A6001279",
        "tenant": "Splash9",
        "distanceMiles": 17.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_i3lca9wq",
        "type": "AA Cloud",
        "label": "AACC - LASD-SCSAP 3",
        "tenant": "Cacuastaskforce",
        "distanceMiles": 20,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602521A6001589",
        "type": "RF-560",
        "label": "DR05602521A6001589",
        "tenant": "Disney",
        "distanceMiles": 25.7,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_91qj5v1e",
        "type": "AA Cloud",
        "label": "AACC - Disney_Mobile_West",
        "tenant": "Disney",
        "distanceMiles": 25.7,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602521A6001563",
        "type": "RF-560",
        "label": "DR05602521A6001563",
        "tenant": "Disney",
        "distanceMiles": 25.7,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602521A6001589W",
        "type": "RF-560",
        "label": "DR05602521A6001589",
        "tenant": "Disney",
        "distanceMiles": 25.7,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602521A6001563W",
        "type": "RF-560",
        "label": "DR05602521A6001563",
        "tenant": "Disney",
        "distanceMiles": 25.7,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602424P6002643",
        "type": "RF-360",
        "label": "RF360-2643-IRC",
        "tenant": "Ocprobation",
        "distanceMiles": 28.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602429A6001115",
        "type": "RF-560",
        "label": "RF560-1115-MOB",
        "tenant": "Ocprobation",
        "distanceMiles": 28.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602424P6002645",
        "type": "RF-360",
        "label": "RF360-2645-MOB",
        "tenant": "Ocprobation",
        "distanceMiles": 28.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602429A6001114",
        "type": "RF-560",
        "label": "RF560-1114-MOB",
        "tenant": "Ocprobation",
        "distanceMiles": 28.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602429A6001114W",
        "type": "RF-560",
        "label": "RF560-1114-MOB",
        "tenant": "Ocprobation",
        "distanceMiles": 28.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602429A1001575",
        "type": "RF-160",
        "label": "RF160-1575-MOB",
        "tenant": "Ocprobation",
        "distanceMiles": 28.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_ae800hto",
        "type": "Camera",
        "label": "AXIS_PTZ-MOB",
        "tenant": "Ocprobation",
        "distanceMiles": 28.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602429A1001575W",
        "type": "RF-160",
        "label": "RF160-1575-MOB",
        "tenant": "Ocprobation",
        "distanceMiles": 28.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602424P6002643W",
        "type": "RF-360",
        "label": "RF360-2643-IRC",
        "tenant": "Ocprobation",
        "distanceMiles": 28.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602429A6001115W",
        "type": "RF-560",
        "label": "RF560-1115-MOB",
        "tenant": "Ocprobation",
        "distanceMiles": 28.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602424P6002645W",
        "type": "RF-360",
        "label": "RF360-2645-MOB",
        "tenant": "Ocprobation",
        "distanceMiles": 28.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602436P6002780",
        "type": "RF-360",
        "label": "RF360-2780-UNIT_T",
        "tenant": "Ocprobation",
        "distanceMiles": 28.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602436P6002780W",
        "type": "RF-360",
        "label": "RF360-2780-UNIT_T",
        "tenant": "Ocprobation",
        "distanceMiles": 28.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_enkgk1ku",
        "type": "Camera",
        "label": "AXIS_PTZ-MRC",
        "tenant": "Ocprobation",
        "distanceMiles": 28.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602436P6002784W",
        "type": "RF-360",
        "label": "RF360-2784-MRC",
        "tenant": "Ocprobation",
        "distanceMiles": 28.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602436A1001625W",
        "type": "RF-160",
        "label": "RF160-1625-MRC",
        "tenant": "Ocprobation",
        "distanceMiles": 28.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602436A1001625",
        "type": "RF-160",
        "label": "RF160-1625-MRC",
        "tenant": "Ocprobation",
        "distanceMiles": 28.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602436P6002784",
        "type": "RF-360",
        "label": "RF360-2784-MRC",
        "tenant": "Ocprobation",
        "distanceMiles": 28.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_m3gp0h52",
        "type": "Camera",
        "label": "AXIS_PTZ-MRC",
        "tenant": "Ocprobation",
        "distanceMiles": 28.6,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602521A6001582",
        "type": "RF-560",
        "label": "DR05602521A6001582",
        "tenant": "Disney",
        "distanceMiles": 30.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602521A6001582W",
        "type": "RF-560",
        "label": "DR05602521A6001582",
        "tenant": "Disney",
        "distanceMiles": 30.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602442P6002869",
        "type": "RF-360",
        "label": "PAR-RF360-POD8-SW",
        "tenant": "Sce",
        "distanceMiles": 36.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602442P6002869W",
        "type": "RF-360",
        "label": "PAR-RF360-POD8-SW",
        "tenant": "Sce",
        "distanceMiles": 36.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602424P6002624",
        "type": "RF-360",
        "label": "PAR-RF360-ROOF-SE",
        "tenant": "Sce",
        "distanceMiles": 36.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_nqqwpnp4",
        "type": "Camera",
        "label": "PAR-PTZ1-ROOF",
        "tenant": "Sce",
        "distanceMiles": 36.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602436A1001622W",
        "type": "RF-160",
        "label": "PAR-RF160-ROOF-SE",
        "tenant": "Sce",
        "distanceMiles": 36.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602436A1001622",
        "type": "RF-160",
        "label": "PAR-RF160-ROOF-SE",
        "tenant": "Sce",
        "distanceMiles": 36.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602424P6002624W",
        "type": "RF-360",
        "label": "PAR-RF360-ROOF-SE",
        "tenant": "Sce",
        "distanceMiles": 36.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_1bb9g1ev",
        "type": "Camera",
        "label": "PAR-PTZ2-POD12",
        "tenant": "Sce",
        "distanceMiles": 36.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602417A1001503W",
        "type": "RF-160",
        "label": "PAR-RF160-POD14-NW",
        "tenant": "Sce",
        "distanceMiles": 36.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602442P6002865W",
        "type": "RF-360",
        "label": "PAR-RF360-POD14-NW",
        "tenant": "Sce",
        "distanceMiles": 36.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602428P6002716",
        "type": "RF-360",
        "label": "PAR-RF360-POD1-N",
        "tenant": "Sce",
        "distanceMiles": 36.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602442P6002865",
        "type": "RF-360",
        "label": "PAR-RF360-POD14-NW",
        "tenant": "Sce",
        "distanceMiles": 36.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602417A1001503",
        "type": "RF-160",
        "label": "PAR-RF160-POD14-NW",
        "tenant": "Sce",
        "distanceMiles": 36.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602428P6002716W",
        "type": "RF-360",
        "label": "PAR-RF360-POD1-N",
        "tenant": "Sce",
        "distanceMiles": 36.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602349P6002136",
        "type": "RF-360",
        "label": "RF360-2136-SW-TRAILER",
        "tenant": "Ontariointl",
        "distanceMiles": 41.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602349P6002136W",
        "type": "RF-360",
        "label": "RF360-2136-SW-TRAILER",
        "tenant": "Ontariointl",
        "distanceMiles": 41.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602349P6002139",
        "type": "RF-360",
        "label": "RF360-2139-W-FEDEX-L",
        "tenant": "Ontariointl",
        "distanceMiles": 41.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602349P6002139W",
        "type": "RF-360",
        "label": "RF360-2139-W-FEDEX-L",
        "tenant": "Ontariointl",
        "distanceMiles": 41.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602349P6002133",
        "type": "RF-360",
        "label": "RF360-2133-NW-FEDEX-R",
        "tenant": "Ontariointl",
        "distanceMiles": 42,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602349P6002133W",
        "type": "RF-360",
        "label": "RF360-2133-NW-FEDEX-R",
        "tenant": "Ontariointl",
        "distanceMiles": 42,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602349P6002138",
        "type": "RF-360",
        "label": "RF360-2138-SW-AVION",
        "tenant": "Ontariointl",
        "distanceMiles": 42.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602349P6002138W",
        "type": "RF-360",
        "label": "RF360-2138-SW-AVION",
        "tenant": "Ontariointl",
        "distanceMiles": 42.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602349P6002137",
        "type": "RF-360",
        "label": "RF360-2137-N-INTLARIV",
        "tenant": "Ontariointl",
        "distanceMiles": 42.7,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602349P6002137W",
        "type": "RF-360",
        "label": "RF360-2137-N-INTLARIV",
        "tenant": "Ontariointl",
        "distanceMiles": 42.7,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602349P6002140W",
        "type": "RF-360",
        "label": "RF360-2140-NE-TERM4",
        "tenant": "Ontariointl",
        "distanceMiles": 43.7,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602349P6002140",
        "type": "RF-360",
        "label": "RF360-2140-NE-TERM4",
        "tenant": "Ontariointl",
        "distanceMiles": 43.7,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602349P6002141",
        "type": "RF-360",
        "label": "RF360-2141-SE-UPS",
        "tenant": "Ontariointl",
        "distanceMiles": 43.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602349P6002141W",
        "type": "RF-360",
        "label": "RF360-2141-SE-UPS",
        "tenant": "Ontariointl",
        "distanceMiles": 43.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602348A1001414W",
        "type": "RF-160",
        "label": "RF160-1414-E-ENTERPRISE",
        "tenant": "Ontariointl",
        "distanceMiles": 44.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602349P6002134",
        "type": "RF-360",
        "label": "RF360-2134-E-ENTERPRISE",
        "tenant": "Ontariointl",
        "distanceMiles": 44.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602348A1001414",
        "type": "RF-160",
        "label": "RF160-1414-E-ENTERPRISE",
        "tenant": "Ontariointl",
        "distanceMiles": 44.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602349P6002134W",
        "type": "RF-360",
        "label": "RF360-2134-E-ENTERPRISE",
        "tenant": "Ontariointl",
        "distanceMiles": 44.3,
        "isActive": true
      }
    ]
  },
  "dallas": {
    "total": 21,
    "typeCounts": {
      "RF-560": 8,
      "Camera": 5,
      "RF-310": 6,
      "ADS-B": 2
    },
    "tenants": [
      {
        "name": "B PD",
        "sensorCount": 10,
        "types": [
          "RF-310",
          "RF-560",
          "Camera"
        ]
      },
      {
        "name": "Lewisville PD",
        "sensorCount": 7,
        "types": [
          "RF-560",
          "Camera",
          "RF-310"
        ]
      },
      {
        "name": "B PD Beyond",
        "sensorCount": 2,
        "types": [
          "ADS-B",
          "Camera"
        ]
      },
      {
        "name": "Lewisville PD Dfr",
        "sensorCount": 2,
        "types": [
          "ADS-B",
          "Camera"
        ]
      }
    ],
    "sensors": [
      {
        "source": "DTracker",
        "sensorId": "DR05602512A6001414",
        "type": "RF-560",
        "label": "560 FORE",
        "tenant": "Lewisville PD",
        "distanceMiles": 20.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_jmhe16iu",
        "type": "Camera",
        "label": "Camera:10.34.123.30",
        "tenant": "Lewisville PD",
        "distanceMiles": 20.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602514A6001428",
        "type": "RF-560",
        "label": "560 AFT",
        "tenant": "Lewisville PD",
        "distanceMiles": 20.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102523P2001516W",
        "type": "RF-310",
        "label": "310 SCAN",
        "tenant": "Lewisville PD",
        "distanceMiles": 20.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602512A6001414W",
        "type": "RF-560",
        "label": "560 FORE",
        "tenant": "Lewisville PD",
        "distanceMiles": 20.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602514A6001428W",
        "type": "RF-560",
        "label": "560 AFT",
        "tenant": "Lewisville PD",
        "distanceMiles": 20.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102519P2001477W",
        "type": "RF-310",
        "label": "310 DF",
        "tenant": "Lewisville PD",
        "distanceMiles": 20.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "ADSB_47g15mgg",
        "type": "ADS-B",
        "label": "ADS-B Receiver 10.34.123.10",
        "tenant": "B PD Beyond",
        "distanceMiles": 21.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_didgjrkd",
        "type": "Camera",
        "label": "Camera:10.34.123.30",
        "tenant": "B PD Beyond",
        "distanceMiles": 21.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "ADSB_f7m4v4cd",
        "type": "ADS-B",
        "label": "ADS-B Receiver 10.34.123.10",
        "tenant": "Lewisville PD Dfr",
        "distanceMiles": 21.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_2aep3c98",
        "type": "Camera",
        "label": "Camera:10.34.123.30",
        "tenant": "Lewisville PD Dfr",
        "distanceMiles": 21.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102531P2001566",
        "type": "RF-310",
        "label": "310 DF",
        "tenant": "B PD",
        "distanceMiles": 22,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102531P2001573",
        "type": "RF-310",
        "label": "310 SCAN",
        "tenant": "B PD",
        "distanceMiles": 22,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602530A6001653",
        "type": "RF-560",
        "label": "560 AFT",
        "tenant": "B PD",
        "distanceMiles": 22,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_yvmdghgg",
        "type": "Camera",
        "label": "Camera:10.34.123.30",
        "tenant": "B PD",
        "distanceMiles": 22,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602530A6001653W",
        "type": "RF-560",
        "label": "560 AFT",
        "tenant": "B PD",
        "distanceMiles": 22,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602530A6001663W",
        "type": "RF-560",
        "label": "560 FORE",
        "tenant": "B PD",
        "distanceMiles": 22,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102531P2001566W",
        "type": "RF-310",
        "label": "310 DF",
        "tenant": "B PD",
        "distanceMiles": 22,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102531P2001573W",
        "type": "RF-310",
        "label": "310 SCAN",
        "tenant": "B PD",
        "distanceMiles": 22,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602530A6001663",
        "type": "RF-560",
        "label": "560 FORE",
        "tenant": "B PD",
        "distanceMiles": 22,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_ct4wp6z3",
        "type": "Camera",
        "label": "Camera:10.34.123.31",
        "tenant": "B PD",
        "distanceMiles": 22,
        "isActive": true
      }
    ]
  },
  "sf": {
    "total": 112,
    "typeCounts": {
      "AA Cloud": 2,
      "RF-360": 52,
      "RF-560": 24,
      "RF-160": 20,
      "Camera": 8,
      "Link": 1,
      "RF-310": 4,
      "Simulator": 1
    },
    "tenants": [
      {
        "name": "Tesla Fremont",
        "sensorCount": 24,
        "types": [
          "RF-360",
          "RF-160"
        ]
      },
      {
        "name": "Sanfran49ers",
        "sensorCount": 23,
        "types": [
          "AA Cloud",
          "RF-360",
          "RF-560",
          "RF-160",
          "Camera"
        ]
      },
      {
        "name": "Dalycity PD",
        "sensorCount": 16,
        "types": [
          "RF-560",
          "Camera",
          "RF-310"
        ]
      },
      {
        "name": "Tesla Kato",
        "sensorCount": 10,
        "types": [
          "RF-160",
          "RF-360",
          "RF-560"
        ]
      },
      {
        "name": "Tesla Nobel",
        "sensorCount": 10,
        "types": [
          "RF-360",
          "RF-560",
          "RF-160"
        ]
      },
      {
        "name": "Meta",
        "sensorCount": 8,
        "types": [
          "RF-360",
          "RF-160"
        ]
      },
      {
        "name": "Smysc",
        "sensorCount": 6,
        "types": [
          "RF-360",
          "RF-160"
        ]
      },
      {
        "name": "Cacuastaskforce",
        "sensorCount": 5,
        "types": [
          "RF-560",
          "AA Cloud"
        ]
      },
      {
        "name": "Teslapaloalto",
        "sensorCount": 4,
        "types": [
          "RF-360",
          "RF-160"
        ]
      },
      {
        "name": "Google Events",
        "sensorCount": 2,
        "types": [
          "RF-360"
        ]
      },
      {
        "name": "Demo Charlie",
        "sensorCount": 2,
        "types": [
          "RF-560"
        ]
      },
      {
        "name": "Cuaswest",
        "sensorCount": 1,
        "types": [
          "Simulator"
        ]
      }
    ],
    "sensors": [
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_6umshsfc",
        "type": "AA Cloud",
        "label": "AA Cloud Connector sanfran_4",
        "tenant": "Sanfran49ers",
        "distanceMiles": 0,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602418P6002562",
        "type": "RF-360",
        "label": "NW 360 2562",
        "tenant": "Sanfran49ers",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602421P6002579W",
        "type": "RF-360",
        "label": "NE 360 2579",
        "tenant": "Sanfran49ers",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602441A6001192W",
        "type": "RF-560",
        "label": "EBRPD-Mobile",
        "tenant": "Sanfran49ers",
        "distanceMiles": 0.1,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602429A1001573",
        "type": "RF-160",
        "label": "SW 160 1573",
        "tenant": "Sanfran49ers",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602550A6001931",
        "type": "RF-560",
        "label": "SOUTH SCOREBOARD NB ANT",
        "tenant": "Sanfran49ers",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602429A1001576",
        "type": "RF-160",
        "label": "NE 160 1576",
        "tenant": "Sanfran49ers",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602421P6002584",
        "type": "RF-360",
        "label": "SW 360 2584",
        "tenant": "Sanfran49ers",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602549A6001917",
        "type": "RF-560",
        "label": "SOUTH SCOREBOARD1",
        "tenant": "Sanfran49ers",
        "distanceMiles": 0.1,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602421P6002579",
        "type": "RF-360",
        "label": "NE 360 2579",
        "tenant": "Sanfran49ers",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602549A6001917W",
        "type": "RF-560",
        "label": "SOUTH SCOREBOARD1",
        "tenant": "Sanfran49ers",
        "distanceMiles": 0.1,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602441A6001192",
        "type": "RF-560",
        "label": "EBRPD-Mobile",
        "tenant": "Sanfran49ers",
        "distanceMiles": 0.1,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602418P6002562W",
        "type": "RF-360",
        "label": "NW 360 2562",
        "tenant": "Sanfran49ers",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_7l6md8lf",
        "type": "Camera",
        "label": "SE Camera",
        "tenant": "Sanfran49ers",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602429A1001576W",
        "type": "RF-160",
        "label": "NE 160 1576",
        "tenant": "Sanfran49ers",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602550A6001931W",
        "type": "RF-560",
        "label": "SOUTH SCOREBOARD NB ANT",
        "tenant": "Sanfran49ers",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602545A6001809",
        "type": "RF-560",
        "label": "SOUTH SCOREBOARD SB ANT",
        "tenant": "Sanfran49ers",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602421P6002583",
        "type": "RF-360",
        "label": "SE 360 2583",
        "tenant": "Sanfran49ers",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_c8rv86ey",
        "type": "Camera",
        "label": "NW Camera",
        "tenant": "Sanfran49ers",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602421P6002583W",
        "type": "RF-360",
        "label": "SE 360 2583",
        "tenant": "Sanfran49ers",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602421P6002584W",
        "type": "RF-360",
        "label": "SW 360 2584",
        "tenant": "Sanfran49ers",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602545A6001809W",
        "type": "RF-560",
        "label": "SOUTH SCOREBOARD SB ANT",
        "tenant": "Sanfran49ers",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602429A1001573W",
        "type": "RF-160",
        "label": "SW 160 1573",
        "tenant": "Sanfran49ers",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602340P6001043",
        "type": "RF-560",
        "label": "EBRPD-AIRBORNE",
        "tenant": "Cacuastaskforce",
        "distanceMiles": 0.9,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602436A1001620",
        "type": "RF-160",
        "label": "RF160-1620-S",
        "tenant": "Tesla Kato",
        "distanceMiles": 5.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602436A1001620W",
        "type": "RF-160",
        "label": "RF160-1620-S",
        "tenant": "Tesla Kato",
        "distanceMiles": 5.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602421P6002586",
        "type": "RF-360",
        "label": "RF360-2586-S",
        "tenant": "Tesla Kato",
        "distanceMiles": 5.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602442A6001203",
        "type": "RF-560",
        "label": "RF560-1203-S",
        "tenant": "Tesla Kato",
        "distanceMiles": 5.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602442A6001203W",
        "type": "RF-560",
        "label": "RF560-1203-S",
        "tenant": "Tesla Kato",
        "distanceMiles": 5.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602421P6002585",
        "type": "RF-360",
        "label": "RF360-2585-W",
        "tenant": "Tesla Kato",
        "distanceMiles": 5.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602421P6002585W",
        "type": "RF-360",
        "label": "RF360-2585-W",
        "tenant": "Tesla Kato",
        "distanceMiles": 5.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602421P6002588W",
        "type": "RF-360",
        "label": "RF360-2588-E",
        "tenant": "Tesla Kato",
        "distanceMiles": 5.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602421P6002588",
        "type": "RF-360",
        "label": "RF360-2588-E",
        "tenant": "Tesla Kato",
        "distanceMiles": 5.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602421P6002586W",
        "type": "RF-360",
        "label": "RF360-2586-S",
        "tenant": "Tesla Kato",
        "distanceMiles": 5.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602409P6002293",
        "type": "RF-360",
        "label": "RF360-S-LOT",
        "tenant": "Tesla Fremont",
        "distanceMiles": 6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602409P6002293W",
        "type": "RF-360",
        "label": "RF360-S-LOT",
        "tenant": "Tesla Fremont",
        "distanceMiles": 6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602410A1001463",
        "type": "RF-160",
        "label": "RF160-S-FACTORY-1",
        "tenant": "Tesla Fremont",
        "distanceMiles": 6.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602408P6002268",
        "type": "RF-360",
        "label": "RF360-S-FACTORY",
        "tenant": "Tesla Fremont",
        "distanceMiles": 6.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602410A1001463W",
        "type": "RF-160",
        "label": "RF160-S-FACTORY-1",
        "tenant": "Tesla Fremont",
        "distanceMiles": 6.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602409P6002306W",
        "type": "RF-360",
        "label": "RF360-S-TRACK-GATE",
        "tenant": "Tesla Fremont",
        "distanceMiles": 6.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602411A1001469W",
        "type": "RF-160",
        "label": "RF160-S-FACTORY-2",
        "tenant": "Tesla Fremont",
        "distanceMiles": 6.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602408P6002268W",
        "type": "RF-360",
        "label": "RF360-S-FACTORY",
        "tenant": "Tesla Fremont",
        "distanceMiles": 6.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602411A1001469",
        "type": "RF-160",
        "label": "RF160-S-FACTORY-2",
        "tenant": "Tesla Fremont",
        "distanceMiles": 6.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602409P6002306",
        "type": "RF-360",
        "label": "RF360-S-TRACK-GATE",
        "tenant": "Tesla Fremont",
        "distanceMiles": 6.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602408P6002273",
        "type": "RF-360",
        "label": "RF360-W-ENTRANCE",
        "tenant": "Tesla Fremont",
        "distanceMiles": 6.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602408P6002273W",
        "type": "RF-360",
        "label": "RF360-W-ENTRANCE",
        "tenant": "Tesla Fremont",
        "distanceMiles": 6.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602341P6002002W",
        "type": "RF-360",
        "label": "RF360-2002",
        "tenant": "Tesla Nobel",
        "distanceMiles": 6.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602341P6002004W",
        "type": "RF-360",
        "label": "RF360-2004",
        "tenant": "Tesla Nobel",
        "distanceMiles": 6.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602346P6001057",
        "type": "RF-560",
        "label": "RF560-1075",
        "tenant": "Tesla Nobel",
        "distanceMiles": 6.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602341P6002002",
        "type": "RF-360",
        "label": "RF360-2002",
        "tenant": "Tesla Nobel",
        "distanceMiles": 6.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602436A1001606",
        "type": "RF-160",
        "label": "RF160-1606",
        "tenant": "Tesla Nobel",
        "distanceMiles": 6.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602341P6002004",
        "type": "RF-360",
        "label": "RF360-2004",
        "tenant": "Tesla Nobel",
        "distanceMiles": 6.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602436A1001606W",
        "type": "RF-160",
        "label": "RF160-1606",
        "tenant": "Tesla Nobel",
        "distanceMiles": 6.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602346P6001057W",
        "type": "RF-560",
        "label": "RF560-1075",
        "tenant": "Tesla Nobel",
        "distanceMiles": 6.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602419P6002573W",
        "type": "RF-360",
        "label": "RF360-2573",
        "tenant": "Google Events",
        "distanceMiles": 6.5,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602409P6002304",
        "type": "RF-360",
        "label": "RF360-E-RP1",
        "tenant": "Tesla Fremont",
        "distanceMiles": 6.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602341P6002009",
        "type": "RF-360",
        "label": "RF360-2009",
        "tenant": "Tesla Nobel",
        "distanceMiles": 6.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602341P6002009W",
        "type": "RF-360",
        "label": "RF360-2009",
        "tenant": "Tesla Nobel",
        "distanceMiles": 6.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602419P6002573",
        "type": "RF-360",
        "label": "RF360-2573",
        "tenant": "Google Events",
        "distanceMiles": 6.5,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602409P6002304W",
        "type": "RF-360",
        "label": "RF360-E-RP1",
        "tenant": "Tesla Fremont",
        "distanceMiles": 6.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602410A1001460W",
        "type": "RF-160",
        "label": "RF160-N-FACTORY",
        "tenant": "Tesla Fremont",
        "distanceMiles": 6.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602411P6002369",
        "type": "RF-360",
        "label": "RF360-E-NORTHPAINT",
        "tenant": "Tesla Fremont",
        "distanceMiles": 6.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602409P6002323W",
        "type": "RF-360",
        "label": "RF360-N-FACTORY",
        "tenant": "Tesla Fremont",
        "distanceMiles": 6.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602411P6002366",
        "type": "RF-360",
        "label": "RF360-NW-CASTINGS",
        "tenant": "Tesla Fremont",
        "distanceMiles": 6.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602411P6002369W",
        "type": "RF-360",
        "label": "RF360-E-NORTHPAINT",
        "tenant": "Tesla Fremont",
        "distanceMiles": 6.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602409P6002323",
        "type": "RF-360",
        "label": "RF360-N-FACTORY",
        "tenant": "Tesla Fremont",
        "distanceMiles": 6.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602411P6002366W",
        "type": "RF-360",
        "label": "RF360-NW-CASTINGS",
        "tenant": "Tesla Fremont",
        "distanceMiles": 6.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602410A1001460",
        "type": "RF-160",
        "label": "RF160-N-FACTORY",
        "tenant": "Tesla Fremont",
        "distanceMiles": 6.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602411P6002365W",
        "type": "RF-360",
        "label": "RF360-NE-LOT",
        "tenant": "Tesla Fremont",
        "distanceMiles": 6.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602411P6002365",
        "type": "RF-360",
        "label": "RF360-NE-LOT",
        "tenant": "Tesla Fremont",
        "distanceMiles": 6.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602407P6002243",
        "type": "RF-360",
        "label": "RF360-2243",
        "tenant": "Teslapaloalto",
        "distanceMiles": 9.7,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602407P6002243W",
        "type": "RF-360",
        "label": "RF360-2243",
        "tenant": "Teslapaloalto",
        "distanceMiles": 9.7,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602336A1001361W",
        "type": "RF-160",
        "label": "RF160-1361",
        "tenant": "Teslapaloalto",
        "distanceMiles": 9.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602336A1001361",
        "type": "RF-160",
        "label": "RF160-1361",
        "tenant": "Teslapaloalto",
        "distanceMiles": 9.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602311P5001236",
        "type": "RF-360",
        "label": "DR0360-1236-BLD11",
        "tenant": "Meta",
        "distanceMiles": 11.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602311P5001236W",
        "type": "RF-360",
        "label": "DR0360-1236-BLD11",
        "tenant": "Meta",
        "distanceMiles": 11.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602311P5001350W",
        "type": "RF-360",
        "label": "DR0360-1350-BLD17",
        "tenant": "Meta",
        "distanceMiles": 11.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602311P5001350",
        "type": "RF-360",
        "label": "DR0360-1350-BLD17",
        "tenant": "Meta",
        "distanceMiles": 11.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602509A1001713",
        "type": "RF-160",
        "label": "DR0160-1713-BLD14",
        "tenant": "Meta",
        "distanceMiles": 11.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602509A1001713W",
        "type": "RF-160",
        "label": "DR0160-1713-BLD14",
        "tenant": "Meta",
        "distanceMiles": 11.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602432P6002740",
        "type": "RF-360",
        "label": "DR0360-2740-BLD19",
        "tenant": "Meta",
        "distanceMiles": 11.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602432P6002740W",
        "type": "RF-360",
        "label": "DR0360-2740-BLD19",
        "tenant": "Meta",
        "distanceMiles": 11.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602121P5001152",
        "type": "RF-360",
        "label": "Stairwell - 360",
        "tenant": "Smysc",
        "distanceMiles": 21.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602121P5001155",
        "type": "RF-360",
        "label": "Crosswalk - 360",
        "tenant": "Smysc",
        "distanceMiles": 21.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602121P5001155W",
        "type": "RF-360",
        "label": "Crosswalk - 360",
        "tenant": "Smysc",
        "distanceMiles": 21.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602121P5001152W",
        "type": "RF-360",
        "label": "Stairwell - 360",
        "tenant": "Smysc",
        "distanceMiles": 21.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602505A1001685W",
        "type": "RF-160",
        "label": "RF160",
        "tenant": "Smysc",
        "distanceMiles": 21.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602505A1001685",
        "type": "RF-160",
        "label": "RF160",
        "tenant": "Smysc",
        "distanceMiles": 21.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602340P6001043W",
        "type": "RF-560",
        "label": "EBRPD-AIRBORNE",
        "tenant": "Cacuastaskforce",
        "distanceMiles": 21.8,
        "isActive": false
      },
      {
        "source": "DCity",
        "sensorId": "0QRDJCGR033181",
        "type": "Link",
        "label": "SanFran_1",
        "tenant": "",
        "distanceMiles": 29.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602510A6001363W",
        "type": "RF-560",
        "label": "SFPD-GIRARD STREET",
        "tenant": "Cacuastaskforce",
        "distanceMiles": 34,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602519A6001502W",
        "type": "RF-560",
        "label": "560 AFT",
        "tenant": "Dalycity PD",
        "distanceMiles": 34,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_ka9a1a26",
        "type": "Camera",
        "label": "Port Camera",
        "tenant": "Dalycity PD",
        "distanceMiles": 34,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102512P2001391W",
        "type": "RF-310",
        "label": "310 DF",
        "tenant": "Dalycity PD",
        "distanceMiles": 34,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_shj5eqau",
        "type": "Camera",
        "label": "Port Camera",
        "tenant": "Dalycity PD",
        "distanceMiles": 34,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102515P2001465W",
        "type": "RF-310",
        "label": "310 SCAN",
        "tenant": "Dalycity PD",
        "distanceMiles": 34,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602519A6001502",
        "type": "RF-560",
        "label": "560 AFT",
        "tenant": "Dalycity PD",
        "distanceMiles": 34,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602510A6001370",
        "type": "RF-560",
        "label": "RF560-1370-JohnDaly",
        "tenant": "Dalycity PD",
        "distanceMiles": 34,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602510A6001363",
        "type": "RF-560",
        "label": "SFPD-GIRARD STREET",
        "tenant": "Cacuastaskforce",
        "distanceMiles": 34,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102512P2001391",
        "type": "RF-310",
        "label": "310 DF",
        "tenant": "Dalycity PD",
        "distanceMiles": 34,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_hwsiinlx",
        "type": "Camera",
        "label": "Camera Port",
        "tenant": "Dalycity PD",
        "distanceMiles": 34,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_ljzudlvd",
        "type": "Camera",
        "label": "Starboard Camera",
        "tenant": "Dalycity PD",
        "distanceMiles": 34,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602510A6001370W",
        "type": "RF-560",
        "label": "RF560-1370-JohnDaly",
        "tenant": "Dalycity PD",
        "distanceMiles": 34,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102515P2001465",
        "type": "RF-310",
        "label": "310 SCAN",
        "tenant": "Dalycity PD",
        "distanceMiles": 34,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602516A6001456",
        "type": "RF-560",
        "label": "560 FORE",
        "tenant": "Dalycity PD",
        "distanceMiles": 34,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_r86d13na",
        "type": "Camera",
        "label": "Camera Starboard",
        "tenant": "Dalycity PD",
        "distanceMiles": 34,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_3yxxb8xe",
        "type": "Camera",
        "label": "Port Camera",
        "tenant": "Dalycity PD",
        "distanceMiles": 34,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602516A6001456W",
        "type": "RF-560",
        "label": "560 FORE",
        "tenant": "Dalycity PD",
        "distanceMiles": 34,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_ns4anezm",
        "type": "AA Cloud",
        "label": "AACC - EBRPD",
        "tenant": "Cacuastaskforce",
        "distanceMiles": 35.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "SIMULATORSENSOR_joe085a9",
        "type": "Simulator",
        "label": "Simulator",
        "tenant": "Cuaswest",
        "distanceMiles": 36.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602510A6001387W",
        "type": "RF-560",
        "label": "DR05602510A6001387",
        "tenant": "Demo Charlie",
        "distanceMiles": 36.3,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602510A6001387",
        "type": "RF-560",
        "label": "DR05602510A6001387",
        "tenant": "Demo Charlie",
        "distanceMiles": 36.3,
        "isActive": false
      }
    ]
  },
  "miami": {
    "total": 37,
    "typeCounts": {
      "RF-360": 12,
      "RF-160": 4,
      "AA Cloud": 1,
      "Camera": 3,
      "Link": 3,
      "RF-560": 10,
      "RF-310": 4
    },
    "tenants": [
      {
        "name": "Tsa Hq",
        "sensorCount": 10,
        "types": [
          "RF-360",
          "RF-160"
        ]
      },
      {
        "name": "Delraybeach PD",
        "sensorCount": 10,
        "types": [
          "RF-310",
          "RF-560",
          "Camera"
        ]
      },
      {
        "name": "Dolphins",
        "sensorCount": 8,
        "types": [
          "RF-360",
          "RF-160",
          "AA Cloud",
          "Camera"
        ]
      },
      {
        "name": "Sunnyisles PD",
        "sensorCount": 4,
        "types": [
          "RF-560"
        ]
      },
      {
        "name": "Demo Alpha",
        "sensorCount": 2,
        "types": [
          "RF-560"
        ]
      }
    ],
    "sensors": [
      {
        "source": "DTracker",
        "sensorId": "DR03602410P6002333",
        "type": "RF-360",
        "label": "Gate 2A - RF360",
        "tenant": "Dolphins",
        "distanceMiles": 0.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602412A1001480W",
        "type": "RF-160",
        "label": "Gate 1 RF160",
        "tenant": "Dolphins",
        "distanceMiles": 0.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_m9bpeigo",
        "type": "AA Cloud",
        "label": "AACC - MiamiDolphinsAAIntegration",
        "tenant": "Dolphins",
        "distanceMiles": 0.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602408P6002275",
        "type": "RF-360",
        "label": "Gate 7 RF360",
        "tenant": "Dolphins",
        "distanceMiles": 0.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_g050gwzs",
        "type": "Camera",
        "label": "Training Camp - PTZ",
        "tenant": "Dolphins",
        "distanceMiles": 0.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602410P6002333W",
        "type": "RF-360",
        "label": "Gate 2A - RF360",
        "tenant": "Dolphins",
        "distanceMiles": 0.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602408P6002275W",
        "type": "RF-360",
        "label": "Gate 7 RF360",
        "tenant": "Dolphins",
        "distanceMiles": 0.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602412A1001480",
        "type": "RF-160",
        "label": "Gate 1 RF160",
        "tenant": "Dolphins",
        "distanceMiles": 0.3,
        "isActive": true
      },
      {
        "source": "DCity",
        "sensorId": "0QRDL5XR03J8JS",
        "type": "Link",
        "label": "Miami Dolphins",
        "tenant": "",
        "distanceMiles": 0.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602533A6001708W",
        "type": "RF-560",
        "label": "DR05602533A6001708",
        "tenant": "Demo Alpha",
        "distanceMiles": 6.4,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602533A6001708",
        "type": "RF-560",
        "label": "DR05602533A6001708",
        "tenant": "Demo Alpha",
        "distanceMiles": 6.4,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602545A6001793",
        "type": "RF-560",
        "label": "210 174th St. RF560",
        "tenant": "Sunnyisles PD",
        "distanceMiles": 7.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602545A6001796",
        "type": "RF-560",
        "label": "Gov. Center RF560",
        "tenant": "Sunnyisles PD",
        "distanceMiles": 7.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602545A6001793W",
        "type": "RF-560",
        "label": "210 174th St. RF560",
        "tenant": "Sunnyisles PD",
        "distanceMiles": 7.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602545A6001796W",
        "type": "RF-560",
        "label": "Gov. Center RF560",
        "tenant": "Sunnyisles PD",
        "distanceMiles": 7.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602512P6003020",
        "type": "RF-360",
        "label": "SW360 DR03602512P6003020",
        "tenant": "Tsa Hq",
        "distanceMiles": 9.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602512P6003020W",
        "type": "RF-360",
        "label": "SW360 DR03602512P6003020",
        "tenant": "Tsa Hq",
        "distanceMiles": 9.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602138P4001161",
        "type": "RF-160",
        "label": "SW160 DR01602138P4001161",
        "tenant": "Tsa Hq",
        "distanceMiles": 9.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602138P4001161W",
        "type": "RF-160",
        "label": "SW160 DR01602138P4001161",
        "tenant": "Tsa Hq",
        "distanceMiles": 9.3,
        "isActive": true
      },
      {
        "source": "DCity",
        "sensorId": "0QRDG710030097",
        "type": "Link",
        "label": "FtLauderdale_2",
        "tenant": "",
        "distanceMiles": 9.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602138P5001208W",
        "type": "RF-360",
        "label": "NW360 DR03602138P5001208",
        "tenant": "Tsa Hq",
        "distanceMiles": 9.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602138P5001208",
        "type": "RF-360",
        "label": "NW360 DR03602138P5001208",
        "tenant": "Tsa Hq",
        "distanceMiles": 9.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602138P5001209",
        "type": "RF-360",
        "label": "SE360 DR03602138P5001209",
        "tenant": "Tsa Hq",
        "distanceMiles": 10,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602138P5001209W",
        "type": "RF-360",
        "label": "SE360 DR03602138P5001209",
        "tenant": "Tsa Hq",
        "distanceMiles": 10,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602505P6002910W",
        "type": "RF-360",
        "label": "NE360 DR03602505P6002910",
        "tenant": "Tsa Hq",
        "distanceMiles": 10.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602505P6002910",
        "type": "RF-360",
        "label": "NE360 DR03602505P6002910",
        "tenant": "Tsa Hq",
        "distanceMiles": 10.4,
        "isActive": true
      },
      {
        "source": "DCity",
        "sensorId": "0QRDKC2R03ECS5",
        "type": "Link",
        "label": "Miami_2",
        "tenant": "",
        "distanceMiles": 11.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102515P2001440",
        "type": "RF-310",
        "label": "310 SCAN",
        "tenant": "Delraybeach PD",
        "distanceMiles": 36.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102510P2001371",
        "type": "RF-310",
        "label": "310 DF",
        "tenant": "Delraybeach PD",
        "distanceMiles": 36.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602516A6001442",
        "type": "RF-560",
        "label": "560 FORE",
        "tenant": "Delraybeach PD",
        "distanceMiles": 36.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602516A6001442W",
        "type": "RF-560",
        "label": "560 FORE",
        "tenant": "Delraybeach PD",
        "distanceMiles": 36.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602516A6001449",
        "type": "RF-560",
        "label": "560 AFT",
        "tenant": "Delraybeach PD",
        "distanceMiles": 36.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_jnc6tcrh",
        "type": "Camera",
        "label": "Camera:10.34.123.30",
        "tenant": "Delraybeach PD",
        "distanceMiles": 36.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_vfpa21ae",
        "type": "Camera",
        "label": "Camera:10.34.123.31",
        "tenant": "Delraybeach PD",
        "distanceMiles": 36.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102515P2001440W",
        "type": "RF-310",
        "label": "310 SCAN",
        "tenant": "Delraybeach PD",
        "distanceMiles": 36.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602516A6001449W",
        "type": "RF-560",
        "label": "560 AFT",
        "tenant": "Delraybeach PD",
        "distanceMiles": 36.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102510P2001371W",
        "type": "RF-310",
        "label": "310 DF",
        "tenant": "Delraybeach PD",
        "distanceMiles": 36.1,
        "isActive": true
      }
    ]
  },
  "atlanta": {
    "total": 68,
    "typeCounts": {
      "Camera": 6,
      "RF-360": 26,
      "AA Cloud": 5,
      "RF-160": 6,
      "RF-560": 16,
      "EchoShield Radar": 4,
      "RF-310": 4,
      "AeroScope": 1
    },
    "tenants": [
      {
        "name": "Braves",
        "sensorCount": 16,
        "types": [
          "RF-360",
          "RF-160",
          "Camera",
          "RF-560",
          "AA Cloud"
        ]
      },
      {
        "name": "Mercedes Benz Stadium",
        "sensorCount": 14,
        "types": [
          "Camera",
          "RF-360",
          "AA Cloud",
          "RF-160"
        ]
      },
      {
        "name": "Ccso",
        "sensorCount": 12,
        "types": [
          "AA Cloud",
          "EchoShield Radar",
          "Camera",
          "RF-310",
          "AeroScope"
        ]
      },
      {
        "name": "Emory",
        "sensorCount": 10,
        "types": [
          "RF-360",
          "RF-160"
        ]
      },
      {
        "name": "Atlanta 560",
        "sensorCount": 6,
        "types": [
          "RF-560"
        ]
      },
      {
        "name": "Geogroup",
        "sensorCount": 5,
        "types": [
          "RF-360",
          "Camera",
          "RF-560"
        ]
      },
      {
        "name": "Sunrise Fl",
        "sensorCount": 2,
        "types": [
          "RF-560"
        ]
      },
      {
        "name": "Sedemo",
        "sensorCount": 1,
        "types": [
          "AA Cloud"
        ]
      },
      {
        "name": "Epd In",
        "sensorCount": 1,
        "types": [
          "RF-560"
        ]
      },
      {
        "name": "Knoxcso",
        "sensorCount": 1,
        "types": [
          "RF-560"
        ]
      }
    ],
    "sensors": [
      {
        "source": "DTracker",
        "sensorId": "IPCAM_qjclul1j",
        "type": "Camera",
        "label": "MBS - PTZ",
        "tenant": "Mercedes Benz Stadium",
        "distanceMiles": 0,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602410P6002334",
        "type": "RF-360",
        "label": "West -360",
        "tenant": "Mercedes Benz Stadium",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602421P6002600",
        "type": "RF-360",
        "label": "East - 360",
        "tenant": "Mercedes Benz Stadium",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602423P6002618",
        "type": "RF-360",
        "label": "North - 360",
        "tenant": "Mercedes Benz Stadium",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602410P6002334W",
        "type": "RF-360",
        "label": "West -360",
        "tenant": "Mercedes Benz Stadium",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602411P6002385W",
        "type": "RF-360",
        "label": "South - 360",
        "tenant": "Mercedes Benz Stadium",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_i995sc1r",
        "type": "AA Cloud",
        "label": "AA Cloud AtlantaFalconsCameraIntegration",
        "tenant": "Mercedes Benz Stadium",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_7962qj0c",
        "type": "AA Cloud",
        "label": "AA Cloud Connector Sensor AtlantaFalconsCameraIntegration",
        "tenant": "Mercedes Benz Stadium",
        "distanceMiles": 0.1,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602411P6002385",
        "type": "RF-360",
        "label": "South - 360",
        "tenant": "Mercedes Benz Stadium",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602423P6002618W",
        "type": "RF-360",
        "label": "North - 360",
        "tenant": "Mercedes Benz Stadium",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602421P6002600W",
        "type": "RF-360",
        "label": "East - 360",
        "tenant": "Mercedes Benz Stadium",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_9tsshc0n",
        "type": "AA Cloud",
        "label": "AACC - Atlanta Falcons",
        "tenant": "Sedemo",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_0v5lv720",
        "type": "Camera",
        "label": "HDBY - PTZ",
        "tenant": "Mercedes Benz Stadium",
        "distanceMiles": 0.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602321A1001326W",
        "type": "RF-160",
        "label": "HDBY - 160",
        "tenant": "Mercedes Benz Stadium",
        "distanceMiles": 0.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602321A1001326",
        "type": "RF-160",
        "label": "HDBY - 160",
        "tenant": "Mercedes Benz Stadium",
        "distanceMiles": 0.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602413P6002425",
        "type": "RF-360",
        "label": "Emerson - 360",
        "tenant": "Emory",
        "distanceMiles": 4.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602413P6002425W",
        "type": "RF-360",
        "label": "Emerson - 360",
        "tenant": "Emory",
        "distanceMiles": 4.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602338P6001052",
        "type": "RF-560",
        "label": "GEMA-560-Unit-5",
        "tenant": "Atlanta 560",
        "distanceMiles": 5.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602338P6001052W",
        "type": "RF-560",
        "label": "GEMA-560-Unit-5",
        "tenant": "Atlanta 560",
        "distanceMiles": 5.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602411A1001475W",
        "type": "RF-160",
        "label": "Whitehead - 160",
        "tenant": "Emory",
        "distanceMiles": 5.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602411P6002387W",
        "type": "RF-360",
        "label": "Whitehead - 360",
        "tenant": "Emory",
        "distanceMiles": 5.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602411P6002387",
        "type": "RF-360",
        "label": "Whitehead - 360",
        "tenant": "Emory",
        "distanceMiles": 5.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602411A1001475",
        "type": "RF-160",
        "label": "Whitehead - 160",
        "tenant": "Emory",
        "distanceMiles": 5.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602510P6002966W",
        "type": "RF-360",
        "label": "HSRB2",
        "tenant": "Emory",
        "distanceMiles": 5.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602412P6002394W",
        "type": "RF-360",
        "label": "CEPAR HQ - 360",
        "tenant": "Emory",
        "distanceMiles": 5.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602510P6002966",
        "type": "RF-360",
        "label": "HSRB2",
        "tenant": "Emory",
        "distanceMiles": 5.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602412P6002394",
        "type": "RF-360",
        "label": "CEPAR HQ - 360",
        "tenant": "Emory",
        "distanceMiles": 5.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602516A6001450",
        "type": "RF-560",
        "label": "560 FORE",
        "tenant": "Sunrise Fl",
        "distanceMiles": 6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602528A6001625",
        "type": "RF-560",
        "label": "560 FORE",
        "tenant": "Epd In",
        "distanceMiles": 6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602514A6001417",
        "type": "RF-560",
        "label": "560 AFT",
        "tenant": "Knoxcso",
        "distanceMiles": 6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602528A6001632",
        "type": "RF-560",
        "label": "560 AFT",
        "tenant": "Sunrise Fl",
        "distanceMiles": 6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602410P6002332",
        "type": "RF-360",
        "label": "RF360-2332",
        "tenant": "Braves",
        "distanceMiles": 10.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602412A1001479",
        "type": "RF-160",
        "label": "RF160-1479",
        "tenant": "Braves",
        "distanceMiles": 10.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602410P6002330",
        "type": "RF-360",
        "label": "RF360-2330",
        "tenant": "Braves",
        "distanceMiles": 10.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602408P6002276W",
        "type": "RF-360",
        "label": "RF360-2276",
        "tenant": "Braves",
        "distanceMiles": 10.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602410P6002332W",
        "type": "RF-360",
        "label": "RF360-2332",
        "tenant": "Braves",
        "distanceMiles": 10.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602412A1001479W",
        "type": "RF-160",
        "label": "RF160-1479",
        "tenant": "Braves",
        "distanceMiles": 10.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602410P6002330W",
        "type": "RF-360",
        "label": "RF360-2330",
        "tenant": "Braves",
        "distanceMiles": 10.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602412P6002397",
        "type": "RF-360",
        "label": "RF360-2397",
        "tenant": "Braves",
        "distanceMiles": 10.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602408P6002276",
        "type": "RF-360",
        "label": "RF360-2276",
        "tenant": "Braves",
        "distanceMiles": 10.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_rtxhkxv3",
        "type": "Camera",
        "label": "Camera",
        "tenant": "Braves",
        "distanceMiles": 10.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602412P6002397W",
        "type": "RF-360",
        "label": "RF360-2397",
        "tenant": "Braves",
        "distanceMiles": 10.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_sxqxh4mz",
        "type": "AA Cloud",
        "label": "AACC - Braves_Atlanta_4",
        "tenant": "Ccso",
        "distanceMiles": 10.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602521A6001599",
        "type": "RF-560",
        "label": "RF560-1599",
        "tenant": "Braves",
        "distanceMiles": 10.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602521A6001574W",
        "type": "RF-560",
        "label": "RF560-1574",
        "tenant": "Braves",
        "distanceMiles": 10.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_ibzuq3du",
        "type": "AA Cloud",
        "label": "AACC - Atlanta_4",
        "tenant": "Braves",
        "distanceMiles": 10.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602521A6001574",
        "type": "RF-560",
        "label": "RF560-1574",
        "tenant": "Braves",
        "distanceMiles": 10.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602521A6001599W",
        "type": "RF-560",
        "label": "RF560-1599",
        "tenant": "Braves",
        "distanceMiles": 10.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "ECHODYNE_7l24m2rx",
        "type": "EchoShield Radar",
        "label": "Radar - Aft",
        "tenant": "Ccso",
        "distanceMiles": 14.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "ECHODYNE_9k0ehqev",
        "type": "EchoShield Radar",
        "label": "Radar - Port",
        "tenant": "Ccso",
        "distanceMiles": 14.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "ECHODYNE_nexucswl",
        "type": "EchoShield Radar",
        "label": "Radar - Fore",
        "tenant": "Ccso",
        "distanceMiles": 14.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "ECHODYNE_o7qnrk11",
        "type": "EchoShield Radar",
        "label": "Radar - Starboard",
        "tenant": "Ccso",
        "distanceMiles": 14.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_xg0v4b5f",
        "type": "Camera",
        "label": "Camera - Starboard",
        "tenant": "Ccso",
        "distanceMiles": 14.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102238P2001023W",
        "type": "RF-310",
        "label": "RF Sensor (DF)",
        "tenant": "Ccso",
        "distanceMiles": 14.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AEROSCOPE_wpk6ajnc",
        "type": "AeroScope",
        "label": "RF Sensor (Telemetry)",
        "tenant": "Ccso",
        "distanceMiles": 14.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102238P2001022",
        "type": "RF-310",
        "label": "RF Sensor (Scanning)",
        "tenant": "Ccso",
        "distanceMiles": 14.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102238P2001023",
        "type": "RF-310",
        "label": "RF Sensor (DF)",
        "tenant": "Ccso",
        "distanceMiles": 14.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_x5pi11et",
        "type": "Camera",
        "label": "Camera - Port",
        "tenant": "Ccso",
        "distanceMiles": 14.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102238P2001022W",
        "type": "RF-310",
        "label": "RF Sensor (Scanning)",
        "tenant": "Ccso",
        "distanceMiles": 14.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602510P6002976",
        "type": "RF-360",
        "label": "RF360-2976",
        "tenant": "Geogroup",
        "distanceMiles": 22.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_o2xo0vi8",
        "type": "Camera",
        "label": "Axis Camera",
        "tenant": "Geogroup",
        "distanceMiles": 22.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602521A6001595W",
        "type": "RF-560",
        "label": "RF560-1595",
        "tenant": "Geogroup",
        "distanceMiles": 22.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602521A6001595",
        "type": "RF-560",
        "label": "RF560-1595",
        "tenant": "Geogroup",
        "distanceMiles": 22.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602510P6002976W",
        "type": "RF-360",
        "label": "RF360-2976",
        "tenant": "Geogroup",
        "distanceMiles": 22.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602433A6001148",
        "type": "RF-560",
        "label": "GEMA-560-Unit-1",
        "tenant": "Atlanta 560",
        "distanceMiles": 41.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602433A6001148W",
        "type": "RF-560",
        "label": "GEMA-560-Unit-1",
        "tenant": "Atlanta 560",
        "distanceMiles": 41.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602512A6001407",
        "type": "RF-560",
        "label": "GEMA-560-Unit-6",
        "tenant": "Atlanta 560",
        "distanceMiles": 43.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602512A6001407W",
        "type": "RF-560",
        "label": "GEMA-560-Unit-6",
        "tenant": "Atlanta 560",
        "distanceMiles": 43.4,
        "isActive": true
      }
    ]
  },
  "houston": {
    "total": 0,
    "typeCounts": {},
    "tenants": [],
    "sensors": []
  },
  "philly": {
    "total": 24,
    "typeCounts": {
      "RF-560": 10,
      "RF-160": 2,
      "RF-310": 6,
      "EchoShield Radar": 4,
      "Camera": 2
    },
    "tenants": [
      {
        "name": "Njsp",
        "sensorCount": 12,
        "types": [
          "RF-560",
          "EchoShield Radar",
          "RF-310",
          "Camera"
        ]
      },
      {
        "name": "Wilmington PD",
        "sensorCount": 6,
        "types": [
          "RF-560",
          "RF-310"
        ]
      },
      {
        "name": "Comcast",
        "sensorCount": 2,
        "types": [
          "RF-160"
        ]
      },
      {
        "name": "Nosdd",
        "sensorCount": 2,
        "types": [
          "RF-560"
        ]
      },
      {
        "name": "Bapsnj",
        "sensorCount": 2,
        "types": [
          "RF-560"
        ]
      }
    ],
    "sensors": [
      {
        "source": "DTracker",
        "sensorId": "DR05602441A6001197",
        "type": "RF-560",
        "label": "DR05602441A6001197",
        "tenant": "Njsp",
        "distanceMiles": 3.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602441A6001197W",
        "type": "RF-560",
        "label": "DR05602441A6001197",
        "tenant": "Njsp",
        "distanceMiles": 3.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602103P4001137",
        "type": "RF-160",
        "label": "DR01602103P4001137",
        "tenant": "Comcast",
        "distanceMiles": 3.7,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602103P4001137W",
        "type": "RF-160",
        "label": "DR01602103P4001137",
        "tenant": "Comcast",
        "distanceMiles": 3.7,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602519A6001494",
        "type": "RF-560",
        "label": "560 AFT",
        "tenant": "Wilmington PD",
        "distanceMiles": 23.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602519A6001497",
        "type": "RF-560",
        "label": "560 FORE",
        "tenant": "Wilmington PD",
        "distanceMiles": 23.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102515P2001428W",
        "type": "RF-310",
        "label": "310 SCAN",
        "tenant": "Wilmington PD",
        "distanceMiles": 23.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602519A6001497W",
        "type": "RF-560",
        "label": "560 FORE",
        "tenant": "Wilmington PD",
        "distanceMiles": 23.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102519P2001476W",
        "type": "RF-310",
        "label": "310 DF",
        "tenant": "Wilmington PD",
        "distanceMiles": 23.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602519A6001494W",
        "type": "RF-560",
        "label": "560 AFT",
        "tenant": "Wilmington PD",
        "distanceMiles": 23.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "ECHODYNE_8gd88rgb",
        "type": "EchoShield Radar",
        "label": "Radar - Starboard",
        "tenant": "Njsp",
        "distanceMiles": 30.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102345P2001069",
        "type": "RF-310",
        "label": "RF Sensor (DF)",
        "tenant": "Njsp",
        "distanceMiles": 30.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_g7ncgc2w",
        "type": "Camera",
        "label": "Camera - Port",
        "tenant": "Njsp",
        "distanceMiles": 30.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_dq494021",
        "type": "Camera",
        "label": "Camera - Starboard",
        "tenant": "Njsp",
        "distanceMiles": 30.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "ECHODYNE_n1oepug9",
        "type": "EchoShield Radar",
        "label": "Radar - Fore",
        "tenant": "Njsp",
        "distanceMiles": 30.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "ECHODYNE_fzp7v74a",
        "type": "EchoShield Radar",
        "label": "Radar - Port",
        "tenant": "Njsp",
        "distanceMiles": 30.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102345P2001070",
        "type": "RF-310",
        "label": "RF Sensor (Scanning)",
        "tenant": "Njsp",
        "distanceMiles": 30.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "ECHODYNE_yad59x3k",
        "type": "EchoShield Radar",
        "label": "Radar - Aft",
        "tenant": "Njsp",
        "distanceMiles": 30.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102345P2001070W",
        "type": "RF-310",
        "label": "RF Sensor (Scanning)",
        "tenant": "Njsp",
        "distanceMiles": 30.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102345P2001069W",
        "type": "RF-310",
        "label": "RF Sensor (DF)",
        "tenant": "Njsp",
        "distanceMiles": 30.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602421P6001086",
        "type": "RF-560",
        "label": "(Farm) DR0560 (Ser.#2421P6001086)",
        "tenant": "Nosdd",
        "distanceMiles": 33.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602421P6001086W",
        "type": "RF-560",
        "label": "(Farm) DR0560 (Ser.#2421P6001086)",
        "tenant": "Nosdd",
        "distanceMiles": 33.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602439A6001171",
        "type": "RF-560",
        "label": "DR05602439A6001171",
        "tenant": "Bapsnj",
        "distanceMiles": 39.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602439A6001171W",
        "type": "RF-560",
        "label": "DR05602439A6001171",
        "tenant": "Bapsnj",
        "distanceMiles": 39.6,
        "isActive": true
      }
    ]
  },
  "seattle": {
    "total": 26,
    "typeCounts": {
      "RF-360": 16,
      "RF-160": 4,
      "AA Cloud": 1,
      "Camera": 2,
      "RF-560": 2,
      "Link": 1
    },
    "tenants": [
      {
        "name": "Seahawks",
        "sensorCount": 13,
        "types": [
          "RF-360",
          "RF-160",
          "AA Cloud",
          "Camera"
        ]
      },
      {
        "name": "Amazonhq",
        "sensorCount": 10,
        "types": [
          "RF-360",
          "RF-160"
        ]
      },
      {
        "name": "Kemperdc",
        "sensorCount": 2,
        "types": [
          "RF-560"
        ]
      },
      {
        "name": "Seattle",
        "sensorCount": 1,
        "types": [
          "Link"
        ]
      }
    ],
    "sensors": [
      {
        "source": "DTracker",
        "sensorId": "DR03602425P6002684",
        "type": "RF-360",
        "label": "RF360_SE-HUSSLE",
        "tenant": "Seahawks",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602423A1001540",
        "type": "RF-160",
        "label": "RF160_HAWKS-NEST",
        "tenant": "Seahawks",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602425P6002687",
        "type": "RF-360",
        "label": "RF360_SW-HUSSLE",
        "tenant": "Seahawks",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602425P6002687W",
        "type": "RF-360",
        "label": "RF360_SW-HUSSLE",
        "tenant": "Seahawks",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602423A1001540W",
        "type": "RF-160",
        "label": "RF160_HAWKS-NEST",
        "tenant": "Seahawks",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_52lorq50",
        "type": "AA Cloud",
        "label": "AA Cloud Connector Sensor Seahawks_test_1",
        "tenant": "Seahawks",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_z8azs4jh",
        "type": "Camera",
        "label": "PTZ_HAWKS-NEST",
        "tenant": "Seahawks",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602425P6002684W",
        "type": "RF-360",
        "label": "RF360_SE-HUSSLE",
        "tenant": "Seahawks",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602424P6002661",
        "type": "RF-360",
        "label": "RF360_HAWKS-NEST",
        "tenant": "Seahawks",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602424P6002661W",
        "type": "RF-360",
        "label": "RF360_HAWKS-NEST",
        "tenant": "Seahawks",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602424P6002642",
        "type": "RF-360",
        "label": "RF360_S-PARKING",
        "tenant": "Seahawks",
        "distanceMiles": 0.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_mgb0ymgq",
        "type": "Camera",
        "label": "PTZ_S-PARKING",
        "tenant": "Seahawks",
        "distanceMiles": 0.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602424P6002642W",
        "type": "RF-360",
        "label": "RF360_S-PARKING",
        "tenant": "Seahawks",
        "distanceMiles": 0.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DRT3602149P5001269W",
        "type": "RF-360",
        "label": "Meeting Center - 360",
        "tenant": "Amazonhq",
        "distanceMiles": 1.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DRT3602149P5001269",
        "type": "RF-360",
        "label": "Meeting Center - 360",
        "tenant": "Amazonhq",
        "distanceMiles": 1.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DRT3602149P5001268",
        "type": "RF-360",
        "label": "Summit - 360",
        "tenant": "Amazonhq",
        "distanceMiles": 1.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DRT3602149P5001268W",
        "type": "RF-360",
        "label": "Summit - 360",
        "tenant": "Amazonhq",
        "distanceMiles": 1.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DRT3602149P5001265",
        "type": "RF-360",
        "label": "Arizona - 360",
        "tenant": "Amazonhq",
        "distanceMiles": 1.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DRT3602149P5001265W",
        "type": "RF-360",
        "label": "Arizona - 360",
        "tenant": "Amazonhq",
        "distanceMiles": 1.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602417A1001501",
        "type": "RF-160",
        "label": "NEW Brazil - 160",
        "tenant": "Amazonhq",
        "distanceMiles": 1.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DRT3602149P5001267W",
        "type": "RF-360",
        "label": "Brazil - 360",
        "tenant": "Amazonhq",
        "distanceMiles": 1.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602417A1001501W",
        "type": "RF-160",
        "label": "NEW Brazil - 160",
        "tenant": "Amazonhq",
        "distanceMiles": 1.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DRT3602149P5001267",
        "type": "RF-360",
        "label": "Brazil - 360",
        "tenant": "Amazonhq",
        "distanceMiles": 1.9,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602533A6001696",
        "type": "RF-560",
        "label": "DR05602533A6001696",
        "tenant": "Kemperdc",
        "distanceMiles": 6.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602533A6001696W",
        "type": "RF-560",
        "label": "DR05602533A6001696",
        "tenant": "Kemperdc",
        "distanceMiles": 6.3,
        "isActive": true
      },
      {
        "source": "DCity",
        "sensorId": "0QRDGC5R03JJUY",
        "type": "Link",
        "label": "Seattle_4",
        "tenant": "Seattle",
        "distanceMiles": 10.7,
        "isActive": true
      }
    ]
  },
  "kc": {
    "total": 46,
    "typeCounts": {
      "RF-560": 11,
      "RF-160": 4,
      "Camera": 6,
      "AA Cloud": 2,
      "Radio": 4,
      "Prototype Radar": 1,
      "RF-360": 16,
      "RF-310": 2
    },
    "tenants": [
      {
        "name": "Qascade Arrowhead",
        "sensorCount": 17,
        "types": [
          "RF-560",
          "RF-160",
          "AA Cloud",
          "Camera",
          "RF-360"
        ]
      },
      {
        "name": "Arrowhead Kc",
        "sensorCount": 17,
        "types": [
          "RF-160",
          "Camera",
          "AA Cloud",
          "RF-560",
          "RF-360"
        ]
      },
      {
        "name": "Opkansas",
        "sensorCount": 7,
        "types": [
          "RF-560",
          "Camera",
          "RF-310"
        ]
      },
      {
        "name": "Training",
        "sensorCount": 5,
        "types": [
          "Radio",
          "Prototype Radar"
        ]
      }
    ],
    "sensors": [
      {
        "source": "DTracker",
        "sensorId": "DR05602533A6001735Mirror",
        "type": "RF-560",
        "label": "Press Box- 560 (1735)",
        "tenant": "Qascade Arrowhead",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602533A6001735WMirror",
        "type": "RF-560",
        "label": "Press Box- 560 (1735)",
        "tenant": "Qascade Arrowhead",
        "distanceMiles": 0.1,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602509A1001715WMirror",
        "type": "RF-160",
        "label": "Chapel-160 (1715)",
        "tenant": "Qascade Arrowhead",
        "distanceMiles": 0.1,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602509A1001715",
        "type": "RF-160",
        "label": "Chapel-160 (1715)",
        "tenant": "Arrowhead Kc",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_h8gmqm27",
        "type": "Camera",
        "label": "Concessions PTZ",
        "tenant": "Arrowhead Kc",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_a6ix94teMirror",
        "type": "AA Cloud",
        "label": "AACC - Kansas City 2",
        "tenant": "Qascade Arrowhead",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602509A1001715Mirror",
        "type": "RF-160",
        "label": "Chapel-160 (1715)",
        "tenant": "Qascade Arrowhead",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602528A6001618WMirror",
        "type": "RF-560",
        "label": "Press Box- 560 (1618)",
        "tenant": "Qascade Arrowhead",
        "distanceMiles": 0.1,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_a6ix94te",
        "type": "AA Cloud",
        "label": "AACC - Kansas City 2",
        "tenant": "Arrowhead Kc",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602528A6001618",
        "type": "RF-560",
        "label": "Press Box- 560 (1618)",
        "tenant": "Arrowhead Kc",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_el62ge4d",
        "type": "Camera",
        "label": "Press Box PTZ",
        "tenant": "Arrowhead Kc",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602509A1001715W",
        "type": "RF-160",
        "label": "Chapel-160 (1715)",
        "tenant": "Arrowhead Kc",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602533A6001735",
        "type": "RF-560",
        "label": "Press Box- 560 (1735)",
        "tenant": "Arrowhead Kc",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602528A6001618W",
        "type": "RF-560",
        "label": "Press Box- 560 (1618)",
        "tenant": "Arrowhead Kc",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602533A6001735W",
        "type": "RF-560",
        "label": "Press Box- 560 (1735)",
        "tenant": "Arrowhead Kc",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602528A6001618Mirror",
        "type": "RF-560",
        "label": "Press Box- 560 (1618)",
        "tenant": "Qascade Arrowhead",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_h8gmqm27Mirror",
        "type": "Camera",
        "label": "Concessions PTZ",
        "tenant": "Qascade Arrowhead",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "RF360-3",
        "type": "Radio",
        "label": "RF360-3",
        "tenant": "Training",
        "distanceMiles": 0.1,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "RF360-4",
        "type": "Radio",
        "label": "RF360-4",
        "tenant": "Training",
        "distanceMiles": 0.1,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_el62ge4dMirror",
        "type": "Camera",
        "label": "Press Box PTZ",
        "tenant": "Qascade Arrowhead",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "Echoguard",
        "type": "Prototype Radar",
        "label": "Echoguard-1",
        "tenant": "Training",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "RF360-2",
        "type": "Radio",
        "label": "RF360-2",
        "tenant": "Training",
        "distanceMiles": 0.1,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "RF360-1",
        "type": "Radio",
        "label": "RF360-1",
        "tenant": "Training",
        "distanceMiles": 0.1,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602506P6002921WMirror",
        "type": "RF-360",
        "label": "Gate 5- 360 (2921)",
        "tenant": "Qascade Arrowhead",
        "distanceMiles": 0.4,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602506P6002921Mirror",
        "type": "RF-360",
        "label": "Gate 5- 360 (needs Azimuth) (2921)",
        "tenant": "Qascade Arrowhead",
        "distanceMiles": 0.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602506P6002921",
        "type": "RF-360",
        "label": "Gate 5- 360 (needs Azimuth) (2921)",
        "tenant": "Arrowhead Kc",
        "distanceMiles": 0.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602510P6002974",
        "type": "RF-360",
        "label": "Gate 6 - 360 (2974)",
        "tenant": "Arrowhead Kc",
        "distanceMiles": 0.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602506P6002918",
        "type": "RF-360",
        "label": "Gate 3 - Oct. 9 (2918)",
        "tenant": "Arrowhead Kc",
        "distanceMiles": 0.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602506P6002921W",
        "type": "RF-360",
        "label": "Gate 5- 360 (needs Azimuth) (2921)",
        "tenant": "Arrowhead Kc",
        "distanceMiles": 0.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602506P6002917W",
        "type": "RF-360",
        "label": "Gate 2- 360 (2917)",
        "tenant": "Arrowhead Kc",
        "distanceMiles": 0.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602510P6002974W",
        "type": "RF-360",
        "label": "Gate 6 - 360 (2974)",
        "tenant": "Arrowhead Kc",
        "distanceMiles": 0.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602506P6002918Mirror",
        "type": "RF-360",
        "label": "Gate 3 - Oct. 9 (2918)",
        "tenant": "Qascade Arrowhead",
        "distanceMiles": 0.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602506P6002918W",
        "type": "RF-360",
        "label": "Gate 3 - Oct. 9 (2918)",
        "tenant": "Arrowhead Kc",
        "distanceMiles": 0.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602506P6002917",
        "type": "RF-360",
        "label": "Gate 2- 360 (2917)",
        "tenant": "Arrowhead Kc",
        "distanceMiles": 0.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602510P6002974Mirror",
        "type": "RF-360",
        "label": "Gate 6 - 360 (2974)",
        "tenant": "Qascade Arrowhead",
        "distanceMiles": 0.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602506P6002917Mirror",
        "type": "RF-360",
        "label": "Gate 2- 360 (2917)",
        "tenant": "Qascade Arrowhead",
        "distanceMiles": 0.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602510P6002974WMirror",
        "type": "RF-360",
        "label": "Gate 6 - 360 (2974)",
        "tenant": "Qascade Arrowhead",
        "distanceMiles": 0.4,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602506P6002918WMirror",
        "type": "RF-360",
        "label": "Gate 3 - Oct. 9 (2918)",
        "tenant": "Qascade Arrowhead",
        "distanceMiles": 0.4,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602506P6002917WMirror",
        "type": "RF-360",
        "label": "Gate 2- 360 (2917)",
        "tenant": "Qascade Arrowhead",
        "distanceMiles": 0.4,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602519A6001519",
        "type": "RF-560",
        "label": "560 AFT",
        "tenant": "Opkansas",
        "distanceMiles": 14.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_ff1enqd7",
        "type": "Camera",
        "label": "Camera:Port",
        "tenant": "Opkansas",
        "distanceMiles": 14.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_w1cw0eht",
        "type": "Camera",
        "label": "Camera:Starboard",
        "tenant": "Opkansas",
        "distanceMiles": 14.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602516A6001459W",
        "type": "RF-560",
        "label": "560 FORE",
        "tenant": "Opkansas",
        "distanceMiles": 14.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602519A6001519W",
        "type": "RF-560",
        "label": "560 AFT",
        "tenant": "Opkansas",
        "distanceMiles": 14.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102519P2001479W",
        "type": "RF-310",
        "label": "310 DF",
        "tenant": "Opkansas",
        "distanceMiles": 14.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03102509P2001347W",
        "type": "RF-310",
        "label": "310 SCAN",
        "tenant": "Opkansas",
        "distanceMiles": 14.8,
        "isActive": true
      }
    ]
  },
  "boston": {
    "total": 21,
    "typeCounts": {
      "AA Cloud": 1,
      "Camera": 2,
      "RF-560": 4,
      "RF-360": 10,
      "RF-160": 2,
      "Link": 2
    },
    "tenants": [
      {
        "name": "Gillette Stadium",
        "sensorCount": 13,
        "types": [
          "AA Cloud",
          "Camera",
          "RF-560",
          "RF-360",
          "RF-160"
        ]
      },
      {
        "name": "National Grid",
        "sensorCount": 4,
        "types": [
          "RF-360"
        ]
      },
      {
        "name": "Redsox",
        "sensorCount": 2,
        "types": [
          "RF-560"
        ]
      }
    ],
    "sensors": [
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_vvrl2vo5",
        "type": "AA Cloud",
        "label": "AA Cloud Connector Sensor https://partnerapi.aerialarmor.com",
        "tenant": "Gillette Stadium",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_236vblzg",
        "type": "Camera",
        "label": "E3 Elevator - PTZ",
        "tenant": "Gillette Stadium",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602549A6001921W",
        "type": "RF-560",
        "label": "DR05602549A6001921",
        "tenant": "Gillette Stadium",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602549A6001921",
        "type": "RF-560",
        "label": "DR05602549A6001921",
        "tenant": "Gillette Stadium",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_kmk8752z",
        "type": "Camera",
        "label": "W2 Elevator - PTZ",
        "tenant": "Gillette Stadium",
        "distanceMiles": 0.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602339P6001986",
        "type": "RF-360",
        "label": "East Perimeter - 360",
        "tenant": "Gillette Stadium",
        "distanceMiles": 0.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602340A1001374",
        "type": "RF-160",
        "label": "Waste Mgmt. - 160",
        "tenant": "Gillette Stadium",
        "distanceMiles": 0.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602341P6002006",
        "type": "RF-360",
        "label": "Skipjacks - 360",
        "tenant": "Gillette Stadium",
        "distanceMiles": 0.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602339P6001985",
        "type": "RF-360",
        "label": "Waste Mgmt. - 360",
        "tenant": "Gillette Stadium",
        "distanceMiles": 0.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602339P6001986W",
        "type": "RF-360",
        "label": "East Perimeter - 360",
        "tenant": "Gillette Stadium",
        "distanceMiles": 0.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602340A1001374W",
        "type": "RF-160",
        "label": "Waste Mgmt. - 160",
        "tenant": "Gillette Stadium",
        "distanceMiles": 0.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602339P6001985W",
        "type": "RF-360",
        "label": "Waste Mgmt. - 360",
        "tenant": "Gillette Stadium",
        "distanceMiles": 0.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602341P6002006W",
        "type": "RF-360",
        "label": "Skipjacks - 360",
        "tenant": "Gillette Stadium",
        "distanceMiles": 0.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602510A6001373W",
        "type": "RF-560",
        "label": "DR05602510A6001373",
        "tenant": "Redsox",
        "distanceMiles": 19.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602510A6001373",
        "type": "RF-560",
        "label": "DR05602510A6001373",
        "tenant": "Redsox",
        "distanceMiles": 19.6,
        "isActive": true
      },
      {
        "source": "DCity",
        "sensorId": "0QRDK2ER03R324",
        "type": "Link",
        "label": "Boston_3",
        "tenant": "",
        "distanceMiles": 19.7,
        "isActive": true
      },
      {
        "source": "DCity",
        "sensorId": "0QRDG8TR03D8YY",
        "type": "Link",
        "label": "Boston PD Encore Hotel",
        "tenant": "",
        "distanceMiles": 23.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602424P6002655",
        "type": "RF-360",
        "label": "Zone 16-17 (P1 PumpHouse)",
        "tenant": "National Grid",
        "distanceMiles": 35.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602424P6002655W",
        "type": "RF-360",
        "label": "Zone 16-17 (P1 PumpHouse)",
        "tenant": "National Grid",
        "distanceMiles": 35.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602418P6002566W",
        "type": "RF-360",
        "label": "Zone 11-12 (P1 Rearend)",
        "tenant": "National Grid",
        "distanceMiles": 35.7,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602423P6002623W",
        "type": "RF-360",
        "label": "Zone 7-8 (P2 Rearend)",
        "tenant": "National Grid",
        "distanceMiles": 35.8,
        "isActive": true
      }
    ]
  },
  "vancouver": {
    "total": 0,
    "typeCounts": {},
    "tenants": [],
    "sensors": []
  },
  "toronto": {
    "total": 34,
    "typeCounts": {
      "Link": 2,
      "RF-160": 6,
      "Camera": 8,
      "RF-360": 12,
      "AeroScope": 1,
      "AA Cloud": 1,
      "RF-560": 4
    },
    "tenants": [
      {
        "name": "Gtaa",
        "sensorCount": 27,
        "types": [
          "RF-160",
          "Camera",
          "RF-360",
          "AeroScope"
        ]
      },
      {
        "name": "Cbpbuffalo",
        "sensorCount": 5,
        "types": [
          "AA Cloud",
          "RF-560"
        ]
      }
    ],
    "sensors": [
      {
        "source": "DCity",
        "sensorId": "0QRDFBN0030005",
        "type": "Link",
        "label": "RCMP_32",
        "tenant": "",
        "distanceMiles": 0.3,
        "isActive": false
      },
      {
        "source": "DCity",
        "sensorId": "0QRDGAAR038486",
        "type": "Link",
        "label": "RCMP_37",
        "tenant": "",
        "distanceMiles": 0.4,
        "isActive": false
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602341A1001380",
        "type": "RF-160",
        "label": "(NPSV-S) DR01602341A1001380",
        "tenant": "Gtaa",
        "distanceMiles": 9.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_iaopwl9q",
        "type": "Camera",
        "label": "NPSV-S Camera: 10.7.62.114",
        "tenant": "Gtaa",
        "distanceMiles": 9.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602344P6002057",
        "type": "RF-360",
        "label": "(NPSV-S) DR03602344P6002057",
        "tenant": "Gtaa",
        "distanceMiles": 9.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_0hgwairv",
        "type": "Camera",
        "label": "AMF Camera: 10.7.52.61",
        "tenant": "Gtaa",
        "distanceMiles": 9.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602342P6002017",
        "type": "RF-360",
        "label": "(AMF) DR03602342P6002017",
        "tenant": "Gtaa",
        "distanceMiles": 9.4,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602342P6002029",
        "type": "RF-360",
        "label": "(BUSSING) DR03602342P6002029",
        "tenant": "Gtaa",
        "distanceMiles": 9.5,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602342P6002016",
        "type": "RF-360",
        "label": "(5675-SD) DR03602342P6002016",
        "tenant": "Gtaa",
        "distanceMiles": 9.7,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_lri0xuh6",
        "type": "Camera",
        "label": "Towing C Camera: 10.7.53.223",
        "tenant": "Gtaa",
        "distanceMiles": 9.7,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602339P6001982",
        "type": "RF-360",
        "label": "(T1) DR03602339P6001982",
        "tenant": "Gtaa",
        "distanceMiles": 10,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_ugkdercs",
        "type": "Camera",
        "label": "T1 PG Camera: 10.7.23.10",
        "tenant": "Gtaa",
        "distanceMiles": 10.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602342P6002019",
        "type": "RF-360",
        "label": "(T1-PG) DR03602342P6002019",
        "tenant": "Gtaa",
        "distanceMiles": 10.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AEROSCOPE_0iqop7ku",
        "type": "AeroScope",
        "label": "Aeroscope 0QRDG780030101",
        "tenant": "Gtaa",
        "distanceMiles": 10.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_hm7hl1vh",
        "type": "Camera",
        "label": "T3 Pier C Camera: 10.7.40.68",
        "tenant": "Gtaa",
        "distanceMiles": 10.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602039P4001134",
        "type": "RF-160",
        "label": "GULLY-160",
        "tenant": "Gtaa",
        "distanceMiles": 10.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602133P5001186",
        "type": "RF-360",
        "label": "ACA HANGER-360",
        "tenant": "Gtaa",
        "distanceMiles": 11.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602134P5001192",
        "type": "RF-360",
        "label": "CARGO2-360",
        "tenant": "Gtaa",
        "distanceMiles": 11.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602039P4001133",
        "type": "RF-160",
        "label": "ACA HANGER-160",
        "tenant": "Gtaa",
        "distanceMiles": 11.2,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_3uz7a3ns",
        "type": "Camera",
        "label": "Cargo 3 Camera: 10.7.42.92",
        "tenant": "Gtaa",
        "distanceMiles": 11.3,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602027P3001099",
        "type": "RF-160",
        "label": "FESTI-160",
        "tenant": "Gtaa",
        "distanceMiles": 12,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602414P6002491",
        "type": "RF-360",
        "label": "FESTI-360 New DR03602414P6002491",
        "tenant": "Gtaa",
        "distanceMiles": 12,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_fgtb37jq",
        "type": "Camera",
        "label": "FESTI Camera: 10.7.42.91",
        "tenant": "Gtaa",
        "distanceMiles": 12,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602133P4001159",
        "type": "RF-160",
        "label": "NFH-160",
        "tenant": "Gtaa",
        "distanceMiles": 12.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR01602133P4001159W",
        "type": "RF-160",
        "label": "NFH-160",
        "tenant": "Gtaa",
        "distanceMiles": 12.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "IPCAM_af3322tr",
        "type": "Camera",
        "label": "NFH Camera: 10.7.43.83",
        "tenant": "Gtaa",
        "distanceMiles": 12.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602114P5001138",
        "type": "RF-360",
        "label": "NFH-360",
        "tenant": "Gtaa",
        "distanceMiles": 12.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602114P5001138W",
        "type": "RF-360",
        "label": "NFH-360",
        "tenant": "Gtaa",
        "distanceMiles": 12.1,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR03602134P5001195",
        "type": "RF-360",
        "label": "FEDEX-360",
        "tenant": "Gtaa",
        "distanceMiles": 12.6,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "AACLOUD_0fav68pw",
        "type": "AA Cloud",
        "label": "AACC - NiagaraFalls",
        "tenant": "Cbpbuffalo",
        "distanceMiles": 37.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602521A6001596W",
        "type": "RF-560",
        "label": "DR05602521A6001596",
        "tenant": "Cbpbuffalo",
        "distanceMiles": 37.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602441A6001193W",
        "type": "RF-560",
        "label": "DR05602441A6001193",
        "tenant": "Cbpbuffalo",
        "distanceMiles": 37.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602441A6001193",
        "type": "RF-560",
        "label": "DR05602441A6001193",
        "tenant": "Cbpbuffalo",
        "distanceMiles": 37.8,
        "isActive": true
      },
      {
        "source": "DTracker",
        "sensorId": "DR05602521A6001596",
        "type": "RF-560",
        "label": "DR05602521A6001596",
        "tenant": "Cbpbuffalo",
        "distanceMiles": 37.8,
        "isActive": true
      }
    ]
  },
  "mexico-city": {
    "total": 0,
    "typeCounts": {},
    "tenants": [],
    "sensors": []
  },
  "guadalajara": {
    "total": 0,
    "typeCounts": {},
    "tenants": [],
    "sensors": []
  },
  "monterrey": {
    "total": 0,
    "typeCounts": {},
    "tenants": [],
    "sensors": []
  }
};
