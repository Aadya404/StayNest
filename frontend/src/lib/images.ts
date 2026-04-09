/**
 * Utility to get unique, category-based property images from Unsplash.
 * Ensures consistent but unique imagery for each listing ID.
 */
export const getListingImage = (category: string, listingId: number): string => {
  const primaryMapping: Record<string, string> = {
    "apartment": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
    "villa": "https://images.unsplash.com/photo-1580587771525-78b9dba3b914",
    "cabin": "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8",
    "beach house": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    "penthouse": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
    "farmhouse": "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
    "treehouse": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4",
    "houseboat": "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2",
  };

  const secondaryMapping: Record<string, string> = {
    "apartment": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
    "villa": "https://images.unsplash.com/photo-1613490493576-7fde63acd811",
    "cabin": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
    "beach house": "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2",
    "penthouse": "https://images.unsplash.com/photo-1515263487990-61b07816b324",
    "farmhouse": "https://images.unsplash.com/photo-1500382017468-9049fed747ef",
    "treehouse": "https://images.unsplash.com/photo-1448375033470-5890c7446e9c",
    "houseboat": "https://images.unsplash.com/photo-1567684014761-b65e2e59b9eb",
  };

  const cat = category.toLowerCase();
  const useSecondary = listingId % 2 !== 0;
  
  const baseUrl = (useSecondary ? secondaryMapping[cat] : primaryMapping[cat]) 
    || (useSecondary ? "https://images.unsplash.com/photo-1460317442991-0ec209397118" : "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2");
  
  return `${baseUrl}?w=800&q=80&auto=format&fit=crop`;
};
