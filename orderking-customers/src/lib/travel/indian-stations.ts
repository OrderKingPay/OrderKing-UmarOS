export interface AirportItem {
  code: string;
  city: string;
  name: string;
  state: string;
  isPopular?: boolean;
}

export interface TrainStationItem {
  code: string;
  city: string;
  name: string;
  state: string;
  isPopular?: boolean;
}

export const INDIAN_AIRPORTS: readonly AirportItem[] = [
  { code: "DEL", city: "New Delhi", name: "Indira Gandhi International (DEL)", state: "Delhi", isPopular: true },
  { code: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Maharaj (BOM)", state: "Maharashtra", isPopular: true },
  { code: "BLR", city: "Bengaluru", name: "Kempegowda International (BLR)", state: "Karnataka", isPopular: true },
  { code: "HYD", city: "Hyderabad", name: "Rajiv Gandhi International (HYD)", state: "Telangana", isPopular: true },
  { code: "MAA", city: "Chennai", name: "Chennai International (MAA)", state: "Tamil Nadu", isPopular: true },
  { code: "CCU", city: "Kolkata", name: "Netaji Subhash Chandra Bose (CCU)", state: "West Bengal", isPopular: true },
  { code: "GOI", city: "Goa (Dabolim)", name: "Dabolim Airport (GOI)", state: "Goa", isPopular: true },
  { code: "GOX", city: "Goa (Mopa)", name: "Manohar International Airport (GOX)", state: "Goa", isPopular: true },
  { code: "PNQ", city: "Pune", name: "Pune International Airport (PNQ)", state: "Maharashtra", isPopular: true },
  { code: "AMD", city: "Ahmedabad", name: "Sardar Vallabhbhai Patel (AMD)", state: "Gujarat", isPopular: true },
  { code: "JAI", city: "Jaipur", name: "Jaipur International Airport (JAI)", state: "Rajasthan", isPopular: true },
  { code: "COK", city: "Kochi", name: "Cochin International Airport (COK)", state: "Kerala", isPopular: true },
  { code: "LKO", city: "Lucknow", name: "Chaudhary Charan Singh (LKO)", state: "Uttar Pradesh", isPopular: true },
  { code: "GAU", city: "Guwahati", name: "Lokpriya Gopinath Bordoloi (GAU)", state: "Assam", isPopular: true },
  { code: "PAT", city: "Patna", name: "Jayprakash Narayan Airport (PAT)", state: "Bihar", isPopular: true },
  { code: "IXC", city: "Chandigarh", name: "Shaheed Bhagat Singh Intl (IXC)", state: "Punjab", isPopular: true },
  { code: "SXR", city: "Srinagar", name: "Sheikh ul-Alam Airport (SXR)", state: "Jammu & Kashmir", isPopular: true },
  { code: "VNS", city: "Varanasi", name: "Lal Bahadur Shastri Intl (VNS)", state: "Uttar Pradesh", isPopular: true },
  { code: "BBI", city: "Bhubaneswar", name: "Biju Patnaik Airport (BBI)", state: "Odisha", isPopular: true },
  { code: "TRV", city: "Thiruvananthapuram", name: "Trivandrum International (TRV)", state: "Kerala", isPopular: true },
  { code: "VTZ", city: "Visakhapatnam", name: "Visakhapatnam Airport (VTZ)", state: "Andhra Pradesh", isPopular: true },
  { code: "DXB", city: "Dubai", name: "Dubai International (DXB)", state: "UAE", isPopular: false },
  { code: "SIN", city: "Singapore", name: "Singapore Changi Airport (SIN)", state: "Singapore", isPopular: false },
  { code: "BKK", city: "Bangkok", name: "Suvarnabhumi Airport (BKK)", state: "Thailand", isPopular: false },
  { code: "LHR", city: "London", name: "Heathrow Airport (LHR)", state: "United Kingdom", isPopular: false },
];

export const INDIAN_TRAIN_STATIONS: readonly TrainStationItem[] = [
  { code: "NDLS", city: "New Delhi", name: "New Delhi Railway Station (NDLS)", state: "Delhi", isPopular: true },
  { code: "MMCT", city: "Mumbai Central", name: "Mumbai Central (MMCT)", state: "Maharashtra", isPopular: true },
  { code: "CSMT", city: "Mumbai CSMT", name: "Chhatrapati Shivaji Maharaj Terminus (CSMT)", state: "Maharashtra", isPopular: true },
  { code: "HWH", city: "Kolkata (Howrah)", name: "Howrah Junction (HWH)", state: "West Bengal", isPopular: true },
  { code: "SBC", city: "Bengaluru City", name: "KSR Bengaluru (SBC)", state: "Karnataka", isPopular: true },
  { code: "MAS", city: "Chennai Central", name: "MGR Chennai Central (MAS)", state: "Tamil Nadu", isPopular: true },
  { code: "SC", city: "Secunderabad", name: "Secunderabad Junction (SC)", state: "Telangana", isPopular: true },
  { code: "BSB", city: "Varanasi", name: "Varanasi Junction (BSB)", state: "Uttar Pradesh", isPopular: true },
  { code: "PNBE", city: "Patna", name: "Patna Junction (PNBE)", state: "Bihar", isPopular: true },
  { code: "ADI", city: "Ahmedabad", name: "Ahmedabad Junction (ADI)", state: "Gujarat", isPopular: true },
  { code: "PUNE", city: "Pune", name: "Pune Junction (PUNE)", state: "Maharashtra", isPopular: true },
  { code: "JP", city: "Jaipur", name: "Jaipur Junction (JP)", state: "Rajasthan", isPopular: true },
  { code: "CNB", city: "Kanpur", name: "Kanpur Central (CNB)", state: "Uttar Pradesh", isPopular: true },
  { code: "LKO", city: "Lucknow", name: "Lucknow Charbagh (LKO)", state: "Uttar Pradesh", isPopular: true },
  { code: "GKP", city: "Gorakhpur", name: "Gorakhpur Junction (GKP)", state: "Uttar Pradesh", isPopular: true },
  { code: "CDG", city: "Chandigarh", name: "Chandigarh Junction (CDG)", state: "Chandigarh", isPopular: true },
  { code: "AGC", city: "Agra Cantt", name: "Agra Cantt (AGC)", state: "Uttar Pradesh", isPopular: true },
  { code: "BPL", city: "Bhopal", name: "Bhopal Junction (BPL)", state: "Madhya Pradesh", isPopular: true },
  { code: "GHY", city: "Guwahati", name: "Guwahati Railway Station (GHY)", state: "Assam", isPopular: true },
  { code: "MAO", city: "Goa (Madgaon)", name: "Madgaon Junction (MAO)", state: "Goa", isPopular: true },
  { code: "ERS", city: "Kochi (Ernakulam)", name: "Ernakulam Junction (ERS)", state: "Kerala", isPopular: true },
];

export function searchAirports(query: string): AirportItem[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return INDIAN_AIRPORTS.filter((a) => a.isPopular).slice(0, 8);
  return INDIAN_AIRPORTS.filter(
    (a) =>
      a.code.toLowerCase().includes(clean) ||
      a.city.toLowerCase().includes(clean) ||
      a.name.toLowerCase().includes(clean) ||
      a.state.toLowerCase().includes(clean)
  ).slice(0, 8);
}

export function searchTrainStations(query: string): TrainStationItem[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return INDIAN_TRAIN_STATIONS.filter((s) => s.isPopular).slice(0, 8);
  return INDIAN_TRAIN_STATIONS.filter(
    (s) =>
      s.code.toLowerCase().includes(clean) ||
      s.city.toLowerCase().includes(clean) ||
      s.name.toLowerCase().includes(clean) ||
      s.state.toLowerCase().includes(clean)
  ).slice(0, 8);
}
