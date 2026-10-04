export const popularCities = [
  "Dehradun",
  "Delhi",
  "Mumbai",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
  "Chandigarh",
];

export const allCities = [
  "Agartala", "Agra", "Ahmedabad", "Aizawl", "Ajmer", "Akola", "Aligarh", "Alwar", "Ambala",
  "Amravati", "Amritsar", "Anand", "Anantapur", "Asansol", "Aurangabad", "Bareilly", "Belagavi",
  "Bengaluru", "Bhagalpur", "Bharatpur", "Bhavnagar", "Bhilai", "Bhopal", "Bhubaneswar",
  "Bikaner", "Bilaspur", "Bokaro", "Chandigarh", "Chennai", "Coimbatore", "Cuttack",
  "Darbhanga", "Dehradun", "Delhi", "Dhanbad", "Dharamshala", "Durgapur", "Erode", "Faridabad",
  "Gandhinagar", "Gangtok", "Ghaziabad", "Gorakhpur", "Guntur", "Gurugram", "Guwahati",
  "Gwalior", "Haldwani", "Haridwar", "Hisar", "Hubballi", "Hyderabad", "Imphal", "Indore",
  "Jabalpur", "Jaipur", "Jalandhar", "Jalgaon", "Jammu", "Jamnagar", "Jamshedpur", "Jhansi",
  "Jodhpur", "Junagadh", "Kanpur", "Karnal", "Kochi", "Kohima", "Kolhapur", "Kolkata", "Kota",
  "Kozhikode", "Kurnool", "Leh", "Lucknow", "Ludhiana", "Madurai", "Mangaluru", "Manali",
  "Mathura", "Meerut", "Moradabad", "Mumbai", "Mussoorie", "Muzaffarpur", "Mysuru", "Nagercoil",
  "Nagpur", "Nainital", "Nanded", "Nashik", "Navi Mumbai", "Nellore", "Noida", "Panaji",
  "Panipat", "Patiala", "Patna", "Prayagraj", "Puducherry", "Pune", "Puri", "Raipur", "Rajkot",
  "Ranchi", "Rishikesh", "Rohtak", "Roorkee", "Rourkela", "Saharanpur", "Salem", "Shimla",
  "Shillong", "Siliguri", "Solapur", "Srinagar", "Surat", "Thane", "Thiruvananthapuram",
  "Thrissur", "Tiruchirappalli", "Tirunelveli", "Tirupati", "Tiruppur", "Udaipur", "Ujjain",
  "Vadodara", "Varanasi", "Vijayawada", "Visakhapatnam", "Warangal",
];

const metros = [
  "Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad",
  "Jaipur", "Lucknow", "Chandigarh", "Surat", "Indore", "Kochi", "Nagpur", "Coimbatore",
  "Noida", "Gurugram", "Thane", "Navi Mumbai", "Visakhapatnam", "Bhopal", "Vadodara",
];

const hills = [
  "Dehradun", "Mussoorie", "Haridwar", "Rishikesh", "Roorkee", "Haldwani", "Nainital",
  "Shimla", "Manali", "Dharamshala", "Chandigarh", "Srinagar", "Jammu", "Leh", "Gangtok",
  "Shillong", "Guwahati",
];

const north = [
  "Delhi", "Noida", "Gurugram", "Faridabad", "Ghaziabad", "Lucknow", "Kanpur", "Varanasi",
  "Prayagraj", "Agra", "Meerut", "Bareilly", "Moradabad", "Aligarh", "Jaipur", "Jodhpur",
  "Kota", "Udaipur", "Ajmer", "Amritsar", "Ludhiana", "Jalandhar", "Patiala", "Ambala",
  "Karnal", "Panipat", "Hisar", "Rohtak", "Patna", "Ranchi", "Jamshedpur", "Dhanbad",
];

const uniq = (list: string[]) => Array.from(new Set(list));

export function coverageFor(category: string): string[] {
  switch (category) {
    case "Family":
      return uniq([...hills, ...north]);
    case "Sport":
      return metros;
    case "Cargo":
      return uniq([...metros, "Ludhiana", "Kanpur", "Nashik", "Rajkot", "Raipur", "Jamshedpur"]);
    case "Premium":
      return uniq([...metros, "Dehradun", "Mussoorie", "Shimla", "Nainital"]);
    default:
      return uniq([...metros, ...hills, ...north, "Bhubaneswar", "Madurai", "Mysuru", "Vijayawada", "Ranchi", "Guwahati"]);
  }
}

export function matchingCities(query: string) {
  const needle = query.trim().toLowerCase();
  return needle ? allCities.filter((c) => c.toLowerCase().includes(needle)) : allCities;
}
