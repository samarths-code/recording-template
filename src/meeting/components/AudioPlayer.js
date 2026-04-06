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
      audioRef.current.play();
    }
  }, [micStream]);
  return (
    <audio ref={audioRef} autoPlay muted={isLocal} />
  );
};