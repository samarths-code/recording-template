import { MeetingProvider } from "@videosdk.live/react-sdk";
import { useEffect } from "react";
import { useState } from "react";
import { MeetingAppProvider } from "./MeetingAppContextDef";
import { MeetingContainer } from "./meeting/MeetingContainer";
import { LeaveScreen } from "./components/screens/LeaveScreen";

function App() {
  const [token, setToken] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [isMeetingLeft, setIsMeetingLeft] = useState(false);

  const isMobile = window.matchMedia(
    "only screen and (max-width: 768px)"
  ).matches;

  // Parse URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlMeetingId = urlParams.get("meetingId");
    const urlToken = urlParams.get("token");
    const participantIdParam = urlParams.get("participantId");

    if (urlMeetingId) setMeetingId(urlMeetingId);
    if (urlToken) setToken(urlToken);
    if (participantIdParam) setParticipantId(participantIdParam);
  }, []);

  useEffect(() => {
    if (isMobile) {
      window.onbeforeunload = () => {
        return "Are you sure you want to exit?";
      };
    }
  }, [isMobile]);

  return (
    <>
      <MeetingAppProvider>
        {token && meetingId ? (
          <MeetingProvider
            config={{
              meetingId,
              participantId: participantId || undefined,
              micEnabled: false,
              webcamEnabled: false,
              name: participantName ? participantName : "recorder",
              multiStream: true,
            }}
            token={token}
            reinitialiseMeetingOnConfigChange={true}
            joinWithoutUserInteraction={true}
          >
            <MeetingContainer
              onMeetingLeave={() => {
                setToken("");
                setMeetingId("");
                setParticipantId("");
                setParticipantName("");
              }}
              setIsMeetingLeft={setIsMeetingLeft}
              meetingId={meetingId}
            />
          </MeetingProvider>
        ) : isMeetingLeft ? (
          <LeaveScreen setIsMeetingLeft={setIsMeetingLeft} />
        ) : (

          <div className="flex items-center justify-center h-screen w-screen bg-gray-800">
            <h2 className="text-2xl text-white font-bold">
              Kindly pass the meetingId, token in the URL
            </h2>
          </div>
        )}
      </MeetingAppProvider>
    </>
  );
}

export default App;
