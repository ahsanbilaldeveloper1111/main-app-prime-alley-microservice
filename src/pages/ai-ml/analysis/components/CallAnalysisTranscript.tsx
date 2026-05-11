import AudioPlayer, { AudioPlayerRef } from "@components/AudioPlayer";
import avatar from "@assets/images/user/avatar-3.jpg";
import { TRANSCRIPTION_SPEAKER_1 } from "@pages/ai-ml/analysis/constants";
import type { Transcription } from "@pages/ai-ml/analysis/types";
import React, { RefObject } from "react";
import { Alert, Button, Col, Row, Spinner } from "react-bootstrap";

type Props = Readonly<{
  chunksAnalysisData: any;
  uuid: string;
  mediaPlayerShow: boolean;
  audioLoading: boolean;
  audioError: string | null;
  setAudioError: (v: string | null) => void;
  audioPlayerRef: RefObject<AudioPlayerRef | null>;
  getAudioFilePath: () => string;
  loadAuthenticatedAudio: () => Promise<void>;
  playingSegment: { start: number; end: number } | null;
  onTimeClick: (start: number, end: number) => void;
  onStopAudio: () => void;
}>;

function isListenSegmentActive(
  playingSegment: Props["playingSegment"],
  segmentStart: number,
  segmentEnd: number,
): boolean {
  if (playingSegment == null) {
    return false;
  }
  return playingSegment.start === segmentStart && playingSegment.end === segmentEnd;
}

function canShowListenUi(item: Transcription, mediaPlayerShow: boolean): boolean {
  return (
    mediaPlayerShow &&
    item.start !== undefined &&
    item.start !== null &&
    Number.isFinite(item.start) &&
    item.end !== undefined &&
    item.end !== null &&
    Number.isFinite(item.end)
  );
}

type TranscriptAudioPaneProps = Pick<
  Props,
  | "audioLoading"
  | "audioError"
  | "setAudioError"
  | "mediaPlayerShow"
  | "audioPlayerRef"
  | "getAudioFilePath"
  | "uuid"
  | "loadAuthenticatedAudio"
>;

function TranscriptAudioPane({
  audioLoading,
  audioError,
  setAudioError,
  loadAuthenticatedAudio,
  mediaPlayerShow,
  audioPlayerRef,
  getAudioFilePath,
  uuid,
}: TranscriptAudioPaneProps) {
  if (audioLoading) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading audio...</span>
        </Spinner>
        <p className="mt-2">Loading audio file...</p>
      </div>
    );
  }

  if (audioError) {
    return (
      <Alert variant="warning" className="text-center">
        <Alert.Heading>Audio Loading Error</Alert.Heading>
        <p>{audioError}</p>
        <hr />
        <div className="d-flex justify-content-end gap-2">
          <Button
            variant="outline-warning"
            size="sm"
            onClick={() => {
              setAudioError(null);
              loadAuthenticatedAudio().catch(() => {
                /* errors surfaced via audioError */
              });
            }}
          >
            Retry
          </Button>
        </div>
      </Alert>
    );
  }

  if (mediaPlayerShow) {
    return (
      <AudioPlayer
        ref={audioPlayerRef}
        audioSrc={getAudioFilePath()}
        title={`Call Recording - ${uuid}`}
        showWaveform={false}
      />
    );
  }

  return (
    <Alert variant="info" className="text-center">
      <Alert.Heading>No Audio Available</Alert.Heading>
      <p>Audio file is not available for this call recording.</p>
    </Alert>
  );
}

type TranscriptListenStampProps = Readonly<{
  transcriptItem: Transcription;
  mediaPlayerShow: boolean;
  playingSegment: Props["playingSegment"];
  onTimeClick: Props["onTimeClick"];
  onStopAudio: Props["onStopAudio"];
  paragraphClassName: string;
  spanClassName?: string;
}>;

function TranscriptListenStamp({
  transcriptItem,
  mediaPlayerShow,
  playingSegment,
  onTimeClick,
  onStopAudio,
  paragraphClassName,
  spanClassName,
}: TranscriptListenStampProps) {
  const canListen = canShowListenUi(transcriptItem, mediaPlayerShow);
  const isActive =
    canListen && isListenSegmentActive(playingSegment, transcriptItem.start, transcriptItem.end);

  const handleActivate = () => {
    if (isActive) {
      onStopAudio();
      return;
    }
    onTimeClick(transcriptItem.start, transcriptItem.end);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "Enter" && e.key !== " ") {
      return;
    }
    e.preventDefault();
    handleActivate();
  };

  const label = isActive ? "Stop" : "Listen";
  const tiClass = `ti ${isActive ? "ti-player-pause" : "ti-player-play"}`;

  if (!canListen) {
    return null;
  }

  return (
    <p className={paragraphClassName}>
      <button
        type="button"
        className={["time-stamp", "cursor-pointer", "btn", "btn-link", "p-0", "border-0", "text-decoration-none", "shadow-none", spanClassName].filter(Boolean).join(" ")}
        aria-label={label}
        aria-pressed={isActive}
        onClick={handleActivate}
        onKeyDown={handleKeyDown}
      >
        <i className={tiClass} title={label} />
        {label}
      </button>
    </p>
  );
}

