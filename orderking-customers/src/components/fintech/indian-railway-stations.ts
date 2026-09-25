export type RailStation = {
  code: string;
  name: string;
  city: string;
  state: string;
};

export const INDIAN_RAILWAY_STATIONS: RailStation[] = [
  { code:"NDLS", name:"New Delhi", city:"New Delhi", state:"Delhi" },
  { code:"DLI", name:"Delhi Junction", city:"Delhi", state:"Delhi" },
  { code:"DEE", name:"Delhi Sarai Rohilla", city:"Delhi", state:"Delhi" },
  { code:"NZM", name:"Hazrat Nizamuddin", city:"New Delhi", state:"Delhi" },
  { code:"ANVT", name:"Anand Vihar Terminal", city:"Delhi", state:"Delhi" },
  { code:"CSMT", name:"Chhatrapati Shivaji Maharaj Terminus", city:"Mumbai", state:"Maharashtra" },
  { code:"LTT", name:"Lokmanya Tilak Terminus", city:"Mumbai", state:"Maharashtra" },
  { code:"PUNE", name:"Pune Junction", city:"Pune", state:"Maharashtra" },
  { code:"NGP", name:"Nagpur Junction", city:"Nagpur", state:"Maharashtra" },
  { code:"ADI", name:"Ahmedabad Junction", city:"Ahmedabad", state:"Gujarat" },
  { code:"ST", name:"Surat", city:"Surat", state:"Gujarat" },
  { code:"BRC", name:"Vadodara Junction", city:"Vadodara", state:"Gujarat" },
  { code:"JP", name:"Jaipur Junction", city:"Jaipur", state:"Rajasthan" },
  { code:"AII", name:"Ajmer Junction", city:"Ajmer", state:"Rajasthan" },
  { code:"JAT", name:"Jammu Tawi", city:"Jammu", state:"Jammu and Kashmir" },
  { code:"ASR", name:"Amritsar Junction", city:"Amritsar", state:"Punjab" },
  { code:"LDH", name:"Ludhiana Junction", city:"Ludhiana", state:"Punjab" },
  { code:"CDG", name:"Chandigarh", city:"Chandigarh", state:"Chandigarh" },
  { code:"LKO", name:"Lucknow Charbagh", city:"Lucknow", state:"Uttar Pradesh" },
  { code:"CNB", name:"Kanpur Central", city:"Kanpur", state:"Uttar Pradesh" },
  { code:"BSB", name:"Varanasi Junction", city:"Varanasi", state:"Uttar Pradesh" },
  { code:"PRYJ", name:"Prayagraj Junction", city:"Prayagraj", state:"Uttar Pradesh" },
  { code:"AGC", name:"Agra Cantt", city:"Agra", state:"Uttar Pradesh" },
  { code:"GKP", name:"Gorakhpur", city:"Gorakhpur", state:"Uttar Pradesh" },
  { code:"HWH", name:"Howrah Junction", city:"Howrah", state:"West Bengal" },
  { code:"SDAH", name:"Sealdah", city:"Kolkata", state:"West Bengal" },
  { code:"KOAA", name:"Kolkata", city:"Kolkata", state:"West Bengal" },
  { code:"ASN", name:"Asansol Junction", city:"Asansol", state:"West Bengal" },
  { code:"BWN", name:"Barddhaman Junction", city:"Bardhaman", state:"West Bengal" },
  { code:"RNC", name:"Ranchi", city:"Ranchi", state:"Jharkhand" },
  { code:"TATA", name:"Tatanagar Junction", city:"Jamshedpur", state:"Jharkhand" },
  { code:"GMO", name:"Gomoh Junction", city:"Dhanbad", state:"Jharkhand" },
  { code:"BBS", name:"Bhubaneswar", city:"Bhubaneswar", state:"Odisha" },
  { code:"PURI", name:"Puri", city:"Puri", state:"Odisha" },
  { code:"VSKP", name:"Visakhapatnam", city:"Visakhapatnam", state:"Andhra Pradesh" },
  { code:"SC", name:"Secunderabad Junction", city:"Hyderabad", state:"Telangana" },
  { code:"HYB", name:"Hyderabad Deccan", city:"Hyderabad", state:"Telangana" },
  { code:"KCG", name:"Kacheguda", city:"Hyderabad", state:"Telangana" },
  { code:"MAS", name:"MGR Chennai Central", city:"Chennai", state:"Tamil Nadu" },
  { code:"MS", name:"Chennai Egmore", city:"Chennai", state:"Tamil Nadu" },
  { code:"CBE", name:"Coimbatore Junction", city:"Coimbatore", state:"Tamil Nadu" },
  { code:"MDU", name:"Madurai Junction", city:"Madurai", state:"Tamil Nadu" },
  { code:"TVC", name:"Thiruvananthapuram Central", city:"Thiruvananthapuram", state:"Kerala" },
  { code:"ERS", name:"Ernakulam Junction", city:"Kochi", state:"Kerala" },
  { code:"CLT", name:"Kozhikode", city:"Kozhikode", state:"Kerala" },
  { code:"SBC", name:"KSR Bengaluru City Junction", city:"Bengaluru", state:"Karnataka" },
  { code:"YPR", name:"Yesvantpur Junction", city:"Bengaluru", state:"Karnataka" },
  { code:"MYS", name:"Mysuru Junction", city:"Mysuru", state:"Karnataka" },
  { code:"MAJN", name:"Mangaluru Junction", city:"Mangaluru", state:"Karnataka" },
  { code:"BPL", name:"Bhopal Junction", city:"Bhopal", state:"Madhya Pradesh" },
  { code:"INDB", name:"Indore Junction", city:"Indore", state:"Madhya Pradesh" },
  { code:"JBP", name:"Jabalpur Junction", city:"Jabalpur", state:"Madhya Pradesh" },
  { code:"GWL", name:"Gwalior Junction", city:"Gwalior", state:"Madhya Pradesh" },
  { code:"KOTA", name:"Kota Junction", city:"Kota", state:"Rajasthan" },
  { code:"UJN", name:"Ujjain Junction", city:"Ujjain", state:"Madhya Pradesh" },
  { code:"PATNA", name:"Patna Junction", city:"Patna", state:"Bihar" },
  { code:"GAYA", name:"Gaya Junction", city:"Gaya", state:"Bihar" },
  { code:"MFP", name:"Muzaffarpur Junction", city:"Muzaffarpur", state:"Bihar" },
  { code:"DNR", name:"Danapur", city:"Patna", state:"Bihar" },
  { code:"KIR", name:"Katihar Junction", city:"Katihar", state:"Bihar" },
  { code:"GHY", name:"Guwahati", city:"Guwahati", state:"Assam" },
  { code:"LMG", name:"Lumding Junction", city:"Hojai", state:"Assam" },
  { code:"DBRG", name:"Dibrugarh", city:"Dibrugarh", state:"Assam" },
  { code:"DBRT", name:"Dibrugarh Town", city:"Dibrugarh", state:"Assam" },
  { code:"NTSK", name:"New Tinsukia Junction", city:"Tinsukia", state:"Assam" },
  { code:"SCL", name:"Silchar", city:"Silchar", state:"Assam" },
  { code:"AGTL", name:"Agartala", city:"Agartala", state:"Tripura" },
  { code:"NJP", name:"New Jalpaiguri", city:"Siliguri", state:"West Bengal" },
  { code:"SGUJ", name:"Siliguri Junction", city:"Siliguri", state:"West Bengal" },
  { code:"RNY", name:"Rangiya Junction", city:"Rangia", state:"Assam" },
  { code:"KYQ", name:"Kamakhya Junction", city:"Guwahati", state:"Assam" }
];

export function searchRailStations(query: string, limit = 12): RailStation[] {
  const q = query.trim().toLowerCase();
  if (!q) return INDIAN_RAILWAY_STATIONS.slice(0, limit);

  return INDIAN_RAILWAY_STATIONS
    .filter((station) =>
      station.code.toLowerCase().includes(q) ||
      station.name.toLowerCase().includes(q) ||
      station.city.toLowerCase().includes(q) ||
      station.state.toLowerCase().includes(q)
    )
    .slice(0, limit);
}
