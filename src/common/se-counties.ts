/** Southeast region states + county FIPS (Census ANSI). Auto-generated for Phase 2 geo. */
export type SeState = { name: string; abbr: string; fips: string };
export type SeCounty = { name: string; countyFips: string };

export const SE_STATES: SeState[] = [
  {
    "name": "North Carolina",
    "abbr": "NC",
    "fips": "37"
  },
  {
    "name": "South Carolina",
    "abbr": "SC",
    "fips": "45"
  },
  {
    "name": "Georgia",
    "abbr": "GA",
    "fips": "13"
  },
  {
    "name": "Tennessee",
    "abbr": "TN",
    "fips": "47"
  },
  {
    "name": "Florida",
    "abbr": "FL",
    "fips": "12"
  },
  {
    "name": "Alabama",
    "abbr": "AL",
    "fips": "01"
  },
  {
    "name": "Mississippi",
    "abbr": "MS",
    "fips": "28"
  },
  {
    "name": "Virginia",
    "abbr": "VA",
    "fips": "51"
  }
];

export const SE_COUNTIES_BY_STATE_FIPS: Record<string, SeCounty[]> = {
  "12": [
    {
      "name": "Alachua County",
      "countyFips": "001"
    },
    {
      "name": "Baker County",
      "countyFips": "003"
    },
    {
      "name": "Bay County",
      "countyFips": "005"
    },
    {
      "name": "Bradford County",
      "countyFips": "007"
    },
    {
      "name": "Brevard County",
      "countyFips": "009"
    },
    {
      "name": "Broward County",
      "countyFips": "011"
    },
    {
      "name": "Calhoun County",
      "countyFips": "013"
    },
    {
      "name": "Charlotte County",
      "countyFips": "015"
    },
    {
      "name": "Citrus County",
      "countyFips": "017"
    },
    {
      "name": "Clay County",
      "countyFips": "019"
    },
    {
      "name": "Collier County",
      "countyFips": "021"
    },
    {
      "name": "Columbia County",
      "countyFips": "023"
    },
    {
      "name": "DeSoto County",
      "countyFips": "027"
    },
    {
      "name": "Dixie County",
      "countyFips": "029"
    },
    {
      "name": "Duval County",
      "countyFips": "031"
    },
    {
      "name": "Escambia County",
      "countyFips": "033"
    },
    {
      "name": "Flagler County",
      "countyFips": "035"
    },
    {
      "name": "Franklin County",
      "countyFips": "037"
    },
    {
      "name": "Gadsden County",
      "countyFips": "039"
    },
    {
      "name": "Gilchrist County",
      "countyFips": "041"
    },
    {
      "name": "Glades County",
      "countyFips": "043"
    },
    {
      "name": "Gulf County",
      "countyFips": "045"
    },
    {
      "name": "Hamilton County",
      "countyFips": "047"
    },
    {
      "name": "Hardee County",
      "countyFips": "049"
    },
    {
      "name": "Hendry County",
      "countyFips": "051"
    },
    {
      "name": "Hernando County",
      "countyFips": "053"
    },
    {
      "name": "Highlands County",
      "countyFips": "055"
    },
    {
      "name": "Hillsborough County",
      "countyFips": "057"
    },
    {
      "name": "Holmes County",
      "countyFips": "059"
    },
    {
      "name": "Indian River County",
      "countyFips": "061"
    },
    {
      "name": "Jackson County",
      "countyFips": "063"
    },
    {
      "name": "Jefferson County",
      "countyFips": "065"
    },
    {
      "name": "Lafayette County",
      "countyFips": "067"
    },
    {
      "name": "Lake County",
      "countyFips": "069"
    },
    {
      "name": "Lee County",
      "countyFips": "071"
    },
    {
      "name": "Leon County",
      "countyFips": "073"
    },
    {
      "name": "Levy County",
      "countyFips": "075"
    },
    {
      "name": "Liberty County",
      "countyFips": "077"
    },
    {
      "name": "Madison County",
      "countyFips": "079"
    },
    {
      "name": "Manatee County",
      "countyFips": "081"
    },
    {
      "name": "Marion County",
      "countyFips": "083"
    },
    {
      "name": "Martin County",
      "countyFips": "085"
    },
    {
      "name": "Miami-Dade County",
      "countyFips": "086"
    },
    {
      "name": "Monroe County",
      "countyFips": "087"
    },
    {
      "name": "Nassau County",
      "countyFips": "089"
    },
    {
      "name": "Okaloosa County",
      "countyFips": "091"
    },
    {
      "name": "Okeechobee County",
      "countyFips": "093"
    },
    {
      "name": "Orange County",
      "countyFips": "095"
    },
    {
      "name": "Osceola County",
      "countyFips": "097"
    },
    {
      "name": "Palm Beach County",
      "countyFips": "099"
    },
    {
      "name": "Pasco County",
      "countyFips": "101"
    },
    {
      "name": "Pinellas County",
      "countyFips": "103"
    },
    {
      "name": "Polk County",
      "countyFips": "105"
    },
    {
      "name": "Putnam County",
      "countyFips": "107"
    },
    {
      "name": "Santa Rosa County",
      "countyFips": "113"
    },
    {
      "name": "Sarasota County",
      "countyFips": "115"
    },
    {
      "name": "Seminole County",
      "countyFips": "117"
    },
    {
      "name": "St. Johns County",
      "countyFips": "109"
    },
    {
      "name": "St. Lucie County",
      "countyFips": "111"
    },
    {
      "name": "Sumter County",
      "countyFips": "119"
    },
    {
      "name": "Suwannee County",
      "countyFips": "121"
    },
    {
      "name": "Taylor County",
      "countyFips": "123"
    },
    {
      "name": "Union County",
      "countyFips": "125"
    },
    {
      "name": "Volusia County",
      "countyFips": "127"
    },
    {
      "name": "Wakulla County",
      "countyFips": "129"
    },
    {
      "name": "Walton County",
      "countyFips": "131"
    },
    {
      "name": "Washington County",
      "countyFips": "133"
    }
  ],
  "13": [
    {
      "name": "Appling County",
      "countyFips": "001"
    },
    {
      "name": "Atkinson County",
      "countyFips": "003"
    },
    {
      "name": "Bacon County",
      "countyFips": "005"
    },
    {
      "name": "Baker County",
      "countyFips": "007"
    },
    {
      "name": "Baldwin County",
      "countyFips": "009"
    },
    {
      "name": "Banks County",
      "countyFips": "011"
    },
    {
      "name": "Barrow County",
      "countyFips": "013"
    },
    {
      "name": "Bartow County",
      "countyFips": "015"
    },
    {
      "name": "Ben Hill County",
      "countyFips": "017"
    },
    {
      "name": "Berrien County",
      "countyFips": "019"
    },
    {
      "name": "Bibb County",
      "countyFips": "021"
    },
    {
      "name": "Bleckley County",
      "countyFips": "023"
    },
    {
      "name": "Brantley County",
      "countyFips": "025"
    },
    {
      "name": "Brooks County",
      "countyFips": "027"
    },
    {
      "name": "Bryan County",
      "countyFips": "029"
    },
    {
      "name": "Bulloch County",
      "countyFips": "031"
    },
    {
      "name": "Burke County",
      "countyFips": "033"
    },
    {
      "name": "Butts County",
      "countyFips": "035"
    },
    {
      "name": "Calhoun County",
      "countyFips": "037"
    },
    {
      "name": "Camden County",
      "countyFips": "039"
    },
    {
      "name": "Candler County",
      "countyFips": "043"
    },
    {
      "name": "Carroll County",
      "countyFips": "045"
    },
    {
      "name": "Catoosa County",
      "countyFips": "047"
    },
    {
      "name": "Charlton County",
      "countyFips": "049"
    },
    {
      "name": "Chatham County",
      "countyFips": "051"
    },
    {
      "name": "Chattahoochee County",
      "countyFips": "053"
    },
    {
      "name": "Chattooga County",
      "countyFips": "055"
    },
    {
      "name": "Cherokee County",
      "countyFips": "057"
    },
    {
      "name": "Clarke County",
      "countyFips": "059"
    },
    {
      "name": "Clay County",
      "countyFips": "061"
    },
    {
      "name": "Clayton County",
      "countyFips": "063"
    },
    {
      "name": "Clinch County",
      "countyFips": "065"
    },
    {
      "name": "Cobb County",
      "countyFips": "067"
    },
    {
      "name": "Coffee County",
      "countyFips": "069"
    },
    {
      "name": "Colquitt County",
      "countyFips": "071"
    },
    {
      "name": "Columbia County",
      "countyFips": "073"
    },
    {
      "name": "Cook County",
      "countyFips": "075"
    },
    {
      "name": "Coweta County",
      "countyFips": "077"
    },
    {
      "name": "Crawford County",
      "countyFips": "079"
    },
    {
      "name": "Crisp County",
      "countyFips": "081"
    },
    {
      "name": "Dade County",
      "countyFips": "083"
    },
    {
      "name": "Dawson County",
      "countyFips": "085"
    },
    {
      "name": "Decatur County",
      "countyFips": "087"
    },
    {
      "name": "DeKalb County",
      "countyFips": "089"
    },
    {
      "name": "Dodge County",
      "countyFips": "091"
    },
    {
      "name": "Dooly County",
      "countyFips": "093"
    },
    {
      "name": "Dougherty County",
      "countyFips": "095"
    },
    {
      "name": "Douglas County",
      "countyFips": "097"
    },
    {
      "name": "Early County",
      "countyFips": "099"
    },
    {
      "name": "Echols County",
      "countyFips": "101"
    },
    {
      "name": "Effingham County",
      "countyFips": "103"
    },
    {
      "name": "Elbert County",
      "countyFips": "105"
    },
    {
      "name": "Emanuel County",
      "countyFips": "107"
    },
    {
      "name": "Evans County",
      "countyFips": "109"
    },
    {
      "name": "Fannin County",
      "countyFips": "111"
    },
    {
      "name": "Fayette County",
      "countyFips": "113"
    },
    {
      "name": "Floyd County",
      "countyFips": "115"
    },
    {
      "name": "Forsyth County",
      "countyFips": "117"
    },
    {
      "name": "Franklin County",
      "countyFips": "119"
    },
    {
      "name": "Fulton County",
      "countyFips": "121"
    },
    {
      "name": "Gilmer County",
      "countyFips": "123"
    },
    {
      "name": "Glascock County",
      "countyFips": "125"
    },
    {
      "name": "Glynn County",
      "countyFips": "127"
    },
    {
      "name": "Gordon County",
      "countyFips": "129"
    },
    {
      "name": "Grady County",
      "countyFips": "131"
    },
    {
      "name": "Greene County",
      "countyFips": "133"
    },
    {
      "name": "Gwinnett County",
      "countyFips": "135"
    },
    {
      "name": "Habersham County",
      "countyFips": "137"
    },
    {
      "name": "Hall County",
      "countyFips": "139"
    },
    {
      "name": "Hancock County",
      "countyFips": "141"
    },
    {
      "name": "Haralson County",
      "countyFips": "143"
    },
    {
      "name": "Harris County",
      "countyFips": "145"
    },
    {
      "name": "Hart County",
      "countyFips": "147"
    },
    {
      "name": "Heard County",
      "countyFips": "149"
    },
    {
      "name": "Henry County",
      "countyFips": "151"
    },
    {
      "name": "Houston County",
      "countyFips": "153"
    },
    {
      "name": "Irwin County",
      "countyFips": "155"
    },
    {
      "name": "Jackson County",
      "countyFips": "157"
    },
    {
      "name": "Jasper County",
      "countyFips": "159"
    },
    {
      "name": "Jeff Davis County",
      "countyFips": "161"
    },
    {
      "name": "Jefferson County",
      "countyFips": "163"
    },
    {
      "name": "Jenkins County",
      "countyFips": "165"
    },
    {
      "name": "Johnson County",
      "countyFips": "167"
    },
    {
      "name": "Jones County",
      "countyFips": "169"
    },
    {
      "name": "Lamar County",
      "countyFips": "171"
    },
    {
      "name": "Lanier County",
      "countyFips": "173"
    },
    {
      "name": "Laurens County",
      "countyFips": "175"
    },
    {
      "name": "Lee County",
      "countyFips": "177"
    },
    {
      "name": "Liberty County",
      "countyFips": "179"
    },
    {
      "name": "Lincoln County",
      "countyFips": "181"
    },
    {
      "name": "Long County",
      "countyFips": "183"
    },
    {
      "name": "Lowndes County",
      "countyFips": "185"
    },
    {
      "name": "Lumpkin County",
      "countyFips": "187"
    },
    {
      "name": "Macon County",
      "countyFips": "193"
    },
    {
      "name": "Madison County",
      "countyFips": "195"
    },
    {
      "name": "Marion County",
      "countyFips": "197"
    },
    {
      "name": "McDuffie County",
      "countyFips": "189"
    },
    {
      "name": "McIntosh County",
      "countyFips": "191"
    },
    {
      "name": "Meriwether County",
      "countyFips": "199"
    },
    {
      "name": "Miller County",
      "countyFips": "201"
    },
    {
      "name": "Mitchell County",
      "countyFips": "205"
    },
    {
      "name": "Monroe County",
      "countyFips": "207"
    },
    {
      "name": "Montgomery County",
      "countyFips": "209"
    },
    {
      "name": "Morgan County",
      "countyFips": "211"
    },
    {
      "name": "Murray County",
      "countyFips": "213"
    },
    {
      "name": "Muscogee County",
      "countyFips": "215"
    },
    {
      "name": "Newton County",
      "countyFips": "217"
    },
    {
      "name": "Oconee County",
      "countyFips": "219"
    },
    {
      "name": "Oglethorpe County",
      "countyFips": "221"
    },
    {
      "name": "Paulding County",
      "countyFips": "223"
    },
    {
      "name": "Peach County",
      "countyFips": "225"
    },
    {
      "name": "Pickens County",
      "countyFips": "227"
    },
    {
      "name": "Pierce County",
      "countyFips": "229"
    },
    {
      "name": "Pike County",
      "countyFips": "231"
    },
    {
      "name": "Polk County",
      "countyFips": "233"
    },
    {
      "name": "Pulaski County",
      "countyFips": "235"
    },
    {
      "name": "Putnam County",
      "countyFips": "237"
    },
    {
      "name": "Quitman County",
      "countyFips": "239"
    },
    {
      "name": "Rabun County",
      "countyFips": "241"
    },
    {
      "name": "Randolph County",
      "countyFips": "243"
    },
    {
      "name": "Richmond County",
      "countyFips": "245"
    },
    {
      "name": "Rockdale County",
      "countyFips": "247"
    },
    {
      "name": "Schley County",
      "countyFips": "249"
    },
    {
      "name": "Screven County",
      "countyFips": "251"
    },
    {
      "name": "Seminole County",
      "countyFips": "253"
    },
    {
      "name": "Spalding County",
      "countyFips": "255"
    },
    {
      "name": "Stephens County",
      "countyFips": "257"
    },
    {
      "name": "Stewart County",
      "countyFips": "259"
    },
    {
      "name": "Sumter County",
      "countyFips": "261"
    },
    {
      "name": "Talbot County",
      "countyFips": "263"
    },
    {
      "name": "Taliaferro County",
      "countyFips": "265"
    },
    {
      "name": "Tattnall County",
      "countyFips": "267"
    },
    {
      "name": "Taylor County",
      "countyFips": "269"
    },
    {
      "name": "Telfair County",
      "countyFips": "271"
    },
    {
      "name": "Terrell County",
      "countyFips": "273"
    },
    {
      "name": "Thomas County",
      "countyFips": "275"
    },
    {
      "name": "Tift County",
      "countyFips": "277"
    },
    {
      "name": "Toombs County",
      "countyFips": "279"
    },
    {
      "name": "Towns County",
      "countyFips": "281"
    },
    {
      "name": "Treutlen County",
      "countyFips": "283"
    },
    {
      "name": "Troup County",
      "countyFips": "285"
    },
    {
      "name": "Turner County",
      "countyFips": "287"
    },
    {
      "name": "Twiggs County",
      "countyFips": "289"
    },
    {
      "name": "Union County",
      "countyFips": "291"
    },
    {
      "name": "Upson County",
      "countyFips": "293"
    },
    {
      "name": "Walker County",
      "countyFips": "295"
    },
    {
      "name": "Walton County",
      "countyFips": "297"
    },
    {
      "name": "Ware County",
      "countyFips": "299"
    },
    {
      "name": "Warren County",
      "countyFips": "301"
    },
    {
      "name": "Washington County",
      "countyFips": "303"
    },
    {
      "name": "Wayne County",
      "countyFips": "305"
    },
    {
      "name": "Webster County",
      "countyFips": "307"
    },
    {
      "name": "Wheeler County",
      "countyFips": "309"
    },
    {
      "name": "White County",
      "countyFips": "311"
    },
    {
      "name": "Whitfield County",
      "countyFips": "313"
    },
    {
      "name": "Wilcox County",
      "countyFips": "315"
    },
    {
      "name": "Wilkes County",
      "countyFips": "317"
    },
    {
      "name": "Wilkinson County",
      "countyFips": "319"
    },
    {
      "name": "Worth County",
      "countyFips": "321"
    }
  ],
  "28": [
    {
      "name": "Adams County",
      "countyFips": "001"
    },
    {
      "name": "Alcorn County",
      "countyFips": "003"
    },
    {
      "name": "Amite County",
      "countyFips": "005"
    },
    {
      "name": "Attala County",
      "countyFips": "007"
    },
    {
      "name": "Benton County",
      "countyFips": "009"
    },
    {
      "name": "Bolivar County",
      "countyFips": "011"
    },
    {
      "name": "Calhoun County",
      "countyFips": "013"
    },
    {
      "name": "Carroll County",
      "countyFips": "015"
    },
    {
      "name": "Chickasaw County",
      "countyFips": "017"
    },
    {
      "name": "Choctaw County",
      "countyFips": "019"
    },
    {
      "name": "Claiborne County",
      "countyFips": "021"
    },
    {
      "name": "Clarke County",
      "countyFips": "023"
    },
    {
      "name": "Clay County",
      "countyFips": "025"
    },
    {
      "name": "Coahoma County",
      "countyFips": "027"
    },
    {
      "name": "Copiah County",
      "countyFips": "029"
    },
    {
      "name": "Covington County",
      "countyFips": "031"
    },
    {
      "name": "DeSoto County",
      "countyFips": "033"
    },
    {
      "name": "Forrest County",
      "countyFips": "035"
    },
    {
      "name": "Franklin County",
      "countyFips": "037"
    },
    {
      "name": "George County",
      "countyFips": "039"
    },
    {
      "name": "Greene County",
      "countyFips": "041"
    },
    {
      "name": "Grenada County",
      "countyFips": "043"
    },
    {
      "name": "Hancock County",
      "countyFips": "045"
    },
    {
      "name": "Harrison County",
      "countyFips": "047"
    },
    {
      "name": "Hinds County",
      "countyFips": "049"
    },
    {
      "name": "Holmes County",
      "countyFips": "051"
    },
    {
      "name": "Humphreys County",
      "countyFips": "053"
    },
    {
      "name": "Issaquena County",
      "countyFips": "055"
    },
    {
      "name": "Itawamba County",
      "countyFips": "057"
    },
    {
      "name": "Jackson County",
      "countyFips": "059"
    },
    {
      "name": "Jasper County",
      "countyFips": "061"
    },
    {
      "name": "Jefferson County",
      "countyFips": "063"
    },
    {
      "name": "Jefferson Davis County",
      "countyFips": "065"
    },
    {
      "name": "Jones County",
      "countyFips": "067"
    },
    {
      "name": "Kemper County",
      "countyFips": "069"
    },
    {
      "name": "Lafayette County",
      "countyFips": "071"
    },
    {
      "name": "Lamar County",
      "countyFips": "073"
    },
    {
      "name": "Lauderdale County",
      "countyFips": "075"
    },
    {
      "name": "Lawrence County",
      "countyFips": "077"
    },
    {
      "name": "Leake County",
      "countyFips": "079"
    },
    {
      "name": "Lee County",
      "countyFips": "081"
    },
    {
      "name": "Leflore County",
      "countyFips": "083"
    },
    {
      "name": "Lincoln County",
      "countyFips": "085"
    },
    {
      "name": "Lowndes County",
      "countyFips": "087"
    },
    {
      "name": "Madison County",
      "countyFips": "089"
    },
    {
      "name": "Marion County",
      "countyFips": "091"
    },
    {
      "name": "Marshall County",
      "countyFips": "093"
    },
    {
      "name": "Monroe County",
      "countyFips": "095"
    },
    {
      "name": "Montgomery County",
      "countyFips": "097"
    },
    {
      "name": "Neshoba County",
      "countyFips": "099"
    },
    {
      "name": "Newton County",
      "countyFips": "101"
    },
    {
      "name": "Noxubee County",
      "countyFips": "103"
    },
    {
      "name": "Oktibbeha County",
      "countyFips": "105"
    },
    {
      "name": "Panola County",
      "countyFips": "107"
    },
    {
      "name": "Pearl River County",
      "countyFips": "109"
    },
    {
      "name": "Perry County",
      "countyFips": "111"
    },
    {
      "name": "Pike County",
      "countyFips": "113"
    },
    {
      "name": "Pontotoc County",
      "countyFips": "115"
    },
    {
      "name": "Prentiss County",
      "countyFips": "117"
    },
    {
      "name": "Quitman County",
      "countyFips": "119"
    },
    {
      "name": "Rankin County",
      "countyFips": "121"
    },
    {
      "name": "Scott County",
      "countyFips": "123"
    },
    {
      "name": "Sharkey County",
      "countyFips": "125"
    },
    {
      "name": "Simpson County",
      "countyFips": "127"
    },
    {
      "name": "Smith County",
      "countyFips": "129"
    },
    {
      "name": "Stone County",
      "countyFips": "131"
    },
    {
      "name": "Sunflower County",
      "countyFips": "133"
    },
    {
      "name": "Tallahatchie County",
      "countyFips": "135"
    },
    {
      "name": "Tate County",
      "countyFips": "137"
    },
    {
      "name": "Tippah County",
      "countyFips": "139"
    },
    {
      "name": "Tishomingo County",
      "countyFips": "141"
    },
    {
      "name": "Tunica County",
      "countyFips": "143"
    },
    {
      "name": "Union County",
      "countyFips": "145"
    },
    {
      "name": "Walthall County",
      "countyFips": "147"
    },
    {
      "name": "Warren County",
      "countyFips": "149"
    },
    {
      "name": "Washington County",
      "countyFips": "151"
    },
    {
      "name": "Wayne County",
      "countyFips": "153"
    },
    {
      "name": "Webster County",
      "countyFips": "155"
    },
    {
      "name": "Wilkinson County",
      "countyFips": "157"
    },
    {
      "name": "Winston County",
      "countyFips": "159"
    },
    {
      "name": "Yalobusha County",
      "countyFips": "161"
    },
    {
      "name": "Yazoo County",
      "countyFips": "163"
    }
  ],
  "37": [
    {
      "name": "Alamance County",
      "countyFips": "001"
    },
    {
      "name": "Alexander County",
      "countyFips": "003"
    },
    {
      "name": "Alleghany County",
      "countyFips": "005"
    },
    {
      "name": "Anson County",
      "countyFips": "007"
    },
    {
      "name": "Ashe County",
      "countyFips": "009"
    },
    {
      "name": "Avery County",
      "countyFips": "011"
    },
    {
      "name": "Beaufort County",
      "countyFips": "013"
    },
    {
      "name": "Bertie County",
      "countyFips": "015"
    },
    {
      "name": "Bladen County",
      "countyFips": "017"
    },
    {
      "name": "Brunswick County",
      "countyFips": "019"
    },
    {
      "name": "Buncombe County",
      "countyFips": "021"
    },
    {
      "name": "Burke County",
      "countyFips": "023"
    },
    {
      "name": "Cabarrus County",
      "countyFips": "025"
    },
    {
      "name": "Caldwell County",
      "countyFips": "027"
    },
    {
      "name": "Camden County",
      "countyFips": "029"
    },
    {
      "name": "Carteret County",
      "countyFips": "031"
    },
    {
      "name": "Caswell County",
      "countyFips": "033"
    },
    {
      "name": "Catawba County",
      "countyFips": "035"
    },
    {
      "name": "Chatham County",
      "countyFips": "037"
    },
    {
      "name": "Cherokee County",
      "countyFips": "039"
    },
    {
      "name": "Chowan County",
      "countyFips": "041"
    },
    {
      "name": "Clay County",
      "countyFips": "043"
    },
    {
      "name": "Cleveland County",
      "countyFips": "045"
    },
    {
      "name": "Columbus County",
      "countyFips": "047"
    },
    {
      "name": "Craven County",
      "countyFips": "049"
    },
    {
      "name": "Cumberland County",
      "countyFips": "051"
    },
    {
      "name": "Currituck County",
      "countyFips": "053"
    },
    {
      "name": "Dare County",
      "countyFips": "055"
    },
    {
      "name": "Davidson County",
      "countyFips": "057"
    },
    {
      "name": "Davie County",
      "countyFips": "059"
    },
    {
      "name": "Duplin County",
      "countyFips": "061"
    },
    {
      "name": "Durham County",
      "countyFips": "063"
    },
    {
      "name": "Edgecombe County",
      "countyFips": "065"
    },
    {
      "name": "Forsyth County",
      "countyFips": "067"
    },
    {
      "name": "Franklin County",
      "countyFips": "069"
    },
    {
      "name": "Gaston County",
      "countyFips": "071"
    },
    {
      "name": "Gates County",
      "countyFips": "073"
    },
    {
      "name": "Graham County",
      "countyFips": "075"
    },
    {
      "name": "Granville County",
      "countyFips": "077"
    },
    {
      "name": "Greene County",
      "countyFips": "079"
    },
    {
      "name": "Guilford County",
      "countyFips": "081"
    },
    {
      "name": "Halifax County",
      "countyFips": "083"
    },
    {
      "name": "Harnett County",
      "countyFips": "085"
    },
    {
      "name": "Haywood County",
      "countyFips": "087"
    },
    {
      "name": "Henderson County",
      "countyFips": "089"
    },
    {
      "name": "Hertford County",
      "countyFips": "091"
    },
    {
      "name": "Hoke County",
      "countyFips": "093"
    },
    {
      "name": "Hyde County",
      "countyFips": "095"
    },
    {
      "name": "Iredell County",
      "countyFips": "097"
    },
    {
      "name": "Jackson County",
      "countyFips": "099"
    },
    {
      "name": "Johnston County",
      "countyFips": "101"
    },
    {
      "name": "Jones County",
      "countyFips": "103"
    },
    {
      "name": "Lee County",
      "countyFips": "105"
    },
    {
      "name": "Lenoir County",
      "countyFips": "107"
    },
    {
      "name": "Lincoln County",
      "countyFips": "109"
    },
    {
      "name": "Macon County",
      "countyFips": "113"
    },
    {
      "name": "Madison County",
      "countyFips": "115"
    },
    {
      "name": "Martin County",
      "countyFips": "117"
    },
    {
      "name": "McDowell County",
      "countyFips": "111"
    },
    {
      "name": "Mecklenburg County",
      "countyFips": "119"
    },
    {
      "name": "Mitchell County",
      "countyFips": "121"
    },
    {
      "name": "Montgomery County",
      "countyFips": "123"
    },
    {
      "name": "Moore County",
      "countyFips": "125"
    },
    {
      "name": "Nash County",
      "countyFips": "127"
    },
    {
      "name": "New Hanover County",
      "countyFips": "129"
    },
    {
      "name": "Northampton County",
      "countyFips": "131"
    },
    {
      "name": "Onslow County",
      "countyFips": "133"
    },
    {
      "name": "Orange County",
      "countyFips": "135"
    },
    {
      "name": "Pamlico County",
      "countyFips": "137"
    },
    {
      "name": "Pasquotank County",
      "countyFips": "139"
    },
    {
      "name": "Pender County",
      "countyFips": "141"
    },
    {
      "name": "Perquimans County",
      "countyFips": "143"
    },
    {
      "name": "Person County",
      "countyFips": "145"
    },
    {
      "name": "Pitt County",
      "countyFips": "147"
    },
    {
      "name": "Polk County",
      "countyFips": "149"
    },
    {
      "name": "Randolph County",
      "countyFips": "151"
    },
    {
      "name": "Richmond County",
      "countyFips": "153"
    },
    {
      "name": "Robeson County",
      "countyFips": "155"
    },
    {
      "name": "Rockingham County",
      "countyFips": "157"
    },
    {
      "name": "Rowan County",
      "countyFips": "159"
    },
    {
      "name": "Rutherford County",
      "countyFips": "161"
    },
    {
      "name": "Sampson County",
      "countyFips": "163"
    },
    {
      "name": "Scotland County",
      "countyFips": "165"
    },
    {
      "name": "Stanly County",
      "countyFips": "167"
    },
    {
      "name": "Stokes County",
      "countyFips": "169"
    },
    {
      "name": "Surry County",
      "countyFips": "171"
    },
    {
      "name": "Swain County",
      "countyFips": "173"
    },
    {
      "name": "Transylvania County",
      "countyFips": "175"
    },
    {
      "name": "Tyrrell County",
      "countyFips": "177"
    },
    {
      "name": "Union County",
      "countyFips": "179"
    },
    {
      "name": "Vance County",
      "countyFips": "181"
    },
    {
      "name": "Wake County",
      "countyFips": "183"
    },
    {
      "name": "Warren County",
      "countyFips": "185"
    },
    {
      "name": "Washington County",
      "countyFips": "187"
    },
    {
      "name": "Watauga County",
      "countyFips": "189"
    },
    {
      "name": "Wayne County",
      "countyFips": "191"
    },
    {
      "name": "Wilkes County",
      "countyFips": "193"
    },
    {
      "name": "Wilson County",
      "countyFips": "195"
    },
    {
      "name": "Yadkin County",
      "countyFips": "197"
    },
    {
      "name": "Yancey County",
      "countyFips": "199"
    }
  ],
  "45": [
    {
      "name": "Abbeville County",
      "countyFips": "001"
    },
    {
      "name": "Aiken County",
      "countyFips": "003"
    },
    {
      "name": "Allendale County",
      "countyFips": "005"
    },
    {
      "name": "Anderson County",
      "countyFips": "007"
    },
    {
      "name": "Bamberg County",
      "countyFips": "009"
    },
    {
      "name": "Barnwell County",
      "countyFips": "011"
    },
    {
      "name": "Beaufort County",
      "countyFips": "013"
    },
    {
      "name": "Berkeley County",
      "countyFips": "015"
    },
    {
      "name": "Calhoun County",
      "countyFips": "017"
    },
    {
      "name": "Charleston County",
      "countyFips": "019"
    },
    {
      "name": "Cherokee County",
      "countyFips": "021"
    },
    {
      "name": "Chester County",
      "countyFips": "023"
    },
    {
      "name": "Chesterfield County",
      "countyFips": "025"
    },
    {
      "name": "Clarendon County",
      "countyFips": "027"
    },
    {
      "name": "Colleton County",
      "countyFips": "029"
    },
    {
      "name": "Darlington County",
      "countyFips": "031"
    },
    {
      "name": "Dillon County",
      "countyFips": "033"
    },
    {
      "name": "Dorchester County",
      "countyFips": "035"
    },
    {
      "name": "Edgefield County",
      "countyFips": "037"
    },
    {
      "name": "Fairfield County",
      "countyFips": "039"
    },
    {
      "name": "Florence County",
      "countyFips": "041"
    },
    {
      "name": "Georgetown County",
      "countyFips": "043"
    },
    {
      "name": "Greenville County",
      "countyFips": "045"
    },
    {
      "name": "Greenwood County",
      "countyFips": "047"
    },
    {
      "name": "Hampton County",
      "countyFips": "049"
    },
    {
      "name": "Horry County",
      "countyFips": "051"
    },
    {
      "name": "Jasper County",
      "countyFips": "053"
    },
    {
      "name": "Kershaw County",
      "countyFips": "055"
    },
    {
      "name": "Lancaster County",
      "countyFips": "057"
    },
    {
      "name": "Laurens County",
      "countyFips": "059"
    },
    {
      "name": "Lee County",
      "countyFips": "061"
    },
    {
      "name": "Lexington County",
      "countyFips": "063"
    },
    {
      "name": "Marion County",
      "countyFips": "067"
    },
    {
      "name": "Marlboro County",
      "countyFips": "069"
    },
    {
      "name": "McCormick County",
      "countyFips": "065"
    },
    {
      "name": "Newberry County",
      "countyFips": "071"
    },
    {
      "name": "Oconee County",
      "countyFips": "073"
    },
    {
      "name": "Orangeburg County",
      "countyFips": "075"
    },
    {
      "name": "Pickens County",
      "countyFips": "077"
    },
    {
      "name": "Richland County",
      "countyFips": "079"
    },
    {
      "name": "Saluda County",
      "countyFips": "081"
    },
    {
      "name": "Spartanburg County",
      "countyFips": "083"
    },
    {
      "name": "Sumter County",
      "countyFips": "085"
    },
    {
      "name": "Union County",
      "countyFips": "087"
    },
    {
      "name": "Williamsburg County",
      "countyFips": "089"
    },
    {
      "name": "York County",
      "countyFips": "091"
    }
  ],
  "47": [
    {
      "name": "Anderson County",
      "countyFips": "001"
    },
    {
      "name": "Bedford County",
      "countyFips": "003"
    },
    {
      "name": "Benton County",
      "countyFips": "005"
    },
    {
      "name": "Bledsoe County",
      "countyFips": "007"
    },
    {
      "name": "Blount County",
      "countyFips": "009"
    },
    {
      "name": "Bradley County",
      "countyFips": "011"
    },
    {
      "name": "Campbell County",
      "countyFips": "013"
    },
    {
      "name": "Cannon County",
      "countyFips": "015"
    },
    {
      "name": "Carroll County",
      "countyFips": "017"
    },
    {
      "name": "Carter County",
      "countyFips": "019"
    },
    {
      "name": "Cheatham County",
      "countyFips": "021"
    },
    {
      "name": "Chester County",
      "countyFips": "023"
    },
    {
      "name": "Claiborne County",
      "countyFips": "025"
    },
    {
      "name": "Clay County",
      "countyFips": "027"
    },
    {
      "name": "Cocke County",
      "countyFips": "029"
    },
    {
      "name": "Coffee County",
      "countyFips": "031"
    },
    {
      "name": "Crockett County",
      "countyFips": "033"
    },
    {
      "name": "Cumberland County",
      "countyFips": "035"
    },
    {
      "name": "Davidson County",
      "countyFips": "037"
    },
    {
      "name": "Decatur County",
      "countyFips": "039"
    },
    {
      "name": "DeKalb County",
      "countyFips": "041"
    },
    {
      "name": "Dickson County",
      "countyFips": "043"
    },
    {
      "name": "Dyer County",
      "countyFips": "045"
    },
    {
      "name": "Fayette County",
      "countyFips": "047"
    },
    {
      "name": "Fentress County",
      "countyFips": "049"
    },
    {
      "name": "Franklin County",
      "countyFips": "051"
    },
    {
      "name": "Gibson County",
      "countyFips": "053"
    },
    {
      "name": "Giles County",
      "countyFips": "055"
    },
    {
      "name": "Grainger County",
      "countyFips": "057"
    },
    {
      "name": "Greene County",
      "countyFips": "059"
    },
    {
      "name": "Grundy County",
      "countyFips": "061"
    },
    {
      "name": "Hamblen County",
      "countyFips": "063"
    },
    {
      "name": "Hamilton County",
      "countyFips": "065"
    },
    {
      "name": "Hancock County",
      "countyFips": "067"
    },
    {
      "name": "Hardeman County",
      "countyFips": "069"
    },
    {
      "name": "Hardin County",
      "countyFips": "071"
    },
    {
      "name": "Hawkins County",
      "countyFips": "073"
    },
    {
      "name": "Haywood County",
      "countyFips": "075"
    },
    {
      "name": "Henderson County",
      "countyFips": "077"
    },
    {
      "name": "Henry County",
      "countyFips": "079"
    },
    {
      "name": "Hickman County",
      "countyFips": "081"
    },
    {
      "name": "Houston County",
      "countyFips": "083"
    },
    {
      "name": "Humphreys County",
      "countyFips": "085"
    },
    {
      "name": "Jackson County",
      "countyFips": "087"
    },
    {
      "name": "Jefferson County",
      "countyFips": "089"
    },
    {
      "name": "Johnson County",
      "countyFips": "091"
    },
    {
      "name": "Knox County",
      "countyFips": "093"
    },
    {
      "name": "Lake County",
      "countyFips": "095"
    },
    {
      "name": "Lauderdale County",
      "countyFips": "097"
    },
    {
      "name": "Lawrence County",
      "countyFips": "099"
    },
    {
      "name": "Lewis County",
      "countyFips": "101"
    },
    {
      "name": "Lincoln County",
      "countyFips": "103"
    },
    {
      "name": "Loudon County",
      "countyFips": "105"
    },
    {
      "name": "Macon County",
      "countyFips": "111"
    },
    {
      "name": "Madison County",
      "countyFips": "113"
    },
    {
      "name": "Marion County",
      "countyFips": "115"
    },
    {
      "name": "Marshall County",
      "countyFips": "117"
    },
    {
      "name": "Maury County",
      "countyFips": "119"
    },
    {
      "name": "McMinn County",
      "countyFips": "107"
    },
    {
      "name": "McNairy County",
      "countyFips": "109"
    },
    {
      "name": "Meigs County",
      "countyFips": "121"
    },
    {
      "name": "Monroe County",
      "countyFips": "123"
    },
    {
      "name": "Montgomery County",
      "countyFips": "125"
    },
    {
      "name": "Moore County",
      "countyFips": "127"
    },
    {
      "name": "Morgan County",
      "countyFips": "129"
    },
    {
      "name": "Obion County",
      "countyFips": "131"
    },
    {
      "name": "Overton County",
      "countyFips": "133"
    },
    {
      "name": "Perry County",
      "countyFips": "135"
    },
    {
      "name": "Pickett County",
      "countyFips": "137"
    },
    {
      "name": "Polk County",
      "countyFips": "139"
    },
    {
      "name": "Putnam County",
      "countyFips": "141"
    },
    {
      "name": "Rhea County",
      "countyFips": "143"
    },
    {
      "name": "Roane County",
      "countyFips": "145"
    },
    {
      "name": "Robertson County",
      "countyFips": "147"
    },
    {
      "name": "Rutherford County",
      "countyFips": "149"
    },
    {
      "name": "Scott County",
      "countyFips": "151"
    },
    {
      "name": "Sequatchie County",
      "countyFips": "153"
    },
    {
      "name": "Sevier County",
      "countyFips": "155"
    },
    {
      "name": "Shelby County",
      "countyFips": "157"
    },
    {
      "name": "Smith County",
      "countyFips": "159"
    },
    {
      "name": "Stewart County",
      "countyFips": "161"
    },
    {
      "name": "Sullivan County",
      "countyFips": "163"
    },
    {
      "name": "Sumner County",
      "countyFips": "165"
    },
    {
      "name": "Tipton County",
      "countyFips": "167"
    },
    {
      "name": "Trousdale County",
      "countyFips": "169"
    },
    {
      "name": "Unicoi County",
      "countyFips": "171"
    },
    {
      "name": "Union County",
      "countyFips": "173"
    },
    {
      "name": "Van Buren County",
      "countyFips": "175"
    },
    {
      "name": "Warren County",
      "countyFips": "177"
    },
    {
      "name": "Washington County",
      "countyFips": "179"
    },
    {
      "name": "Wayne County",
      "countyFips": "181"
    },
    {
      "name": "Weakley County",
      "countyFips": "183"
    },
    {
      "name": "White County",
      "countyFips": "185"
    },
    {
      "name": "Williamson County",
      "countyFips": "187"
    },
    {
      "name": "Wilson County",
      "countyFips": "189"
    }
  ],
  "51": [
    {
      "name": "Accomack County",
      "countyFips": "001"
    },
    {
      "name": "Albemarle County",
      "countyFips": "003"
    },
    {
      "name": "Alexandria city",
      "countyFips": "510"
    },
    {
      "name": "Alleghany County",
      "countyFips": "005"
    },
    {
      "name": "Amelia County",
      "countyFips": "007"
    },
    {
      "name": "Amherst County",
      "countyFips": "009"
    },
    {
      "name": "Appomattox County",
      "countyFips": "011"
    },
    {
      "name": "Arlington County",
      "countyFips": "013"
    },
    {
      "name": "Augusta County",
      "countyFips": "015"
    },
    {
      "name": "Bath County",
      "countyFips": "017"
    },
    {
      "name": "Bedford city",
      "countyFips": "515"
    },
    {
      "name": "Bedford County",
      "countyFips": "019"
    },
    {
      "name": "Bland County",
      "countyFips": "021"
    },
    {
      "name": "Botetourt County",
      "countyFips": "023"
    },
    {
      "name": "Bristol city",
      "countyFips": "520"
    },
    {
      "name": "Brunswick County",
      "countyFips": "025"
    },
    {
      "name": "Buchanan County",
      "countyFips": "027"
    },
    {
      "name": "Buckingham County",
      "countyFips": "029"
    },
    {
      "name": "Buena Vista city",
      "countyFips": "530"
    },
    {
      "name": "Campbell County",
      "countyFips": "031"
    },
    {
      "name": "Caroline County",
      "countyFips": "033"
    },
    {
      "name": "Carroll County",
      "countyFips": "035"
    },
    {
      "name": "Charles City County",
      "countyFips": "036"
    },
    {
      "name": "Charlotte County",
      "countyFips": "037"
    },
    {
      "name": "Charlottesville city",
      "countyFips": "540"
    },
    {
      "name": "Chesapeake city",
      "countyFips": "550"
    },
    {
      "name": "Chesterfield County",
      "countyFips": "041"
    },
    {
      "name": "Clarke County",
      "countyFips": "043"
    },
    {
      "name": "Colonial Heights city",
      "countyFips": "570"
    },
    {
      "name": "Covington city",
      "countyFips": "580"
    },
    {
      "name": "Craig County",
      "countyFips": "045"
    },
    {
      "name": "Culpeper County",
      "countyFips": "047"
    },
    {
      "name": "Cumberland County",
      "countyFips": "049"
    },
    {
      "name": "Danville city",
      "countyFips": "590"
    },
    {
      "name": "Dickenson County",
      "countyFips": "051"
    },
    {
      "name": "Dinwiddie County",
      "countyFips": "053"
    },
    {
      "name": "Emporia city",
      "countyFips": "595"
    },
    {
      "name": "Essex County",
      "countyFips": "057"
    },
    {
      "name": "Fairfax city",
      "countyFips": "600"
    },
    {
      "name": "Fairfax County",
      "countyFips": "059"
    },
    {
      "name": "Falls Church city",
      "countyFips": "610"
    },
    {
      "name": "Fauquier County",
      "countyFips": "061"
    },
    {
      "name": "Floyd County",
      "countyFips": "063"
    },
    {
      "name": "Fluvanna County",
      "countyFips": "065"
    },
    {
      "name": "Franklin city",
      "countyFips": "620"
    },
    {
      "name": "Franklin County",
      "countyFips": "067"
    },
    {
      "name": "Frederick County",
      "countyFips": "069"
    },
    {
      "name": "Fredericksburg city",
      "countyFips": "630"
    },
    {
      "name": "Galax city",
      "countyFips": "640"
    },
    {
      "name": "Giles County",
      "countyFips": "071"
    },
    {
      "name": "Gloucester County",
      "countyFips": "073"
    },
    {
      "name": "Goochland County",
      "countyFips": "075"
    },
    {
      "name": "Grayson County",
      "countyFips": "077"
    },
    {
      "name": "Greene County",
      "countyFips": "079"
    },
    {
      "name": "Greensville County",
      "countyFips": "081"
    },
    {
      "name": "Halifax County",
      "countyFips": "083"
    },
    {
      "name": "Hampton city",
      "countyFips": "650"
    },
    {
      "name": "Hanover County",
      "countyFips": "085"
    },
    {
      "name": "Harrisonburg city",
      "countyFips": "660"
    },
    {
      "name": "Henrico County",
      "countyFips": "087"
    },
    {
      "name": "Henry County",
      "countyFips": "089"
    },
    {
      "name": "Highland County",
      "countyFips": "091"
    },
    {
      "name": "Hopewell city",
      "countyFips": "670"
    },
    {
      "name": "Isle of Wight County",
      "countyFips": "093"
    },
    {
      "name": "James City County",
      "countyFips": "095"
    },
    {
      "name": "King and Queen County",
      "countyFips": "097"
    },
    {
      "name": "King George County",
      "countyFips": "099"
    },
    {
      "name": "King William County",
      "countyFips": "101"
    },
    {
      "name": "Lancaster County",
      "countyFips": "103"
    },
    {
      "name": "Lee County",
      "countyFips": "105"
    },
    {
      "name": "Lexington city",
      "countyFips": "678"
    },
    {
      "name": "Loudoun County",
      "countyFips": "107"
    },
    {
      "name": "Louisa County",
      "countyFips": "109"
    },
    {
      "name": "Lunenburg County",
      "countyFips": "111"
    },
    {
      "name": "Lynchburg city",
      "countyFips": "680"
    },
    {
      "name": "Madison County",
      "countyFips": "113"
    },
    {
      "name": "Manassas city",
      "countyFips": "683"
    },
    {
      "name": "Manassas Park city",
      "countyFips": "685"
    },
    {
      "name": "Martinsville city",
      "countyFips": "690"
    },
    {
      "name": "Mathews County",
      "countyFips": "115"
    },
    {
      "name": "Mecklenburg County",
      "countyFips": "117"
    },
    {
      "name": "Middlesex County",
      "countyFips": "119"
    },
    {
      "name": "Montgomery County",
      "countyFips": "121"
    },
    {
      "name": "Nelson County",
      "countyFips": "125"
    },
    {
      "name": "New Kent County",
      "countyFips": "127"
    },
    {
      "name": "Newport News city",
      "countyFips": "700"
    },
    {
      "name": "Norfolk city",
      "countyFips": "710"
    },
    {
      "name": "Northampton County",
      "countyFips": "131"
    },
    {
      "name": "Northumberland County",
      "countyFips": "133"
    },
    {
      "name": "Norton city",
      "countyFips": "720"
    },
    {
      "name": "Nottoway County",
      "countyFips": "135"
    },
    {
      "name": "Orange County",
      "countyFips": "137"
    },
    {
      "name": "Page County",
      "countyFips": "139"
    },
    {
      "name": "Patrick County",
      "countyFips": "141"
    },
    {
      "name": "Petersburg city",
      "countyFips": "730"
    },
    {
      "name": "Pittsylvania County",
      "countyFips": "143"
    },
    {
      "name": "Poquoson city",
      "countyFips": "735"
    },
    {
      "name": "Portsmouth city",
      "countyFips": "740"
    },
    {
      "name": "Powhatan County",
      "countyFips": "145"
    },
    {
      "name": "Prince Edward County",
      "countyFips": "147"
    },
    {
      "name": "Prince George County",
      "countyFips": "149"
    },
    {
      "name": "Prince William County",
      "countyFips": "153"
    },
    {
      "name": "Pulaski County",
      "countyFips": "155"
    },
    {
      "name": "Radford city",
      "countyFips": "750"
    },
    {
      "name": "Rappahannock County",
      "countyFips": "157"
    },
    {
      "name": "Richmond city",
      "countyFips": "760"
    },
    {
      "name": "Richmond County",
      "countyFips": "159"
    },
    {
      "name": "Roanoke city",
      "countyFips": "770"
    },
    {
      "name": "Roanoke County",
      "countyFips": "161"
    },
    {
      "name": "Rockbridge County",
      "countyFips": "163"
    },
    {
      "name": "Rockingham County",
      "countyFips": "165"
    },
    {
      "name": "Russell County",
      "countyFips": "167"
    },
    {
      "name": "Salem city",
      "countyFips": "775"
    },
    {
      "name": "Scott County",
      "countyFips": "169"
    },
    {
      "name": "Shenandoah County",
      "countyFips": "171"
    },
    {
      "name": "Smyth County",
      "countyFips": "173"
    },
    {
      "name": "Southampton County",
      "countyFips": "175"
    },
    {
      "name": "Spotsylvania County",
      "countyFips": "177"
    },
    {
      "name": "Stafford County",
      "countyFips": "179"
    },
    {
      "name": "Staunton city",
      "countyFips": "790"
    },
    {
      "name": "Suffolk city",
      "countyFips": "800"
    },
    {
      "name": "Surry County",
      "countyFips": "181"
    },
    {
      "name": "Sussex County",
      "countyFips": "183"
    },
    {
      "name": "Tazewell County",
      "countyFips": "185"
    },
    {
      "name": "Virginia Beach city",
      "countyFips": "810"
    },
    {
      "name": "Warren County",
      "countyFips": "187"
    },
    {
      "name": "Washington County",
      "countyFips": "191"
    },
    {
      "name": "Waynesboro city",
      "countyFips": "820"
    },
    {
      "name": "Westmoreland County",
      "countyFips": "193"
    },
    {
      "name": "Williamsburg city",
      "countyFips": "830"
    },
    {
      "name": "Winchester city",
      "countyFips": "840"
    },
    {
      "name": "Wise County",
      "countyFips": "195"
    },
    {
      "name": "Wythe County",
      "countyFips": "197"
    },
    {
      "name": "York County",
      "countyFips": "199"
    }
  ],
  "01": [
    {
      "name": "Autauga County",
      "countyFips": "001"
    },
    {
      "name": "Baldwin County",
      "countyFips": "003"
    },
    {
      "name": "Barbour County",
      "countyFips": "005"
    },
    {
      "name": "Bibb County",
      "countyFips": "007"
    },
    {
      "name": "Blount County",
      "countyFips": "009"
    },
    {
      "name": "Bullock County",
      "countyFips": "011"
    },
    {
      "name": "Butler County",
      "countyFips": "013"
    },
    {
      "name": "Calhoun County",
      "countyFips": "015"
    },
    {
      "name": "Chambers County",
      "countyFips": "017"
    },
    {
      "name": "Cherokee County",
      "countyFips": "019"
    },
    {
      "name": "Chilton County",
      "countyFips": "021"
    },
    {
      "name": "Choctaw County",
      "countyFips": "023"
    },
    {
      "name": "Clarke County",
      "countyFips": "025"
    },
    {
      "name": "Clay County",
      "countyFips": "027"
    },
    {
      "name": "Cleburne County",
      "countyFips": "029"
    },
    {
      "name": "Coffee County",
      "countyFips": "031"
    },
    {
      "name": "Colbert County",
      "countyFips": "033"
    },
    {
      "name": "Conecuh County",
      "countyFips": "035"
    },
    {
      "name": "Coosa County",
      "countyFips": "037"
    },
    {
      "name": "Covington County",
      "countyFips": "039"
    },
    {
      "name": "Crenshaw County",
      "countyFips": "041"
    },
    {
      "name": "Cullman County",
      "countyFips": "043"
    },
    {
      "name": "Dale County",
      "countyFips": "045"
    },
    {
      "name": "Dallas County",
      "countyFips": "047"
    },
    {
      "name": "DeKalb County",
      "countyFips": "049"
    },
    {
      "name": "Elmore County",
      "countyFips": "051"
    },
    {
      "name": "Escambia County",
      "countyFips": "053"
    },
    {
      "name": "Etowah County",
      "countyFips": "055"
    },
    {
      "name": "Fayette County",
      "countyFips": "057"
    },
    {
      "name": "Franklin County",
      "countyFips": "059"
    },
    {
      "name": "Geneva County",
      "countyFips": "061"
    },
    {
      "name": "Greene County",
      "countyFips": "063"
    },
    {
      "name": "Hale County",
      "countyFips": "065"
    },
    {
      "name": "Henry County",
      "countyFips": "067"
    },
    {
      "name": "Houston County",
      "countyFips": "069"
    },
    {
      "name": "Jackson County",
      "countyFips": "071"
    },
    {
      "name": "Jefferson County",
      "countyFips": "073"
    },
    {
      "name": "Lamar County",
      "countyFips": "075"
    },
    {
      "name": "Lauderdale County",
      "countyFips": "077"
    },
    {
      "name": "Lawrence County",
      "countyFips": "079"
    },
    {
      "name": "Lee County",
      "countyFips": "081"
    },
    {
      "name": "Limestone County",
      "countyFips": "083"
    },
    {
      "name": "Lowndes County",
      "countyFips": "085"
    },
    {
      "name": "Macon County",
      "countyFips": "087"
    },
    {
      "name": "Madison County",
      "countyFips": "089"
    },
    {
      "name": "Marengo County",
      "countyFips": "091"
    },
    {
      "name": "Marion County",
      "countyFips": "093"
    },
    {
      "name": "Marshall County",
      "countyFips": "095"
    },
    {
      "name": "Mobile County",
      "countyFips": "097"
    },
    {
      "name": "Monroe County",
      "countyFips": "099"
    },
    {
      "name": "Montgomery County",
      "countyFips": "101"
    },
    {
      "name": "Morgan County",
      "countyFips": "103"
    },
    {
      "name": "Perry County",
      "countyFips": "105"
    },
    {
      "name": "Pickens County",
      "countyFips": "107"
    },
    {
      "name": "Pike County",
      "countyFips": "109"
    },
    {
      "name": "Randolph County",
      "countyFips": "111"
    },
    {
      "name": "Russell County",
      "countyFips": "113"
    },
    {
      "name": "Shelby County",
      "countyFips": "117"
    },
    {
      "name": "St. Clair County",
      "countyFips": "115"
    },
    {
      "name": "Sumter County",
      "countyFips": "119"
    },
    {
      "name": "Talladega County",
      "countyFips": "121"
    },
    {
      "name": "Tallapoosa County",
      "countyFips": "123"
    },
    {
      "name": "Tuscaloosa County",
      "countyFips": "125"
    },
    {
      "name": "Walker County",
      "countyFips": "127"
    },
    {
      "name": "Washington County",
      "countyFips": "129"
    },
    {
      "name": "Wilcox County",
      "countyFips": "131"
    },
    {
      "name": "Winston County",
      "countyFips": "133"
    }
  ]
};

