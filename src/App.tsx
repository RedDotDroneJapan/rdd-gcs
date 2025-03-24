import { Viewer, Entity, CameraFlyTo } from "resium";
import { Cartesian3, VerticalOrigin, HorizontalOrigin } from "cesium";
import { useEffect, useMemo, useState } from "react";
import { useMqtt } from "./hooks/useMQtt";
import { Track } from "./types";

function App() {
  const channelPosition = "/v2.C/droneinfo";
  const [track, setTrack] = useState<Track>({});
  const [cameraPosition, setCameraPosition] = useState<Cartesian3>(Cartesian3.fromDegrees(135.5023, 34.6937, 1000));
  const [airplanePosition, setAirplanePosition] = useState<Cartesian3>(Cartesian3.fromDegrees(135.5023, 34.6937, 10));

  const memoizedOptions = useMemo(() => ({
    clientId: `mqtt_${Math.random().toString(16).slice(2)}`,
    username: import.meta.env.VITE_MQTT_BROKER_USERNAME,
    password: import.meta.env.VITE_MQTT_BROKER_PASSWORD,
    connectTimeout: 10000,
    keepalive: 60,
  }), []);

  const { messages, subscribe } = useMqtt({
    ipaddress: import.meta.env.VITE_MQTT_BROKER_ADDRESS,
    options: memoizedOptions,
  });

  const processCSV = (data: string[]) => {
    const [
      command, timestamp, fromName, toName,
      latitude, longitude, elevation
    ] = data;
    console.log({
      command, timestamp, fromName, toName,
      latitude, longitude, elevation
    });
    return {
      command, timestamp, fromName, toName,
      latitude: Number(latitude),
      longitude: Number(longitude),
      elevation: Number(elevation)
    };
  }

  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.startsWith(channelPosition)) {
        const csvData = latestMessage.slice(channelPosition.length + 1).split(",");
        const {fromName, latitude, longitude, elevation} = processCSV(csvData);

        const newPosition = Cartesian3.fromDegrees(longitude, latitude, elevation);
        const newCameraPosition = Cartesian3.fromDegrees(longitude, latitude, 500);

        const positions = track[fromName];
        if(positions) {
          setTrack({
            ...track,
            [fromName]: [...positions, newPosition]
          })
        }
        else {
          setTrack({
            ...track,
            [fromName]: [newPosition]
          })
        }
        setCameraPosition(newCameraPosition);
        setAirplanePosition(newPosition);
      }
    }
  }, [messages]);

  useEffect(() => {
    subscribe(channelPosition);
  }, [subscribe])


  return (
    <Viewer full>
      {/* Move Camera Close to Ground */}
      <CameraFlyTo destination={cameraPosition} duration={2} />

      {/* Polyline Showing Path */}
      {/* {
        Object.keys(track).map(fromName => {
            const positions = track[fromName]
            return <Entity polyline={{ positions, width: 3, material: Color.RED }} />
        })
      } */}

      {/* Draw circles at each position */}
      {/* {
        Object.keys(track).map(fromName => {
          const positions = track[fromName]
          return positions.slice(0, positions.length - 1).map((pos, index) => (
            <Entity
              key={index}
              position={pos}
              point={{
                pixelSize: 10, // Size of the circle
                color: Color.YELLOW, // Circle color
                outlineColor: Color.BLACK, // Border color
                outlineWidth: 2,
              }}
            />
          )
         )}
        )
      } */}

      {/* Moving Airplane */}
      <Entity
        position={airplanePosition}
        billboard={{
          image: "/airplane.png",
          scale: 0.02,
          verticalOrigin: VerticalOrigin.CENTER,
          horizontalOrigin: HorizontalOrigin.CENTER,
        }}
      />
    </Viewer>
  );
}

export default App;
