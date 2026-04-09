export const homeServices = [
  {
    id: 1,
    title: "Plumber",
    image: "https://cdn-icons-png.flaticon.com/512/5453/5453005.png",
    description: "Expert plumbing services for home and office."
  },
  {
    id: 2,
    title: "Electrician",
    image: "https://cdn-icons-png.flaticon.com/512/3098/3098409.png",
    description: "Professional electrical repair and installation."
  },
  {
    id: 3,
    title: "Cleaning",
    image: "https://cdn-icons-png.flaticon.com/512/995/995053.png",
    description: "Deep cleaning services for your home."
  },
  {
    id: 4,
    title: "Painter",
    image: "https://cdn-icons-png.flaticon.com/512/2850/2850423.png",
    description: "House painting and wall design services."
  },
  {
    id: 5,
    title: "Carpenter",
    image: "https://cdn-icons-png.flaticon.com/512/968/968822.png",
    description: "Furniture repair and woodwork services."
  },
  {
    id: 6,
    title: "AC Repair",
    image: "https://cdn-icons-png.flaticon.com/512/3653/3653552.png",
    description: "AC installation and maintenance services."
  },
  {
    id: 7,
    title: "Gardening",
    image: "https://cdn-icons-png.flaticon.com/512/2909/2909762.png",
    description: "Garden cleaning and plant care services."
  },
  {
    id: 8,
    title: "Hardware Repair",
    image: "https://cdn-icons-png.flaticon.com/512/2910/2910765.png",
    description: "Repair and maintenance of home appliances and hardware."
  },
  {
    id: 9,
    title: "Pest Control",
    image: "https://cdn-icons-png.flaticon.com/512/616/616554.png",
    description: "Safe pest control solutions for homes, kitchens, and offices."
  },
  {
    id: 10,
    title: "Sofa Cleaning",
    image: "https://cdn-icons-png.flaticon.com/512/1046/1046857.png",
    description: "Deep sofa, mattress, and upholstery cleaning services."
  },
  {
    id: 11,
    title: "Fridge Repair",
    image: "https://cdn-icons-png.flaticon.com/512/3659/3659898.png",
    description: "Quick refrigerator repair and cooling system support."
  },
  {
    id: 12,
    title: "Water Tank Cleaning",
    image: "https://cdn-icons-png.flaticon.com/512/4148/4148460.png",
    description: "Professional water tank cleaning for healthier home use."
  },
  {
    id: 13,
    title: "CCTV Installation",
    image: "https://cdn-icons-png.flaticon.com/512/2838/2838912.png",
    description: "Home security camera installation and setup service."
  },
  {
    id: 14,
    title: "Home Shifting",
    image: "https://cdn-icons-png.flaticon.com/512/679/679720.png",
    description: "Packing, moving, and home shifting support with care."
  },
  {
    id: 15,
    title: "Washing Machine Repair",
    image: "https://cdn-icons-png.flaticon.com/512/2933/2933245.png",
    description: "Installation, repair, and servicing for all washing machines."
  },
  {
    id: 16,
    title: "Interior Design",
    image: "https://cdn-icons-png.flaticon.com/512/1040/1040230.png",
    description: "Smart interior styling and space makeover support for your home."
  }
];

const bookingServiceOverrides = {
  Plumber: {
    amount: 500,
    priority: "High",
    timeline: "Same day support",
    note: "Leak repairs, tap fitting, and water line fixes."
  },
  Electrician: {
    amount: 700,
    priority: "Medium",
    timeline: "2 hour callback",
    note: "Switchboard, wiring, and appliance connection help."
  },
  Cleaning: {
    amount: 450,
    priority: "Low",
    timeline: "Flexible slot",
    note: "Kitchen, bathroom, and room deep-clean support."
  },
  Painter: {
    amount: 900,
    priority: "Medium",
    timeline: "Scheduled visit",
    note: "Interior wall paint, touch-up work, and fresh color updates."
  },
  Carpenter: {
    amount: 900,
    priority: "High",
    timeline: "Scheduled visit",
    note: "Furniture repair, fittings, and woodwork service."
  },
  "AC Repair": {
    amount: 850,
    priority: "High",
    timeline: "Priority dispatch",
    note: "Cooling checks, gas refill support, and AC repair service."
  },
  Gardening: {
    amount: 600,
    priority: "Low",
    timeline: "Flexible slot",
    note: "Garden cleaning, trimming, and routine plant care service."
  },
  "Hardware Repair": {
    amount: 800,
    priority: "High",
    timeline: "Priority dispatch",
    note: "Home hardware repair, appliance fitting, and urgent maintenance."
  },
  "Pest Control": {
    amount: 950,
    priority: "High",
    timeline: "Scheduled visit",
    note: "Safe pest treatment for homes, kitchens, and office spaces."
  },
  "Sofa Cleaning": {
    amount: 700,
    priority: "Medium",
    timeline: "Flexible slot",
    note: "Deep sofa, mattress, and upholstery cleaning support."
  },
  "Fridge Repair": {
    amount: 850,
    priority: "High",
    timeline: "Priority dispatch",
    note: "Cooling issue diagnosis and refrigerator repair support."
  },
  "Water Tank Cleaning": {
    amount: 1100,
    priority: "Medium",
    timeline: "Scheduled visit",
    note: "Professional cleaning for safer household water storage."
  },
  "CCTV Installation": {
    amount: 1500,
    priority: "Medium",
    timeline: "Booked installation slot",
    note: "Security camera setup, cable routing, and configuration help."
  },
  "Home Shifting": {
    amount: 2000,
    priority: "High",
    timeline: "Scheduled move slot",
    note: "Packing, moving, and shifting support handled with care."
  },
  "Washing Machine Repair": {
    amount: 800,
    priority: "High",
    timeline: "Priority dispatch",
    note: "Diagnosis, servicing, and repair for washing machines."
  },
  "Interior Design": {
    amount: 2500,
    priority: "Medium",
    timeline: "Consultation slot",
    note: "Space planning, styling, and home interior design support."
  }
};

export const bookingServiceMeta = homeServices.reduce((serviceMeta, service) => {
  const override = bookingServiceOverrides[service.title] || {};

  serviceMeta[service.title] = {
    amount: override.amount ?? 600,
    priority: override.priority ?? "Medium",
    timeline: override.timeline ?? "Scheduled service slot",
    note: override.note ?? service.description
  };

  return serviceMeta;
}, {});
