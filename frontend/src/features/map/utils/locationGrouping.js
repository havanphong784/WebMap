const GROUP_DISTANCE_DEGREES = 0.00025;

const toNumber = (value) => Number.parseFloat(value);

const isNear = (a, b) => {
  const aLat = toNumber(a.lat);
  const aLng = toNumber(a.lng);
  const bLat = toNumber(b.lat);
  const bLng = toNumber(b.lng);

  if (![aLat, aLng, bLat, bLng].every(Number.isFinite)) return false;

  return (
    Math.abs(aLat - bLat) <= GROUP_DISTANCE_DEGREES &&
    Math.abs(aLng - bLng) <= GROUP_DISTANCE_DEGREES
  );
};

export const groupNearbyLocations = (locations = []) => {
  const groups = [];

  locations.forEach((location) => {
    const existingGroup = groups.find((group) => isNear(group.anchor, location));

    if (existingGroup) {
      existingGroup.items.push(location);
      return;
    }

    groups.push({
      anchor: location,
      items: [location],
    });
  });

  return groups.map(({anchor, items}) => {
    const sortedItems = [...items].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });

    return {
      location: sortedItems[0] || anchor,
      items: sortedItems,
    };
  });
};

export const withNearbyGroup = (location, locations = []) => {
  if (!location) return location;
  const group = locations.filter((candidate) => isNear(candidate, location));
  return group.length > 1 ? {...location, group} : location;
};
