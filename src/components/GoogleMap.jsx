import { GoogleMap, Marker, LoadScript } from "@react-google-maps/api";
import { GOOGLEMAP_API_KEY } from "../env";

const containerStyle = {
  width: "100%",
  height: "300px",
  borderRadius: "12px",
  marginTop: "1rem"
};

export default function GoogleMapComponent({ lat, lng }) {
  const center = {
    lat: parseFloat(lat),
    lng: parseFloat(lng)
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLEMAP_API_KEY}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={14}>
        <Marker position={center} />
      </GoogleMap>
    </LoadScript>
  );
}