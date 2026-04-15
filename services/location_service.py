import math

def haversine(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    # Convert decimal degrees to radians 
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # Haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a)) 
    
    # Radius of earth in kilometers
    r = 6371 
    return c * r

def get_nearest_entities(source_lat, source_lng, entities, min_radius_km=25):
    """
    Given a source location and a list of entities (e.g., donors or blood banks),
    filter and return those within the minimum radius, sorted by distance.
    Assumes entities have `latitude` and `longitude` fields.
    """
    nearby = []
    for entity in entities:
        if entity.latitude is None or entity.longitude is None:
            continue
            
        dist = haversine(source_lat, source_lng, entity.latitude, entity.longitude)
        if dist <= min_radius_km:
            # We can attach the distance to the entity object or return a tuple
            nearby.append({'entity': entity, 'distance': round(dist, 2)})
            
    # Sort by distance
    nearby = sorted(nearby, key=lambda x: x['distance'])
    return nearby
