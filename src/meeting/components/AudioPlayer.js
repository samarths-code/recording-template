import { useParticipant } from "@videosdk.live/react-sdk";
import { useEffect, useRef } from "react";

export const ParticipantAudioPlayer = ({ participantId }) => {
  const { micStream, isLocal } = useParticipant(participantId);
  const audioRef = useRef();
  useEffect(() => {
    if (micStream && !isLocal) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(micStream.track);
      audioRef.current.srcObject = mediaStream;
      audioRef.current.play().catch((err) => {
        if (
          err.message ===
          "play() failed because the user didn't interact with the document first. https://goo.gl/xX8pDD"
        ) {
          console.log("audio " + err.message);
        } else {
          console.log("audio catch", err);
        }
      });
    }
  }, [micStream]);
  return (
    <audio ref={audioRef} autoPlay muted={isLocal} />
  );
};