import { useState, useEffect, useRef, createRef, useMemo } from "react";
import { Constants, useMeeting } from "@videosdk.live/react-sdk";
import { PresenterView } from "../components/PresenterView";
import WaitingToJoinScreen from "../components/screens/WaitingToJoinScreen";
import ConfirmBox from "../components/ConfirmBox";
import useIsMobile from "../hooks/useIsMobile";
import useIsTab from "../hooks/useIsTab";
import { useMediaQuery } from "react-responsive";
import { MemoizedParticipant } from "../components/ParticipantGrid";
import { ParticipantAudioPlayer } from "./components/AudioPlayer";

export function MeetingContainer({
  onMeetingLeave,
  setIsMeetingLeft,
}) {

  const bottomBarHeight = 60;

  const [containerHeight, setContainerHeight] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [localParticipantAllowedJoin, setLocalParticipantAllowedJoin] = useState(null);
  const [meetingErrorVisible, setMeetingErrorVisible] = useState(false);
  const [meetingError, setMeetingError] = useState(false);

  const mMeetingRef = useRef();
  const containerRef = createRef();
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

  function onMeetingJoined() {
    setLocalParticipantAllowedJoin(true);
  }

  function onMeetingLeft() {
    onMeetingLeave();
  }


  const mMeeting = useMeeting({
    onParticipantJoined,
    // onEntryResponded,
    onMeetingJoined,
    onMeetingLeft,
  });

  const isPresenting = mMeeting.presenterId ? true : false;

  useEffect(() => {
    mMeetingRef.current = mMeeting;
  }, [mMeeting]);

  const tutorParticipantId = useMemo(() => {
    const id = [...mMeeting.participants.values()].
      find((participant) => participant.metaData?.isTutor || participant.displayName === "Tutor")?.id
    return id;
  },
    [mMeeting.participants]
  );

  const audioParticipants = useMemo(() => {
    return [...mMeeting.participants.values()].filter((participant) => {
      return participant.id !== mMeeting.localParticipant.id && participant.mode == Constants.modes.SEND_AND_RECV;
    });
  }, [mMeeting.participants, mMeeting.localParticipant?.id]);
  return (
    <div className="fixed inset-0">
      <div ref={containerRef} className="h-full flex flex-col bg-gray-800">
        {
          localParticipantAllowedJoin ? (
            <>
              <div className={` flex flex-1 flex-row bg-gray-800 `}>
                <div className={`flex flex-1 `}>
                  {isPresenting ? (
                    <PresenterView height={containerHeight - bottomBarHeight} />
                  ) : null}
                  {/* {isPresenting && isMobile ? (
                    participantsData.map((participantId) => (
                      <ParticipantMicStream key={participantId} participantId={participantId} />
                    ))
                  ) : (
                    <MemorizedParticipantView isPresenting={isPresenting} />
                  )} */}
                  {
                    audioParticipants.map((participant) => {
                      return <ParticipantAudioPlayer key={participant.id} participantId={participant.id} />
                    })
                  }
                  {tutorParticipantId && (
                    <div
                      className={
                        isPresenting
                          ? " fixed bottom-2 right-2 w-96 h-auto z-50 overflow-hidden rounded-lg shadow-lg border-2 border-gray-700 bg-gray-900"
                          : "w-full h-full"
                      }
                    >
                      <MemoizedParticipant participantId={tutorParticipantId} />
                    </div>
                  )}
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
