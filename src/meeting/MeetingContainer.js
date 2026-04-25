import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Constants, useMeeting, usePubSub } from "@videosdk.live/react-sdk";
import { PresenterView } from "../components/PresenterView";
import WaitingToJoinScreen from "../components/screens/WaitingToJoinScreen";
import ConfirmBox from "../components/ConfirmBox";
import useIsMobile from "../hooks/useIsMobile";
import useIsTab from "../hooks/useIsTab";
import { useMediaQuery } from "react-responsive";
import MemorizedParticipantView from "./components/ParticipantView";
import { ParticipantAudioPlayer } from "./components/AudioPlayer";
import { useMeetingAppContext } from "../MeetingAppContextDef";

function extractUserMeta(msg) {
  if (msg?.payload && typeof msg.payload === "object") return msg.payload;
  if (typeof msg?.message === "string") {
    try {
      return JSON.parse(msg.message);
    } catch {
      return null;
    }
  }
  if (msg?.message && typeof msg.message === "object") return msg.message;
  return null;
}

export function MeetingContainer({
  onMeetingLeave,
  setIsMeetingLeft,
  isPresenting,
}) {
  const bottomBarHeight = 60;

  const [containerHeight, setContainerHeight] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [localParticipantAllowedJoin, setLocalParticipantAllowedJoin] =
    useState(null);
  const [meetingErrorVisible, setMeetingErrorVisible] = useState(false);
  const [meetingError, setMeetingError] = useState(false);

  const mMeetingRef = useRef();
  const containerRef = useRef(); // was createRef — useRef avoids re-renders on each render cycle
  const containerHeightRef = useRef();
  const containerWidthRef = useRef();

  useEffect(() => {
    containerHeightRef.current = containerHeight;
    containerWidthRef.current = containerWidth;
  }, [containerHeight, containerWidth]);

  const isMobile = useIsMobile();
  const isTab = useIsTab();
  const isLGDesktop = useMediaQuery({ minWidth: 1024, maxWidth: 1439 });
  const isXLDesktop = useMediaQuery({ minWidth: 1440 });

  const sideBarContainerWidth = isXLDesktop
    ? 400
    : isLGDesktop
      ? 360
      : isTab
        ? 320
        : isMobile
          ? 280
          : 240;

  useEffect(() => {
    containerRef.current?.offsetHeight &&
      setContainerHeight(containerRef.current.offsetHeight);
    containerRef.current?.offsetWidth &&
      setContainerWidth(containerRef.current.offsetWidth);

    window.addEventListener("resize", ({ target }) => {
      containerRef.current?.offsetHeight &&
        setContainerHeight(containerRef.current.offsetHeight);
      containerRef.current?.offsetWidth &&
        setContainerWidth(containerRef.current.offsetWidth);
    });
  }, [containerRef]);

  const _handleMeetingLeft = () => {
    setIsMeetingLeft(true);
  };

  function onParticipantJoined(participant) {
    // Change quality to low, med or high based on resolution
    participant && participant.setQuality("high");
  }

  function onEntryResponded(participantId, name) {
    if (mMeetingRef.current?.localParticipant?.id === participantId) {
      if (name === "allowed") {
        setLocalParticipantAllowedJoin(true);
      } else {
        setLocalParticipantAllowedJoin(false);
        setTimeout(() => {
          _handleMeetingLeft();
        }, 3000);
      }
    }
  }

  const { setParticipantMetadata } = useMeetingAppContext();

  function onMeetingJoined() {
    setLocalParticipantAllowedJoin(true);
  }

  function onMeetingLeft() {
    onMeetingLeave();
  }

  const mMeeting = useMeeting({
    onParticipantJoined,
    onMeetingJoined,
    onMeetingLeft,
  });

  mMeetingRef.current = mMeeting;




  // usePubSub registers its internal _handlePubSub callback once (stale closure).
  // If onMessageReceived is a new function every render, the stale version gets called
  // and updates are lost. useCallback with stable deps ([setParticipantMetadata]) keeps
  // the same function reference, so the stale closure always calls the right function.
  const onMessageReceived = (msg) => {
    console.log("[USER_METADATA] received", msg);
    const meta = extractUserMeta(msg);
    if (!meta || !msg?.senderId) return;
    setParticipantMetadata((prev) => ({
      ...prev,
      [msg.senderId]: { ...(prev[msg.senderId] || {}), ...meta },
    }));
  };



  usePubSub("USER_METADATA", { onMessageReceived });

  const audioParticipants = useMemo(() => {
    return [...mMeeting.participants.values()].filter((participant) => {
      return (
        participant.id !== mMeeting.localParticipant.id &&
        participant.mode == Constants.modes.SEND_AND_RECV
      );
    });
  }, [mMeeting.participants, mMeeting.localParticipant?.id]);
  return (
    <div className="fixed inset-0">
      <div ref={containerRef} className="h-full flex flex-col bg-gray-800">
        {localParticipantAllowedJoin ? (
          <>
            <div className={` flex flex-1 flex-row bg-gray-800 `}>
              <div className={`flex flex-1 `}>
                {isPresenting ? (
                  <PresenterView height={containerHeight - bottomBarHeight} />
                ) : null}
                <MemorizedParticipantView isPresenting={isPresenting} />
                {audioParticipants.map((participant) => {
                  return (
                    <ParticipantAudioPlayer
                      key={participant.id}
                      participantId={participant.id}
                    />
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          !mMeeting.isMeetingJoined && <WaitingToJoinScreen />
        )}
        <ConfirmBox
          open={meetingErrorVisible}
          successText="OKAY"
          onSuccess={() => {
            setMeetingErrorVisible(false);
          }}
          title={`Error Code: ${meetingError.code}`}
          subTitle={meetingError.message}
        />
      </div>
    </div>
  );
}