export function getSeStates(): SeState[] {
  return SE_STATES;
}

export function getCountiesForState(stateFipsOrName: string): SeCounty[] {
  const key = String(stateFipsOrName || '').trim();
  if (SE_COUNTIES_BY_STATE_FIPS[key]) return SE_COUNTIES_BY_STATE_FIPS[key];
  const state = SE_STATES.find(
    (s) => s.name.toLowerCase() === key.toLowerCase() || s.abbr.toLowerCase() === key.toLowerCase() || s.fips === key.padStart(2, '0'),
  );
  return state ? SE_COUNTIES_BY_STATE_FIPS[state.fips] || [] : [];
}

export function resolveSeFips(stateNameOrAbbrOrFips: string, countyName: string): { state: SeState; county: SeCounty; stateFips: string; countyFips: string } | null {
  const sKey = String(stateNameOrAbbrOrFips || '').trim();
  const cKey = String(countyName || '').trim().toLowerCase();
  const state = SE_STATES.find(
    (s) =>
      s.name.toLowerCase() === sKey.toLowerCase() ||
      s.abbr.toLowerCase() === sKey.toLowerCase() ||
      s.fips === sKey.padStart(2, '0'),
  );
  if (!state) return null;
  const counties = SE_COUNTIES_BY_STATE_FIPS[state.fips] || [];
  const county =
    counties.find((c) => c.name.toLowerCase() === cKey) ||
    counties.find((c) => c.name.toLowerCase().replace(/ county$/, '') === cKey.replace(/ county$/, ''));
  if (!county) return null;
  return { state, county, stateFips: state.fips, countyFips: county.countyFips };
}

export function isValidSeFips(stateFips: string, countyFips: string): boolean {
  const sf = String(stateFips || '').trim().padStart(2, '0');
  const cf = String(countyFips || '').trim().padStart(3, '0');
  const counties = SE_COUNTIES_BY_STATE_FIPS[sf];
  if (!counties) return false;
  return counties.some((c) => c.countyFips === cf);
}