type TranscriptTurnProps = Readonly<{
  transcriptItem: Transcription;
  isSpeakerPrimary: boolean;
  mediaPlayerShow: boolean;
  playingSegment: Props["playingSegment"];
  onTimeClick: (start: number, end: number) => void;
  onStopAudio: () => void;
}>;

function TranscriptTurn({
  transcriptItem,
  isSpeakerPrimary,
  mediaPlayerShow,
  playingSegment,
  onTimeClick,
  onStopAudio,
}: TranscriptTurnProps) {
  const stampBase = {
    transcriptItem,
    mediaPlayerShow,
    playingSegment,
    onTimeClick,
    onStopAudio,
  } as const satisfies Omit<TranscriptListenStampProps, "paragraphClassName" | "spanClassName">;

  if (isSpeakerPrimary) {
    return (
      <Row>
        <Col md={6}>
          <div className="message-in">
            <div className="d-flex">
              <div className="flex-shrink-0">
                <div className="chat-avtar">
                  <img className="rounded-circle img-fluid wid-40" src={avatar.src} alt="Participant" />
                  <i className="chat-badge bg-success"></i>
                </div>
              </div>
              <div className="flex-grow-1 mx-3">
                <div className="d-flex align-items-start flex-column">
                  <div className="message d-flex align-items-start flex-column">
                    <div className="d-flex align-items-center mb-1 chat-msg">
                      <div className="flex-grow-1 me-3">
                        <div className="msg-content card mb-0">
                          <p className="mb-0">{transcriptItem.text}</p>
                          <TranscriptListenStamp {...stampBase} paragraphClassName="text-primary mb-0" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    );
  }

  return (
    <Row>
      <Col md={6}></Col>
      <Col md={6}>
        <div className="message-out">
          <div className="d-flex align-items-end flex-column">
            <div className="message d-flex align-items-end flex-column">
              <div className="d-flex align-items-center mb-1 chat-msg">
                <div className="flex-grow-1 ms-3">
                  <div className="msg-content card bg-primary">
                    <p className="mb-0 text-white">{transcriptItem.text}</p>
                    <TranscriptListenStamp
                      {...stampBase}
                      paragraphClassName="text-white mb-0"
                      spanClassName="time-stamp-padding"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Col>
    </Row>
  );
}

export function CallAnalysisTranscript({
  chunksAnalysisData,
  uuid,
  mediaPlayerShow,
  audioLoading,
  audioError,
  setAudioError,
  audioPlayerRef,
  getAudioFilePath,
  loadAuthenticatedAudio,
  playingSegment,
  onTimeClick,
  onStopAudio,
}: Props) {
  const transcriptionsUnknown = chunksAnalysisData?.transcriptions;

  let transcriptTurns: React.ReactNode = null;
  if (Array.isArray(transcriptionsUnknown) && transcriptionsUnknown.length > 0) {
    const transcriptions = transcriptionsUnknown as Transcription[];
    transcriptTurns = transcriptions.map((transcriptItem, index) => (
      <div key={`${transcriptItem.start}-${transcriptItem.end}-${transcriptItem.speaker}-${index}`}>
        <TranscriptTurn
          transcriptItem={transcriptItem}
          isSpeakerPrimary={transcriptItem.speaker === TRANSCRIPTION_SPEAKER_1}
          mediaPlayerShow={mediaPlayerShow}
          playingSegment={playingSegment}
          onTimeClick={onTimeClick}
          onStopAudio={onStopAudio}
        />
      </div>
    ));
  }

  return (
    <Row>
      <Col md={12}>
        <div className="card">
          <div className="card-body">
            <div className="transcript">
              <Row>
                <Col md={12}>
                  <div className={`mb-4 mediaPlayerOuter ${mediaPlayerShow ? "show" : "d-none"}`}>
                    <TranscriptAudioPane
                      audioLoading={audioLoading}
                      audioError={audioError}
                      setAudioError={setAudioError}
                      mediaPlayerShow={mediaPlayerShow}
                      audioPlayerRef={audioPlayerRef}
                      getAudioFilePath={getAudioFilePath}
                      uuid={uuid}
                      loadAuthenticatedAudio={loadAuthenticatedAudio}
                    />
                  </div>
                </Col>
              </Row>
              {transcriptTurns}
            </div>
          </div>
        </div>
      </Col>
    </Row>
  );
}
